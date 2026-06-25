export function showToast(message, type = 'success', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return null;

    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-y-8 opacity-0 pointer-events-auto`;
    
    const setContent = (msg, toastType) => {
        // Reset specific classes
        toast.className = `flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 pointer-events-auto`;
        
        if (toastType === 'success') {
            toast.classList.add('bg-emerald-900/90', 'border', 'border-emerald-700', 'text-emerald-100');
            toast.innerHTML = `
                <svg class="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-sm font-medium leading-snug">${msg}</span>
            `;
        } else if (toastType === 'error') {
            toast.classList.add('bg-red-900/90', 'border', 'border-red-700', 'text-red-100');
            toast.innerHTML = `
                <svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span class="text-sm font-medium leading-snug">${msg}</span>
            `;
        } else if (toastType === 'info') {
            toast.classList.add('bg-slate-800/90', 'border', 'border-slate-700', 'text-slate-200');
            toast.innerHTML = `
                <svg class="animate-spin w-5 h-5 text-slate-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-sm font-medium leading-snug">${msg}</span>
            `;
        }
    };

    setContent(message, type);
    container.appendChild(toast);

    // animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-8', 'opacity-0');
    });

    let timeoutId;
    const close = () => {
        toast.classList.add('translate-y-8', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    };

    if (duration > 0) {
        timeoutId = setTimeout(close, duration);
    }

    return {
        close,
        update: (newMessage, newType, newDuration = 4000) => {
            if (timeoutId) clearTimeout(timeoutId);
            setContent(newMessage, newType);
            if (newDuration > 0) {
                timeoutId = setTimeout(close, newDuration);
            }
        }
    };
}
