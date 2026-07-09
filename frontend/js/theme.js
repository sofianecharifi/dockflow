export function applyTheme() {
    const isDark = localStorage.getItem('absolute_dark_mode') === 'true';
    if (isDark) {
        document.body.classList.add('absolute-dark');
    } else {
        document.body.classList.remove('absolute-dark');
    }
}

// Automatically apply theme on import
applyTheme();
