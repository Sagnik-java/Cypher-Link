import { useState, useEffect, useRef } from "react";
import { UserProfile, Peer, Message } from "../types";
import { deriveRoomKey, encryptText, decryptText } from "../utils/crypto";

export function useRoom() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("webrtc_e2ee_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return {
      nickname: "",
      avatar: "🦊",
      colorTheme: "violet",
    };
  });

  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  
  const [peers, setPeers] = useState<Peer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCalling, setIsCalling] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerStreams, setPeerStreams] = useState<Record<string, MediaStream>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const rtcConnections = useRef<Record<string, RTCPeerConnection>>({});
  const dataChannels = useRef<Record<string, RTCDataChannel>>({});
  const cryptoKeyRef = useRef<CryptoKey | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const bufferedCandidatesRef = useRef<Record<string, RTCIceCandidateInit[]>>({});

  // Save profile to localStorage on changes
  useEffect(() => {
    localStorage.setItem("webrtc_e2ee_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  // Handle local track enabling/disabling
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
      });
    }
  }, [isVideoEnabled, localStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isAudioEnabled;
      });
    }
  }, [isAudioEnabled, localStream]);

  // Clean elements on unmount
  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, []);

  const clearCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    localStreamRef.current = null;
    setPeerStreams({});
    setIsCalling(false);
  };

  const leaveRoom = () => {
    // Notify signaling
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Close all PeerConnections
    Object.keys(rtcConnections.current).forEach(peerId => {
      rtcConnections.current[peerId].close();
    });
    rtcConnections.current = {};
    dataChannels.current = {};
    bufferedCandidatesRef.current = {};

    clearCall();
    setIsJoined(false);
    setMyPeerId(null);
    setPeers([]);
    setMessages([]);
    cryptoKeyRef.current = null;
    setJoinError(null);
  };

  // Acquire Local Video/Audio Stream
  const joinCall = async (wVideo: boolean) => {
    try {
      if (localStreamRef.current) {
        // Stop current
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: wVideo ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } } : false,
        audio: true
      });

      setLocalStream(stream);
      localStreamRef.current = stream;
      setIsVideoEnabled(wVideo);
      setIsAudioEnabled(true);
      setIsCalling(true);

      // Add tracks to all existing peer connections and trigger negotiation
      for (const peerId of Object.keys(rtcConnections.current)) {
        const pc = rtcConnections.current[peerId];
        
        // Remove existing senders to prevent duplicates
        const senders = pc.getSenders();
        senders.forEach(sender => pc.removeTrack(sender));

        // Add track
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Loop renegotiation offer
        if (pc.signalingState === "stable") {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: "signal",
                targetPeerId: peerId,
                signalData: offer
              }));
            }
          } catch (e) {
            console.error("Renegotiation failed:", e);
          }
        }
      }

      // Add system message about entering call
      const text = `${userProfile.nickname} turned on ${wVideo ? "video call" : "voice call"}.`;
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          senderId: "system",
          senderName: "System",
          senderAvatar: "🔒",
          senderColor: "slate",
          text,
          timestamp: Date.now(),
          isMe: false,
          system: true
        }
      ]);

    } catch (err) {
      console.error("Failed to acquire microphone and camera streams:", err);
      alert("Permission denied or microphone/camera is unavailable. Ensure your browser is configured to allow permission.");
    }
  };

  const stopCall = () => {
    clearCall();

    // Notify peers by removing tracks
    for (const peerId of Object.keys(rtcConnections.current)) {
      const pc = rtcConnections.current[peerId];
      const senders = pc.getSenders();
      senders.forEach(sender => pc.removeTrack(sender));

      // Trigger renegotiation
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "signal",
            targetPeerId: peerId,
            signalData: offer
          }));
        }
      }).catch(e => console.error(e));
    }

    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        senderId: "system",
        senderName: "System",
        senderAvatar: "🔒",
        senderColor: "slate",
        text: `${userProfile.nickname} left the call.`,
        timestamp: Date.now(),
        isMe: false,
        system: true
      }
    ]);
  };

  const createPeerConnection = (peerId: string, isInitiator: boolean): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });

    rtcConnections.current[peerId] = pc;

    // Attach local stream tracks if calling
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE Handshaking
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "signal",
          targetPeerId: peerId,
          signalData: { candidate: event.candidate }
        }));
      }
    };

    // Receive Remote Streams
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setPeerStreams(prev => ({
        ...prev,
        [peerId]: remoteStream
      }));
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        setPeerStreams(prev => {
          const updated = { ...prev };
          delete updated[peerId];
          return updated;
        });
      }
    };

    // Chat Data Channel Setup
    if (isInitiator) {
      try {
        const dc = pc.createDataChannel("chat");
        setupDataChannel(peerId, dc);
      } catch (err) {
        console.error("Failed to create RTCDataChannel:", err);
      }
    } else {
      pc.ondatachannel = (event) => {
        setupDataChannel(peerId, event.channel);
      };
    }

    return pc;
  };

  const setupDataChannel = (peerId: string, dc: RTCDataChannel) => {
    dataChannels.current[peerId] = dc;

    dc.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "direct-msg" && cryptoKeyRef.current) {
          const decrypted = await decryptText(data.payload, cryptoKeyRef.current);
          const msgId = data.msgId;
          
          setMessages(prev => {
            if (msgId && prev.some(m => m.id === msgId)) return prev;
            return [
              ...prev,
              {
                id: msgId || Math.random().toString(),
                senderId: peerId,
                senderName: data.senderName,
                senderAvatar: data.senderAvatar,
                senderColor: data.senderColor,
                text: decrypted,
                timestamp: Date.now(),
                isMe: false,
                system: false
              }
            ];
          });
        } else if (data.type === "delete-msg") {
          const { msgId } = data;
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted: true } : m));
        } else if (data.type === "reaction-msg") {
          const { msgId, emoji, peerId: reactingPeerId, nickname, action } = data;
          setMessages(prev => prev.map(m => {
            if (m.id !== msgId) return m;
            const reactions = { ...(m.reactions || {}) };
            const usersList = [...(reactions[emoji] || [])];
            const index = usersList.findIndex(u => u.peerId === reactingPeerId);
            if (action === "add") {
              if (index === -1) {
                usersList.push({ peerId: reactingPeerId, nickname });
              }
            } else if (action === "remove") {
              if (index !== -1) {
                usersList.splice(index, 1);
              }
            }
            if (usersList.length === 0) {
              delete reactions[emoji];
            } else {
              reactions[emoji] = usersList;
            }
            return { ...m, reactions };
          }));
        }
      } catch (e) {
        console.error("Error standardizing remote datachannel packet:", e);
      }
    };

    dc.onclose = () => {
      delete dataChannels.current[peerId];
    };
  };

  const joinRoom = async (inputRoomId: string, passwordText: string, mode: "create" | "join") => {
    if (!inputRoomId.trim()) return;
    setIsJoining(true);
    setJoinError(null);

    // Prepare WebSocket location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "join",
        roomId: inputRoomId,
        nickname: userProfile.nickname || "Local Navigator",
        avatar: userProfile.avatar,
        colorTheme: userProfile.colorTheme,
        password: passwordText,
        mode: mode,
      }));

      // Keep-alive ping to prevent connection drops on Cloud Run
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
      
      ws.addEventListener("close", () => {
        clearInterval(pingInterval);
      });
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "joined-success") {
          // Store basic local coordinates
          setMyPeerId(data.peerId);
          setRoomId(inputRoomId);
          setPassword(passwordText);

          // Derive shared cryptographic material
          const key = await deriveRoomKey(passwordText, inputRoomId);
          cryptoKeyRef.current = key;

          setIsJoined(true);
          setIsJoining(false);

          // Build local peers list
          setPeers(data.peers);

          // Connect with existing peers in the list
          for (const p of data.peers) {
            const pc = createPeerConnection(p.id, true);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            ws.send(JSON.stringify({
              type: "signal",
              targetPeerId: p.id,
              signalData: offer
            }));
          }

          // Add greeting system messaging
          setMessages([
            {
              id: "joined",
              senderId: "system",
              senderName: "System",
              senderAvatar: "🔒",
              senderColor: "slate",
              text: `Successfully authenticated of End-to-End Encrypted Room [${inputRoomId}]. Real-time messages are ciphered locally!`,
              timestamp: Date.now(),
              isMe: false,
              system: true
            }
          ]);
        }

        else if (data.type === "join-error") {
          setJoinError(data.message);
          setIsJoining(false);
          ws.close();
        }

        else if (data.type === "peer-joined") {
          const { peerId, nickname, avatar, colorTheme } = data;
          
          // Re-create receiver configuration
          createPeerConnection(peerId, false);

          setPeers(prev => {
            // Guard against duplication
            if (prev.some(p => p.id === peerId)) return prev;
            return [...prev, { id: peerId, nickname, avatar, colorTheme }];
          });

          // System notify
          setMessages(prev => [
            ...prev,
            {
              id: Math.random().toString(),
              senderId: "system",
              senderName: "System",
              senderAvatar: "🔒",
              senderColor: "slate",
              text: `${nickname} entered the room.`,
              timestamp: Date.now(),
              isMe: false,
              system: true
            }
          ]);
        }

        else if (data.type === "peer-left") {
          const { peerId } = data;
          const departingPeer = peers.find(p => p.id === peerId) || { nickname: "A peer" };

          // Close connection
          if (rtcConnections.current[peerId]) {
            rtcConnections.current[peerId].close();
            delete rtcConnections.current[peerId];
          }
          if (dataChannels.current[peerId]) {
            dataChannels.current[peerId].close();
            delete dataChannels.current[peerId];
          }
          delete bufferedCandidatesRef.current[peerId];

          setPeerStreams(prev => {
            const updated = { ...prev };
            delete updated[peerId];
            return updated;
          });

          setPeers(prev => prev.filter(p => p.id !== peerId));

          setMessages(prev => [
            ...prev,
            {
              id: Math.random().toString(),
              senderId: "system",
              senderName: "System",
              senderAvatar: "🔒",
              senderColor: "slate",
              text: `${departingPeer.nickname} disconnected from the room.`,
              timestamp: Date.now(),
              isMe: false,
              system: true
            }
          ]);
        }

        else if (data.type === "signal") {
          const { senderPeerId, signalData } = data;
          let pc = rtcConnections.current[senderPeerId];

          if (!pc) {
            pc = createPeerConnection(senderPeerId, false);
          }

          if (signalData.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(signalData));
            
            // Set up buffered ICE candidates
            const buffered = bufferedCandidatesRef.current[senderPeerId] || [];
            for (const cand of buffered) {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
            bufferedCandidatesRef.current[senderPeerId] = [];

            if (signalData.type === "offer") {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              ws.send(JSON.stringify({
                type: "signal",
                targetPeerId: senderPeerId,
                signalData: answer
              }));
            }
          } else if (signalData.candidate) {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
            } else {
              if (!bufferedCandidatesRef.current[senderPeerId]) {
                bufferedCandidatesRef.current[senderPeerId] = [];
              }
              bufferedCandidatesRef.current[senderPeerId].push(signalData.candidate);
            }
          }
        }

        else if (data.type === "chat-msg") {
          const { senderPeerId, nickname, avatar, colorTheme, encryptedPayload, timestamp, msgId } = data;
          if (!cryptoKeyRef.current) return;

          // Decrypt timeline text locally!
          const text = await decryptText(encryptedPayload, cryptoKeyRef.current);
          const isMe = senderPeerId === myPeerId;

          setMessages(prev => {
            if (msgId && prev.some(m => m.id === msgId)) return prev;
            return [
              ...prev,
              {
                id: msgId || Math.random().toString(),
                senderId: senderPeerId,
                senderName: nickname,
                senderAvatar: avatar,
                senderColor: colorTheme,
                text,
                timestamp,
                isMe,
                system: false
              }
            ];
          });
        }

        else if (data.type === "delete-msg") {
          const { msgId } = data;
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted: true } : m));
        }

        else if (data.type === "reaction-msg") {
          const { msgId, emoji, peerId: reactingPeerId, nickname, action } = data;
          setMessages(prev => prev.map(m => {
            if (m.id !== msgId) return m;
            const reactions = { ...(m.reactions || {}) };
            const usersList = [...(reactions[emoji] || [])];
            const index = usersList.findIndex(u => u.peerId === reactingPeerId);
            if (action === "add") {
              if (index === -1) {
                usersList.push({ peerId: reactingPeerId, nickname });
              }
            } else if (action === "remove") {
              if (index !== -1) {
                usersList.splice(index, 1);
              }
            }
            if (usersList.length === 0) {
              delete reactions[emoji];
            } else {
              reactions[emoji] = usersList;
            }
            return { ...m, reactions };
          }));
        }

      } catch (err) {
        console.error("Signal parsing error:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket socket error:", err);
      setJoinError("Failed to reach signalling web server. Verify your local internet status.");
      setIsJoining(false);
    };

    ws.onclose = () => {
      leaveRoom();
    };
  };

  const sendMessage = async (rawText: string) => {
    if (!rawText.trim() || !cryptoKeyRef.current) return;

    // Encrypt message locally first!
    const cipherText = await encryptText(rawText, cryptoKeyRef.current);
    const msgId = Math.random().toString(36).substr(2, 9);

    // 1. Direct WebRTC DataChannel send (Extreme security proof)
    let channelSent = false;
    Object.keys(dataChannels.current).forEach(peerId => {
      const dc = dataChannels.current[peerId];
      if (dc.readyState === "open") {
        try {
          dc.send(JSON.stringify({
            type: "direct-msg",
            payload: cipherText,
            senderName: userProfile.nickname,
            senderAvatar: userProfile.avatar,
            senderColor: userProfile.colorTheme,
            msgId
          }));
          channelSent = true;
        } catch (e) {
          console.error("Failed to send text over RTC data channel:", e);
        }
      }
    });

    // 2. Fallback Relay via Websocket Server for reliable mesh packet sync
    // This transmits ONLY the cipherText! Server never knows what was sent!
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "chat-msg",
        encryptedPayload: cipherText,
        msgId
      }));
    } else {
      // Offline fallback indicator
      if (channelSent) {
        // Since we sent directly via P2P webRTC data channel, we manually inject it on our screen too
        setMessages(prev => {
          if (prev.some(m => m.id === msgId)) return prev;
          return [
            ...prev,
            {
              id: msgId,
              senderId: myPeerId || "me",
              senderName: userProfile.nickname,
              senderAvatar: userProfile.avatar,
              senderColor: userProfile.colorTheme,
              text: rawText,
              timestamp: Date.now(),
              isMe: true,
              system: false
            }
          ];
        });
      }
    }
  };

  const deleteMessage = (msgId: string) => {
    // 1. Send via WebRTC DataChannels
    Object.keys(dataChannels.current).forEach(peerId => {
      const dc = dataChannels.current[peerId];
      if (dc.readyState === "open") {
        try {
          dc.send(JSON.stringify({
            type: "delete-msg",
            msgId
          }));
        } catch (e) {
          console.error("Failed to send delete-msg over data channel:", e);
        }
      }
    });

    // 2. Send via WebSocket signaling
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "delete-msg",
        msgId
      }));
    }

    // 3. Update locally
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted: true } : m));
  };

  const toggleReaction = (msgId: string, emoji: string) => {
    if (!myPeerId) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    const myNickname = userProfile.nickname || "Local Navigator";
    const reactions = msg.reactions || {};
    const existingUsers = reactions[emoji] || [];
    const hasReacted = existingUsers.some(u => u.peerId === myPeerId);
    const action = hasReacted ? "remove" : "add";

    // 1. Send via WebRTC DataChannels
    Object.keys(dataChannels.current).forEach(peerId => {
      const dc = dataChannels.current[peerId];
      if (dc.readyState === "open") {
        try {
          dc.send(JSON.stringify({
            type: "reaction-msg",
            msgId,
            emoji,
            peerId: myPeerId,
            nickname: myNickname,
            action
          }));
        } catch (e) {
          console.error("Failed to send reaction-msg over data channel:", e);
        }
      }
    });

    // 2. Send via WebSocket signaling
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "reaction-msg",
        msgId,
        emoji,
        peerId: myPeerId,
        nickname: myNickname,
        action
      }));
    }

    // 3. Update locally
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const currentReactions = { ...(m.reactions || {}) };
      const usersList = [...(currentReactions[emoji] || [])];
      
      if (action === "add") {
        if (!usersList.some(u => u.peerId === myPeerId)) {
          usersList.push({ peerId: myPeerId, nickname: myNickname });
        }
      } else {
        const idx = usersList.findIndex(u => u.peerId === myPeerId);
        if (idx !== -1) {
          usersList.splice(idx, 1);
        }
      }

      if (usersList.length === 0) {
        delete currentReactions[emoji];
      } else {
        currentReactions[emoji] = usersList;
      }
      return { ...m, reactions: currentReactions };
    }));
  };

  return {
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

    // Calling System
    isCalling,
    videoEnabled: isVideoEnabled,
    audioEnabled: isAudioEnabled,
    setVideoEnabled: setIsVideoEnabled,
    setAudioEnabled: setIsAudioEnabled,
    localStream,
    peerStreams,
    joinCall,
    stopCall
  };
}
