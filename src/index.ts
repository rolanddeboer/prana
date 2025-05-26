import './styles/main.css';
import { SettingsManager } from './components/SettingsManager';
import { ActionScreenManager } from './components/ActionScreenManager';
import { Settings } from './services/Settings';

class BreathingApp {
    private currentScreen: 'settings' | 'action' = 'settings';
    private settingsManager: SettingsManager;
    private actionScreenManager: ActionScreenManager;
    private settings: Settings;

    constructor() {
        this.settings = Settings.getInstance();
        this.settingsManager = new SettingsManager();
        this.actionScreenManager = new ActionScreenManager();
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
            this.settingsManager.refreshDisplay();
        } else {
            settingsScreen?.classList.add('hidden');
            actionScreen?.classList.remove('hidden');
            this.actionScreenManager.updateDisplay();
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
        this.actionScreenManager.toggleExercise();
    }

    private adjustCycleDuration(seconds: number): void {
        this.actionScreenManager.adjustCycleDuration(seconds);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BreathingApp();
});

// Only register service worker in production
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
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