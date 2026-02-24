
class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private masterGain: GainNode | null = null;

  private getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.3; // Global volume
    }
    return this.ctx;
  }

  // Soft high-tech click
  playClick() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();
      
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.08);
      
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      
      osc.start(t);
      osc.stop(t + 0.09);
    } catch (e) {}
  }

  // Very subtle air puff for hover
  playHover() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();

      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.type = 'sawtooth'; // Richer harmonic content
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.linearRampToValueAtTime(100, t + 0.05);

      gain.gain.setValueAtTime(0.05, t); // Very quiet
      gain.gain.linearRampToValueAtTime(0.001, t + 0.05);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch (e) {}
  }

  // Sci-fi "Processing" start sound
  playStart() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();
      
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.4);
      
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      
      osc.start(t);
      osc.stop(t + 0.4);
    } catch (e) {}
  }

  // Positive chime for completion
  playSuccess() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();
      
      const t = ctx.currentTime;
      
      const playNote = (freq: number, delay: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain!);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + delay);
        
        gain.gain.setValueAtTime(0, t + delay);
        gain.gain.linearRampToValueAtTime(vol, t + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.8);
        
        osc.start(t + delay);
        osc.stop(t + delay + 0.8);
      };

      playNote(523.25, 0, 0.1);    // C5
      playNote(659.25, 0.1, 0.1);  // E5
      playNote(783.99, 0.2, 0.08); // G5
      playNote(1046.50, 0.3, 0.05); // C6
    } catch (e) {}
  }

  toggle(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const sounds = new SoundManager();
