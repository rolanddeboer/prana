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
            this.resetExercise();
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
        this.resetProgressBar();
    }

    private startExercise(): void {
        this.breathingCycle.start();
        this.isRunning = true;
        this.updateGoResetButton();
    }

    private resetProgressBar(): void {
        const progressFill = document.getElementById('progress-fill');
        const holdCounter = document.getElementById('hold-counter');
        
        if (progressFill) {
            progressFill.style.height = '0%';
            progressFill.style.transition = 'none';
        }
        
        if (holdCounter) {
            holdCounter.style.display = 'none';
        }
    }

    private updateGoResetButton(): void {
        const button = document.getElementById('go-reset-btn');
        const playIcon = document.getElementById('play-icon');
        const resetIcon = document.getElementById('reset-icon');
        
        if (button && playIcon && resetIcon) {
            if (this.isRunning) {
                playIcon.style.display = 'none';
                resetIcon.style.display = 'block';
                button.style.backgroundColor = '#f44336';
            } else {
                playIcon.style.display = 'block';
                resetIcon.style.display = 'none';
                button.style.backgroundColor = '#4CAF50';
            }
        }
    }

    private updateDisplayFromState(state: CycleState): void {
        this.updateTotalCounter(state);
        this.updateProgressBar(state);
        this.updateHoldCounter(state);
        this.updateNostrilIndicator(state);
        
        if (state.totalRemainingMs <= 0 && !state.isActive) {
            this.onExerciseComplete();
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

    private updateProgressBar(state: CycleState): void {
        const progressFill = document.getElementById('progress-fill');
        if (!progressFill) return;

        if (state.phase === 'inhale' || state.phase === 'exhale') {
            const percentage = this.breathingCycle.getProgressPercentage();
            const remainingDuration = state.remainingTimeMs / 1000;
            
            if (state.phase === 'inhale') {
                progressFill.style.height = `${percentage}%`;
            } else {
                // For exhale, still show decreasing height (100% - percentage)
                progressFill.style.height = `${100 - percentage}%`;
            }
            
            // Keep the same color for both inhale and exhale
            progressFill.style.background = 'linear-gradient(to top, #2196F3, #64B5F6)';
            progressFill.style.transition = `height ${remainingDuration}s linear`;
        } else {
            // Hold phases - keep current height, no animation
            progressFill.style.transition = 'none';
        }
    }

    private updateHoldCounter(state: CycleState): void {
        const holdCounter = document.getElementById('hold-counter');
        if (!holdCounter) return;

        if (state.phase === 'hold-in' || state.phase === 'hold-out') {
            const remainingSeconds = Math.max(0, Math.ceil(state.remainingTimeMs / 1000));
            holdCounter.textContent = remainingSeconds.toString();
            holdCounter.style.display = 'flex';
        } else {
            holdCounter.style.display = 'none';
        }
    }

    private updateNostrilIndicator(state: CycleState): void {
        const nostrilIndicator = document.getElementById('nostril-indicator');
        if (nostrilIndicator) {
            nostrilIndicator.className = `nostril-indicator ${state.nostril}`;
        }
    }

    private updateCycleDuration(): void {
        const cycleDurationEl = document.getElementById('cycle-duration-display');
        if (cycleDurationEl) {
            const currentDuration = this.settings.getSettings().cycleDurationSeconds;
            cycleDurationEl.textContent = `${currentDuration}s`;
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
        
        this.settings.setCycleDuration(newDuration);
        this.updateCycleDuration();
        this.breathingCycle.adjustTimingsOnTheFly();
    }
}