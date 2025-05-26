import { Settings } from './Settings';

export type BreathingPhase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out';
export type Nostril = 'left' | 'right';

export interface CycleState {
    phase: BreathingPhase;
    nostril: Nostril;
    remainingTimeMs: number;
    totalPhaseTimeMs: number;
    totalRemainingMs: number;
    isActive: boolean;
    cycleCount: number;
}

export class BreathingCycle {
    private settings: Settings;
    private state: CycleState;
    private intervalId: number | null = null;
    private onStateChange: ((state: CycleState) => void) | null = null;

    constructor() {
        this.settings = Settings.getInstance();
        this.state = this.getInitialState();
    }

    private getInitialState(): CycleState {
        const settingsData = this.settings.getSettings();
        const inBreathDuration = this.settings.getInBreathDuration();
        
        return {
            phase: 'inhale',
            nostril: 'left',
            remainingTimeMs: inBreathDuration * 1000,
            totalPhaseTimeMs: inBreathDuration * 1000,
            totalRemainingMs: settingsData.totalExerciseMinutes * 60 * 1000,
            isActive: false,
            cycleCount: 0
        };
    }

    public setStateChangeCallback(callback: (state: CycleState) => void): void {
        this.onStateChange = callback;
    }

    public getState(): CycleState {
        return { ...this.state };
    }

    public start(): void {
        if (this.state.isActive) return;
        
        this.state.isActive = true;
        this.intervalId = window.setInterval(() => {
            this.tick();
        }, 100);
        
        this.notifyStateChange();
    }

    public stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.state.isActive = false;
        this.notifyStateChange();
    }

    public reset(): void {
        this.stop();
        this.state = this.getInitialState();
        this.notifyStateChange();
    }

    public adjustTimingsOnTheFly(): void {
        // Recalculate the current phase timing based on current progress
        // but maintain the same percentage through the phase
        
        if (!this.state.isActive) {
            // If not active, just update the initial state
            this.state = this.getInitialState();
            this.notifyStateChange();
            return;
        }

        // Calculate current progress percentage
        const elapsed = this.state.totalPhaseTimeMs - this.state.remainingTimeMs;
        const progressPercentage = this.state.totalPhaseTimeMs > 0 ? 
            elapsed / this.state.totalPhaseTimeMs : 0;

        // Get new phase duration
        const newPhaseDuration = this.getNewPhaseDuration(this.state.phase);
        
        // Apply the same progress percentage to the new duration
        const newElapsed = newPhaseDuration * progressPercentage;
        const newRemaining = newPhaseDuration - newElapsed;

        this.state.totalPhaseTimeMs = newPhaseDuration;
        this.state.remainingTimeMs = Math.max(0, newRemaining);

        this.notifyStateChange();
    }

    private getNewPhaseDuration(phase: BreathingPhase): number {
        const settings = this.settings.getSettings();
        
        switch (phase) {
            case 'inhale':
                return this.settings.getInBreathDuration() * 1000;
            case 'hold-in':
                return settings.holdInSeconds * 1000;
            case 'exhale':
                return this.settings.getOutBreathDuration() * 1000;
            case 'hold-out':
                return settings.holdOutSeconds * 1000;
            default:
                return 1000; // fallback
        }
    }

    private tick(): void {
        if (!this.state.isActive) return;

        this.state.remainingTimeMs -= 100;
        this.state.totalRemainingMs -= 100;

        if (this.state.totalRemainingMs <= 0) {
            this.state.totalRemainingMs = 0;
            this.stop();
            return;
        }

        if (this.state.remainingTimeMs <= 0) {
            this.advanceToNextPhase();
        }

        this.notifyStateChange();
    }

    private advanceToNextPhase(): void {
        const settings = this.settings.getSettings();
        
        switch (this.state.phase) {
            case 'inhale':
                this.state.phase = 'hold-in';
                this.state.remainingTimeMs = settings.holdInSeconds * 1000;
                this.state.totalPhaseTimeMs = settings.holdInSeconds * 1000;
                break;
            
            case 'hold-in':
                this.state.phase = 'exhale';
                this.state.remainingTimeMs = this.settings.getOutBreathDuration() * 1000;
                this.state.totalPhaseTimeMs = this.settings.getOutBreathDuration() * 1000;
                break;
            
            case 'exhale':
                this.state.phase = 'hold-out';
                this.state.remainingTimeMs = settings.holdOutSeconds * 1000;
                this.state.totalPhaseTimeMs = settings.holdOutSeconds * 1000;
                break;
            
            case 'hold-out':
                this.state.nostril = this.state.nostril === 'left' ? 'right' : 'left';
                this.state.phase = 'inhale';
                this.state.remainingTimeMs = this.settings.getInBreathDuration() * 1000;
                this.state.totalPhaseTimeMs = this.settings.getInBreathDuration() * 1000;
                this.state.cycleCount++;
                break;
        }

        if (this.state.remainingTimeMs < 0) {
            this.state.remainingTimeMs = 0;
        }
    }

    private notifyStateChange(): void {
        if (this.onStateChange) {
            setTimeout(() => {
                if (this.onStateChange) {
                    this.onStateChange(this.getState());
                }
            }, 0);
        }
    }

    public getDisplayPercentage(): number {
        if (this.state.totalPhaseTimeMs === 0) return 0;
        
        const elapsed = this.state.totalPhaseTimeMs - this.state.remainingTimeMs;
        const percentage = (elapsed / this.state.totalPhaseTimeMs) * 100;
        
        switch (this.state.phase) {
            case 'inhale':
                return Math.min(100, Math.max(0, percentage));
            case 'exhale':
                return Math.max(0, Math.min(100, 100 - percentage));
            case 'hold-in':
            case 'hold-out':
                return Math.max(0, Math.ceil(this.state.remainingTimeMs / 1000));
            default:
                return 0;
        }
    }

    public getPhaseDisplayText(): string {
        switch (this.state.phase) {
            case 'inhale':
                return `${Math.round(this.getDisplayPercentage())}%`;
            case 'exhale':
                return `${Math.round(this.getDisplayPercentage())}%`;
            case 'hold-in':
            case 'hold-out':
                return `${Math.max(0, Math.ceil(this.state.remainingTimeMs / 1000))}`;
            default:
                return 'Ready';
        }
    }

    public getCurrentInstruction(): string {
        const nostril = this.state.nostril === 'left' ? 'Left' : 'Right';
        
        switch (this.state.phase) {
            case 'inhale':
                return `Inhale (${nostril} nostril closed)`;
            case 'hold-in':
                return `Hold breath in`;
            case 'exhale':
                return `Exhale (${nostril} nostril closed)`;
            case 'hold-out':
                return `Hold breath out`;
            default:
                return 'Ready to begin';
        }
    }
}