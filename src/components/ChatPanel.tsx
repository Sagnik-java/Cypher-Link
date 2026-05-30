import React, { useState, useRef, useEffect } from "react";
import { Peer, Message } from "../types";
import { Send, Users, ShieldCheck, Key, LogOut, Phone, Video, HelpCircle, Activity, Trash2, Smile } from "lucide-react";
import { motion } from "motion/react";
import { AvatarDisplay } from "./AvatarDisplay";

interface ChatPanelProps {
  roomId: string;
  roomPasswordHash: string;
  peers: Peer[];
  messages: Message[];
  myPeerId: string | null;
  myProfile: { nickname: string; avatar: string; colorTheme: string };
  onSendMessage: (text: string) => void;
  onDeleteMessage: (msgId: string) => void;
  onToggleReaction: (msgId: string, emoji: string) => void;
  onLeaveRoom: () => void;
  onStartCall: (video: boolean) => void;
  isCalling: boolean;
}

export function ChatPanel({
  roomId,
  roomPasswordHash,
  peers,
  messages,
  myPeerId,
  myProfile,
  onSendMessage,
  onDeleteMessage,
  onToggleReaction,
  onLeaveRoom,
  onStartCall,
  isCalling,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeEmojiPicker, setActiveEmojiPicker] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll messages to bottom on list update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const getThemeColorClass = (theme: string) => {
    switch (theme) {
      case "emerald": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "rose": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "amber": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "slate": return "text-slate-300 bg-white/5 border-white/10";
      default: return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]";
    }
  };

  const getThemeButtonClass = (theme: string) => {
    switch (theme) {
      case "emerald": return "bg-emerald-500 text-slate-950 hover:bg-emerald-400";
      case "rose": return "bg-rose-500 text-white hover:bg-rose-400";
      case "amber": return "bg-amber-500 text-slate-950 hover:bg-amber-400";
      case "slate": return "bg-slate-200 text-slate-900 hover:bg-slate-100";
      default: return "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050508] bg-[radial-gradient(circle_at_center,_#11111a_0%,_#050508_100%)] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
      {/* Top Header Panel */}
      <div className="px-6 py-4 bg-black/20 backdrop-blur-md border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
        {/* Connection Coordinates and Credentials */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white capitalize leading-none tracking-tight">
                Node: {roomId}
              </h1>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
                  E2EE ACTIVE
                </span>
              </div>
            </div>
            {/* Password proving toggles */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <Key className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Secret key:
              </span>
              <button
                id="toggle-room-secret"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-cyan-500/70 hover:text-cyan-400 transition-colors font-mono font-medium outline-none cursor-pointer underline decoration-dotted"
              >
                {showPassword ? roomPasswordHash : "•••••••• (Reveal)"}
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls (Video, Calls, Leaves) */}
        <div className="flex items-center gap-2.5">
          {/* Audio stream shortcut trigger */}
          <button
            id="audio-call-shortcut"
            onClick={() => onStartCall(false)}
            disabled={isCalling}
            className={`px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              isCalling ? "opacity-30 pointer-events-none" : ""
            }`}
            title="Voice Portal"
          >
            <Phone className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          {/* Video stream shortcut trigger */}
          <button
            id="video-call-shortcut"
            onClick={() => onStartCall(true)}
            disabled={isCalling}
            className={`px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              isCalling ? "opacity-30 pointer-events-none" : ""
            }`}
            title="Complete Stream"
          >
            <Video className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          {/* Exit room trigger */}
          <button
            id="leave-room-action"
            onClick={onLeaveRoom}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl border border-rose-400/20 transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.2)]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave Room</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat Feed */}
        <div className="flex-1 flex flex-col bg-black/20 relative">
          {/* Scroll Area */}
          <div
            ref={scrollRef}
            className="flex-1 p-6 overflow-y-auto space-y-4"
          >
            {messages.map((msg, index) => {
              if (msg.system) {
                return (
                  <div
                    key={msg.id || index}
                    className="flex justify-center"
                  >
                    <div className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[10px] font-bold tracking-widest text-[#06b6d4] font-mono text-center max-w-md uppercase">
                      SYSTEM PANEL &gt;&gt; {msg.text}
                    </div>
                  </div>
                );
              }

              const isOwn = msg.senderId === myPeerId;

              return (
                <div
                  key={msg.id || index}
                  className={`flex items-start gap-3.5 max-w-xl ${isOwn ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  {/* Sender Avatar */}
                  <AvatarDisplay avatar={msg.senderAvatar} size="md" className="rounded-xl bg-[#0D0D15] border border-white/10 shadow-inner" />

                  <div className="space-y-1 flex-1 min-w-0">
                    {/* Timestamp & Name */}
                    <div className={`flex items-center gap-2 text-[10px] font-mono ${isOwn ? "justify-end" : ""}`}>
                      <span className="font-bold text-slate-300">{msg.senderName}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Speech bubble + Actions row */}
                    {msg.deleted ? (
                      <div className="px-4 py-2.5 rounded-2xl text-xs leading-relaxed border bg-white/5 border-white/5 text-slate-500 italic flex items-center gap-1.5 w-fit rounded-tl-none">
                        <span>🚫 This message was deleted.</span>
                      </div>
                    ) : (
                      <div className={`relative group flex items-center gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                        {/* Speech bubble */}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed border ${
                            isOwn
                              ? `${getThemeColorClass(myProfile.colorTheme)} rounded-tr-none font-medium`
                              : "bg-white/5 border-white/5 rounded-tl-none text-slate-200"
                          }`}
                        >
                          <p className="break-words font-sans">{msg.text}</p>
                        </div>

                        {/* Actions overlay panel - Hover-triggered on Desktop, Always available on Mobile */}
                        <div className={`flex items-center gap-1 opacity-0 md:group-hover:opacity-100 max-md:opacity-100 transition-opacity duration-150 shrink-0 ${isOwn ? "mr-1" : "ml-1"}`}>
                          {/* Smile Reaction Trigger */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveEmojiPicker(activeEmojiPicker === msg.id ? null : msg.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                              title="React to message"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>

                            {activeEmojiPicker === msg.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setActiveEmojiPicker(null)}
                                />
                                <div className={`absolute z-20 bottom-full mb-1 flex items-center gap-1 p-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl ${isOwn ? "right-0" : "left-0"}`}>
                                  {["👍", "❤️", "😂", "😮", "😢", "🔥"].map(emoji => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => {
                                        onToggleReaction(msg.id, emoji);
                                        setActiveEmojiPicker(null);
                                      }}
                                      className="p-1 hover:bg-white/10 rounded-lg transition-transform hover:scale-125 text-sm cursor-pointer"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Trash Delete Trigger */}
                          {isOwn && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Establish node consensus to delete message?")) {
                                  onDeleteMessage(msg.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Emojis Reactions Render Board */}
                    {!msg.deleted && msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                        {Object.entries(msg.reactions).map(([emoji, users]) => {
                          const hasReacted = users.some(u => u.peerId === myPeerId);
                          const reactorsList = users.map(u => u.nickname).join(", ");
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => onToggleReaction(msg.id, emoji)}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                                hasReacted
                                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                              }`}
                              title={`Reacted by: ${reactorsList}`}
                            >
                              <span className="text-xs">{emoji}</span>
                              <span className="font-mono text-[9px]">{users.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secure cryptographic lock indicator in footer */}
          <div className="px-6 py-2.5 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">
                E2E ENCRYPTION ACTIVE • Data sits only in RAM
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
              <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>AES-GCM-256</span>
            </div>
          </div>

          {/* Composer Send Box */}
          <form
            onSubmit={handleSend}
            className="p-4 bg-black/40 border-t border-white/5 flex items-center gap-3.5"
          >
            <input
              id="chat-send-input"
              type="text"
              required
              placeholder="Message node..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all text-xs font-medium shadow-inner"
            />
            <button
              id="confirm-send-message"
              type="submit"
              className={`p-3 rounded-xl cursor-pointer bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-400/20`}
              title="Encrypt and send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Sidebar Panel of connected Local Peers */}
        <div className="w-64 bg-gradient-to-b from-[#0D0D15] to-[#08080C] border-l border-white/5 hidden lg:flex flex-col">
          <div className="p-4.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Active Nodes</span>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-mono">LOCAL ONLY</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {/* Display local peer (You) */}
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{myProfile.nickname} (You)</div>
                <div className="text-[10px] text-cyan-400/70 font-mono">Coordinates Host</div>
              </div>
              <AvatarDisplay avatar={myProfile.avatar} size="lg" className="rounded-xl bg-black/20" />
            </div>

            {/* Display list of active WebRTC peers */}
            {peers.map((peer) => (
              <div
                key={peer.id}
                className="p-3 rounded-xl hover:bg-white/5 border border-transparent flex items-center gap-3 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-[#06b6d4]"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-300 truncate">{peer.nickname}</div>
                  <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">WebRTC Active</div>
                </div>
                <AvatarDisplay avatar={peer.avatar} size="lg" className="rounded-xl bg-black/20" />
              </div>
            ))}

            {peers.length === 0 && (
              <div className="py-12 text-center text-slate-600 space-y-3 px-2">
                <HelpCircle className="w-5 h-5 text-slate-700 mx-auto" />
                <p className="text-[10px] leading-relaxed font-sans text-slate-500">
                  Secure local link established. Share Room Details to handshake peers.
                </p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-white/5 bg-black/20 mt-auto">
             <div className="text-[10px] text-slate-500 font-mono flex flex-col gap-1.5 leading-snug">
               <span className="flex items-center gap-1.5">
                 Made by <span className="text-cyan-400 font-sans font-bold">Sagnik Manna</span>
               </span>
               <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("sagnikmanna2013@gmail.com");
                    alert("Email copied to clipboard!");
                  }}
                  className="w-full text-left bg-white/5 hover:bg-white/10 px-2 py-1.5 rounded-md border border-white/5 hover:border-cyan-500/30 transition-colors cursor-pointer break-all text-[9.5px] text-slate-400 hover:text-cyan-300 flex items-center gap-1.5"
                  title="Click to copy email"
               >
                 <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                 sagnikmanna2013@gmail.com
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
