"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchSignal =
  exports.matchTerminate =
  exports.matchLoop =
  exports.matchLeave =
  exports.matchJoin =
  exports.matchJoinAttempt =
  exports.matchInit =
    void 0;

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
  for (var _i = 0, WINNING_COMBOS_1 = WINNING_COMBOS; _i < WINNING_COMBOS_1.length; _i++) {
    var _a = WINNING_COMBOS_1[_i],
      a = _a[0],
      b = _a[1],
      c = _a[2];
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (
    board.every(function (cell) {
      return cell !== null;
    })
  )
    return 2;
  return null;
}
var matchInit = function (ctx, logger, nk, params) {
  logger.info("Match Init called with params: %v", params);
  var state = {
    presences: [],
    emptyTicks: 0,
    board: [null, null, null, null, null, null, null, null, null],
    marks: {},
    nextTurn: 0,
    winner: null,
    playing: false,
  };
  return { state: state, tickRate: 10, label: "tic-tac-toe" };
};
exports.matchInit = matchInit;
var matchJoinAttempt = function (ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
  if (state.presences.length >= 2) {
    return { state: state, accept: false, rejectReason: "Match is full" };
  }
  return { state: state, accept: true };
};
exports.matchJoinAttempt = matchJoinAttempt;
var matchJoin = function (ctx, logger, nk, dispatcher, tick, state, presences) {
  var gameState = state;
  logger.info("Match Join called. Presences joining: %v", presences.length);
  for (var _i = 0, presences_1 = presences; _i < presences_1.length; _i++) {
    var presence = presences_1[_i];
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
exports.matchJoin = matchJoin;
var matchLeave = function (ctx, logger, nk, dispatcher, tick, state, presences) {
  var gameState = state;
  gameState.presences = gameState.presences.filter(function (p) {
    return !presences.some(function (lp) {
      return lp.sessionId === p.sessionId;
    });
  });

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
exports.matchLeave = matchLeave;
var matchLoop = function (ctx, logger, nk, dispatcher, tick, state, messages) {
  var gameState = state;

  if (gameState.presences.length === 0) {
    gameState.emptyTicks++;
    if (gameState.emptyTicks > 100) return null;
  } else {
    gameState.emptyTicks = 0;
  }
  if (!gameState.playing) return { state: gameState };
  var stateChanged = false;

  for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
    var message = messages_1[_i];

    if (message.opCode === 2) {
      var mark = gameState.marks[message.sender.sessionId];

      if (mark === gameState.nextTurn && gameState.winner === null) {
        var data = JSON.parse(nk.binaryToString(message.data));
        var position = data.position;

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
exports.matchLoop = matchLoop;
var matchTerminate = function (ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
  return { state: state };
};
exports.matchTerminate = matchTerminate;
var matchSignal = function (ctx, logger, nk, dispatcher, tick, state, data) {
  return { state: state, data: data };
};
exports.matchSignal = matchSignal;
