// check auth visually not possible with http-only, rely on api fails

// handle logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            const isApp = window.Capacitor || (window.navigator && window.navigator.userAgent.includes('Electron'));
            let API_BASE = isApp ? (localStorage.getItem('dockflow_api_url') || '') : '';
            await fetch(API_BASE + '/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (e) {
            console.error('Logout error', e);
        } finally {
            window.location.href = 'login.html';
        }
    });
}

import { createContainerCard } from '../components/card.js';

function renderContainersGrid(containers) {
    const grid = document.getElementById('containers-grid');
    if (!grid) return;

    // clear before inject
    grid.replaceChildren();

    containers.forEach(container => {
        const cardElement = createContainerCard(container);
        grid.appendChild(cardElement);
    });
}

let socket;

// init websockets
function initWebSockets() {
    if (socket) return;

    if (typeof io !== 'undefined') {
        const isApp = window.Capacitor || (window.navigator && window.navigator.userAgent.includes('Electron'));
        let API_BASE = isApp ? (localStorage.getItem('dockflow_api_url') || '') : '';
        socket = io(API_BASE || undefined, {
            withCredentials: true
        });

        socket.on('system-stats', (stats) => {
            // CPU
            const cpuGauge = document.getElementById('cpu-gauge');
            const cpuText = document.getElementById('cpu-text');
            const cpuModelEl = document.getElementById('cpu-model');

            if (cpuGauge && cpuText && stats.cpu !== undefined) {
                cpuGauge.style.width = stats.cpu !== null ? `${stats.cpu}%` : '0%';
                cpuText.textContent = stats.cpu !== null ? `${stats.cpu}%` : 'N/A';
            }

            if (cpuModelEl && stats.cpuModel) {
                cpuModelEl.textContent = stats.cpuModel;
                cpuModelEl.title = stats.cpuModel; // Useful for truncate
            }

            // RAM
            const ramGauge = document.getElementById('ram-gauge');
            const ramText = document.getElementById('ram-text');
            if (ramGauge && ramText && stats.ram !== undefined) {
                ramGauge.style.width = stats.ram !== null ? `${stats.ram}%` : '0%';
                
                let text = stats.ram !== null ? `${stats.ram}%` : 'N/A';
                if (stats.totalRam) {
                    const gb = (stats.totalRam / (1024 ** 3)).toFixed(1);
                    text += ` (sur ${gb} Go)`;
                }
                ramText.textContent = text;
            }

        });

        function formatBytes(bytes) {
            if (bytes === 0 || !bytes) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        socket.on('containers-stats', (containers) => {
            const grid = document.getElementById('containers-grid');
            if (!grid) return;

            containers.forEach(container => {
                const card = grid.querySelector(`[data-container-id="${container.id}"]`);
                const isRunning = container.state === 'running';

                if (card) {
                    const currentState = card.dataset.currentState;
                    if (currentState && currentState !== container.state) {
                        const newCard = createContainerCard(container);
                        card.replaceWith(newCard);
                        return; // card fully replaced
                    }

                    // Update RAM
                    const ramEl = card.querySelector(`[data-stat-ram="${container.id}"]`);
                    if (ramEl) {
                        ramEl.textContent = isRunning ? formatBytes(container.ramUsage) : '0 B';
                    }

                    // Update Disk
                    const diskEl = card.querySelector(`[data-stat-disk="${container.id}"]`);
                    if (diskEl) {
                        diskEl.textContent = formatBytes(container.sizeRw);
                    }

                    // Update status text
                    const statusEl = card.querySelector(`[data-stat-status="${container.id}"]`);
                    if (statusEl) {
                        statusEl.textContent = container.status || (isRunning ? 'En ligne' : 'Stoppé');
                        statusEl.className = `text-sm font-medium ${isRunning ? 'text-emerald-400' : 'text-red-400'}`;
                    }

                    // Also update the badge dot color
                    const badgeDot = card.querySelector('.relative.inline-flex.rounded-full.h-3.w-3');
                    const badgePing = card.querySelector('.animate-ping');

                    if (isRunning) {
                        if (badgeDot) {
                            badgeDot.className = 'relative inline-flex rounded-full h-3 w-3 bg-emerald-500';
                        }
                        if (!badgePing) {
                            const newPing = document.createElement('span');
                            newPing.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75';
                            badgeDot.parentElement.insertBefore(newPing, badgeDot);
                        }
                    } else {
                        if (badgeDot) {
                            badgeDot.className = 'relative inline-flex rounded-full h-3 w-3 bg-red-500';
                        }
                        if (badgePing) {
                            badgePing.remove();
                        }
                    }

                }
            });

            // check if there are deleted/added containers
            const cards = grid.querySelectorAll('[data-container-id]');
            if (cards.length !== containers.length) {
                // If container count changes, full re-render
                import('../api/containers.api.js').then(module => {
                    module.getContainers().then(renderContainersGrid);
                });
            }
        });

        socket.on('container-logs', (data) => {
            const logsStream = document.getElementById('logs-stream');

            if (logsStream) {
                // format string data
                const text = typeof data === 'string' ? data : data.text;
                const type = typeof data === 'string' ? 'stderr' : data.type;

                const span = document.createElement('span');
                span.textContent = text;

                // color logs by type
                if (type === 'stderr') {
                    span.classList.add('text-red-400');
                } else {
                    span.classList.add('text-slate-200'); // normal text
                }

                logsStream.appendChild(span);

                // prevent memory leak
                // limit to 500 logs
                while (logsStream.childNodes.length > 500) {
                    logsStream.removeChild(logsStream.firstChild);
                }

                // auto scroll
                const scrollContainer = logsStream.parentElement;
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        });
    } else {
        console.warn("Socket.io n'est pas encore inclus dans la page !");
    }
}

// imports
import { getContainers, actionContainer } from '../api/containers.api.js';
import { openLogsModal, initLogsModalEvents } from '../components/modal.js';

// container actions
const gridContainer = document.getElementById('containers-grid');
if (gridContainer) {
    gridContainer.addEventListener('click', async (event) => {
        // get clicked button
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

        if (!action || !id) return;

        // show logs modal
        if (action === 'logs') {
            openLogsModal(id, socket);
            return;
        }

        try {
            // call api
            button.disabled = true;
            await actionContainer(id, action);
        } catch (error) {
            console.error(`Erreur lors de l'action ${action}:`, error);
            alert(error.message);
            button.disabled = false;
        }
    });
}

// init modal events
initLogsModalEvents(() => socket);


async function initializeDashboard() {
    try {
        // setup ws & fetch data
        initWebSockets();
        const containers = await getContainers();
        renderContainersGrid(containers);

    } catch (error) {
        console.error("Erreur lors de l'initialisation du tableau de bord :", error);
        if (error.message === 'Session expirée' || error.message.includes('Impossible de')) {
            window.location.href = 'login.html';
        }
    }
}

// init dashboard on load
initializeDashboard();
