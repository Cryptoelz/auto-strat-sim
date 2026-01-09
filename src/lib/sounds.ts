// Simple notification sounds using Web Audio API

let audioContext: AudioContext | null = null;
let volume = parseFloat(localStorage.getItem('sound-volume') || '0.3');
let saveSoundEnabled = localStorage.getItem('save-sound-enabled') !== 'false'; // Default to enabled

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function getVolume(): number {
  return volume;
}

export function setVolume(newVolume: number) {
  volume = Math.max(0, Math.min(1, newVolume));
  localStorage.setItem('sound-volume', volume.toString());
}

export function getSaveSoundEnabled(): boolean {
  return saveSoundEnabled;
}

export function setSaveSoundEnabled(enabled: boolean) {
  saveSoundEnabled = enabled;
  localStorage.setItem('save-sound-enabled', enabled.toString());
}

export function playBuySound() {
  if (volume === 0) return;
  
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Rising tone for buy signal
  oscillator.frequency.setValueAtTime(400, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
  
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.3);
}

export function playSellSound() {
  if (volume === 0) return;
  
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Falling tone for sell signal
  oscillator.frequency.setValueAtTime(600, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.2);
  
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.35);
}

export function playSaveSound() {
  if (volume === 0 || !saveSoundEnabled) return;
  
  const ctx = getAudioContext();
  
  // Create a subtle "saved" confirmation sound - soft double ping
  const playPing = (startTime: number, freq: number) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(freq, startTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.4, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.12);
  };

  // Two soft ascending pings
  playPing(ctx.currentTime, 880);
  playPing(ctx.currentTime + 0.08, 1100);
}

export function playSignalSound(type: 'BUY' | 'SELL') {
  if (type === 'BUY') {
    playBuySound();
  } else {
    playSellSound();
  }
}
