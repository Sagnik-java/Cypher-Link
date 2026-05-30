import { useState, useEffect } from "react";
import { useRoom } from "./hooks/useRoom";
import { JoinPanel } from "./components/JoinPanel";
import { ChatPanel } from "./components/ChatPanel";
import { VideoGrid } from "./components/VideoGrid";
import { Shield, ShieldAlert, Wifi, Info, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Apply CSS inversion class on document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
    }
  }, [isDarkMode]);

  const {
    userProfile,
    setUserProfile,
    roomId,
    password,
    isJoined,
    isJoining,
    joinError,
    myPeerId,
    peers,
    messages,
    sendMessage,
    deleteMessage,
    toggleReaction,
    joinRoom,
    leaveRoom,

    // Calling integrations
    isCalling,
    videoEnabled,
    audioEnabled,
    setVideoEnabled,
    setAudioEnabled,
    localStream,
    peerStreams,
    joinCall,
    stopCall,
  } = useRoom();

  if (!isJoined) {
    return (
      <div className="relative min-h-screen">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="absolute top-6 right-6 z-50 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md flex items-center justify-center no-invert shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <JoinPanel
          profile={userProfile}
          onProfileChange={setUserProfile}
          onJoin={joinRoom}
          isJoining={isJoining}
          error={joinError}
        />
      </div>
    );
  }

  // Create hashed representation of password for UI safe proof displaying
  const mockPasswordHash = password
    ? password.slice(0, 3) + "*".repeat(Math.max(password.length - 3, 5))
    : "Unspecified";

  return (
    <div className="min-h-screen bg-[#050508] bg-[radial-gradient(circle_at_center,_#11111a_0%,_#050508_100%)] text-slate-100 flex flex-col font-sans select-none">
      {/* Upper Status Ribbon */}
      <header className="bg-black/20 border-b border-white/5 px-6 py-4 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            <span>CYPHER<span className="text-cyan-400 font-light">LINK</span></span>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline font-normal tracking-wide">// HOST IDENT: {userProfile.nickname} {userProfile.avatar}</span>
          </h1>
        </div>

        {/* Info label about safety */}
        <div className="hidden md:flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#06b6d4] bg-cyan-500/10 px-3 py-1.5 border border-cyan-500/20 rounded-lg font-mono">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse mr-0.5" />
          <span>Direct WebRTC Matrix Link</span>
        </div>

        {/* Connected peers count bubble */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl font-mono text-[10px] tracking-wider font-bold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{peers.length + 1} LINK CORES LIVE</span>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-100 hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center ml-2 no-invert"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Container Workstation */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 overflow-hidden">
        {/* If Active Call is engaged, display Video Grid alongside Chat */}
        {isCalling && (
          <div className="flex-1 lg:flex-[1.2] min-h-[300px] lg:min-h-0 overflow-hidden">
            <VideoGrid
              localStream={localStream}
              peerStreams={peerStreams}
              peers={peers}
              myProfile={userProfile}
              myPeerId={myPeerId}
              videoEnabled={videoEnabled}
              audioEnabled={audioEnabled}
              isCalling={isCalling}
              onStartCall={joinCall}
              onStopCall={stopCall}
              onAudioEnabled={setAudioEnabled}
            />
          </div>
        )}

        {/* Encrypted Messages Timeline Module */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 overflow-hidden">
          <ChatPanel
            roomId={roomId}
            roomPasswordHash={mockPasswordHash}
            peers={peers}
            messages={messages}
            myPeerId={myPeerId}
            myProfile={userProfile}
            onSendMessage={sendMessage}
            onDeleteMessage={deleteMessage}
            onToggleReaction={toggleReaction}
            onLeaveRoom={leaveRoom}
            onStartCall={joinCall}
            isCalling={isCalling}
          />
        </div>
      </main>
    </div>
  );
}
