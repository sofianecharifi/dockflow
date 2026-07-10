import { actionContainer } from '../../api/containers.api.js';
import { openLogsModal, initLogsModalEvents, openConfirmationModal, initConfirmationModalEvents } from '../modal.js';
import { showToast } from '../toast.js';
import { toggleCardActionLoading } from '../card.js';

export class ContainerActions {
    constructor(grid, getSocketInstance) {
        this.grid = grid;
        this.getSocketInstance = getSocketInstance;
        this.gridElement = document.getElementById('containers-grid');
        
        this.initEvents();
    }

    initEvents() {
        if (this.gridElement) {
            this.gridElement.addEventListener('click', (e) => this.handleActionClick(e));
        }

        initLogsModalEvents(this.getSocketInstance);
        initConfirmationModalEvents();
    }

    async handleActionClick(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

        if (!action || !id) return;

        if (action === 'logs') {
            openLogsModal(id, this.getSocketInstance());
            return;
        }

        const executeAction = async () => {
            const originalChildren = Array.from(button.childNodes);
            let currentToast = null;
            try {
                if (action === 'pull') {
                    this.showPullLoadingState(button);
                }

                const card = button.closest('[data-container-id]');
                toggleCardActionLoading(card, true);
                button.disabled = true;
                
                currentToast = showToast("Action en cours...", "info", 0);
                await actionContainer(id, action);

                const messages = {
                    'pull': "L'image a été mise à jour et le conteneur recréé.",
                    'start': "Conteneur démarré avec succès.",
                    'stop': "Conteneur arrêté avec succès.",
                    'restart': "Conteneur redémarré avec succès.",
                    'remove': "Conteneur supprimé avec succès."
                };

                if (currentToast && messages[action]) {
                    currentToast.update(messages[action], "success");
                }

                // Force UI update
                await this.grid.fetchAndRender();

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

        const containerName = button.closest('[data-container-id]')?.dataset?.containerName;
        const isDockFlow = containerName && containerName.includes('dockflow');

        if (action === 'stop') {
            openConfirmationModal(
                isDockFlow ? "Arrêter DockFlow" : "Arrêter le conteneur", 
                isDockFlow ? "Êtes-vous sûr de vouloir arrêter ce conteneur ? Cela va couper le site et il faudra le relancer manuellement si besoin." : "Êtes-vous sûr de vouloir arrêter ce conteneur ?", 
                executeAction, 
                isDockFlow
            );
        } else if (action === 'restart') {
            openConfirmationModal(
                isDockFlow ? "Redémarrer DockFlow" : "Redémarrer le conteneur", 
                isDockFlow ? "Êtes-vous sûr de vouloir redémarrer ce conteneur ? Cela va temporairement couper le site et il faudra peut-être le relancer manuellement si besoin." : "Êtes-vous sûr de vouloir redémarrer ce conteneur ?", 
                executeAction, 
                isDockFlow
            );
        } else if (action === 'remove') {
            openConfirmationModal("Supprimer l'application", "Êtes-vous sûr de vouloir supprimer définitivement cette application ? Cette action est irréversible.", executeAction, true);
        } else if (action === 'pull') {
            openConfirmationModal("Mettre à jour & Recréer", "Attention : Cette action va stopper, supprimer puis recréer le conteneur avec la dernière image. Assurez-vous que vos données importantes sont sauvegardées dans des volumes persistants.", executeAction, true);
        } else {
            executeAction();
        }
    }

    showPullLoadingState(button) {
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
}
