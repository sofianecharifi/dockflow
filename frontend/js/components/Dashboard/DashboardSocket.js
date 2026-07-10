import { getToken } from '../../auth.store.js';

export class DashboardSocket {
    constructor(grid) {
        this.grid = grid;
        this.socket = null;
        this.logsContainer = document.getElementById('logs-scroll-container');
        this.scrollBtn = document.getElementById('logs-scroll-bottom-btn');

        this.initEvents();
    }

    initEvents() {
        if (this.scrollBtn && this.logsContainer) {
            this.scrollBtn.addEventListener('click', () => {
                this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
            });
            this.logsContainer.addEventListener('scroll', () => {
                const isScrolledUp = this.logsContainer.scrollHeight - this.logsContainer.clientHeight - this.logsContainer.scrollTop > 50;
                if (!isScrolledUp) {
                    this.scrollBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
                }
            });
        }
    }

    connect() {
        if (this.socket) return;

        if (typeof io !== 'undefined') {
            const API_BASE = localStorage.getItem('dockflow_api_url') || '';
            const token = getToken();
            const socketOptions = {};
            if (token) socketOptions.auth = { token };

            const socketUrl = API_BASE || window.location.origin;
            this.socket = io(socketUrl, socketOptions);

            this.socket.on('connect', () => {
                console.log('[DockFlow] WebSocket connecté ✓', socketUrl);
            });

            this.socket.on('connect_error', (err) => {
                console.error('[DockFlow] Erreur WebSocket:', err.message);
            });

            this.socket.on('system-stats', (stats) => this.handleSystemStats(stats));
            this.socket.on('containers-stats', (containers) => {
                this.grid.updateInPlace(containers);
            });
            this.socket.on('container-logs', (data) => this.handleContainerLogs(data));
        } else {
            console.warn("Socket.io n'est pas encore inclus dans la page !");
        }
    }

    handleSystemStats(stats) {
        if (!this.currentStats) this.currentStats = { cpu: 0, ram: 0 };
        const gsapAvailable = typeof gsap !== 'undefined';

        const cpuGauge = document.getElementById('cpu-gauge');
        const cpuText = document.getElementById('cpu-text');
        const cpuModelEl = document.getElementById('cpu-model');

        if (cpuGauge && cpuText && stats.cpu !== undefined && stats.cpu !== null) {
            cpuText.classList.remove('animate-pulse');
            
            if (gsapAvailable) {
                gsap.to(this.currentStats, {
                    cpu: stats.cpu,
                    duration: 0.8,
                    ease: "power2.out",
                    onUpdate: () => {
                        const val = this.currentStats.cpu.toFixed(1);
                        cpuText.textContent = `${val}%`;
                    }
                });
                gsap.to(cpuGauge, {
                    width: `${stats.cpu}%`,
                    duration: 0.8,
                    ease: "power2.out"
                });
            } else {
                cpuGauge.style.width = `${stats.cpu}%`;
                cpuText.textContent = `${stats.cpu}%`;
            }
            
            cpuGauge.className = 'h-2.5 rounded-full ' + 
                (stats.cpu > 85 ? 'bg-red-500 shadow-sm shadow-red-500/50' : stats.cpu > 60 ? 'bg-amber-500 shadow-sm shadow-amber-500/50' : 'bg-blue-500 shadow-sm shadow-blue-500/50');
        } else if (cpuGauge && cpuText && stats.cpu === null) {
            cpuGauge.style.width = '0%';
            cpuText.textContent = 'N/A';
        }

        if (cpuModelEl && stats.cpuModel) {
            cpuModelEl.classList.remove('animate-pulse');
            cpuModelEl.textContent = stats.cpuModel;
            cpuModelEl.removeAttribute('title');
            const tooltip = document.getElementById('cpu-model-tooltip');
            if (tooltip) tooltip.textContent = stats.cpuModel;
        }

        const ramGauge = document.getElementById('ram-gauge');
        const ramText = document.getElementById('ram-text');
        if (ramGauge && ramText && stats.ram !== undefined && stats.ram !== null) {
            ramText.classList.remove('animate-pulse');
            
            const renderRamText = (val) => {
                let text = `${val.toFixed(1)}%`;
                if (stats.totalRam) {
                    const gb = (stats.totalRam / (1024 ** 3)).toFixed(1);
                    text += ` (sur ${gb} Go)`;
                }
                ramText.textContent = text;
            };

            if (gsapAvailable) {
                gsap.to(this.currentStats, {
                    ram: stats.ram,
                    duration: 0.8,
                    ease: "power2.out",
                    onUpdate: () => renderRamText(this.currentStats.ram)
                });
                gsap.to(ramGauge, {
                    width: `${stats.ram}%`,
                    duration: 0.8,
                    ease: "power2.out"
                });
            } else {
                ramGauge.style.width = `${stats.ram}%`;
                renderRamText(stats.ram);
            }
            
            ramGauge.className = 'h-2.5 rounded-full ' + 
                (stats.ram > 85 ? 'bg-red-500 shadow-sm shadow-red-500/50' : stats.ram > 60 ? 'bg-amber-500 shadow-sm shadow-amber-500/50' : 'bg-emerald-500 shadow-sm shadow-emerald-500/50');
        } else if (ramGauge && ramText && stats.ram === null) {
            ramGauge.style.width = '0%';
            ramText.textContent = 'N/A';
        }
    }

    handleContainerLogs(data) {
        const logsStream = document.getElementById('logs-stream');
        if (logsStream) {
            const text = typeof data === 'string' ? data : data.text;
            const type = typeof data === 'string' ? 'stderr' : data.type;
            const span = document.createElement('span');
            
            if (type === 'stderr') {
                span.classList.add('text-red-400');
                span.textContent = text;
            } else {
                span.classList.add('text-slate-200');
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

            while (logsStream.childNodes.length > 500) {
                logsStream.removeChild(logsStream.firstChild);
            }

            if (this.logsContainer) {
                const isScrolledUp = this.logsContainer.scrollHeight - this.logsContainer.clientHeight - this.logsContainer.scrollTop > 50;
                
                if (isScrolledUp) {
                    if (this.scrollBtn) this.scrollBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
                } else {
                    if (this.scrollBtn) this.scrollBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
                    this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
                }
            }
        }
    }
}
