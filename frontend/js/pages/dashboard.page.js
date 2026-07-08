// check auth visually not possible with http-only, rely on api fails

import { getToken, clearToken } from '../auth.store.js';
import { createContainerCard, createEmptyStateCard, toggleCardActionLoading } from '../components/card.js';

// handle logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            const API_BASE = localStorage.getItem('dockflow_api_url') || '';
            await fetch(API_BASE + '/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (e) {
            console.error('Logout error', e);
        } finally {
            // Clear token from session store
            clearToken();
            window.location.href = 'login.html';
        }
    });
}

// user menu toggle
const userMenuBtn = document.getElementById('user-menu-btn');
const userDropdown = document.getElementById('user-dropdown');

if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('opacity-0');
        userDropdown.classList.toggle('scale-95');
        userDropdown.classList.toggle('pointer-events-none');
        userDropdown.classList.toggle('opacity-100');
        userDropdown.classList.toggle('scale-100');
        userDropdown.classList.toggle('pointer-events-auto');
    });

    document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            userDropdown.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
        }
    });
}


let allContainers = [];
let currentSearchTerm = '';
let currentFilter = 'all';

function renderContainersGrid(containers) {
    allContainers = containers;
    const grid = document.getElementById('containers-grid');
    if (!grid) return;

    grid.replaceChildren();
    
    const filteredContainers = containers.filter(container => {
        const matchesSearch = (container.name || '').toLowerCase().includes(currentSearchTerm.toLowerCase());
        const isRunning = container.state === 'running';
        const matchesFilter = currentFilter === 'all' || 
                              (currentFilter === 'running' && isRunning) || 
                              (currentFilter === 'stopped' && !isRunning);
        return matchesSearch && matchesFilter;
    });

    if (filteredContainers.length === 0) {
        grid.appendChild(createEmptyStateCard(
            containers.length === 0 ? "Aucune application détectée" : "Aucune application ne correspond à vos critères"
        ));
        return;
    }

    filteredContainers.forEach((container, index) => {
        const cardElement = createContainerCard(container);
        cardElement.classList.add('animate-slide-up');
        cardElement.style.animationFillMode = 'both';
        cardElement.style.animationDelay = `${index * 80}ms`;
        grid.appendChild(cardElement);
    });
}

let socket;

