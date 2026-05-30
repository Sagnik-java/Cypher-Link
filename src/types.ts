export interface UserProfile {
  nickname: string;
  avatar: string; // E.g., 'avatar-1', 'avatar-2' etc.
  colorTheme: string; // CSS color or identifier (slate, violet, emerald, amber, rose)
}

export interface Peer {
  id: string;
  nickname: string;
  avatar: string;
  colorTheme: string;
}

export interface EncryptedMessage {
  iv: string;
  ciphertext: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderColor: string;
  text: string;
  timestamp: number;
  isMe: boolean;
  system: boolean;
  deleted?: boolean;
  reactions?: Record<string, { peerId: string; nickname: string }[]>;
}

export interface ActivePeerConnection {
  peerId: string;
  nickname: string;
  avatar: string;
  colorTheme: string;
  rtcConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  remoteStream: MediaStream | null;
}

export interface RoomInfo {
  roomId: string;
  password?: string;
  isJoined: boolean;
  myPeerId?: string;
}
