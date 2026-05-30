import express from "express";
import path from "path";
import { createServer as createHttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

async function start() {
  const app = express();
  const server = createHttpServer(app);
  const wss = new WebSocketServer({ noServer: true });

  const PORT = 3000;

  // Attach WebSocket to HTTP upgrades
  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  // Track room and client systems
  interface Peer {
    id: string;
    ws: WebSocket;
    nickname: string;
    avatar: string;
    colorTheme: string;
  }

  interface Room {
    id: string;
    passwordHash: string;
    peers: Map<string, Peer>;
  }

  const rooms = new Map<string, Room>();

  function hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  wss.on("connection", (ws: WebSocket) => {
    let clientRoomId: string | null = null;
    let clientPeerId: string | null = null;

    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message);

        if (data.type === "join") {
          const { roomId, nickname, avatar, colorTheme, password, mode } = data;
          if (!roomId || !nickname) {
            ws.send(JSON.stringify({ type: "join-error", message: "Room ID and nickname are required." }));
            return;
          }

          const hPassword = hashPassword(password || "");
          let room = rooms.get(roomId);

          if (mode === "create") {
            if (room) {
              ws.send(JSON.stringify({ type: "join-error", message: "Node already exists. Use Join to enter." }));
              return;
            }
            // Create a new room with the password
            room = {
              id: roomId,
              passwordHash: hPassword,
              peers: new Map(),
            };
            rooms.set(roomId, room);
          } else if (mode === "join") {
            if (!room) {
              ws.send(JSON.stringify({ type: "join-error", message: "Node does not exist. Use Create to initialize." }));
              return;
            }
            // Verify password for existing room
            if (room.passwordHash !== hPassword) {
              ws.send(JSON.stringify({ type: "join-error", message: "Incorrect password for this node." }));
              return;
            }
          } else {
            // Fallback
            if (!room) {
              room = {
                id: roomId,
                passwordHash: hPassword,
                peers: new Map(),
              };
              rooms.set(roomId, room);
            } else {
              if (room.passwordHash !== hPassword) {
                ws.send(JSON.stringify({ type: "join-error", message: "Incorrect password for this room." }));
                return;
              }
            }
          }

          // Assign client identifier
          const peerId = crypto.randomUUID();
          clientRoomId = roomId;
          clientPeerId = peerId;

          // Build a peer entry
          const newPeer: Peer = {
            id: peerId,
            ws,
            nickname,
            avatar,
            colorTheme,
          };

          // Gather existing peers list
          const peersList = Array.from(room.peers.values()).map(p => ({
            id: p.id,
            nickname: p.nickname,
            avatar: p.avatar,
            colorTheme: p.colorTheme,
          }));

          room.peers.set(peerId, newPeer);

          // Tell the entering peer their ID and who else is there
          ws.send(JSON.stringify({
            type: "joined-success",
            peerId,
            peers: peersList,
          }));

          // Notify existing peers
          room.peers.forEach((p, id) => {
            if (id !== peerId) {
              p.ws.send(JSON.stringify({
                type: "peer-joined",
                peerId,
                nickname,
                avatar,
                colorTheme,
              }));
            }
          });

          console.log(`Peer ${nickname} (${peerId}) joined room ${roomId}`);
        }

        else if (data.type === "signal") {
          const { targetPeerId, signalData } = data;
          if (!clientRoomId || !clientPeerId) return;

          const room = rooms.get(clientRoomId);
          if (!room) return;

          const targetPeer = room.peers.get(targetPeerId);
          if (targetPeer && targetPeer.ws.readyState === WebSocket.OPEN) {
            targetPeer.ws.send(JSON.stringify({
              type: "signal",
              senderPeerId: clientPeerId,
              signalData,
            }));
          }
        }

        else if (data.type === "chat-msg") {
          const { encryptedPayload, msgId } = data;
          if (!clientRoomId || !clientPeerId || !encryptedPayload) return;

          const room = rooms.get(clientRoomId);
          if (!room) return;

          const sender = room.peers.get(clientPeerId);
          if (!sender) return;

          // Relay chat message with encryption details to all peers in the room
          room.peers.forEach((p) => {
            if (p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({
                type: "chat-msg",
                senderPeerId: clientPeerId,
                nickname: sender.nickname,
                avatar: sender.avatar,
                colorTheme: sender.colorTheme,
                encryptedPayload,
                timestamp: Date.now(),
                msgId,
              }));
            }
          });
        }

        else if (data.type === "delete-msg") {
          const { msgId } = data;
          if (!clientRoomId || !msgId) return;

          const room = rooms.get(clientRoomId);
          if (!room) return;

          // Relay deletion signal to all peers in the room
          room.peers.forEach((p) => {
            if (p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({
                type: "delete-msg",
                msgId,
              }));
            }
          });
        }

        else if (data.type === "reaction-msg") {
          const { msgId, emoji, peerId, nickname, action } = data;
          if (!clientRoomId || !msgId || !emoji || !peerId || !nickname || !action) return;

          const room = rooms.get(clientRoomId);
          if (!room) return;

          // Relay reaction signal to all peers in the room
          room.peers.forEach((p) => {
            if (p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({
                type: "reaction-msg",
                msgId,
                emoji,
                peerId,
                nickname,
                action,
              }));
            }
          });
        }
        
        else if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch (err) {
        console.error("Failed to process socket message:", err);
      }
    });

    ws.on("close", () => {
      if (clientRoomId && clientPeerId) {
        const room = rooms.get(clientRoomId);
        if (room) {
          room.peers.delete(clientPeerId);
          console.log(`Peer ${clientPeerId} left room ${clientRoomId}`);

          // Notify other peers
          room.peers.forEach((p) => {
            if (p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({
                type: "peer-left",
                peerId: clientPeerId,
              }));
            }
          });

          // Delete the room if empty
          if (room.peers.size === 0) {
            rooms.delete(clientRoomId);
            console.log(`Room ${clientRoomId} is empty. Cleaned up room.`);
          }
        }
      }
    });
  });

  // Serve static assets or mount Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Error starting server:", err);
});
