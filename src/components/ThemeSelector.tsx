import React, { useRef } from "react";
import { UserProfile } from "../types";
import { ImagePlus } from "lucide-react";

interface ThemeSelectorProps {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
}

const AVATARS = ["🦊", "🐨", "🐯", "🐼", "🦁", "🦄", "🦖", "🐙", "🐝", "🦉", "🦋", "🐠", "🚀", "🛡️", "👾", "🧠"];
const THEMES = [
  { id: "violet", name: "Cyber Violet", color: "bg-violet-600 border-violet-400" },
  { id: "emerald", name: "Green Mint", color: "bg-emerald-600 border-emerald-400" },
  { id: "rose", name: "Neon Rose", color: "bg-rose-600 border-rose-400" },
  { id: "amber", name: "Warm Copper", color: "bg-amber-600 border-amber-400" },
  { id: "slate", name: "High Contrast Slate", color: "bg-slate-600 border-slate-400" },
];

export function ThemeSelector({ profile, onChange }: ThemeSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateNickname = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...profile, nickname: e.target.value.slice(0, 24) });
  };

  const selectAvatar = (avatar: string) => {
    onChange({ ...profile, avatar });
  };

  const selectTheme = (themeId: string) => {
    onChange({ ...profile, colorTheme: themeId });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("Image must be smaller than 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onChange({ ...profile, avatar: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isCustomPhoto = profile.avatar.startsWith('data:') || profile.avatar.startsWith('http');

  return (
    <div className="space-y-6">
      {/* Nickname Input */}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-2">
          Your Nickname
        </label>
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0 overflow-hidden no-invert">
            {isCustomPhoto ? (
              <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover no-invert" />
            ) : (
              <span className="no-invert">{profile.avatar}</span>
            )}
          </div>
          <input
            id="nickname-input"
            type="text"
            required
            placeholder="Type your local nickname..."
            value={profile.nickname}
            onChange={updateNickname}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm font-medium shadow-inner"
          />
        </div>
      </div>

      {/* Choose Avatar */}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-3">
          Select Identity Avatar
        </label>
        <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
              isCustomPhoto
                ? "bg-cyan-500/20 border border-cyan-500/40 scale-110 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/30"
                : "bg-white/5 border border-white/5 hover:bg-white/10 hover:scale-105 text-cyan-400"
            }`}
          >
            <ImagePlus className="w-6 h-6 mb-1" />
            <span className="text-[8px] font-bold uppercase tracking-wider text-center leading-none">Photo</span>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
          </button>
          {AVATARS.map((emoji) => (
            <button
              id={`avatar-${emoji}`}
              key={emoji}
              type="button"
              onClick={() => selectAvatar(emoji)}
              className={`text-2xl p-2 rounded-xl transition-all cursor-pointer no-invert flex items-center justify-center ${
                !isCustomPhoto && profile.avatar === emoji
                  ? "bg-cyan-500/20 border border-cyan-500/40 scale-110 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/30"
                  : "bg-white/5 border border-white/5 hover:bg-white/10 hover:scale-105"
              }`}
            >
              <span className="no-invert">{emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Themes */}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-3">
          Accent Theme
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {THEMES.map((t) => (
            <button
              id={`theme-${t.id}`}
              key={t.id}
              type="button"
              onClick={() => selectTheme(t.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                profile.colorTheme === t.id
                  ? "bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full ${t.color}`} />
              <span className="text-xs font-semibold text-slate-200">{t.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
