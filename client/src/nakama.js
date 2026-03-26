import { Client } from "@heroiclabs/nakama-js";

const client = new Client("defaultkey", "127.0.0.1", "7350");
let session = null;
let socket = null;

export const connectToNakama = async (nickname) => {
  const deviceId = localStorage.getItem("deviceId") || crypto.randomUUID();
  localStorage.setItem("deviceId", deviceId);

  try {
    session = await client.authenticateDevice(deviceId, true, nickname);
    console.log("Authenticated successfully. User ID:", session.user_id);

    socket = client.createSocket();
    await socket.connect(session, true);
    console.log("Socket connected successfully!");
    return { session, socket };
  } catch (error) {
    console.error("Error connecting to Nakama:", error);
    throw error;
  }
};

export const getSocket = () => socket;
export const getSession = () => session;

/**
 * High-level function to find a match specifically for Tic-Tac-Toe
 * @param {Function} onMatchJoined Callback when a match is successfully found and joined
 */
export const findMatch = async (onMatchJoined) => {
  if (!socket) throw new Error("Socket not connected");

  socket.onmatchmakermatched = async (matched) => {
    console.log("Matchmaker found a match handler entry!", matched);

    try {
      console.log("Full MatchmakerMatched object:", matched);
      console.log("Matched keys:", Object.keys(matched));

      const joinToken = matched.token || null;

      const joinMatchId = matched.matchId || matched.match_id || null;

      console.log("Attempting to join with Token:", joinToken, "or MatchId:", joinMatchId);
      const match = await socket.joinMatch(joinMatchId, joinToken);
      console.log("Joined authoritative match successfully:", match.matchId || match.match_id);

      onMatchJoined(match);
    } catch (error) {
      console.error("Error joining match:", error);
    }
  };

  const query = "+properties.module:tic_tac_toe";
  const minPlayers = 2;
  const maxPlayers = 2;
  const stringProps = { module: "tic_tac_toe" };

  console.log("Calling addMatchmaker with:", { query, minPlayers, maxPlayers, stringProps });
  const ticket = await socket.addMatchmaker(query, minPlayers, maxPlayers, stringProps);
  console.log("Matchmaking Ticket received:", ticket);
};
