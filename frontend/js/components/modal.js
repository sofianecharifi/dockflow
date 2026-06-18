export function closeLogsModal(socket) {
    const logsModal = document.getElementById('logs-modal');
    const logsStream = document.getElementById('logs-stream');

    if (logsModal) {
        logsModal.classList.add('hidden'); // hide modal
    }
    if (logsStream) {
        logsStream.textContent = ''; // clear buffer
    }
    if (socket) {
        socket.emit('stop-logs'); // stop docker stream
    }
}

export function openLogsModal(id, socket) {
    const logsModal = document.getElementById('logs-modal');
    const downloadBtn = document.getElementById('download-logs-btn');
    if (logsModal && socket) {
        logsModal.classList.remove('hidden');
        if (downloadBtn) downloadBtn.dataset.id = id;
        socket.emit('request-logs', id);
    }
}

export function initLogsModalEvents(getSocket) {
    const closeLogsBtn = document.getElementById('close-logs-btn');
    const logsBackdrop = document.getElementById('logs-backdrop');
    const downloadLogsBtn = document.getElementById('download-logs-btn');

    const handleClose = () => closeLogsModal(getSocket());

    if (closeLogsBtn) {
        closeLogsBtn.addEventListener('click', handleClose);
    }

    if (logsBackdrop) {
        logsBackdrop.addEventListener('click', handleClose);
    }

    if (downloadLogsBtn) {
        // save initial state
        const originalChildren = Array.from(downloadLogsBtn.childNodes);
        const originalTitle = downloadLogsBtn.title;

        downloadLogsBtn.addEventListener('click', async () => {
            const containerId = downloadLogsBtn.dataset.id;
            if (!containerId) return;

            const isApp = window.Capacitor || (window.navigator && window.navigator.userAgent.includes('Electron'));
            const API_BASE = isApp ? 'https://dockflow.mycharifi.ovh' : '';
            const url = `${API_BASE}/api/containers/${containerId}/logs/download`;
            const token = localStorage.getItem('dockflow_token');

            try {
                // show loading spinner
                downloadLogsBtn.disabled = true;
                downloadLogsBtn.title = "chargement des logs";
                
                const spinnerSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                spinnerSvg.setAttribute("class", "animate-spin text-blue-400");
                spinnerSvg.setAttribute("width", "20");
                spinnerSvg.setAttribute("height", "20");
                spinnerSvg.setAttribute("viewBox", "0 0 24 24");
                spinnerSvg.setAttribute("fill", "none");
                spinnerSvg.setAttribute("stroke", "currentColor");
                spinnerSvg.setAttribute("stroke-width", "2");
                spinnerSvg.setAttribute("stroke-linecap", "round");
                spinnerSvg.setAttribute("stroke-linejoin", "round");

                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", "12");
                circle.setAttribute("cy", "12");
                circle.setAttribute("r", "10");
                circle.setAttribute("stroke-opacity", "0.25");

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", "M12 2a10 10 0 0 1 10 10");

                spinnerSvg.appendChild(circle);
                spinnerSvg.appendChild(path);

                while (downloadLogsBtn.firstChild) {
                    downloadLogsBtn.removeChild(downloadLogsBtn.firstChild);
                }
                downloadLogsBtn.appendChild(spinnerSvg);

                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error('Erreur lors du téléchargement des logs');
                }

                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `container-${containerId}-logs.txt`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);
            } catch (error) {
                console.error(error);
                alert("Impossible de télécharger les logs.");
            } finally {
                // restore initial state
                downloadLogsBtn.disabled = false;
                downloadLogsBtn.title = originalTitle;
                
                while (downloadLogsBtn.firstChild) {
                    downloadLogsBtn.removeChild(downloadLogsBtn.firstChild);
                }
                originalChildren.forEach(child => downloadLogsBtn.appendChild(child));
            }
        });
    }

    // close on esc
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const logsModal = document.getElementById('logs-modal');
            if (logsModal && !logsModal.classList.contains('hidden')) {
                handleClose();
            }
        }
    });
}
