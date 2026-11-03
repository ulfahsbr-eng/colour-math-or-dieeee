class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastFootstepTime: number = 0;

  // Real-time Horror Ambience System
  private horrorInitialized: boolean = false;
  private dreadDroneGain: GainNode | null = null;
  private dreadFilter: BiquadFilterNode | null = null;
  private tensionChordGain: GainNode | null = null;
  private lastHeartbeatTime: number = 0;
  private lastGrowlTime: number = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Initialize horror drone synthesizers (clean harmonic tones, NO noisy static hiss)
  private initHorrorAmbiance() {
    if (this.horrorInitialized || !this.ctx) return;
    try {
      // 1. Clean Deep Drone (Warm triangle/sine waves, lowpass filtered - NO harsh buzzy noise)
      const droneOsc1 = this.ctx.createOscillator();
      const droneOsc2 = this.ctx.createOscillator();
      const droneOsc3 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const droneGain = this.ctx.createGain();

      droneOsc1.type = 'triangle';
      droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A1

      droneOsc2.type = 'sine';
      droneOsc2.frequency.setValueAtTime(56.5, this.ctx.currentTime); // Gentle dark beating

      droneOsc3.type = 'triangle';
      droneOsc3.frequency.setValueAtTime(110, this.ctx.currentTime); // Octave body A2

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(95, this.ctx.currentTime);
      filter.Q.setValueAtTime(3, this.ctx.currentTime);

      droneGain.gain.setValueAtTime(0, this.ctx.currentTime);

      droneOsc1.connect(filter);
      droneOsc2.connect(filter);
      droneOsc3.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(this.ctx.destination);

      droneOsc1.start();
      droneOsc2.start();
      droneOsc3.start();

      this.dreadFilter = filter;
      this.dreadDroneGain = droneGain;

      // 2. High-Tension Dissonant Chime (Tritone devil's interval, triggers only when monster is right on top of player)
      const tensionOsc1 = this.ctx.createOscillator();
      const tensionOsc2 = this.ctx.createOscillator();
      const tensionFilter = this.ctx.createBiquadFilter();
      const tensionGain = this.ctx.createGain();

      tensionOsc1.type = 'sine';
      tensionOsc1.frequency.setValueAtTime(415.3, this.ctx.currentTime); // G#4
      tensionOsc2.type = 'triangle';
      tensionOsc2.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5 (Tritone)

      tensionFilter.type = 'bandpass';
      tensionFilter.frequency.setValueAtTime(500, this.ctx.currentTime);
      tensionFilter.Q.setValueAtTime(2, this.ctx.currentTime);

      tensionGain.gain.setValueAtTime(0, this.ctx.currentTime);

      tensionOsc1.connect(tensionFilter);
      tensionOsc2.connect(tensionFilter);
      tensionFilter.connect(tensionGain);
      tensionGain.connect(this.ctx.destination);

      tensionOsc1.start();
      tensionOsc2.start();
      this.tensionChordGain = tensionGain;

      this.horrorInitialized = true;
    } catch {
      // AudioContext policy fallback
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopHorrorAmbiance();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Update real-time horror soundscape: ONLY plays when monster is actually near (< 8m) or actively chasing!
  public updateMonsterProximity(distance: number, isChasing: boolean) {
    if (this.isMuted) {
      this.stopHorrorAmbiance();
      return;
    }

    this.initCtx();
    if (!this.ctx) return;

    if (!this.horrorInitialized) {
      this.initHorrorAmbiance();
    }

    const now = performance.now();
    const currTime = this.ctx.currentTime;

    // Monster not nearby and not chasing: Complete silence in the maze!
    if (!isChasing && distance > 8.0) {
      this.stopHorrorAmbiance();
      return;
    }

    // Proximity factor: 0.0 (at 8m) -> 1.0 (at 0m / right next to player)
    const proximity = isChasing
      ? Math.max(0.65, Math.min(1, 1 - distance / 10))
      : Math.max(0, Math.min(1, (8.0 - distance) / 8.0));

    // 1. Dread Tone: ONLY swells when monster is close (< 8m) or chasing
    if (this.dreadDroneGain && this.dreadFilter) {
      const droneTargetVol = Math.min(0.28, proximity * (isChasing ? 0.28 : 0.20));
      const filterTargetFreq = 95 + proximity * (isChasing ? 260 : 180);

      this.dreadDroneGain.gain.cancelScheduledValues(currTime);
      this.dreadDroneGain.gain.linearRampToValueAtTime(droneTargetVol, currTime + 0.15);

      this.dreadFilter.frequency.cancelScheduledValues(currTime);
      this.dreadFilter.frequency.linearRampToValueAtTime(filterTargetFreq, currTime + 0.15);
    }

    // 2. High-Tension Ringing (Only when monster is in direct pursuit or extremely close < 4.5m)
    if (this.tensionChordGain) {
      if (isChasing || distance < 4.5) {
        const tensionVol = isChasing ? 0.14 : ((4.5 - distance) / 4.5) * 0.10;
        this.tensionChordGain.gain.cancelScheduledValues(currTime);
        this.tensionChordGain.gain.linearRampToValueAtTime(tensionVol, currTime + 0.15);
      } else {
        this.tensionChordGain.gain.cancelScheduledValues(currTime);
        this.tensionChordGain.gain.linearRampToValueAtTime(0, currTime + 0.2);
      }
    }

    // 3. Heartbeat: ONLY beats when monster is really near (< 6.0m) or actively chasing!
    if (isChasing || distance < 6.0) {
      // 6m -> ~850ms interval, 2m -> ~340ms frantic racing heartbeat!
      const heartbeatProximity = Math.max(0, Math.min(1, (6.0 - distance) / 6.0));
      const heartbeatInterval = Math.max(340, 850 - heartbeatProximity * 510);
      if (now - this.lastHeartbeatTime > heartbeatInterval) {
        this.lastHeartbeatTime = now;
        this.playHeartbeat(heartbeatProximity);
      }
    }

    // 4. Demonic Growl / Snarl: ONLY when monster is close (< 6.5m) or chasing (every 5-6s)
    if ((distance < 6.5 || isChasing) && now - this.lastGrowlTime > 5200) {
      this.lastGrowlTime = now;
      this.playMonsterGrowl(proximity);
    }
  }

  // Smoothly silence horror background sounds to pure silence (0 volume)
  public stopHorrorAmbiance() {
    if (!this.ctx) return;
    const currTime = this.ctx.currentTime;
    if (this.dreadDroneGain) {
      this.dreadDroneGain.gain.cancelScheduledValues(currTime);
      this.dreadDroneGain.gain.linearRampToValueAtTime(0, currTime + 0.15);
      this.dreadDroneGain.gain.setValueAtTime(0, currTime + 0.16);
    }
    if (this.tensionChordGain) {
      this.tensionChordGain.gain.cancelScheduledValues(currTime);
      this.tensionChordGain.gain.linearRampToValueAtTime(0, currTime + 0.15);
      this.tensionChordGain.gain.setValueAtTime(0, currTime + 0.16);
    }
  }

  // Deep demonic guttural growl / roar of the lurking creature
  public playMonsterGrowl(intensity: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const currTime = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const startFreq = 85 + Math.random() * 20;
    osc.frequency.setValueAtTime(startFreq, currTime);
    osc.frequency.exponentialRampToValueAtTime(38, currTime + 0.7);

    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(startFreq * 0.5, currTime);
    subOsc.frequency.exponentialRampToValueAtTime(25, currTime + 0.7);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, currTime);
    filter.frequency.linearRampToValueAtTime(90, currTime + 0.7);
    filter.Q.setValueAtTime(6, currTime);

    const vol = 0.18 + intensity * 0.22;
    gain.gain.setValueAtTime(0.001, currTime);
    gain.gain.linearRampToValueAtTime(vol, currTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, currTime + 0.75);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(currTime);
    subOsc.start(currTime);
    osc.stop(currTime + 0.8);
    subOsc.stop(currTime + 0.8);
  }

  // Footstep sound for player walking
  public playFootstep() {
    if (this.isMuted) return;
    const now = performance.now();
    if (now - this.lastFootstepTime < 280) return;
    this.lastFootstepTime = now;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90 + Math.random() * 20, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  // Pounding heartbeat (double-thud "lub-dub")
  public playHeartbeat(intensity: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const currTime = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 52 + intensity * 28;
    osc.frequency.setValueAtTime(baseFreq, currTime);
    osc.frequency.exponentialRampToValueAtTime(32, currTime + 0.12);

    const vol = 0.16 + intensity * 0.42;
    gain.gain.setValueAtTime(vol, currTime);
    gain.gain.exponentialRampToValueAtTime(0.001, currTime + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(currTime + 0.15);

    // Second thud of double beat
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 0.88, this.ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(28, this.ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(vol * 0.72, this.ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start();
      osc2.stop(this.ctx.currentTime + 0.13);
    }, 120);
  }

  public playPaintPickup() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.06 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.06);
      osc.stop(this.ctx.currentTime + idx * 0.06 + 0.26);
    });
  }

  public playDoorUnlocked() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.5]; // C chord
    chords.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.07);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.07 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.07);
      osc.stop(this.ctx.currentTime + idx * 0.07 + 0.45);
    });
  }

  // Crisp, satisfying acoustic bubble pop / chime when switching paint colors
  public playColorSwitch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(784, now + 0.09);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playCorrectAnswer() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [587.33, 880]; // D5, A5
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.22, this.ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.1);
      osc.stop(this.ctx.currentTime + idx * 0.1 + 0.35);
    });
  }

  public playWrongAnswer() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }

  // Menacing horror screech when monster attacks or enters direct pursuit
  public playMonsterScreech() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const currTime = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const oscDissonant = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, currTime);
    osc.frequency.exponentialRampToValueAtTime(540, currTime + 0.18);
    osc.frequency.exponentialRampToValueAtTime(70, currTime + 0.65);

    // Minor second dissonance
    oscDissonant.type = 'sawtooth';
    oscDissonant.frequency.setValueAtTime(233, currTime);
    oscDissonant.frequency.exponentialRampToValueAtTime(572, currTime + 0.18);
    oscDissonant.frequency.exponentialRampToValueAtTime(74, currTime + 0.65);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(28, currTime);
    lfoGain.gain.setValueAtTime(80, currTime);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfoGain.connect(oscDissonant.frequency);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, currTime);
    filter.Q.setValueAtTime(4, currTime);

    gain.gain.setValueAtTime(0.32, currTime);
    gain.gain.exponentialRampToValueAtTime(0.001, currTime + 0.7);

    osc.connect(filter);
    oscDissonant.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(currTime);
    osc.start(currTime);
    oscDissonant.start(currTime);
    lfo.stop(currTime + 0.75);
    osc.stop(currTime + 0.75);
    oscDissonant.stop(currTime + 0.75);
  }

  // Terrifying explosive jumpscare audio when the monster lunges into the player's screen!
  public playJumpscare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const currTime = this.ctx.currentTime;

    // 1. Heavy Sub-Bass Impact Slam (Earthquake thud)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, currTime);
    subOsc.frequency.exponentialRampToValueAtTime(24, currTime + 0.65);
    subGain.gain.setValueAtTime(0.55, currTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, currTime + 0.7);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(currTime);
    subOsc.stop(currTime + 0.75);

    // 2. Piercing Demonic Roar & Screech (Triple dissonant saws + FM scream)
    const freqs = [185, 196, 293.66, 440]; // Dissonant cluster
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, currTime);
      osc.frequency.linearRampToValueAtTime(freq * 1.8, currTime + 0.12);
      osc.frequency.exponentialRampToValueAtTime(60, currTime + 1.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, currTime);
      filter.frequency.linearRampToValueAtTime(320, currTime + 1.2);

      gain.gain.setValueAtTime(0.26, currTime);
      gain.gain.exponentialRampToValueAtTime(0.001, currTime + 1.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(currTime);
      osc.stop(currTime + 1.3);
    });

    // 3. Harsh Metallic FM Screech Ringing
    const fmMod = this.ctx.createOscillator();
    const fmCarrier = this.ctx.createOscillator();
    const fmModGain = this.ctx.createGain();
    const fmOutGain = this.ctx.createGain();

    fmMod.type = 'sawtooth';
    fmMod.frequency.setValueAtTime(65, currTime);
    fmModGain.gain.setValueAtTime(450, currTime);
    fmModGain.gain.linearRampToValueAtTime(80, currTime + 0.9);

    fmCarrier.type = 'sawtooth';
    fmCarrier.frequency.setValueAtTime(560, currTime);
    fmCarrier.frequency.exponentialRampToValueAtTime(120, currTime + 0.95);

    fmMod.connect(fmModGain);
    fmModGain.connect(fmCarrier.frequency);

    fmOutGain.gain.setValueAtTime(0.35, currTime);
    fmOutGain.gain.exponentialRampToValueAtTime(0.001, currTime + 1.0);

    fmCarrier.connect(fmOutGain);
    fmOutGain.connect(this.ctx.destination);

    fmMod.start(currTime);
    fmCarrier.start(currTime);
    fmMod.stop(currTime + 1.05);
    fmCarrier.stop(currTime + 1.05);
  }

  public playTimeWarning() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  public playGameStart() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [
      { f: 261.63, d: 0.1 },
      { f: 329.63, d: 0.1 },
      { f: 392.0, d: 0.12 },
      { f: 523.25, d: 0.35 },
    ];
    let time = this.ctx.currentTime;
    notes.forEach((n) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, time);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + n.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + n.d + 0.05);
      time += n.d * 0.75;
    });
  }

  public playVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.stopHorrorAmbiance();

    const notes = [
      { f: 523.25, d: 0.16 }, // C5
      { f: 523.25, d: 0.16 }, // C5
      { f: 523.25, d: 0.16 }, // C5
      { f: 659.25, d: 0.35 }, // E5
      { f: 783.99, d: 0.25 }, // G5
      { f: 659.25, d: 0.18 }, // E5
      { f: 783.99, d: 0.2 },  // G5
      { f: 1046.5, d: 0.8 },  // C6 grand finale
    ];
    let time = this.ctx.currentTime;
    notes.forEach((n, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === notes.length - 1 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(n.f, time);

      const oscHarm = this.ctx.createOscillator();
      const gainHarm = this.ctx.createGain();
      oscHarm.type = 'triangle';
      oscHarm.frequency.setValueAtTime(n.f * 0.75, time);

      const vol = idx === notes.length - 1 ? 0.35 : 0.22;
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + n.d);

      gainHarm.gain.setValueAtTime(vol * 0.5, time);
      gainHarm.gain.exponentialRampToValueAtTime(0.001, time + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      oscHarm.connect(gainHarm);
      gainHarm.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + n.d + 0.05);
      oscHarm.start(time);
      oscHarm.stop(time + n.d + 0.05);

      time += n.d * 0.82;
    });
  }
}

export const soundManager = new SoundManager();
