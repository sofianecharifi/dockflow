class ContainerController {
    constructor(containerService) {
        this.service = containerService;
        
        // Bind context
        this.listContainers = this.listContainers.bind(this);
        this.startContainer = this.startContainer.bind(this);
        this.stopContainer = this.stopContainer.bind(this);
        this.restartContainer = this.restartContainer.bind(this);
        this.removeContainer = this.removeContainer.bind(this);
        this.pullAndRecreateContainer = this.pullAndRecreateContainer.bind(this);
        this.downloadContainerLogs = this.downloadContainerLogs.bind(this);
    }

    async listContainers(req, res) {
        try {
            const containers = await this.service.listContainers();
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.json(containers);
        } catch (error) {
            res.status(500).json({ error: "Erreur serveur" });
        }
    }

    async startContainer(req, res) {
        try {
            const id = req.params.id;
            await this.service.startContainer(id);
            return res.status(200).json({ message: "Conteneur démarré avec succès" });
        } catch (error) {
            if (error.statusCode === 304) {
                return res.status(304).json({ message: "Action impossible, le conteneur tourne déjà" });
            }
            console.error("startContainer error:", error);
            return res.status(500).json({ message: "Erreur lors du démarrage du conteneur", error: error.message });
        }
    }

    async stopContainer(req, res) {
        try {
            const id = req.params.id;
            await this.service.stopContainer(id);
            return res.status(200).json({ message: "Conteneur arrêté avec succès" });
        } catch (error) {
            if (error.statusCode === 304) {
                return res.status(304).json({ message: "Action impossible, le conteneur est déjà arrêté" });
            }
            console.error("stopContainer error:", error);
            return res.status(500).json({ message: "Erreur lors de l'arrêt du conteneur", error: error.message });
        }
    }

    async restartContainer(req, res) {
        try {
            const id = req.params.id;
            await this.service.restartContainer(id);
            return res.status(200).json({ message: "Conteneur redémarré avec succès" });
        } catch (error) {
            console.error("restartContainer error:", error);
            return res.status(500).json({ message: "Erreur lors du redémarrage du conteneur", error: error.message });
        }
    }

    async removeContainer(req, res) {
        try {
            const id = req.params.id;
            await this.service.removeContainer(id);
            return res.status(200).json({ message: "Conteneur supprimé avec succès" });
        } catch (error) {
            if (error.statusCode === 409) {
                return res.status(409).json({ message: "Action impossible, le conteneur est en cours d'exécution" });
            }
            console.error("removeContainer error:", error);
            return res.status(500).json({ message: "Erreur lors de la suppression du conteneur", error: error.message });
        }
    }

    async pullAndRecreateContainer(req, res) {
        try {
            const id = req.params.id;
            await this.service.pullAndRecreateContainer(id);
            return res.status(200).json({ message: "Conteneur mis à jour et recréé avec succès" });
        } catch (error) {
            console.error("pullAndRecreateContainer error:", error);
            return res.status(500).json({ message: "Erreur lors de la mise à jour du conteneur", error: error.message });
        }
    }

    async downloadContainerLogs(req, res) {
        try {
            const id = req.params.id.trim();
            this.service.downloadLogs(id, req, res);
        } catch (error) {
            console.error("downloadContainerLogs error:", error);
            if (!res.headersSent) {
                return res.status(500).json({ message: "Erreur lors du téléchargement des logs", error: error.message });
            }
        }
    }
}

// Instantiate with the service (which is already exported as an instance)
const containerService = require('./containers.service');
module.exports = new ContainerController(containerService);