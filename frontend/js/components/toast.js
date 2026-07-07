export function showToast(message, type = 'success', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return null;

    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-y-8 opacity-0 pointer-events-auto`;
    
    const setContent = (msg, toastType) => {
        // Reset specific classes
        toast.className = `flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 pointer-events-auto`;
        toast.replaceChildren();

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        const span = document.createElement("span");
        span.className = "text-sm font-medium leading-snug";
        span.textContent = msg;

        if (toastType === 'success') {
            toast.classList.add('bg-emerald-900/90', 'border', 'border-emerald-700', 'text-emerald-100');
            
            svg.setAttribute("class", "w-5 h-5 text-emerald-400 flex-shrink-0");
            svg.setAttribute("fill", "none");
            svg.setAttribute("stroke", "currentColor");
            svg.setAttribute("viewBox", "0 0 24 24");

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("stroke-linecap", "round");
            path.setAttribute("stroke-linejoin", "round");
            path.setAttribute("stroke-width", "2");
            path.setAttribute("d", "M5 13l4 4L19 7");
            svg.appendChild(path);

        } else if (toastType === 'error') {
            toast.classList.add('bg-red-900/90', 'border', 'border-red-700', 'text-red-100');
            
            svg.setAttribute("class", "w-5 h-5 text-red-400 flex-shrink-0");
            svg.setAttribute("fill", "none");
            svg.setAttribute("stroke", "currentColor");
            svg.setAttribute("viewBox", "0 0 24 24");

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("stroke-linecap", "round");
            path.setAttribute("stroke-linejoin", "round");
            path.setAttribute("stroke-width", "2");
            path.setAttribute("d", "M6 18L18 6M6 6l12 12");
            svg.appendChild(path);

        } else if (toastType === 'info') {
            toast.classList.add('bg-slate-800/90', 'border', 'border-slate-700', 'text-slate-200');
            
            svg.setAttribute("class", "animate-spin w-5 h-5 text-slate-400 flex-shrink-0");
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
        }

        toast.appendChild(svg);
        toast.appendChild(span);
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
