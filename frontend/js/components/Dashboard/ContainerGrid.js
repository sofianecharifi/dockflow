import { createContainerCard, createEmptyStateCard } from '../card.js';
import { getContainers } from '../../api/containers.api.js';

export class ContainerGrid {
    constructor() {
        this.allContainers = [];
        this.currentSearchTerm = '';
        this.currentFilter = 'all';

        this.grid = document.getElementById('containers-grid');
        this.searchInput = document.getElementById('container-search-input');
        this.filterGroup = document.getElementById('filter-btn-group');

        this.initEvents();
    }

    initEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.currentSearchTerm = e.target.value;
                this.applyFilters();
            });
        }

        if (this.filterGroup) {
            const filterBtns = this.filterGroup.querySelectorAll('button');
            filterBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    filterBtns.forEach(b => {
                        b.classList.remove('bg-slate-700', 'text-white', 'shadow-sm');
                        b.classList.add('text-slate-400');
                    });
                    
                    const clickedBtn = e.target;
                    clickedBtn.classList.remove('text-slate-400');
                    clickedBtn.classList.add('bg-slate-700', 'text-white', 'shadow-sm');
                    
                    this.currentFilter = clickedBtn.dataset.filter;
                    this.applyFilters();
                });
            });
        }
    }

    async fetchAndRender() {
        this.allContainers = await getContainers();
        this.renderGrid();
    }

    renderGrid() {
        if (!this.grid) return;

        this.grid.replaceChildren();
        
        this.allContainers.forEach((container) => {
            const cardElement = createContainerCard(container);
            this.grid.appendChild(cardElement);
        });

        this.applyFilters(true);

        // Animation de chargement initial via GSAP au lieu du CSS Tailwind
        if (typeof gsap !== 'undefined') {
            const visibleCards = Array.from(this.grid.children).filter(el => !el.classList.contains('hidden'));
            if (visibleCards.length > 0) {
                // Supprimer les transitions CSS temporairement pour éviter le conflit GSAP/Tailwind
                visibleCards.forEach(el => el.classList.remove('transition-all', 'duration-300'));

                gsap.fromTo(visibleCards, 
                    { opacity: 0, y: 30 }, 
                    { 
                        opacity: 1, 
                        y: 0, 
                        duration: 0.5, 
                        stagger: 0.08, 
                        ease: "power2.out",
                        onComplete: function() {
                            // Restaurer les transitions pour le survol (hover)
                            this.targets().forEach(el => el.classList.add('transition-all', 'duration-300'));
                        }
                    }
                );
            }
        }
    }

    applyFilters(skipAnimation = false) {
        if (!this.grid) return;

        let visibleCount = 0;
        const cards = Array.from(this.grid.querySelectorAll('[data-container-id]'));
        let emptyStateCard = this.grid.querySelector('#empty-state-card');
        
        const flipAvailable = typeof Flip !== 'undefined' && typeof gsap !== 'undefined' && !skipAnimation;
        let state;
        
        const allItems = [...cards];
        if (emptyStateCard) allItems.push(emptyStateCard);

        if (flipAvailable) {
            const visibleElements = allItems.filter(el => !el.classList.contains('hidden'));
            state = Flip.getState(visibleElements);
        }

        cards.forEach(card => {
            const containerId = card.dataset.containerId;
            const container = this.allContainers.find(c => c.id === containerId);
            if (!container) return;

            const matchesSearch = (container.name || '').toLowerCase().includes(this.currentSearchTerm.toLowerCase());
            const isRunning = container.state === 'running';
            const matchesFilter = this.currentFilter === 'all' || 
                                  (this.currentFilter === 'running' && isRunning) || 
                                  (this.currentFilter === 'stopped' && !isRunning);
            
            if (matchesSearch && matchesFilter) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        if (visibleCount === 0) {
            const message = this.allContainers.length === 0 ? "Aucune application détectée" : "Aucune application ne correspond à vos critères";
            if (!emptyStateCard) {
                emptyStateCard = createEmptyStateCard(message);
                emptyStateCard.id = 'empty-state-card';
                this.grid.appendChild(emptyStateCard);
                allItems.push(emptyStateCard); // add to allItems so Flip knows about it
            } else {
                const p = emptyStateCard.querySelector('p');
                if (p) p.textContent = message;
                emptyStateCard.classList.remove('hidden');
            }
        } else {
            if (emptyStateCard) {
                emptyStateCard.classList.add('hidden');
            }
        }
        
        if (flipAvailable && state) {
            // Targets: elements that are NOW visible OR were visible in state (so Flip can animate leaving ones)
            const targets = allItems.filter(el => !el.classList.contains('hidden') || state.targets.includes(el));
            
            // Supprimer temporairement les transitions CSS pour éviter les conflits avec GSAP
            targets.forEach(el => el.classList.remove('transition-all', 'duration-300'));
            
            Flip.from(state, {
                targets: targets,
                duration: 0.4,
                ease: "power2.out",
                absoluteOnLeave: true, // Prevents grid collapse
                onEnter: elements => gsap.fromTo(elements, {opacity: 0, scale: 0.95}, {opacity: 1, scale: 1, duration: 0.4}),
                onLeave: elements => gsap.to(elements, {opacity: 0, scale: 0.95, duration: 0.4}),
                onComplete: () => {
                    // Restaurer les transitions pour le survol (hover) une fois l'animation GSAP terminée
                    targets.forEach(el => el.classList.add('transition-all', 'duration-300'));
                }
            });
        }
    }

    updateInPlace(containers) {
        if (!this.grid) return;

        let stateChanged = false;

        containers.forEach(container => {
            const index = this.allContainers.findIndex(c => c.id === container.id);
            if (index !== -1) {
                if (this.allContainers[index].state !== container.state) {
                    stateChanged = true;
                }
                this.allContainers[index] = { ...this.allContainers[index], ...container };
            }

            const card = this.grid.querySelector(`[data-container-id="${container.id}"]`);
            const isRunning = container.state === 'running';

            if (card) {
                const currentState = card.dataset.currentState;
                if (currentState && currentState !== container.state) {
                    const newCard = createContainerCard(container);
                    card.replaceWith(newCard);
                    return;
                }

                const ramEl = card.querySelector(`[data-stat-ram="${container.id}"]`);
                if (ramEl) {
                    ramEl.classList.remove('animate-pulse');
                    ramEl.textContent = isRunning ? this.formatBytes(container.ramUsage) : '0 B';
                }

                const diskEl = card.querySelector(`[data-stat-disk="${container.id}"]`);
                if (diskEl) {
                    diskEl.classList.remove('animate-pulse');
                    diskEl.textContent = this.formatBytes(container.sizeRw);
                }

                const statusEl = card.querySelector(`[data-stat-status="${container.id}"]`);
                if (statusEl) {
                    statusEl.textContent = container.status || (isRunning ? 'En ligne' : 'Stoppé');
                    statusEl.className = `text-sm font-medium ${isRunning ? 'text-emerald-400' : 'text-red-400'}`;
                }

                const badgeDot = card.querySelector('.relative.inline-flex.rounded-full.h-3.w-3');
                const badgePing = card.querySelector('.animate-ping');

                if (isRunning) {
                    if (badgeDot) badgeDot.className = 'relative inline-flex rounded-full h-3 w-3 bg-emerald-500';
                    if (!badgePing && badgeDot) {
                        const newPing = document.createElement('span');
                        newPing.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75';
                        badgeDot.parentElement.insertBefore(newPing, badgeDot);
                    }
                } else {
                    if (badgeDot) badgeDot.className = 'relative inline-flex rounded-full h-3 w-3 bg-red-500';
                    if (badgePing) badgePing.remove();
                }
            }
        });

        if (this.allContainers.length !== containers.length) {
            this.fetchAndRender();
        } else {
            const currentIds = this.allContainers.map(c => c.id).sort().join(',');
            const newIds = containers.map(c => c.id).sort().join(',');
            if (currentIds !== newIds) {
                this.fetchAndRender();
            } else if (stateChanged) {
                this.applyFilters();
            }
        }
    }

    formatBytes(bytes) {
        if (bytes === 0 || !bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
