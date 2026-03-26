"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var match_handler_1 = require("./match_handler");
var InitModule = function (ctx, logger, nk, initializer) {
  initializer.registerMatch("tic_tac_toe", {
    matchInit: match_handler_1.matchInit,
    matchJoinAttempt: match_handler_1.matchJoinAttempt,
    matchJoin: match_handler_1.matchJoin,
    matchLeave: match_handler_1.matchLeave,
    matchLoop: match_handler_1.matchLoop,
    matchTerminate: match_handler_1.matchTerminate,
    matchSignal: match_handler_1.matchSignal,
  });

  logger.info("Tic-Tac-Toe Module Loaded Successfully!");
};

!InitModule && InitModule.bind(null);
