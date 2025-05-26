import './styles/main.css';

class BreathingApp {
    private currentScreen: 'settings' | 'action' = 'settings';

    constructor() {
        this.init();
    }

    private init(): void {
        this.setupEventListeners();
        this.showScreen(this.currentScreen);
    }

    private setupEventListeners(): void {
        const settingsOkBtn = document.getElementById('settings-ok');
        const settingsBtn = document.getElementById('settings-btn');
        const goResetBtn = document.getElementById('go-reset-btn');
        const plusBtn = document.getElementById('plus-btn');
        const minusBtn = document.getElementById('minus-btn');

        settingsOkBtn?.addEventListener('click', () => this.showActionScreen());
        settingsBtn?.addEventListener('click', () => this.showSettingsScreen());
        goResetBtn?.addEventListener('click', () => this.handleGoReset());
        plusBtn?.addEventListener('click', () => this.adjustCycleDuration(5));
        minusBtn?.addEventListener('click', () => this.adjustCycleDuration(-5));
    }

    private showScreen(screen: 'settings' | 'action'): void {
        const settingsScreen = document.getElementById('settings-screen');
        const actionScreen = document.getElementById('action-screen');

        if (screen === 'settings') {
            settingsScreen?.classList.remove('hidden');
            actionScreen?.classList.add('hidden');
        } else {
            settingsScreen?.classList.add('hidden');
            actionScreen?.classList.remove('hidden');
        }
        
        this.currentScreen = screen;
    }

    private showActionScreen(): void {
        this.showScreen('action');
    }

    private showSettingsScreen(): void {
        this.showScreen('settings');
    }

    private handleGoReset(): void {
        // TODO: Implement go/reset functionality
        console.log('Go/Reset clicked');
    }

    private adjustCycleDuration(seconds: number): void {
        // TODO: Implement cycle duration adjustment
        console.log(`Adjust cycle duration by ${seconds} seconds`);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BreathingApp();
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}