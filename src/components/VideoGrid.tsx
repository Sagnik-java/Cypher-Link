import React, { useEffect, useRef } from "react";
import { Peer } from "../types";
import { Mic, MicOff, Video, VideoOff, Shield, ShieldAlert, Cpu } from "lucide-react";
import { AvatarDisplay } from "./AvatarDisplay";

interface VideoGridProps {
  localStream: MediaStream | null;
  peerStreams: Record<string, MediaStream>;
  peers: Peer[];
  myProfile: { nickname: string; avatar: string; colorTheme: string };
  myPeerId: string | null;
  videoEnabled: boolean;
  audioEnabled: boolean;
  isCalling: boolean;
  onStartCall: (v: boolean) => void;
  onStopCall: () => void;
  onAudioEnabled: (v: boolean) => void;
}

// Child helper component to properly bind MediaStream to HTML5 video element
function VideoPlayer({ stream, muted }: { stream: MediaStream; muted: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      referrerPolicy="no-referrer"
      className="w-full h-full object-cover transform scale-x-[-1]" // mirror local/peer video for natural view
    />
  );
}

export function VideoGrid({
  localStream,
  peerStreams,
  peers,
  myProfile,
  myPeerId,
  videoEnabled,
  audioEnabled,
  isCalling,
  onStartCall,
  onStopCall,
  onAudioEnabled,
}: VideoGridProps) {
  const activeRemoteStreams = Object.keys(peerStreams).filter(k => peerStreams[k]);
  const hasStreams = localStream || activeRemoteStreams.length > 0;

  // Let's count grid columns
  const totalItems = (localStream ? 1 : 0) + activeRemoteStreams.length;
  let gridCols = "grid-cols-1";
  if (totalItems === 2) gridCols = "grid-cols-1 md:grid-cols-2";
  else if (totalItems >= 3) gridCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="flex flex-col h-full bg-[#050508] bg-[radial-gradient(circle_at_center,_#11111a_0%,_#050508_100%)] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
      {/* Feed Panel Header */}
      <div className="px-5 py-3.5 bg-black/20 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-4 bg-cyan-500 rounded-full" />
          <h2 className="text-xs font-bold text-slate-100 uppercase tracking-[0.15em] font-mono">
            Local WebRTC Audio & Video Matrix
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
          </span>
          <span className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-widest font-mono">
            {totalItems} Secure Stream{totalItems !== 1 ? "s" : ""} Active
          </span>
        </div>
      </div>

      {/* Grid container */}
      <div className="flex-1 p-6 overflow-y-auto min-h-[300px] flex items-center justify-center">
        {!hasStreams ? (
          <div className="text-center max-w-sm p-8 space-y-5 bg-[#0D0D15]/60 border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl">
            <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(6,182,212,0.15)] text-2xl">
              📡
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100 tracking-wider uppercase">Node Streams Offline</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Establish peer-to-peer tunnels using your local media devices.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                id="voice-call-enable"
                onClick={() => onStartCall(false)}
                className="px-4 py-2 bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Portal</span>
              </button>
              <button
                id="video-call-enable"
                onClick={() => onStartCall(true)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-400/10"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Complete Stream</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-4 w-full h-full max-h-[600px]`}>
            {/* Local Client Viewport */}
            {localStream && (
              <div className="relative aspect-video sm:aspect-auto sm:h-full bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden shadow-lg group">
                {videoEnabled ? (
                  <VideoPlayer stream={localStream} muted={true} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D0D15]/80 space-y-3">
                    <AvatarDisplay avatar={myProfile.avatar} size="xl" className="rounded-full bg-cyan-500/10 border border-cyan-500/20 shadow-lg ring-4 ring-cyan-500/10" />
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-300">Camera offline</span>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">STANDBY</p>
                    </div>
                  </div>
                )}

                {/* Overlaid parameters */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold text-cyan-400">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                  <span>SECURE LINK</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md border border-white/10 px-3 py-2 rounded-xl">
                  <span className="text-xs font-bold text-slate-100">
                    {myProfile.nickname} (You)
                  </span>
                  <div className="flex items-center gap-1.5">
                    {audioEnabled ? (
                      <Mic className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <MicOff className="w-3.5 h-3.5 text-rose-500" />
                    )}
                    {videoEnabled ? (
                      <Video className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <VideoOff className="w-3.5 h-3.5 text-rose-500" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Remote Peers Viewports */}
            {activeRemoteStreams.map((peerId) => {
              const peerInfo = peers.find(p => p.id === peerId) || {
                nickname: "Group Peer",
                avatar: "👾",
                colorTheme: "slate"
              };
              const stream = peerStreams[peerId];
              const tracks = stream ? stream.getVideoTracks() : [];
              const hasRemoteVideo = tracks.length > 0 && tracks[0].enabled;

              return (
                <div
                  key={peerId}
                  className="relative aspect-video sm:aspect-auto sm:h-full bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden ring-1 ring-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.1)] group"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent pointer-events-none" />
                  {hasRemoteVideo ? (
                    <VideoPlayer stream={stream} muted={false} />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D0D15]/80 space-y-3">
                      <AvatarDisplay avatar={peerInfo.avatar} size="xl" className="rounded-full bg-cyan-500/20 border border-cyan-500/30 shadow-xl ring-4 ring-cyan-500/15" />
                      <div className="text-center font-mono">
                        <span className="text-xs font-bold text-cyan-400">{peerInfo.nickname}</span>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">STREAMING...</p>
                      </div>
                    </div>
                  )}

                  {/* Overlaid parameters */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md border border-cyan-500/25 rounded-full text-[10px] font-bold text-cyan-400 font-mono shadow-[0_0_10px_rgba(6,182,212,0.25)]">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span>CIPHER ACTIVE</span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md border border-white/10 px-3 py-2 rounded-xl">
                    <span className="text-xs font-bold text-slate-100">
                      {peerInfo.nickname}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-cyan-400" />
                      {hasRemoteVideo ? (
                        <Video className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <VideoOff className="w-3.5 h-3.5 text-rose-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Control bar */}
      {isCalling && (
        <div className="p-4 bg-[#0D0D15]/90 backdrop-blur-xl border-t border-white/5 flex flex-wrap items-center justify-between gap-3 px-6">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-cyan-400 font-mono">
              E2E ENCRYPTION ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
               id="stream-voice-mute"
               onClick={() => onAudioEnabled(!audioEnabled)}
               className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                 audioEnabled
                   ? "bg-white/5 border-white/10 text-slate-100 hover:bg-white/10"
                   : "bg-rose-500/15 hover:bg-rose-500/35 border-rose-500/30 text-rose-400"
               }`}
               title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
            >
              {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
               id="stream-video-mute"
               onClick={() => onStartCall(!videoEnabled)}
               className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                 videoEnabled
                   ? "bg-white/5 border-white/10 text-slate-100 hover:bg-white/10"
                   : "bg-rose-500/15 hover:bg-rose-500/35 border-rose-500/30 text-rose-400"
               }`}
               title={videoEnabled ? "Turn off Video Feed" : "Turn on Video Feed"}
            >
              {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            <div className="w-px h-6 bg-white/10 mx-1"></div>

            <button
              id="stream-call-stop"
              onClick={onStopCall}
              className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 border border-rose-400/20 shadow-[0_0_20px_rgba(225,29,72,0.3)]"
            >
              LEAVE CALL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