// init websockets
function initWebSockets() {
    if (socket) return;

    if (typeof io !== 'undefined') {
        const API_BASE = localStorage.getItem('dockflow_api_url') || '';

        // Retrieve the JWT from our in-memory/session store.
        // Passed via socket.io auth handshake — works cross-origin in Tauri.
        // This is the only way to authenticate WebSocket when cookies can't cross
        // the tauri:// → http:// origin boundary.
        const token = getToken();
        const socketOptions = {};
        if (token) {
            socketOptions.auth = { token };
        }

        // Always provide an explicit URL — io() with no URL would default to
        // tauri://localhost which can't accept WebSocket connections.
        const socketUrl = API_BASE || window.location.origin;
        socket = io(socketUrl, socketOptions);

        socket.on('connect', () => {
            console.log('[DockFlow] WebSocket connecté ✓', socketUrl);
        });

        socket.on('connect_error', (err) => {
            console.error('[DockFlow] Erreur WebSocket:', err.message);
        });

        socket.on('system-stats', (stats) => {
            // CPU
            const cpuGauge = document.getElementById('cpu-gauge');
            const cpuText = document.getElementById('cpu-text');
            const cpuModelEl = document.getElementById('cpu-model');

            if (cpuGauge && cpuText && stats.cpu !== undefined) {
                cpuText.classList.remove('animate-pulse');
                cpuGauge.style.width = stats.cpu !== null ? `${stats.cpu}%` : '0%';
                cpuText.textContent = stats.cpu !== null ? `${stats.cpu}%` : 'N/A';
                cpuGauge.className = 'h-2.5 rounded-full transition-all duration-300 ease-out ' + 
                    (stats.cpu > 85 ? 'bg-red-500 shadow-sm shadow-red-500/50' : stats.cpu > 60 ? 'bg-amber-500 shadow-sm shadow-amber-500/50' : 'bg-blue-500 shadow-sm shadow-blue-500/50');
            }

            if (cpuModelEl && stats.cpuModel) {
                cpuModelEl.classList.remove('animate-pulse');
                cpuModelEl.textContent = stats.cpuModel;
                cpuModelEl.removeAttribute('title'); // Remove native title if any
                const tooltip = document.getElementById('cpu-model-tooltip');
                if (tooltip) tooltip.textContent = stats.cpuModel; // Update custom tooltip
            }

            // RAM
            const ramGauge = document.getElementById('ram-gauge');
            const ramText = document.getElementById('ram-text');
            if (ramGauge && ramText && stats.ram !== undefined) {
                ramText.classList.remove('animate-pulse');
                ramGauge.style.width = stats.ram !== null ? `${stats.ram}%` : '0%';
                
                let text = stats.ram !== null ? `${stats.ram}%` : 'N/A';
                if (stats.totalRam) {
                    const gb = (stats.totalRam / (1024 ** 3)).toFixed(1);
                    text += ` (sur ${gb} Go)`;
                }
                ramText.textContent = text;
                ramGauge.className = 'h-2.5 rounded-full transition-all duration-300 ease-out ' + 
                    (stats.ram > 85 ? 'bg-red-500 shadow-sm shadow-red-500/50' : stats.ram > 60 ? 'bg-amber-500 shadow-sm shadow-amber-500/50' : 'bg-emerald-500 shadow-sm shadow-emerald-500/50');
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
                        ramEl.classList.remove('animate-pulse');
                        ramEl.textContent = isRunning ? formatBytes(container.ramUsage) : '0 B';
                    }

                    // Update Disk
                    const diskEl = card.querySelector(`[data-stat-disk="${container.id}"]`);
                    if (diskEl) {
                        diskEl.classList.remove('animate-pulse');
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

            // check if there are deleted/added containers globally
            if (allContainers.length !== containers.length) {
                // If container count changes, full re-render
                import('../api/containers.api.js').then(module => {
                    module.getContainers().then(renderContainersGrid);
                });
            } else {
                // Verify if any new IDs appeared that we don't have
                const currentIds = allContainers.map(c => c.id).sort().join(',');
                const newIds = containers.map(c => c.id).sort().join(',');
                if (currentIds !== newIds) {
                    import('../api/containers.api.js').then(module => {
                        module.getContainers().then(renderContainersGrid);
                    });
                }
            }
        });

        socket.on('container-logs', (data) => {
            const logsStream = document.getElementById('logs-stream');

            if (logsStream) {
                // format string data
                const text = typeof data === 'string' ? data : data.text;
                const type = typeof data === 'string' ? 'stderr' : data.type;

                const span = document.createElement('span');
                
                // color logs by type safely via textContent
                if (type === 'stderr') {
                    span.classList.add('text-red-400');
                    span.textContent = text;
                } else {
                    span.classList.add('text-slate-200'); // normal text
                    // Safe colorization
                    const tokens = text.split(/(ERROR|WARN|WARNING|INFO)/g);
                    tokens.forEach(token => {
                        if (token === 'ERROR') {
                            const errSpan = document.createElement('span');
                            errSpan.className = 'text-red-400 font-bold';
                            errSpan.textContent = token;
                            span.appendChild(errSpan);
                        } else if (token === 'WARN' || token === 'WARNING') {
                            const warnSpan = document.createElement('span');
                            warnSpan.className = 'text-amber-400 font-bold';
                            warnSpan.textContent = token;
                            span.appendChild(warnSpan);
                        } else if (token === 'INFO') {
                            const infoSpan = document.createElement('span');
                            infoSpan.className = 'text-blue-400 font-bold';
                            infoSpan.textContent = token;
                            span.appendChild(infoSpan);
                        } else {
                            span.appendChild(document.createTextNode(token));
                        }
                    });
                }

                logsStream.appendChild(span);

                // prevent memory leak
                // limit to 500 logs
                while (logsStream.childNodes.length > 500) {
                    logsStream.removeChild(logsStream.firstChild);
                }

                // auto scroll handling
                const scrollContainer = logsStream.parentElement;
                
                // Determine if user is scrolled up
                const isScrolledUp = scrollContainer.scrollHeight - scrollContainer.clientHeight - scrollContainer.scrollTop > 50;
                
                const scrollBtn = document.getElementById('logs-scroll-bottom-btn');
                if (isScrolledUp) {
                    if (scrollBtn) scrollBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
                } else {
                    if (scrollBtn) scrollBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
                    scrollContainer.scrollTop = scrollContainer.scrollHeight;
                }
            }
        });
    } else {
        console.warn("Socket.io n'est pas encore inclus dans la page !");
    }
}

// imports
import { getContainers, actionContainer } from '../api/containers.api.js';
import { openLogsModal, initLogsModalEvents, openConfirmationModal, initConfirmationModalEvents } from '../components/modal.js';
import { showToast } from '../components/toast.js';

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

        const executeAction = async () => {
            const originalChildren = Array.from(button.childNodes);
            let currentToast = null;
            try {
                // spinner for pull
                if (action === 'pull') {
                    button.replaceChildren();
                    
                    const svgNS = "http://www.w3.org/2000/svg";
                    const svg = document.createElementNS(svgNS, "svg");
                    svg.setAttribute("class", "animate-spin h-4 w-4 inline-block mr-1");
                    svg.setAttribute("fill", "none");
                    svg.setAttribute("viewBox", "0 0 24 24");
                    
                    const circle = document.createElementNS(svgNS, "circle");
                    circle.setAttribute("class", "opacity-25");
                    circle.setAttribute("cx", "12");
                    circle.setAttribute("cy", "12");
                    circle.setAttribute("r", "10");
                    circle.setAttribute("stroke", "currentColor");
                    circle.setAttribute("stroke-width", "4");
                    
                    const path = document.createElementNS(svgNS, "path");
                    path.setAttribute("class", "opacity-75");
                    path.setAttribute("fill", "currentColor");
                    path.setAttribute("d", "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z");
                    
                    svg.appendChild(circle);
                    svg.appendChild(path);
                    
                    button.appendChild(svg);
                    button.appendChild(document.createTextNode(" En cours..."));
                }

                const card = button.closest('[data-container-id]');
                toggleCardActionLoading(card, true);

                button.disabled = true;
                
                currentToast = showToast("Action en cours...", "info", 0);

                await actionContainer(id, action);

                if (action === 'pull') {
                    if (currentToast) currentToast.update("L'image a été mise à jour et le conteneur recréé.", "success");
                } else if (action === 'start') {
                    if (currentToast) currentToast.update("Conteneur démarré avec succès.", "success");
                } else if (action === 'stop') {
                    if (currentToast) currentToast.update("Conteneur arrêté avec succès.", "success");
                } else if (action === 'restart') {
                    if (currentToast) currentToast.update("Conteneur redémarré avec succès.", "success");
                } else if (action === 'remove') {
                    if (currentToast) currentToast.update("Conteneur supprimé avec succès.", "success");
                }
            } catch (error) {
                console.error(`Erreur lors de l'action ${action}:`, error);
                if (currentToast) {
                    currentToast.update(error.message || "Une erreur est survenue", 'error');
                } else {
                    showToast(error.message || "Une erreur est survenue", 'error');
                }
            } finally {
                button.disabled = false;
                button.replaceChildren(...originalChildren);
                
                const card = button.closest('[data-container-id]');
                toggleCardActionLoading(card, false);
            }
        };

        if (action === 'stop') {
            const containerName = button.closest('[data-container-id]')?.dataset?.containerName;
            if (containerName && containerName.includes('dockflow')) {
                openConfirmationModal("Arrêter DockFlow", "Êtes-vous sûr de vouloir arrêter ce conteneur ? Cela va couper le site et il faudra le relancer manuellement si besoin.", executeAction, true);
            } else {
                openConfirmationModal("Arrêter le conteneur", "Êtes-vous sûr de vouloir arrêter ce conteneur ?", executeAction);
            }
        } else if (action === 'restart') {
            const containerName = button.closest('[data-container-id]')?.dataset?.containerName;
            if (containerName && containerName.includes('dockflow')) {
                openConfirmationModal("Redémarrer DockFlow", "Êtes-vous sûr de vouloir redémarrer ce conteneur ? Cela va temporairement couper le site et il faudra peut-être le relancer manuellement si besoin.", executeAction, true);
            } else {
                openConfirmationModal("Redémarrer le conteneur", "Êtes-vous sûr de vouloir redémarrer ce conteneur ?", executeAction);
            }
        } else if (action === 'remove') {
            openConfirmationModal("Supprimer l'application", "Êtes-vous sûr de vouloir supprimer définitivement cette application ? Cette action est irréversible.", executeAction, true);
        } else if (action === 'pull') {
            openConfirmationModal("Mettre à jour & Recréer", "Attention : Cette action va stopper, supprimer puis recréer le conteneur avec la dernière image. Assurez-vous que vos données importantes sont sauvegardées dans des volumes persistants.", executeAction, true);
        } else {
            executeAction();
        }
    });
}

