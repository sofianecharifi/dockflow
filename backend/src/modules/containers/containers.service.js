const docker = require("../../config/docker");

class ContainerService {
    constructor(dockerInstance) {
        this.docker = dockerInstance;
    }

    async listContainers() {
        try {
            const containers = await this.docker.listContainers({ all: true });
            return containers.map(container => ({
                id: container.Id,
                name: container.Names[0]?.replace("/", ""),
                image: container.Image,
                state: container.State,
                status: container.Status
            }));
        } catch (error) {
            console.error("Docker error:", error);
            throw error;
        }
    }

    async getContainersStats() {
        try {
            const rawContainers = await this.docker.listContainers({ all: true, size: true });
            const containersPromises = rawContainers.map(async (container) => {
                const cData = {
                    id: container.Id,
                    name: container.Names[0]?.replace("/", ""),
                    image: container.Image,
                    state: container.State,
                    status: container.Status,
                    sizeRw: container.SizeRw || 0,
                    sizeRootFs: container.SizeRootFs || 0,
                    ramUsage: 0,
                    ramLimit: 0
                };

                if (container.State === 'running') {
                    try {
                        const cStats = await this.docker.getContainer(container.Id).stats({stream: false});
                        cData.ramUsage = cStats.memory_stats?.usage || 0;
                        cData.ramLimit = cStats.memory_stats?.limit || 0;
                    } catch (e) {
                        // ignore if container dies during stats fetch
                    }
                }
                return cData;
            });
            
            return await Promise.all(containersPromises);
        } catch (err) {
            console.error("Error retrieving container stats:", err);
            return [];
        }
    }

    async startContainer(id) {
        const container = this.docker.getContainer(id);
        await container.start();
    }

    async stopContainer(id) {
        const container = this.docker.getContainer(id);
        await container.stop();
    }

    async restartContainer(id) {
        const container = this.docker.getContainer(id);
        await container.restart();
    }

    async removeContainer(id) {
        const container = this.docker.getContainer(id);
        await container.remove();
    }

    async pullAndRecreateContainer(id) {
        const container = this.docker.getContainer(id);
        const info = await container.inspect();

        const image = info.Config.Image;
        const name = info.Name.substring(1); // remove leading slash

        // Pull new image
        await new Promise((resolve, reject) => {
            this.docker.pull(image, (err, stream) => {
                if (err) return reject(err);
                this.docker.modem.followProgress(stream, onFinished);
                function onFinished(err, output) {
                    if (err) return reject(err);
                    resolve(output);
                }
            });
        });

        // Stop if running
        if (info.State.Running) {
            await container.stop();
        }

        // Remove container
        await container.remove();

        // Create new container
        const newContainer = await this.docker.createContainer({
            ...info.Config,
            HostConfig: info.HostConfig,
            name: name
        });

        // Start new container
        await newContainer.start();
    }

    downloadLogs(id, req, res) {
        const optsf = {
            path: '/containers/' + id + '/logs?stdout=1&stderr=1&timestamps=1&follow=0',
            method: 'GET',
            isStream: true,
            statusCodes: {
                200: true,
                404: 'no such container',
                500: 'server error'
            }
        };

        this.docker.modem.dial(optsf, (err, stream) => {
            if (err) {
                console.error("Error retrieving stream:", err);
                if (!res.headersSent) {
                    return res.status(500).json({ message: "Erreur lors du téléchargement des logs", error: err.message });
                }
                return;
            }

            let logStream = stream;

            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="container-${id}-logs.txt"`);

            this.docker.modem.demuxStream(logStream, res, res);

            logStream.on('end', () => {
                res.end();
            });

            req.on('close', () => {
                if (logStream && !logStream.destroyed) {
                    logStream.destroy();
                }
            });
        });
    }
}

module.exports = new ContainerService(docker);
