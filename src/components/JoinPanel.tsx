import React, { useState } from "react";
import { UserProfile } from "../types";
import { ThemeSelector } from "./ThemeSelector";
import { Shield, Key, Lock, Network, MessageSquare, Video } from "lucide-react";
import { motion } from "motion/react";

interface JoinPanelProps {
  profile: UserProfile;
  onProfileChange: (p: UserProfile) => void;
  onJoin: (roomId: string, passwordText: string, mode: "create" | "join") => void;
  isJoining: boolean;
  error: string | null;
}

export function JoinPanel({ profile, onProfileChange, onJoin, isJoining, error }: JoinPanelProps) {
  const [createRoomId, setCreateRoomId] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [mode, setMode] = useState<"create" | "join">("join");

  const handleSubmit = (e?: React.FormEvent, submitMode?: "create" | "join") => {
    if (e && e.preventDefault) e.preventDefault();
    
    if (!profile.nickname.trim()) {
      alert("Please enter a nickname first.");
      return;
    }
    
    const activeMode = submitMode || mode;
    const roomIdToUse = activeMode === "create" ? createRoomId : joinRoomId;
    const passwordToUse = activeMode === "create" ? createPassword : joinPassword;

    if (!roomIdToUse.trim() || !passwordToUse.trim()) {
      alert("Please specify both a Node ID and Password.");
      return;
    }
    onJoin(roomIdToUse.trim().toLowerCase(), passwordToUse.trim(), activeMode);
  };

  return (
    <div className="min-h-screen bg-[#050508] bg-[radial-gradient(circle_at_center,_#11111a_0%,_#050508_100%)] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      {/* Visual background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-2xl bg-[#0D0D15]/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 z-10"
      >
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] font-mono">
              SECURED LAN CHANNEL
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
            CYPHER<span className="text-cyan-400 font-light">LINK</span>
          </h1>

          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Zero-servers local peer-to-peer audio, video and chat encryption matrix. No telemetry, no cloud logging, absolute data sovereignty.
          </p>
        </div>

        {/* Informational Bullet Ribbons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/40 p-4 rounded-xl border border-white/5">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-200">Zero Servers E2EE</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                AES-GCM encryption key derived in-browser from room secret.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Network className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-200">Local WebRTC Mesh</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                Direct peer-to-peer data channel streams with zero central relays.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Key className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-200">Shared Password Info</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                Only clients inputs sharing exact room password can hand shake.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Settings Customizer */}
          <ThemeSelector profile={profile} onChange={onProfileChange} />

          {/* Room Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Section */}
            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                   <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                 </div>
                 <div>
                   <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Create Node</h3>
                   <p className="text-[10px] text-slate-500">Initialize a new secure room</p>
                 </div>
              </div>
              
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-2">
                  New Node ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. ops-hub"
                    value={createRoomId}
                    onChange={(e) => { setCreateRoomId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "")); setMode("create"); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all text-sm font-medium shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-2">
                  Encryption Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Set node secret..."
                    value={createPassword}
                    onChange={(e) => { setCreatePassword(e.target.value); setMode("create"); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all text-sm font-medium shadow-inner"
                  />
                </div>
              </div>

              <div className="mt-auto pt-4">
                <button
                  type="button"
                  disabled={isJoining && mode === "create"}
                  onClick={(e) => { setMode("create"); handleSubmit(e, "create"); }}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10 hover:border-cyan-500/50 hover:text-cyan-400"
                >
                  {isJoining && mode === "create" ? "Initializing..." : "Create New Node"}
                </button>
              </div>
            </div>

            {/* Join Section */}
            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                   <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                 </div>
                 <div>
                   <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Join Node</h3>
                   <p className="text-[10px] text-slate-500">Connect to an active room</p>
                 </div>
              </div>
              
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-2">
                  Target Node ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. dev-team"
                    value={joinRoomId}
                    onChange={(e) => { setJoinRoomId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "")); setMode("join"); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-medium shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-2">
                  Node Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter node secret..."
                    value={joinPassword}
                    onChange={(e) => { setJoinPassword(e.target.value); setMode("join"); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-medium shadow-inner"
                  />
                </div>
              </div>

              <div className="mt-auto pt-4">
                <button
                  type="button"
                  disabled={isJoining && mode === "join"}
                  onClick={(e) => { setMode("join"); handleSubmit(e, "join"); }}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.45)] border border-cyan-400/20"
                >
                  {isJoining && mode === "join" ? "Connecting..." : "Link to Node"}
                </button>
              </div>
            </div>
          </div>

          {/* Display Join Validation Errors */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-300 font-semibold text-center leading-relaxed"
            >
              ⚠️ {error}
            </motion.div>
          )}

        </form>
      </motion.div>

      {/* Footer Signature */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-8 text-center text-xs text-slate-500 font-medium z-10"
      >
        <p className="flex items-center gap-1.5 justify-center">
          Made by <span className="text-cyan-400 font-bold ml-1">Sagnik Manna</span>
        </p>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText("sagnikmanna2013@gmail.com");
            alert("Email copied to clipboard!");
          }}
          className="mt-3 text-[10px] text-slate-400 hover:text-cyan-400 transition-all font-mono bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/5 hover:border-cyan-500/30 cursor-pointer flex items-center justify-center gap-2 mx-auto"
          title="Click to copy email"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          sagnikmanna2013@gmail.com
        </button>
      </motion.div>
    </div>
  );
}
