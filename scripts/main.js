import { world, system } from "@minecraft/server";
import { musicSystemTick } from "./modules/music/index.js";
import { dialogFunction } from "./modules/dialog/index.js";
import { managePlayerTags } from "./modules/player_tags/player_tag_manager.js";
import { giveIllegalItem } from "./utils/index.js";

// === Fractal spatial module ===
// import { fractalFunction } from "./features/fractals/index.js";
// fractalFunction();
// ==============================

let tickCounter = 0;

system.runInterval(() => {
    tickCounter = tickCounter >= 200 ? 0 : tickCounter + 1;

    managePlayerTags();
    dialogFunction();

    if (tickCounter % 2 === 0) {
        musicSystemTick();
    }

}, 1);

//-----------------\/ 테스트 코드 \-----------------/
