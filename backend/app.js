import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

// Initialize express web framework
const app = express();
app.use(cors());

// Establish HTTP node server bound with Express
const server = http.createServer(app);

// Bind Socket.io onto the HTTP server allowing cross-origin requests
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Active game rooms directory store
const rooms = {};

// Collection of easy, drawing-friendly words
const WORDS = [
  "APPLE", "BANANA", "CAT", "DOG", "CAR", "HOUSE", "TREE", "FLOWER", "CLOUD",
  "SUN", "MOON", "BIRD", "FISH", "BOAT", "PLANE", "BALL", "BOOK", "PEN",
  "CHAIR", "TABLE", "WINDOW", "DOOR", "STAR", "SMILE", "HEART", "CUP",
  "SHIRT", "SHOES", "HAT", "CLOCK", "PHONE", "CAKE", "COOKIE", "PIZZA",
  "PENCIL", "GUITAR", "HAMMER", "SPIDER", "ROCKET", "BRIDGE", "TRAIN"
];

/**
 * Custom Room State Broadcast
 * Sends a tailor-masked payload back to each client.
 * The drawer sees the true word, while guessers receive dashes.
 *
 * @param {String} roomName - Key identifying the target room
 */
function broadcastRoomState(roomName) {
  const room = rooms[roomName];
  if (!room) return;

  const socketsInRoom = io.sockets.adapter.rooms.get(roomName);
  if (!socketsInRoom) return;

  for (const socketId of socketsInRoom) {
    const s = io.sockets.sockets.get(socketId);
    if (!s) continue;

    const isDrawer = room.players[room.drawerIdx]?.id === socketId;
    
    // Mask word for guessers (e.g. "APPLE" becomes "_____")
    const maskedWord = isDrawer 
      ? room.word 
      : room.word.split("").map(() => "_").join("");

    s.emit("room-state", {
      players: room.players,
      currentDrawer: room.players[room.drawerIdx]?.name || "",
      isDrawer: isDrawer,
      word: maskedWord,
      timer: room.timer,
      gameStatus: room.gameStatus,
    });
  }
}

/**
 * Start Game Round
 * Triggers round setups, allocates the drawer, rolls a random word,
 * clears canvases, and establishes a 1-second countdown clock interval.
 *
 * @param {String} roomName - Key identifying the target room
 */
function startRound(roomName) {
  const room = rooms[roomName];
  if (!room || room.players.length < 2) {
    if (room) {
      room.gameStatus = "LOBBY";
      room.word = "";
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }
      broadcastRoomState(roomName);
    }
    return;
  }

  // Advance to the next player to draw
  room.drawerIdx = (room.drawerIdx + 1) % room.players.length;

  // Reset correct-guess indicators for this round
  room.players.forEach((p) => {
    p.hasGuessed = false;
  });

  // Pick a random secret word
  const randomIndex = Math.floor(Math.random() * WORDS.length);
  room.word = WORDS[randomIndex].toUpperCase();

  room.gameStatus = "DRAWING";
  room.timer = 60; // 60-second drawing clock

  const drawer = room.players[room.drawerIdx];
  io.to(roomName).emit("receive-message", {
    type: "system",
    text: `Round starting! ${drawer.name} is drawing.`,
  });

  // Reset whiteboard canvas globally
  io.to(roomName).emit("clear-canvas");

  if (room.timerInterval) {
    clearInterval(room.timerInterval);
  }

  broadcastRoomState(roomName);

  // Core countdown clock ticker
  room.timerInterval = setInterval(() => {
    if (!rooms[roomName]) return;
    rooms[roomName].timer--;

    if (rooms[roomName].timer <= 0) {
      endRound(roomName, "Time's up!");
    } else {
      broadcastRoomState(roomName);
    }
  }, 1000);
}

/**
 * End Game Round
 * Clears tickers, switches states, discloses the true secret word,
 * and schedules a timeout trigger to commence the next round.
 *
 * @param {String} roomName - Identify room profile
 * @param {String} reason - Reason text broadcasted to the room chat
 */
function endRound(roomName, reason) {
  const room = rooms[roomName];
  if (!room) return;

  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }

  room.gameStatus = "ROUND_END";

  io.to(roomName).emit("receive-message", {
    type: "system",
    text: `${reason} The secret word was "${room.word}".`,
  });

  broadcastRoomState(roomName);

  // Wait 5 seconds before starting the next round automatically
  setTimeout(() => {
    if (rooms[roomName]) {
      startRound(roomName);
    }
  }, 5000);
}

