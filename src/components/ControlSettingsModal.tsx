import React, { useState } from 'react';
import {
  Laptop,
  Tablet,
  Smartphone,
  Sliders,
  Check,
  RotateCcw,
  X,
  Keyboard,
  Gamepad2,
  Sparkles,
  Zap,
  Music,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ControlSettings, DevicePreset, TouchControlStyle, TouchVisibility } from '../types/game';

interface ControlSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ControlSettings;
  onUpdateSettings: (newSettings: ControlSettings) => void;
  isMusicMuted?: boolean;
  onToggleMusic?: () => void;
  musicVolume?: number;
  onSetMusicVolume?: (vol: number) => void;
  isSfxMuted?: boolean;
  onToggleSfx?: () => void;
}

export const ControlSettingsModal: React.FC<ControlSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  isMusicMuted = false,
  onToggleMusic,
  musicVolume = 0.5,
  onSetMusicVolume,
  isSfxMuted = false,
  onToggleSfx,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'audio' | 'guide'>('presets');

  if (!isOpen) return null;

  // Preset Handlers
  const applyPreset = (preset: DevicePreset) => {
    let updated: ControlSettings;
    if (preset === 'laptop') {
      updated = {
        ...settings,
        devicePreset: 'laptop',
        touchVisibility: 'hidden',
        sprintToggle: false,
        cameraSensitivity: 1.0,
        buttonScale: 'normal',
      };
    } else if (preset === 'phone') {
      updated = {
        ...settings,
        devicePreset: 'phone',
        touchVisibility: 'always',
        touchStyle: 'joystick',
        sprintToggle: true,
        cameraSensitivity: 1.2,
        buttonScale: 'normal',
      };
    } else if (preset === 'tablet') {
      updated = {
        ...settings,
        devicePreset: 'tablet',
        touchVisibility: 'always',
        touchStyle: 'joystick',
        sprintToggle: true,
        cameraSensitivity: 1.0,
        buttonScale: 'large',
      };
    } else {
      updated = {
        ...settings,
        devicePreset: 'auto',
        touchVisibility: 'auto',
      };
    }
    onUpdateSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none font-['Fredoka',sans-serif]">
      <div className="relative w-full max-w-2xl bg-neutral-900 border-2 border-neutral-700 rounded-3xl p-5 sm:p-6 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-amber-300 leading-tight">
                Tetapan Kawalan Peranti
              </h3>
              <p className="text-xs text-neutral-400">
                Sokongan penuh untuk Laptop 💻, iPad 📱, dan Telefon 📲
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 mb-4 bg-neutral-950 p-1 rounded-2xl border border-neutral-800">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-black'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Peranti</span>
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'audio'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-black'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Muzik & Bunyi</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-black'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Panduan Butang</span>
          </button>
        </div>

        {/* Tab 1: Device Presets & Detailed Customization */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            {/* 3 Quick Device Cards */}
            <div>
              <label className="text-xs uppercase font-bold text-neutral-300 block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Pilih Preset Peranti Anda:</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Laptop Card */}
                <button
                  type="button"
                  onClick={() => applyPreset('laptop')}
                  className={`p-3.5 rounded-2xl border-2 text-left flex flex-col justify-between transition relative ${
                    settings.devicePreset === 'laptop'
                      ? 'border-amber-400 bg-amber-950/40 shadow-lg shadow-amber-500/10'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                  }`}
                >
                  {settings.devicePreset === 'laptop' && (
                    <span className="absolute top-2 right-2 p-1 bg-amber-500 rounded-full text-neutral-950">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2 text-amber-400">
                    <Laptop className="w-5 h-5" />
                    <span className="font-black text-sm">Laptop / PC</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Papan kekunci (WASD / Panah), Tetikus pandangan 360°, kekunci Shift (Lari) & [E] buka pintu.
                  </p>
                </button>

                {/* 2. iPad / Tablet Card */}
                <button
                  type="button"
                  onClick={() => applyPreset('tablet')}
                  className={`p-3.5 rounded-2xl border-2 text-left flex flex-col justify-between transition relative ${
                    settings.devicePreset === 'tablet'
                      ? 'border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-500/10'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                  }`}
                >
                  {settings.devicePreset === 'tablet' && (
                    <span className="absolute top-2 right-2 p-1 bg-emerald-500 rounded-full text-neutral-950">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2 text-emerald-400">
                    <Tablet className="w-5 h-5" />
                    <span className="font-black text-sm">iPad / Tablet</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Butang sentuh saiz <strong>BESAR</strong>, susunan ibu jari luas dan selesa, sokongan seret kamera.
                  </p>
                </button>

                {/* 3. Phone Card */}
                <button
                  type="button"
                  onClick={() => applyPreset('phone')}
                  className={`p-3.5 rounded-2xl border-2 text-left flex flex-col justify-between transition relative ${
                    settings.devicePreset === 'phone'
                      ? 'border-sky-400 bg-sky-950/40 shadow-lg shadow-sky-500/10'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                  }`}
                >
                  {settings.devicePreset === 'phone' && (
                    <span className="absolute top-2 right-2 p-1 bg-sky-400 rounded-full text-neutral-950">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2 text-sky-400">
                    <Smartphone className="w-5 h-5" />
                    <span className="font-black text-sm">Telefon Pintar</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Joystick kompak di sudut skrin, butang aksi pantas, kunci lari automatik (Sprint Lock).
                  </p>
                </button>
              </div>
            </div>

            {/* Detailed Controls Panel */}
            <div className="p-4 bg-neutral-950/80 rounded-2xl border border-neutral-800 space-y-3.5">
              <h4 className="text-xs uppercase font-black text-amber-400 tracking-wider">
                Penalaan Khusus (Custom Settings)
              </h4>

              {/* 1. Touch Visibility */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-neutral-300 font-bold">Paparan Butang Skrin Sentuh:</span>
                <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                  {(
                    [
                      { id: 'auto', label: 'Auto (Kesan Skrin)' },
                      { id: 'always', label: 'Sentiasa Ada' },
                      { id: 'hidden', label: 'Sembunyi' },
                    ] as { id: TouchVisibility; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onUpdateSettings({ ...settings, touchVisibility: opt.id })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        settings.touchVisibility === opt.id
                          ? 'bg-amber-500 text-neutral-950 font-black'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Touch Style: Joystick vs D-Pad */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-neutral-300 font-bold">Gaya Kawalan Pergerakan:</span>
                <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                  {(
                    [
                      { id: 'joystick', label: '🕹️ Joystick Maya' },
                      { id: 'dpad', label: '🎛️ Pad Arah (D-Pad)' },
                    ] as { id: TouchControlStyle; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onUpdateSettings({ ...settings, touchStyle: opt.id })}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                        settings.touchStyle === opt.id
                          ? 'bg-amber-500 text-neutral-950 font-black'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Button Size (Scale) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-neutral-300 font-bold">Saiz Butang Sentuh:</span>
                <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                  <button
                    onClick={() => onUpdateSettings({ ...settings, buttonScale: 'normal' })}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                      settings.buttonScale === 'normal'
                        ? 'bg-amber-500 text-neutral-950 font-black'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Sederhana (Telefon)
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, buttonScale: 'large' })}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                      settings.buttonScale === 'large'
                        ? 'bg-amber-500 text-neutral-950 font-black'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Besar (iPad / Tablet)
                  </button>
                </div>
              </div>

              {/* 4. Sprint Mode */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-neutral-300 font-bold block">Mod Butang Lari (Sprint):</span>
                  <span className="text-[10px] text-neutral-400">
                    {settings.sprintToggle ? 'Tekan sekali untuk aktifkan lari berterusan' : 'Tahan butang semasa berlari'}
                  </span>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, sprintToggle: !settings.sprintToggle })}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                    settings.sprintToggle
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{settings.sprintToggle ? 'Kunci Lari (Toggle ON)' : 'Tahan Semasa Lari (Hold)'}</span>
                </button>
              </div>

              {/* 5. Camera Sensitivity */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300 font-bold">Sensitiviti Kamera (Kelajuan Pusing):</span>
                  <span className="font-mono text-amber-400 font-bold">{settings.cameraSensitivity.toFixed(1)}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-500">Perlahan</span>
                  <input
                    type="range"
                    min="0.6"
                    max="2.0"
                    step="0.2"
                    value={settings.cameraSensitivity}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, cameraSensitivity: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-neutral-500">Laju</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Audio & Muzik Latar */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-950/80 rounded-2xl border border-neutral-800 space-y-4">
              {/* BGM Music Header & Toggle */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${!isMusicMuted ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' : 'bg-neutral-900 border-neutral-700 text-neutral-500'}`}>
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-neutral-100 flex items-center gap-2">
                      <span>Muzik Latar (BGM)</span>
                      {!isMusicMuted && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          Sedang Dimainkan 🎵
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Lagu synthwave misteri adaptif (Meneroka, Dikejar Raksasa, Menjawab Puzzle & Kemenangan)
                    </p>
                  </div>
                </div>

                {onToggleMusic && (
                  <button
                    onClick={onToggleMusic}
                    className={`px-4 py-2 rounded-xl border text-xs font-black transition active:scale-95 ${
                      !isMusicMuted
                        ? 'bg-emerald-500 text-neutral-950 border-white shadow-lg shadow-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                    }`}
                  >
                    {!isMusicMuted ? 'Muzik: ON' : 'Muzik: OFF'}
                  </button>
                )}
              </div>

              {/* Volume Slider for BGM */}
              {onSetMusicVolume && (
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300 font-bold flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      Kekuatan Bunyi Muzik (Volume):
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {Math.round(musicVolume * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500">0%</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={musicVolume}
                      onChange={(e) => onSetMusicVolume(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-neutral-500">100%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sound FX (SFX) Card */}
            <div className="p-4 bg-neutral-950/80 rounded-2xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${!isSfxMuted ? 'bg-amber-950/80 border-amber-500/50 text-amber-400' : 'bg-neutral-900 border-neutral-700 text-neutral-500'}`}>
                  {!isSfxMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-rose-400" />}
                </div>
                <div>
                  <div className="font-black text-sm text-neutral-100">
                    Kesan Bunyi Permainan (SFX)
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Tapak kaki pemain, buka kunci pintu, kutip cat samaran & jumpscare raksasa
                  </p>
                </div>
              </div>

              {onToggleSfx && (
                <button
                  onClick={onToggleSfx}
                  className={`px-4 py-2 rounded-xl border text-xs font-black transition active:scale-95 ${
                    !isSfxMuted
                      ? 'bg-amber-500 text-neutral-950 border-white shadow-lg shadow-amber-500/30'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                  }`}
                >
                  {!isSfxMuted ? 'Bunyi: ON' : 'Bunyi: OFF'}
                </button>
              )}
            </div>

            {/* Soundtrack Info Box */}
            <div className="p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800 text-xs text-neutral-300 space-y-1">
              <div className="font-bold text-neutral-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Teknologi Muzik Real-Time:</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Muzik latar dijana secara sintetik & adaptif melalui Web Audio API — tempo dan rentak lagu akan berubah secara dramatik menjadi pantas apabila raksasa bayang mula mengejar anda!
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Guide by device */}
        {activeTab === 'guide' && (
          <div className="space-y-3 text-xs leading-relaxed">
            {/* Laptop Guide */}
            <div className="p-3.5 bg-neutral-950/80 rounded-2xl border border-neutral-800">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm mb-1.5">
                <Laptop className="w-4 h-4" />
                <span>Kawalan Laptop / Komputer:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-neutral-300">
                <li>
                  <strong>Maju / Undur:</strong> Kekunci <strong>W / S</strong> atau butang panah <strong>⬆️ / ⬇️</strong>
                </li>
                <li>
                  <strong>Pusing Kiri / Kanan:</strong> Kekunci <strong>A / D</strong> atau butang panah <strong>⬅️ / ➡️</strong>
                </li>
                <li>
                  <strong>Memecut (Sprint):</strong> Tahan kekunci <strong>Shift</strong> semasa bergerak
                </li>
                <li>
                  <strong>Buka Pintu Matematik:</strong> Tekan <strong>[E]</strong>, <strong>Space</strong>, atau <strong>Enter</strong>
                </li>
                <li>
                  <strong>Pusing Pandangan Kamera 360°:</strong> Klik & seret tetikus / touchpad pada skrin
                </li>
              </ul>
            </div>

            {/* iPad & Phone Guide */}
            <div className="p-3.5 bg-neutral-950/80 rounded-2xl border border-neutral-800">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-sm mb-1.5">
                <Tablet className="w-4 h-4" />
                <span>Kawalan iPad, Tablet & Telefon:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-neutral-300">
                <li>
                  <strong>Ibu Jari Kiri:</strong> Seret <strong>Joystick Maya</strong> ke mana-mana arah untuk bergerak maju, undur atau memusing badan. (Boleh tukar ke mod D-Pad 4 Butang jika suka).
                </li>
                <li>
                  <strong>Butang Aksi [E] (Kanan):</strong> Apabila menghampiri pintu warna, butang kunci akan menyala kuning keemasan. Tekan untuk membuka soalan kuiz pintu!
                </li>
                <li>
                  <strong>Butang Lari (⚡ Lari):</strong> Tekan untuk lari laju mengelak raksasa bayang.
                </li>
                <li>
                  <strong>Butang Pusing (↶ & ↷):</strong> Tekan butang pusing kiri/kanan di sebelah kanan untuk pusing pantas 45° di simpang lorong.
                </li>
                <li>
                  <strong>Sentuh Skrin Bebas:</strong> Boleh seret jari di bahagian atas/tengah skrin untuk pusing kamera dengan lancar.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer Button */}
        <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => applyPreset('auto')}
            className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Set Semula Ke Auto</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs rounded-xl transition active:scale-95 shadow-lg shadow-amber-500/20"
          >
            Simpan & Teruskan Permainan
          </button>
        </div>
      </div>
    </div>
  );
};
