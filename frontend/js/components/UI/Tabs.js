export class Tabs {
    constructor(tabSelector, contentSelector) {
        this.tabBtns = document.querySelectorAll(tabSelector);
        this.tabContents = document.querySelectorAll(contentSelector);
        
        if (this.tabBtns.length > 0 && this.tabContents.length > 0) {
            this.initEvents();
        }
    }

    initEvents() {
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn));
        });
    }

    switchTab(selectedBtn) {
        // Remove active state from all buttons
        this.tabBtns.forEach(b => {
            const isDanger = b.dataset.target === 'tab-danger';
            if (isDanger) {
                b.classList.remove('active', 'bg-red-500/10', 'text-red-500', 'border-red-500/20', 'shadow-sm', 'shadow-red-500/10');
                b.classList.add('text-red-400', 'hover:text-red-300', 'hover:bg-red-500/10', 'border-transparent');
            } else {
                b.classList.remove('active', 'bg-blue-500/10', 'text-blue-400', 'border-blue-500/20', 'shadow-sm', 'shadow-blue-500/10');
                b.classList.add('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800/50', 'border-transparent');
            }
        });

        // Add active state to clicked button
        const isBtnDanger = selectedBtn.dataset.target === 'tab-danger';
        if (isBtnDanger) {
            selectedBtn.classList.add('active', 'bg-red-500/10', 'text-red-500', 'border-red-500/20', 'shadow-sm', 'shadow-red-500/10');
            selectedBtn.classList.remove('text-red-400', 'hover:text-red-300', 'hover:bg-red-500/10', 'border-transparent');
        } else {
            selectedBtn.classList.add('active', 'bg-blue-500/10', 'text-blue-400', 'border-blue-500/20', 'shadow-sm', 'shadow-blue-500/10');
            selectedBtn.classList.remove('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800/50', 'border-transparent');
        }

        // Hide all contents
        this.tabContents.forEach(content => {
            content.classList.add('hidden');
        });

        // Show target content
        const targetId = selectedBtn.dataset.target;
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
            targetContent.classList.remove('hidden');
        }
    }
}
