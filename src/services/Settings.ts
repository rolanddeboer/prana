export interface BreathingSettings {
  cycleDurationSeconds: number;
  outToInRatio: number;
  holdInSeconds: number;
  holdOutSeconds: number;
  totalExerciseMinutes: number;
}

export class Settings {
  private static instance: Settings;
  private settings: BreathingSettings;
  private readonly STORAGE_KEY = 'prana-settings';

  private constructor() {
      this.settings = this.loadSettings();
  }

  public static getInstance(): Settings {
      if (!Settings.instance) {
          Settings.instance = new Settings();
      }
      return Settings.instance;
  }

  private getDefaultSettings(): BreathingSettings {
      return {
          cycleDurationSeconds: 20,
          outToInRatio: 1.0,
          holdInSeconds: 3,
          holdOutSeconds: 3,
          totalExerciseMinutes: 10
      };
  }

  private loadSettings(): BreathingSettings {
      try {
          const stored = localStorage.getItem(this.STORAGE_KEY);
          if (stored) {
              const parsed = JSON.parse(stored);
              // Validate that all required properties exist
              const defaults = this.getDefaultSettings();
              return {
                  cycleDurationSeconds: parsed.cycleDurationSeconds ?? defaults.cycleDurationSeconds,
                  outToInRatio: parsed.outToInRatio ?? defaults.outToInRatio,
                  holdInSeconds: parsed.holdInSeconds ?? defaults.holdInSeconds,
                  holdOutSeconds: parsed.holdOutSeconds ?? defaults.holdOutSeconds,
                  totalExerciseMinutes: parsed.totalExerciseMinutes ?? defaults.totalExerciseMinutes
              };
          }
      } catch (error) {
          console.warn('Failed to load settings from localStorage:', error);
      }
      return this.getDefaultSettings();
  }

  private saveSettings(): void {
      try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
      } catch (error) {
          console.error('Failed to save settings to localStorage:', error);
      }
  }

  public getSettings(): BreathingSettings {
      return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<BreathingSettings>): void {
      this.settings = { ...this.settings, ...newSettings };
      this.saveSettings();
  }

  public setCycleDuration(seconds: number): void {
      this.settings.cycleDurationSeconds = Math.max(5, Math.min(120, seconds));
      this.saveSettings();
  }

  public setOutToInRatio(ratio: number): void {
      this.settings.outToInRatio = Math.max(0.5, Math.min(3.0, ratio));
      this.saveSettings();
  }

  public setHoldIn(seconds: number): void {
      this.settings.holdInSeconds = Math.max(0, Math.min(30, seconds));
      this.saveSettings();
  }

  public setHoldOut(seconds: number): void {
      this.settings.holdOutSeconds = Math.max(0, Math.min(30, seconds));
      this.saveSettings();
  }

  public setTotalExercise(minutes: number): void {
      this.settings.totalExerciseMinutes = Math.max(1, Math.min(60, minutes));
      this.saveSettings();
  }

  // Calculated properties
  public getInBreathDuration(): number {
      const totalBreathTime = this.settings.cycleDurationSeconds - this.settings.holdInSeconds - this.settings.holdOutSeconds;
      return totalBreathTime / (1 + this.settings.outToInRatio);
  }

  public getOutBreathDuration(): number {
      return this.getInBreathDuration() * this.settings.outToInRatio;
  }
}