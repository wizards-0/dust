module.exports = {
    content: ["./src/**/*.html"],
    theme: {
        extend: {
            colors: {
                'primary': 'var(--primary)',
                'on-primary': 'var(--on-primary)',
                'primary-hover': 'var(--primary-hover)',
                'primary-container': 'var(--primary-container)',
                'on-primary-container': 'var(--on-primary-container)',
                'secondary': 'var(--secondary)',
                'on-secondary': 'var(--on-secondary)',
                'secondary-hover': 'var(--secondary-hover)',
                'secondary-container': 'var(--secondary-container)',
                'on-secondary-container': 'var(--on-secondary-container)',
                'tertiary': 'var(--tertiary)',
                'on-tertiary': 'var(--on-tertiary)',
                'tertiary-hover': 'var(--tertiary-hover)',
                'tertiary-container': 'var(--tertiary-container)',
                'on-tertiary-container': 'var(--on-tertiary-container)',
                'error': 'var(--error)',
                'on-error': 'var(--on-error)',
                'error-hover': 'var(--error-hover)',
                'error-container': 'var(--error-container)',
                'on-error-container': 'var(--on-error-container)',
                'surface': 'var(--surface)',
                'on-surface':'var(--on-surface)',
                'surface-hover':'var(--surface-hover)',
                'surface-container':'var(--surface-container)',              
                'surface-container-high': 'var(--surface-container-high)',
                'surface-container-highest': 'var(--surface-container-highest)',
                'divider': 'var(--divider)'
            }
        },
    },
    plugins: [],
    corePlugins: {
        preflight: false,
    },
    experimental: {
        optimizeUniversalDefaults: true
    }
}