// init modal events
initLogsModalEvents(() => socket);
initConfirmationModalEvents();


async function initializeDashboard() {
    try {
        // Init UI events
        const searchInput = document.getElementById('container-search-input');
        const filterGroup = document.getElementById('filter-btn-group');
        const scrollBtn = document.getElementById('logs-scroll-bottom-btn');
        const logsContainer = document.getElementById('logs-scroll-container');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentSearchTerm = e.target.value;
                renderContainersGrid(allContainers);
            });
        }
        
        if (filterGroup) {
            const filterBtns = filterGroup.querySelectorAll('button');
            filterBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Update active styles
                    filterBtns.forEach(b => {
                        b.classList.remove('bg-slate-700', 'text-white', 'shadow-sm');
                        b.classList.add('text-slate-400');
                    });
                    
                    const clickedBtn = e.target;
                    clickedBtn.classList.remove('text-slate-400');
                    clickedBtn.classList.add('bg-slate-700', 'text-white', 'shadow-sm');
                    
                    // Apply filter
                    currentFilter = clickedBtn.dataset.filter;
                    renderContainersGrid(allContainers);
                });
            });
        }

        if (scrollBtn && logsContainer) {
            scrollBtn.addEventListener('click', () => {
                logsContainer.scrollTop = logsContainer.scrollHeight;
            });
            logsContainer.addEventListener('scroll', () => {
                const isScrolledUp = logsContainer.scrollHeight - logsContainer.clientHeight - logsContainer.scrollTop > 50;
                if (!isScrolledUp) {
                    scrollBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
                }
            });
        }

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
