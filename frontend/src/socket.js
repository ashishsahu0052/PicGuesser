import { io } from "socket.io-client";

// Connect to the backend on port 3000
const socket = io("http://localhost:3000", {
  autoConnect: false, // Connect manually when the user joins a room to prevent idle connections
});

export default socket;
