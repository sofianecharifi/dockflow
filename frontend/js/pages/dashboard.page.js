// check auth visually not possible with http-only, rely on api fails

// handle logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        // call logout endpoint or just clear cookie if we add one, 
        // for now just clear cookie via document.cookie is NOT possible (httpOnly), 
        // so we just redirect and let API fail or add a logout route. Let's redirect for now.
        // Best practice is to have a /api/auth/logout that clears it.
        try {
            const isApp = window.Capacitor || (window.navigator && window.navigator.userAgent.includes('Electron'));
            await fetch((isApp ? 'https://dockflow.mycharifi.ovh' : '') + '/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch(e) {}
        window.location.href = 'login.html';
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
        const API_BASE = isApp ? 'https://dockflow.mycharifi.ovh' : '';
        socket = io(API_BASE || undefined); 

        socket.on('system-stats', (stats) => {
            // CPU
            const cpuGauge = document.getElementById('cpu-gauge');
            const cpuText = document.getElementById('cpu-text');
            if (cpuGauge && cpuText && stats.cpu !== undefined) {
                cpuGauge.style.width = `${stats.cpu}%`;
                cpuText.textContent = `${stats.cpu}%`;
            }

            // RAM
            const ramGauge = document.getElementById('ram-gauge');
            const ramText = document.getElementById('ram-text');
            if (ramGauge && ramText && stats.ram !== undefined) {
                ramGauge.style.width = `${stats.ram}%`;
                ramText.textContent = `${stats.ram}%`;
            }

            // DISK
            const diskGauge = document.getElementById('disk-gauge');
            const diskText = document.getElementById('disk-text');
            if (diskGauge && diskText && stats.disk !== undefined) {
                diskGauge.style.width = `${stats.disk}%`;
                diskText.textContent = `${stats.disk}%`;
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

            // refresh dashboard
            await initializeDashboard();
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
