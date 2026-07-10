export class Toggle {
    constructor(selector, onChange = null) {
        this.toggles = document.querySelectorAll(selector);
        this.onChange = onChange;
        
        if (this.toggles.length > 0) {
            this.initEvents();
        }
    }

    initEvents() {
        this.toggles.forEach(toggle => {
            toggle.addEventListener('click', () => this.handleToggleClick(toggle));
        });
    }

    handleToggleClick(toggle) {
        const isChecked = toggle.getAttribute('aria-checked') === 'true';
        const span = toggle.querySelector('span');
        
        if (isChecked) {
            toggle.setAttribute('aria-checked', 'false');
            toggle.classList.remove('bg-blue-600');
            toggle.classList.add('bg-slate-700');
            span.classList.remove('translate-x-5');
            span.classList.add('translate-x-0');
        } else {
            toggle.setAttribute('aria-checked', 'true');
            toggle.classList.remove('bg-slate-700');
            toggle.classList.add('bg-blue-600');
            span.classList.remove('translate-x-0');
            span.classList.add('translate-x-5');
        }

        if (this.onChange) {
            this.onChange(toggle, !isChecked);
        }
    }
}
