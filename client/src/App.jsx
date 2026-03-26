import { useState, useEffect } from "react";
import { connectToNakama, findMatch, getSocket } from "./nakama";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [match, setMatch] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [myMark, setMyMark] = useState(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isConnected) return;

    socket.onmatchdata = (result) => {
      console.log("Received match data:", result);

      if (result.opCode === 1 || result.op_code === 1) {
        try {
          const jsonString = new TextDecoder().decode(result.data);
          console.log("Decoded OpCode 1 JSON:", jsonString);
          const newState = JSON.parse(jsonString);

          setGameState(newState);
        } catch (err) {
          console.error("Error decoding OpCode 1 data:", err);
        }
      }
    };
  }, [isConnected]);

  useEffect(() => {
    if (match && gameState?.marks) {
      const mySessionId = match.self.sessionId || match.self.session_id;
      setMyMark(gameState.marks[mySessionId]);
    }
  }, [match, gameState]);

  const handleConnect = async () => {
    if (!nickname) return alert("Please enter a nickname");
    try {
      await connectToNakama(nickname);
      setIsConnected(true);
    } catch (error) {
      alert("Failed to connect to the server.");
    }
  };

  const handleStartMatchmaking = async () => {
    setIsSearching(true);
    try {
      await findMatch((joinedMatch) => {
        setIsSearching(false);
        setMatch(joinedMatch);
      });
    } catch (error) {
      console.error("Matchmaking error:", error);
      setIsSearching(false);
    }
  };

  const handleSquareClick = (index) => {
    if (gameState.winner !== null) return;
    if (gameState.nextTurn !== myMark) return;
    if (gameState.board[index] !== null) return;

    const socket = getSocket();

    const data = JSON.stringify({ position: index });
    const matchId = match.matchId || match.match_id;
    socket.sendMatchState(matchId, 2, data);
  };

  const getMarkSymbol = (mark) => (mark === 0 ? "X" : mark === 1 ? "O" : "");

  const getStatusMessage = () => {
    if (!gameState) return "Waiting for game state...";
    if (gameState.winner === 0) return "Player X Wins!";
    if (gameState.winner === 1) return "Player O Wins!";
    if (gameState.winner === 2) return "It's a Draw!";
    if (gameState.winner === 3) return "Opponent Forfeited! You Win!";
    return gameState.nextTurn === myMark ? "Your Turn!" : "Opponent's Turn...";
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        maxWidth: "400px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <h1>LILA Tic-Tac-Toe</h1>

      {!isConnected ? (
        <div>
          <input
            type="text"
            placeholder="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={{ padding: "8px", marginBottom: "10px", width: "100%" }}
          />
          <button
            onClick={handleConnect}
            style={{ padding: "10px 20px", width: "100%", cursor: "pointer" }}
          >
            Continue
          </button>
        </div>
      ) : !match ? (
        <div>
          <h2 style={{ color: "#4CAF50" }}>Connected as {nickname}!</h2>
          {isSearching ? (
            <p style={{ fontStyle: "italic" }}>Finding a random player...</p>
          ) : (
            <button
              onClick={handleStartMatchmaking}
              style={{ padding: "10px 20px", cursor: "pointer" }}
            >
              Find Match
            </button>
          )}
        </div>
      ) : (
        <div>
          <h2>Game Room</h2>
          <p>
            You are Player:{" "}
            <strong>{myMark === 0 ? "X" : myMark === 1 ? "O" : "Loading..."}</strong>
          </p>
          <h3 style={{ color: gameState?.nextTurn === myMark ? "#4CAF50" : "#f44336" }}>
            {getStatusMessage()}
          </h3>

          {/* The Tic-Tac-Toe Board */}
          {gameState && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px",
                marginTop: "20px",
                maxWidth: "300px",
                margin: "20px auto",
              }}
            >
              {gameState.board.map((cellMark, index) => (
                <div
                  key={index}
                  onClick={() => handleSquareClick(index)}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    backgroundColor: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                    fontWeight: "bold",
                    cursor:
                      gameState.winner === null &&
                      gameState.nextTurn === myMark &&
                      cellMark === null
                        ? "pointer"
                        : "not-allowed",
                    borderRadius: "8px",
                    color: cellMark === 0 ? "#2196F3" : "#FF9800",
                  }}
                >
                  {getMarkSymbol(cellMark)}
                </div>
              ))}
            </div>
          )}

          {gameState?.winner !== null && (
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "10px 20px", marginTop: "20px" }}
            >
              Leave Match / Play Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
