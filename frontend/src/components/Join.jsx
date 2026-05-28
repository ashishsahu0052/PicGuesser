import React, { useState } from "react";

/**
 * Join Component
 * Renders the beautifully styled landing page where players can enter their name
 * and a room code to join or create a multiplayer drawing game.
 *
 * @param {Object} props
 * @param {Function} props.setScreen - Function to switch between 'join' and 'main' screen views
 * @param {Function} props.setPlayerData - Function to save player name and room details
 */
export default function Join({ setScreen, setPlayerData }) {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");

  // Process room joining
  const handleJoin = () => {
    if (!name.trim() || !room.trim()) {
      return alert("Please enter both your name and a room code!");
    }

    // Store credentials globally in parent App state
    setPlayerData({
      name: name.trim(),
      room: room.trim().toUpperCase(),
    });

    // Transition to the active game page
    setScreen("main");
  };

  return (
    <div className="min-h-screen flex flex-col bg-blue-900 select-none">
      {/* Header section with stylized PICGUESS logo */}
      <header className="flex items-center justify-center gap-3 py-8">
        <div className="bg-blue-700 p-2 rounded-lg shadow-md">
          {/* Retro-style game camera svg icon */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect
              x="2"
              y="6"
              width="20"
              height="14"
              rx="2"
              stroke="white"
              strokeWidth="1.8"
              fill="none"
            />
            <circle cx="12" cy="13" r="3.5" stroke="white" strokeWidth="1.8" />
            <path
              d="M8.5 6L10 3.5h4L15.5 6"
              stroke="white"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="18" cy="10" r="1" fill="white" />
          </svg>
        </div>
        <div>
          <h1
            className="text-white text-3xl font-extrabold tracking-widest leading-none"
            style={{ fontFamily: "'Fredoka One', cursive, sans-serif" }}
          >
            PICGUESS
          </h1>
          <p className="text-blue-300 text-xs tracking-widest mt-0.5 uppercase">
            Guess the Drawing
          </p>
        </div>
      </header>

      {/* Main card panel for credentials entry */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="bg-blue-700 rounded-xl p-8 w-full max-w-sm border border-blue-700 shadow-xl">
          <h2 className="text-white text-lg font-semibold text-center mb-1">
            Join a Room
          </h2>
          <p className="text-blue-300 text-sm text-center mb-6">
            Enter your details to start playing
          </p>

          {/* Name entry field */}
          <div className="mb-4">
            <label className="block text-blue-300 text-xs font-medium mb-1.5 uppercase tracking-wider">
              Your Name
            </label>
            <input
              type="text"
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="w-full bg-blue-900 border border-blue-600 text-white placeholder-blue-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Room code field */}
          <div className="mb-6">
            <label className="block text-blue-300 text-xs font-medium mb-1.5 uppercase tracking-wider">
              Room Code
            </label>
            <input
              type="text"
              placeholder="e.g. ROOM42"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="w-full bg-blue-900 border border-blue-600 text-white placeholder-blue-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Join action button */}
          <button
            onClick={handleJoin}
            className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-lg text-sm tracking-wider uppercase transition-all shadow-md active:scale-[0.98]"
          >
            Play Game
          </button>

          {/* Feature highlights grid */}
          <div className="flex justify-center gap-6 mt-6 pt-5 border-t border-blue-700 text-center">
            <div>
              <div className="text-white text-base">🎮</div>
              <div className="text-blue-400 text-xs mt-0.5 font-medium">
                Multiplayer
              </div>
            </div>
            <div>
              <div className="text-white text-base">🖌️</div>
              <div className="text-blue-400 text-xs mt-0.5 font-medium">
                Drawing
              </div>
            </div>
            <div>
              <div className="text-white text-base">⚡</div>
              <div className="text-blue-400 text-xs mt-0.5 font-medium">
                Real-time
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Styled clean footer section */}
      <footer className="py-5 px-4 text-center border-t border-blue-800 flex flex-col items-center">
        <p className="text-blue-300 text-xs font-semibold">
          © Ashish Sahu{" "}
          <a
            className="text-bold"
            href="https://www.linkedin.com/in/ashish-sahu-20a83033a/"
          >
            LinkedIn{"       "}
          </a>
          {"    "}
          <a href="https://github.com/ashishsahu0052">Github </a>
          <a href="ashisasahu0052@gmail.com">Email </a>
        </p>
      </footer>
    </div>
  );
}
