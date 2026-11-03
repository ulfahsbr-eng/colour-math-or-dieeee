// Procedural Interactive Background Music (BGM) Engine for Labirin Matematik
// Generates dynamic, multi-track game soundtracks in real-time using Web Audio API

export type BGMTrackMode = 'menu' | 'exploration' | 'chase' | 'puzzle' | 'victory' | 'gameover' | 'off';

class BGMManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicVolume: number = 0.5;
  private isMuted: boolean = false;
  private currentMode: BGMTrackMode = 'off';

  // Sequencer loop state
  private isPlaying: boolean = false;
  private nextNoteTime: number = 0;
  private currentStep: number = 0;
  private timerId: number | null = null;

  // Track mode definitions
  // Exploration chord progression in D Minor: Dm -> Bb -> F -> C
  private readonly chordsExploration = [
    { root: 146.83, name: 'Dm', notes: [293.66, 349.23, 440.0, 523.25] }, // D4, F4, A4, C5
    { root: 116.54, name: 'Bb', notes: [233.08, 293.66, 349.23, 466.16] }, // Bb3, D4, F4, Bb4
    { root: 174.61, name: 'F',  notes: [261.63, 349.23, 440.0, 523.25] }, // C4, F4, A4, C5
    { root: 130.81, name: 'C',  notes: [261.63, 329.63, 392.0, 523.25] }, // C4, E4, G4, C5
  ];

  // Chase chord progression in D Minor: Dm -> Dm -> Bb -> A (urgent, intense)
  private readonly chordsChase = [
    { root: 146.83, name: 'Dm', notes: [293.66, 349.23, 440.0, 587.33] }, // D4, F4, A4, D5
    { root: 146.83, name: 'Dm', notes: [293.66, 349.23, 440.0, 587.33] },
    { root: 116.54, name: 'Bb', notes: [233.08, 293.66, 349.23, 466.16] },
    { root: 110.00, name: 'A',  notes: [220.00, 277.18, 329.63, 440.00] }, // A3, C#4, E4, A4
  ];

  // Menu chord progression: Atmospheric & Mysterious
  private readonly chordsMenu = [
    { root: 146.83, name: 'Dm', notes: [293.66, 440.0, 523.25, 587.33] },
    { root: 116.54, name: 'Bb', notes: [293.66, 349.23, 466.16, 587.33] },
    { root: 196.00, name: 'Gm', notes: [293.66, 392.0, 466.16, 587.33] },
    { root: 110.00, name: 'A',  notes: [277.18, 329.63, 440.0, 554.37] },
  ];

  // Puzzle chord progression: Peaceful, contemplative, ambient
  private readonly chordsPuzzle = [
    { root: 130.81, name: 'C',  notes: [261.63, 329.63, 392.0, 523.25] },
    { root: 174.61, name: 'F',  notes: [261.63, 349.23, 440.0, 523.25] },
    { root: 196.00, name: 'G',  notes: [293.66, 392.0, 493.88, 587.33] },
    { root: 146.83, name: 'Am', notes: [261.63, 329.63, 440.0, 523.25] },
  ];

  constructor() {
    // Attempt saved preferences from localStorage
    try {
      const savedMute = localStorage.getItem('colour_or_die_music_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
      const savedVol = localStorage.getItem('colour_or_die_music_vol');
      if (savedVol !== null) {
        this.musicVolume = parseFloat(savedVol);
      }
    } catch {
      // ignore
    }
  }

  private initAudio() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.musicVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Set current music mode
  public setTrackMode(mode: BGMTrackMode) {
    if (this.currentMode === mode) return;
    this.currentMode = mode;

    if (mode === 'off') {
      this.stop();
      return;
    }

    if (!this.isPlaying) {
      this.start();
    }
  }

  public getTrackMode(): BGMTrackMode {
    return this.currentMode;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('colour_or_die_music_muted', String(muted));
    } catch {
      // ignore
    }

    if (this.masterGain && this.ctx) {
      const targetGain = muted ? 0 : this.musicVolume;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.1);
    }

    if (!muted && !this.isPlaying && this.currentMode !== 'off') {
      this.start();
    }
  }

  public toggleMute(): boolean {
    const next = !this.isMuted;
    this.setMuted(next);
    return next;
  }

  public setVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('colour_or_die_music_vol', String(this.musicVolume));
    } catch {
      // ignore
    }

    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.musicVolume, this.ctx.currentTime + 0.05);
    }
  }

  public getVolume(): number {
    return this.musicVolume;
  }

  // Start BGM loop
  public start() {
    this.initAudio();
    if (!this.ctx || this.isPlaying) return;

    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.scheduleLoop();
  }

  // Stop BGM loop
  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  // Lookahead scheduler for rock-solid musical timing
  private scheduleLoop = () => {
    if (!this.isPlaying || !this.ctx) return;

    // Schedule any notes falling within the next 0.15s window
    while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
      this.playStep(this.nextNoteTime, this.currentStep);
      this.advanceStep();
    }

    this.timerId = window.setTimeout(this.scheduleLoop, 45);
  };

  private advanceStep() {
    // 16 steps per chord, 4 chords = 64 steps total per bar cycle
    this.currentStep = (this.currentStep + 1) % 64;

    // Tempo depends on track mode
    let secondsPer16th = 0.145; // ~103 BPM for exploration
    if (this.currentMode === 'chase') {
      secondsPer16th = 0.115; // ~130 BPM for intense chase!
    } else if (this.currentMode === 'menu') {
      secondsPer16th = 0.170; // ~88 BPM relaxed ambient
    } else if (this.currentMode === 'puzzle') {
      secondsPer16th = 0.160; // ~94 BPM contemplative
    }

    this.nextNoteTime += secondsPer16th;
  }

  // Synthesize musical elements for the current step
  private playStep(time: number, step: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    let chordSet = this.chordsExploration;
    if (this.currentMode === 'chase') chordSet = this.chordsChase;
    else if (this.currentMode === 'menu') chordSet = this.chordsMenu;
    else if (this.currentMode === 'puzzle') chordSet = this.chordsPuzzle;

    const chordIndex = Math.floor(step / 16) % chordSet.length;
    const chord = chordSet[chordIndex];
    const stepInChord = step % 16;

    // 1. Synth Bassline (Driving on beat 0, 4, 8, 12, or 16ths in chase mode)
    const isBassStep =
      this.currentMode === 'chase'
        ? stepInChord % 2 === 0 // 8th note driving bassline
        : stepInChord === 0 || stepInChord === 6 || stepInChord === 8 || stepInChord === 12;

    if (isBassStep) {
      this.playBass(time, chord.root, this.currentMode === 'chase' ? 0.22 : 0.18);
    }

    // 2. Melodic Synth Bell / Arpeggio Pluck
    // Play a delightful, suspenseful melodic pattern over the chord notes
    const arpeggioPattern = [0, 2, 1, 3, 2, 0, 3, 1, 0, 1, 2, 3, 2, 1, 0, 2];
    const noteIdx = arpeggioPattern[stepInChord] % chord.notes.length;
    let freq = chord.notes[noteIdx];

    // In chase mode, occasionally shift notes an octave higher for intense urgency
    if (this.currentMode === 'chase' && (stepInChord === 3 || stepInChord === 7 || stepInChord === 11 || stepInChord === 15)) {
      freq *= 1.5;
    }

    // Trigger synth pluck
    const shouldPlayLead =
      this.currentMode === 'menu'
        ? stepInChord % 4 === 0 || stepInChord === 6 || stepInChord === 14
        : stepInChord % 2 === 0 || stepInChord === 7 || stepInChord === 11;

    if (shouldPlayLead) {
      const isAccent = stepInChord === 0 || stepInChord === 8;
      this.playPluck(time, freq, isAccent ? 0.18 : 0.12);
    }

    // 3. Ambient Pad / Chord Swell at the start of each chord
    if (stepInChord === 0) {
      this.playPad(time, chord.notes, this.currentMode === 'chase' ? 0.10 : 0.14);
    }

    // 4. Subtle Shaker / Rhythmic Pulse
    if (this.currentMode === 'chase') {
      this.playHiHat(time, stepInChord % 2 === 0 ? 0.08 : 0.04);
    } else if (this.currentMode === 'exploration') {
      if (stepInChord % 4 === 2) {
        this.playHiHat(time, 0.03);
      }
    }
  }

  // 808-style Sub & Mid Synth Bass
  private playBass(time: number, freq: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = this.currentMode === 'chase' ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq / 2, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, time);
    filter.frequency.exponentialRampToValueAtTime(120, time + 0.18);

    gain.gain.setValueAtTime(volume * 0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.24);
  }

  // Haunting Retro Pluck / Bell Synthesizer
  private playPluck(time: number, freq: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.002, time); // Subtle rich chorus detune

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.frequency.exponentialRampToValueAtTime(450, time + 0.35);

    gain.gain.setValueAtTime(volume * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.40);
    osc2.stop(time + 0.40);
  }

  // Soft Ambient Pad Chord
  private playPad(time: number, chordNotes: number[], volume: number) {
    if (!this.ctx || !this.masterGain) return;

    const padDuration = 2.2;
    chordNotes.slice(0, 3).forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, time);

      // Smooth attack and release envelope
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(volume * 0.4, time + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, time + padDuration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + padDuration + 0.05);
    });
  }

  // Filtered Soft Click / Shaker
  private playHiHat(time: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(4800, time);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3500, time);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }
}

export const bgmManager = new BGMManager();
