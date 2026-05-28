import { useState, useEffect } from "react";
import socket from "../socket";
import Scoreboard from "./ScoreBoard";
import Whiteboard from "./WhiteBoard";
import Chat from "./Chat";
import Timer from "./TImer";

export default function MainPage({ playerData }) {
  if (!playerData) {
    return <div className="text-white text-center p-10">Loading...</div>;
  }

  const currentUser = playerData.name;

  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentDrawer, setCurrentDrawer] = useState("");
  const [isDrawer, setIsDrawer] = useState(false);
  const [word, setWord] = useState("");
  const [timer, setTimer] = useState(60);
  const [gameStatus, setGameStatus] = useState("LOBBY");

  useEffect(() => {
    socket.connect();

    socket.emit("join-room", {
      name: playerData.name,
      room: playerData.room,
    });

    socket.on("room-state", (data) => {
      setPlayers(data.players);
      setCurrentDrawer(data.currentDrawer);
      setIsDrawer(data.isDrawer);
      setWord(data.word);
      setTimer(data.timer);
      setGameStatus(data.gameStatus);
    });

    socket.on("players", (data) => {
      setPlayers(data);
    });

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("room-state");
      socket.off("players");
      socket.off("receive-message");
      socket.disconnect();
    };
  }, [playerData]);

  const handleSendMessage = (text) => {
    if (!text.trim()) return;

    socket.emit("send-message", {
      room: playerData.room,
      message: text,
    });
  };

  return (
    <div className="flex h-screen bg-blue-900">
      {/* Left */}
      <div className="w-60 bg-slate-800 border-r border-slate-700">
        <Scoreboard
          players={players}
          currentUser={currentUser}
          currentDrawer={currentDrawer}
        />
      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-5">
          <div>
            <p className="text-slate-400 text-xs">Room: {playerData.room}</p>

            <p className="text-white text-sm font-medium">
              {gameStatus === "LOBBY" && "Waiting for players..."}

              {gameStatus === "DRAWING" &&
                (isDrawer ? "You are drawing" : `${currentDrawer} is drawing`)}

              {gameStatus === "ROUND_END" && "Round finished"}
            </p>
          </div>

          {gameStatus === "DRAWING" && <Timer seconds={timer} />}
        </div>

        {/* Board */}
        <div className="flex-1">
          <Whiteboard
            isDrawer={isDrawer && gameStatus === "DRAWING"}
            word={word}
            room={playerData.room}
          />
        </div>
      </div>

      {/* Right */}
      <div className="w-80 bg-slate-800 border-l border-slate-700">
        <Chat
          messages={messages}
          onSend={handleSendMessage}
          currentUser={currentUser}
          isDrawer={isDrawer && gameStatus === "DRAWING"}
        />
      </div>
    </div>
  );
}
