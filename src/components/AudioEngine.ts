/**
 * AudioEngine.ts
 * Synthesizes cute sound effects purely client-side using the Web Audio API.
 * Designed to provide immediate auditory feedback to special education students.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled() {
    return this.soundEnabled;
  }

  // Cute pop sound on tap
  public playPop() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Fast frequency sweep for poppy bubble sound
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // Pouring fizz/water sound (keeps playing while pouring)
  private pourOsc: OscillatorNode | null = null;
  private pourGain: GainNode | null = null;
  private pourNoise: AudioWorkletNode | ScriptProcessorNode | null = null;

  public startPourSound(isWater: boolean = true) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    if (this.pourOsc) return; // Already running

    this.pourOsc = this.ctx.createOscillator();
    this.pourGain = this.ctx.createGain();

    // Create a bubbling synth sound
    this.pourOsc.type = 'triangle';
    const frequency = isWater ? 220 : 130; // lower for cola/juice
    this.pourOsc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    // Warm vibrato for liquid feel
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 25; // Speed of bubble ripple
    lfoGain.gain.value = 40; // Intensty of ripple

    lfo.connect(lfoGain);
    lfoGain.connect(this.pourOsc.frequency);

    this.pourGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    this.pourGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.1);

    this.pourOsc.connect(this.pourGain);
    this.pourGain.connect(this.ctx.destination);

    lfo.start();
    this.pourOsc.start();

    // Store references to stop later
    (this.pourOsc as any).lfo = lfo;
  }

  public stopPourSound() {
    if (this.pourOsc && this.ctx) {
      try {
        const osc = this.pourOsc;
        const gain = this.pourGain;
        const lfo = (osc as any).lfo;

        const stopTime = this.ctx.currentTime + 0.05;
        if (gain) {
          gain.gain.linearRampToValueAtTime(0, stopTime);
        }
        
        setTimeout(() => {
          try {
            osc.stop();
            if (lfo) lfo.stop();
          } catch (e) {}
        }, 60);
      } catch (e) {}
      
      this.pourOsc = null;
      this.pourGain = null;
    }
  }

  // Triumph major-chord fanfare when correctly matching target
  public playSuccess() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 (C Major)
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  }

  // Soft warning/reset chime
  public playReset() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.4);
  }
}

export const audio = new AudioEngine();