// Master socket connect lifecycle handler
io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  // Client joining room
  socket.on("join-room", ({ name, room: roomName }) => {
    if (!name || !roomName) return;

    socket.join(roomName);

    // Instantiate empty room structure if not yet existing
    if (!rooms[roomName]) {
      rooms[roomName] = {
        players: [],
        drawerIdx: -1,
        word: "",
        gameStatus: "LOBBY",
        timer: 60,
        timerInterval: null,
      };
    }

    const room = rooms[roomName];

    // Check if player is reconnecting or create a new player entry
    const existing = room.players.find((p) => p.name === name);
    if (!existing) {
      room.players.push({
        id: socket.id,
        name,
        score: 0,
        hasGuessed: false,
      });
    } else {
      existing.id = socket.id; // Rebind the active socket ID
    }

    console.log(`${name} joined room: ${roomName}`);

    io.to(roomName).emit("receive-message", {
      type: "system",
      text: `${name} joined the room.`,
    });

    // Auto-commence game once 2+ players assemble in lobby
    if (room.gameStatus === "LOBBY" && room.players.length >= 2) {
      startRound(roomName);
    } else {
      broadcastRoomState(roomName);
    }
  });

  // Client sent guess or text comment
  socket.on("send-message", ({ room: roomName, message }) => {
    const room = rooms[roomName];
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    const isDrawer = room.players[room.drawerIdx]?.id === socket.id;

    // Reject message feeds if active drawer attempts to input in drawing state
    if (isDrawer && room.gameStatus === "DRAWING") {
      return;
    }

    const cleanedGuess = message.trim().toUpperCase();

    // Check guess correctness
    if (room.gameStatus === "DRAWING" && cleanedGuess === room.word && !player.hasGuessed) {
      player.hasGuessed = true;

      // Award points proportional to clock speed
      const points = Math.max(10, Math.round((room.timer / 60) * 100));
      player.score += points;

      // Reward drawer with a score bonus for clean artwork
      const drawer = room.players[room.drawerIdx];
      if (drawer) {
        drawer.score += 20;
      }

      // Dispatch private-styled success bubble alerts
      io.to(roomName).emit("receive-message", {
        type: "correct",
        user: player.name,
      });

      // Synchronize player tables
      io.to(roomName).emit("players", room.players);

      // Evaluate round completion triggers
      const guessers = room.players.filter((p, idx) => idx !== room.drawerIdx);
      const allGuessed = guessers.every((g) => g.hasGuessed);

      if (allGuessed && guessers.length > 0) {
        endRound(roomName, "All players guessed the word!");
      } else {
        broadcastRoomState(roomName);
      }
    } else {
      // Broadcast standard user chat message
      io.to(roomName).emit("receive-message", {
        user: player.name,
        text: message,
        type: "chat",
      });
    }
  });

  // Relay real-time canvas paths to other guessers
  socket.on("draw", ({ room: roomName, from, to, color, size }) => {
    socket.to(roomName).emit("draw", { from, to, color, size });
  });

  // Relay manual clears
  socket.on("clear-canvas", (roomName) => {
    socket.to(roomName).emit("clear-canvas");
  });

  // Handle client socket disconnects
  socket.on("disconnect", () => {
    for (const roomName in rooms) {
      const room = rooms[roomName];
      const playerIdx = room.players.findIndex((p) => p.id === socket.id);

      if (playerIdx !== -1) {
        const [removedPlayer] = room.players.splice(playerIdx, 1);
        console.log(`${removedPlayer.name} disconnected from room: ${roomName}`);

        io.to(roomName).emit("receive-message", {
          type: "system",
          text: `${removedPlayer.name} left the room.`,
        });

        // Cleanup empty rooms
        if (room.players.length === 0) {
          if (room.timerInterval) {
            clearInterval(room.timerInterval);
          }
          delete rooms[roomName];
        } else {
          // Handle active drawer disconnects
          if (room.gameStatus === "DRAWING" && room.drawerIdx === playerIdx) {
            room.drawerIdx = room.drawerIdx % room.players.length;
            endRound(roomName, "The drawer disconnected.");
          } else {
            // Keep index pointers valid
            if (room.drawerIdx >= room.players.length) {
              room.drawerIdx = 0;
            }

            // Revert back to lobby countdown if player count drops below 2
            if (room.players.length < 2) {
              room.gameStatus = "LOBBY";
              room.word = "";
              if (room.timerInterval) {
                clearInterval(room.timerInterval);
                room.timerInterval = null;
              }
            }
            broadcastRoomState(roomName);
          }
        }
      }
    }
  });
});

// Run server
server.listen(3000, () => {
  console.log("Server running on port 3000");
});
