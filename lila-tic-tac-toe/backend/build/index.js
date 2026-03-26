"use strict";

var WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],

  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],

  [0, 4, 8],
  [2, 4, 6],
];
function checkWinner(board) {
  for (const [a, b, c] of WINNING_COMBOS) {
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every((cell) => cell !== null)) return 2;
  return null;
}
var matchInit = function (ctx, logger, nk, params) {
  logger.info("Match Init called with params: %v", params);
  const state = {
    presences: [],
    emptyTicks: 0,
    board: [null, null, null, null, null, null, null, null, null],

    marks: {},
    nextTurn: 0,

    winner: null,
    playing: false,
  };
  return { state, tickRate: 10, label: "tic-tac-toe" };
};
var matchJoinAttempt = function (ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
  if (state.presences.length >= 2) {
    return { state, accept: false, rejectReason: "Match is full" };
  }
  return { state, accept: true };
};
var matchJoin = function (ctx, logger, nk, dispatcher, tick, state, presences) {
  const gameState = state;
  logger.info("Match Join called. Presences joining: %v", presences.length);
  for (const presence of presences) {
    logger.info("Player joining: %s", presence.sessionId);
    gameState.presences.push(presence);
    if (gameState.presences.length === 1) {
      gameState.marks[presence.sessionId] = 0;
    } else if (gameState.presences.length === 2) {
      gameState.marks[presence.sessionId] = 1;
      gameState.playing = true;
    }
  }
  logger.info("Broadcasting initial state (OpCode 1) to all players.");
  dispatcher.broadcastMessage(
    1,
    JSON.stringify({
      board: gameState.board,
      nextTurn: gameState.nextTurn,
      winner: gameState.winner,
      marks: gameState.marks,
    }),
    gameState.presences,
  );
  return { state: gameState };
};
var matchLeave = function (ctx, logger, nk, dispatcher, tick, state, presences) {
  const gameState = state;
  gameState.presences = gameState.presences.filter(
    (p) => !presences.some((lp) => lp.sessionId === p.sessionId),
  );
  if (gameState.playing && gameState.presences.length < 2) {
    gameState.winner = 3;
    gameState.playing = false;
    dispatcher.broadcastMessage(
      1,
      JSON.stringify({
        board: gameState.board,
        nextTurn: gameState.nextTurn,
        winner: gameState.winner,
        marks: gameState.marks,
      }),
    );
  }
  return { state: gameState };
};
var matchLoop = function (ctx, logger, nk, dispatcher, tick, state, messages) {
  const gameState = state;
  if (gameState.presences.length === 0) {
    gameState.emptyTicks++;
    if (gameState.emptyTicks > 100) return null;
  } else {
    gameState.emptyTicks = 0;
  }
  if (!gameState.playing) return { state: gameState };
  let stateChanged = false;
  for (const message of messages) {
    if (message.opCode === 2) {
      const mark = gameState.marks[message.sender.sessionId];
      if (mark === gameState.nextTurn && gameState.winner === null) {
        const data = JSON.parse(nk.binaryToString(message.data));
        const position = data.position;
        if (gameState.board[position] === null) {
          gameState.board[position] = mark;
          stateChanged = true;
          gameState.winner = checkWinner(gameState.board);
          if (gameState.winner === null) {
            gameState.nextTurn = gameState.nextTurn === 0 ? 1 : 0;
          } else {
            gameState.playing = false;
          }
        }
      }
    }
  }
  if (stateChanged) {
    dispatcher.broadcastMessage(
      1,
      JSON.stringify({
        board: gameState.board,
        nextTurn: gameState.nextTurn,
        winner: gameState.winner,
        marks: gameState.marks,
      }),
    );
  }
  return { state: gameState };
};
var matchTerminate = function (ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
  return { state };
};
var matchSignal = function (ctx, logger, nk, dispatcher, tick, state, data) {
  return { state, data };
};

var InitModule = function (ctx, logger, nk, initializer) {
  initializer.registerMatch("tic_tac_toe", {
    matchInit,
    matchJoinAttempt,
    matchJoin,
    matchLeave,
    matchLoop,
    matchTerminate,
    matchSignal,
  });
  logger.info("Tic-Tac-Toe Module Loaded Successfully!");
};
!InitModule && InitModule.bind(null);
