import React from "react";

/**
 * Scoreboard Component
 * Displays sorted player listing in real-time. Highlights the local player,
 * marks correct guesses, and decorates the leading player with a gold crown.
 *
 * @param {Object} props
 * @param {Array} props.players - Array of player objects [{ name, score, hasGuessed }]
 * @param {String} props.currentUser - The username of the local client
 * @param {String} props.currentDrawer - The username of the active drawer
 */
export default function Scoreboard({ players = [], currentUser = "", currentDrawer = "" }) {
  // Sort players descending by their score
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col h-full bg-blue-950 select-none">
      
      {/* Scoreboard Header */}
      <div className="px-4 py-4 border-b border-blue-800 flex-shrink-0 bg-blue-950">
        <h2 className="text-center text-white text-xs font-black tracking-widest uppercase" style={{ letterSpacing: "0.15em" }}>
          🏆 SCOREBOARD
        </h2>
      </div>

      {/* Players List Grid */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
        {sorted.map((player, idx) => {
          const isCurrentUser = player.name === currentUser;
          const isDrawing = player.name === currentDrawer;
          const hasCorrectGuess = player.hasGuessed;
          const isLeading = idx === 0 && player.score > 0;

          return (
            <div
              key={player.name}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isCurrentUser
                  ? "bg-blue-600 border-blue-500 shadow-md scale-[1.01]"
                  : "bg-blue-900/60 border-blue-900/80 hover:bg-blue-900/90"
              }`}
            >
              {/* Profile/Name panel */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-blue-400 font-bold w-4">
                  {isLeading ? "👑" : `${idx + 1}.`}
                </span>
                
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-xs font-bold truncate ${
                      isCurrentUser ? "text-yellow-200" : "text-white"
                    }`}
                  >
                    {player.name}
                    {isCurrentUser && " (You)"}
                  </span>
                  
                  {/* Status Pills */}
                  {isDrawing && (
                    <span className="text-[9px] text-yellow-300 font-bold uppercase tracking-wider mt-0.5 animate-pulse">
                      🎨 Painting
                    </span>
                  )}
                  {!isDrawing && hasCorrectGuess && (
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
                      ✓ Guessed
                    </span>
                  )}
                </div>
              </div>

              {/* Player Score display */}
              <div className={`text-xs font-extrabold flex-shrink-0 ${
                isCurrentUser ? "text-white" : "text-blue-300"
              }`}>
                {player.score} pts
              </div>
            </div>
          );
        })}

        {/* Empty lobby indicator */}
        {players.length === 0 && (
          <div className="text-center text-xs text-blue-400 py-10">
            No players in room
          </div>
        )}
      </div>

      {/* Scoreboard Footer round status */}
      <div className="px-4 py-3.5 border-t border-blue-800 bg-blue-950 flex-shrink-0 text-center">
        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
          Multiplayer Active
        </p>
      </div>

    </div>
  );
}
