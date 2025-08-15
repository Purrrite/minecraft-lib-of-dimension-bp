import { world } from "@minecraft/server";
import { dialogDataIntro } from "./chapter1_prolog/dialog_intro.js";

export function dialogFunction() {
    for (const player of world.getAllPlayers()) {
        if (player.hasTag("dialog")) { //이 태그는 플레이어가 dialog 태그를 부여받는 발판을 밟은 경우 참이 됩니다. = 다이얼로그 출력하기

        }
    }





}