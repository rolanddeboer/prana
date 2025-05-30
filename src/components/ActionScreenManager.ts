import { BreathingCycle, CycleState } from '../services/BreathingCycle';
import { Settings } from '../services/Settings';

export class ActionScreenManager {
    private breathingCycle: BreathingCycle;
    private settings: Settings;
    private isRunning: boolean = false;
    private isUpdating: boolean = false;
    private wakeLock: any = null;
    private progressUpdateInterval: number | null = null;

    constructor() {
        this.breathingCycle = new BreathingCycle();
        this.settings = Settings.getInstance();
        this.setupBreathingCycleCallback();
        setTimeout(() => this.updateDisplay(), 0);
    }

    private async requestWakeLock(): Promise<void> {
        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await (navigator as any).wakeLock.request('screen');
                console.log('Screen wake lock acquired');
            }
        } catch (err) {
            console.log('Wake lock request failed:', err);
        }
    }

    private async releaseWakeLock(): Promise<void> {
        try {
            if (this.wakeLock) {
                await this.wakeLock.release();
                this.wakeLock = null;
                console.log('Screen wake lock released');
            }
        } catch (err) {
            console.log('Wake lock release failed:', err);
        }
    }

    private startProgressUpdates(): void {
        if (this.progressUpdateInterval) return;
        
        this.progressUpdateInterval = window.setInterval(() => {
            if (this.isRunning) {
                this.updateProgressBarSmooth();
            }
        }, 100); // Update every 100ms
    }

    private stopProgressUpdates(): void {
        if (this.progressUpdateInterval) {
            clearInterval(this.progressUpdateInterval);
            this.progressUpdateInterval = null;
        }
    }

    private updateProgressBarSmooth(): void {
        const state = this.breathingCycle.getState();
        const progressFill = document.getElementById('progress-fill');
        if (!progressFill) return;

        if (state.phase === 'inhale' || state.phase === 'exhale') {
            const percentage = this.breathingCycle.getProgressPercentage();
            
            if (state.phase === 'inhale') {
                // Fill from bottom to top
                const targetHeight = Math.min(100, Math.max(0, percentage));
                progressFill.style.height = `${targetHeight}%`;
                
                // Ensure it reaches 100% at the end
                if (percentage >= 99.5) {
                    progressFill.style.height = '100%';
                }
            } else {
                // Empty from top to bottom
                const targetHeight = Math.max(0, Math.min(100, 100 - percentage));
                progressFill.style.height = `${targetHeight}%`;
                
                // Ensure it reaches 0% at the end
                if (percentage >= 99.5) {
                    progressFill.style.height = '0%';
                }
            }
            
            // Keep consistent color and smooth transition
            progressFill.style.background = 'linear-gradient(to top, #1565C0, #1976D2)';
            progressFill.style.transition = 'height 0.1s linear';
        }
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
        this.stopProgressUpdates();
        this.releaseWakeLock();
        this.updateGoResetButton();
        this.updateDisplay();
        this.resetProgressBar();
    }

    private startExercise(): void {
        this.breathingCycle.start();
        this.isRunning = true;
        this.startProgressUpdates();
        this.requestWakeLock();
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
                button.style.backgroundColor = '#C62828'; /* Darker red */
            } else {
                playIcon.style.display = 'block';
                resetIcon.style.display = 'none';
                button.style.backgroundColor = '#2E7D32'; /* Darker green */
            }
        }
    }

    private updateDisplayFromState(state: CycleState): void {
        this.updateTotalCounter(state);
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

    private updateHoldCounter(state: CycleState): void {
        const holdCounter = document.getElementById('hold-counter');
        if (!holdCounter) return;

        const settings = this.settings.getSettings();
        const isHoldPhase = state.phase === 'hold-in' || state.phase === 'hold-out';
        const holdDuration = state.phase === 'hold-in' ? settings.holdInSeconds : settings.holdOutSeconds;

        if (isHoldPhase && holdDuration > 0) {
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
        this.stopProgressUpdates();
        this.releaseWakeLock();
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