/**
 * GestureFlow — Speech & Audio Guidance Engine
 * Uses Web Speech API for voice assistance with live subtitle captions,
 * plus Web Audio API procedural holographic sound design (zero network files required).
 */

export class SpeechManager {
  constructor(captionElement = null) {
    this.captionEl = captionElement;
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.voiceEnabled = true;
    this.audioSfxEnabled = true;
    this.volume = 0.85;
    this.rate = 1.05;
    this.pitch = 1.0;
    this.selectedVoice = null;
    this.captionTimeout = null;

    // Web Audio API context for procedural holographic SFX
    this.audioCtx = null;

    this._initAudio();
    this._initVoices();
  }

  _initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }

  _resumeAudioContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  _initVoices() {
    if (!this.synth) return;

    const pickVoice = () => {
      const voices = this.synth.getVoices();
      if (!voices || voices.length === 0) return;
      // Prefer futuristic / crisp English voices (Google US English, Samantha, Microsoft Zira, Daniel, natural)
      const preferred = voices.find(v => 
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Daniel')) &&
        v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      this.selectedVoice = preferred;
    };

    pickVoice();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = pickVoice;
    }
  }

  /**
   * Speak a text string with live visual captions
   * @param {string} text Text to speak
   * @param {boolean} interrupt If true, cancels ongoing speech
   */
  speak(text, interrupt = false) {
    this._resumeAudioContext();
    this.setCaption(text);

    if (!this.synth || !this.voiceEnabled || !text) {
      return;
    }

    try {
      if (interrupt) {
        this.synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.volume = this.volume;
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;

      utterance.onend = () => {
        // Clear caption slightly after speech ends
        if (this.captionTimeout) clearTimeout(this.captionTimeout);
        this.captionTimeout = setTimeout(() => {
          this.setCaption('');
        }, 1800);
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis warning:', e);
      };

      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Speech error:', err);
    }
  }

  /**
   * Display text in the on-screen live subtitles bar
   * @param {string} text 
   */
  setCaption(text) {
    if (!this.captionEl) return;
    if (this.captionTimeout) clearTimeout(this.captionTimeout);

    if (!text) {
      this.captionEl.classList.remove('active');
      this.captionEl.textContent = '';
      return;
    }

    this.captionEl.textContent = text;
    this.captionEl.classList.add('active');

    // Auto clear if no voice engine ends it
    this.captionTimeout = setTimeout(() => {
      this.captionEl.classList.remove('active');
    }, 6000);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.setCaption('');
  }

  toggleVoice(forceState = null) {
    this.voiceEnabled = forceState !== null ? forceState : !this.voiceEnabled;
    if (!this.voiceEnabled) {
      this.stop();
    }
    return this.voiceEnabled;
  }

  // ==========================================
  // PROCEDURAL HOLOGRAPHIC SOUND FX (Web Audio)
  // ==========================================

  playChime(type = 'select') {
    if (!this.audioSfxEnabled || !this.audioCtx) return;
    this._resumeAudioContext();

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'select') {
        // High-tech subtle blip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'grab') {
        // Low tactile resonance hum
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'release') {
        // Soft descending chirp
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.1);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'morph') {
        // Shimmering sweep
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'burst') {
        // Deep energy dispersion
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.3);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'achievement') {
        // Harmonic major triad chime
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        freqs.forEach((f, idx) => {
          const o = this.audioCtx.createOscillator();
          const g = this.audioCtx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + idx * 0.06);
          g.gain.setValueAtTime(0.08, now + idx * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);
          o.connect(g);
          g.connect(this.audioCtx.destination);
          o.start(now + idx * 0.06);
          o.stop(now + idx * 0.06 + 0.45);
        });
      }
    } catch (e) {
      // Ignore audio glitch
    }
  }
}
