import { BreathingCycle, CycleState } from '../services/BreathingCycle';
import { Settings } from '../services/Settings';

export class ActionScreenManager {
    private breathingCycle: BreathingCycle;
    private settings: Settings;
    private isRunning: boolean = false;
    private isUpdating: boolean = false;

    constructor() {
        this.breathingCycle = new BreathingCycle();
        this.settings = Settings.getInstance();
        this.setupBreathingCycleCallback();
        setTimeout(() => this.updateDisplay(), 0);
    }

    private setupBreathingCycleCallback(): void {
        this.breathingCycle.setStateChangeCallback((state: CycleState) => {
            if (!this.isUpdating) {
                this.isUpdating = true;
                this.updateDisplayFromState(state);
                this.isUpdating = false;
            }
        });
    }

    public toggleExercise(): void {
        if (this.isRunning) {
            this.stopExercise();
        } else {
            const state = this.breathingCycle.getState();
            if (state.totalRemainingMs < this.settings.getSettings().totalExerciseMinutes * 60 * 1000) {
                this.resetExercise();
            } else {
                this.startExercise();
            }
        }
    }

    public resetExercise(): void {
        this.breathingCycle.reset();
        this.isRunning = false;
        this.updateGoResetButton();
        this.updateDisplay();
    }

    private startExercise(): void {
        this.breathingCycle.start();
        this.isRunning = true;
        this.updateGoResetButton();
    }

    private stopExercise(): void {
        this.breathingCycle.stop();
        this.isRunning = false;
        this.updateGoResetButton();
    }

    private updateGoResetButton(): void {
        const button = document.getElementById('go-reset-btn');
        if (button) {
            if (this.isRunning) {
                button.textContent = 'Pause';
                button.style.backgroundColor = '#ff9800';
            } else {
                const state = this.breathingCycle.getState();
                const totalExerciseMs = this.settings.getSettings().totalExerciseMinutes * 60 * 1000;
                if (state.totalRemainingMs < totalExerciseMs && state.totalRemainingMs > 0) {
                    button.textContent = 'Reset';
                    button.style.backgroundColor = '#f44336';
                } else {
                    button.textContent = 'Go';
                    button.style.backgroundColor = '#4CAF50';
                }
            }
        }
    }

    private updateDisplayFromState(state: CycleState): void {
        this.updateMainCounter(state);
        this.updateTotalCounter(state);
        this.updateInstruction(state);
        
        if (state.totalRemainingMs <= 0 && !state.isActive) {
            this.onExerciseComplete();
        }
    }

    private updateMainCounter(state: CycleState): void {
        const mainCounter = document.getElementById('main-counter');
        if (!mainCounter) return;

        const totalExerciseMs = this.settings.getSettings().totalExerciseMinutes * 60 * 1000;
        
        if (!state.isActive && state.totalRemainingMs >= totalExerciseMs) {
            mainCounter.textContent = 'Ready';
            mainCounter.style.color = '#333';
        } else if (state.totalRemainingMs <= 0) {
            mainCounter.textContent = 'Complete!';
            mainCounter.style.color = '#4CAF50';
        } else {
            mainCounter.textContent = this.breathingCycle.getPhaseDisplayText();
            mainCounter.style.color = this.getPhaseColor(state.phase);
        }
    }

    private updateTotalCounter(state: CycleState): void {
        const totalCounter = document.getElementById('total-counter');
        if (totalCounter) {
            const totalSeconds = Math.max(0, Math.ceil(state.totalRemainingMs / 1000));
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            totalCounter.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    private updateInstruction(state: CycleState): void {
        const instructionEl = document.getElementById('instruction');
        if (instructionEl) {
            instructionEl.textContent = this.breathingCycle.getCurrentInstruction();
        }
    }

    private updateCycleDuration(): void {
        const cycleDurationEl = document.getElementById('cycle-duration-display');
        if (cycleDurationEl) {
            const currentDuration = this.settings.getSettings().cycleDurationSeconds;
            cycleDurationEl.textContent = `${currentDuration}s`;
        }
    }

    private getPhaseColor(phase: string): string {
        switch (phase) {
            case 'inhale':
                return '#2196F3';
            case 'hold-in':
                return '#9C27B0';
            case 'exhale':
                return '#FF5722';
            case 'hold-out':
                return '#795548';
            default:
                return '#333';
        }
    }

    private onExerciseComplete(): void {
        this.isRunning = false;
        this.updateGoResetButton();
        
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    }

    public updateDisplay(): void {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        this.updateCycleDuration();
        const state = this.breathingCycle.getState();
        this.updateDisplayFromState(state);
        this.updateGoResetButton();
        this.isUpdating = false;
    }

    public adjustCycleDuration(seconds: number): void {
        const currentSettings = this.settings.getSettings();
        const newDuration = currentSettings.cycleDurationSeconds + seconds;
        
        // Update settings
        this.settings.setCycleDuration(newDuration);
        
        // Update display immediately
        this.updateCycleDuration();
        
        // Adjust the breathing cycle timings on the fly (maintaining current progress)
        this.breathingCycle.adjustTimingsOnTheFly();
    }
}