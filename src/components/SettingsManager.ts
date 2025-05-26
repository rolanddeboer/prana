import { Settings } from '../services/Settings';

export class SettingsManager {
    private settings: Settings;
    private updateTimeout: number | null = null;

    constructor() {
        this.settings = Settings.getInstance();
        this.initializeForm();
        this.setupEventListeners();
    }

    private initializeForm(): void {
        const settingsData = this.settings.getSettings();
        
        (document.getElementById('cycle-duration') as HTMLInputElement).value = settingsData.cycleDurationSeconds.toString();
        (document.getElementById('out-in-ratio') as HTMLInputElement).value = settingsData.outToInRatio.toString();
        (document.getElementById('hold-in') as HTMLInputElement).value = settingsData.holdInSeconds.toString();
        (document.getElementById('hold-out') as HTMLInputElement).value = settingsData.holdOutSeconds.toString();
        (document.getElementById('total-exercise') as HTMLInputElement).value = settingsData.totalExerciseMinutes.toString();
        
        this.updateCalculatedValues();
    }

    private setupEventListeners(): void {
        const inputs = [
            'cycle-duration',
            'out-in-ratio', 
            'hold-in',
            'hold-out',
            'total-exercise'
        ];

        inputs.forEach(id => {
            const input = document.getElementById(id) as HTMLInputElement;
            input?.addEventListener('input', () => this.handleInputChange());
        });
    }

    private handleInputChange(): void {
        // Debounce updates to avoid excessive localStorage writes
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        this.updateTimeout = window.setTimeout(() => {
            this.updateSettingsFromForm();
            this.updateCalculatedValues();
        }, 100);
    }

    private updateSettingsFromForm(): void {
        const cycleDuration = parseFloat((document.getElementById('cycle-duration') as HTMLInputElement).value);
        const outInRatio = parseFloat((document.getElementById('out-in-ratio') as HTMLInputElement).value);
        const holdIn = parseFloat((document.getElementById('hold-in') as HTMLInputElement).value);
        const holdOut = parseFloat((document.getElementById('hold-out') as HTMLInputElement).value);
        const totalExercise = parseFloat((document.getElementById('total-exercise') as HTMLInputElement).value);

        if (!isNaN(cycleDuration)) this.settings.setCycleDuration(cycleDuration);
        if (!isNaN(outInRatio)) this.settings.setOutToInRatio(outInRatio);
        if (!isNaN(holdIn)) this.settings.setHoldIn(holdIn);
        if (!isNaN(holdOut)) this.settings.setHoldOut(holdOut);
        if (!isNaN(totalExercise)) this.settings.setTotalExercise(totalExercise);
    }

    private updateCalculatedValues(): void {
        const inhaleElement = document.getElementById('calc-inhale');
        const exhaleElement = document.getElementById('calc-exhale');
        
        if (inhaleElement && exhaleElement) {
            inhaleElement.textContent = `${this.settings.getInBreathDuration().toFixed(1)}s`;
            exhaleElement.textContent = `${this.settings.getOutBreathDuration().toFixed(1)}s`;
        }
    }

    public refreshDisplay(): void {
        this.initializeForm();
    }
}