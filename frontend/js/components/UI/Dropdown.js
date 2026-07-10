export class Dropdown {
    constructor(buttonId, dropdownId) {
        this.button = document.getElementById(buttonId);
        this.dropdown = document.getElementById(dropdownId);
        
        if (this.button && this.dropdown) {
            this.initEvents();
        }
    }

    initEvents() {
        this.button.addEventListener('click', (e) => this.toggle(e));
        document.addEventListener('click', (e) => this.closeOnClickOutside(e));
    }

    toggle(e) {
        e.stopPropagation();
        const isOpen = !this.dropdown.classList.contains('opacity-0');
        if (isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.dropdown.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
    }

    close() {
        this.dropdown.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
    }

    closeOnClickOutside(e) {
        if (!this.dropdown.contains(e.target) && !this.button.contains(e.target)) {
            this.close();
        }
    }
}
