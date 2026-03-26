local nk = require("nakama")

-- This Lua bridge handles the matchmaking match creation
-- It calls the "tic_tac_toe" module (registered in JS)
local function matchmaker_matched(context, matches)
    print("Matchmaker matched (Lua)! Starting tic_tac_toe match.")
    local match_id = nk.match_create("tic_tac_toe", {})
    print("Match created (Lua): " .. match_id)
    return match_id
end

nk.register_matchmaker_matched(matchmaker_matched)
