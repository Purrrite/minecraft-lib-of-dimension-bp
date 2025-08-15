import { world } from "@minecraft/server";
import { dialogData, charaterColorMap } from "./dialogdata.js";

/**
* dialogFunction은 플레이어가 특정 태그를 가지고 있을 때, 해당 태그에 맞는 대화 데이터를 불러와 처리하는 함수입니다.
* 발판은 밟은 경우 dialogData에 정의된 대화 내용을 플레이어에게 보여줍니다.
* `tag dialog_<scene_name>_<number>` 형식으로 플레이어에게 부여되어야 합니다.
*/
export function dialogFunction() {
    for (const player of world.getAllPlayers()) {
        if (player.hasTag(`dialog_${scenename}_${number}`)) {

            if (!(scenename in dialogData)) {
                console.warn(`대화 데이터 "${scenename}"이(가) 정의되어 있지 않습니다.`);
                break;
            }
        }
        const match = tag.match(/^dialog_(.+)_(\d+)$/);
        const scenename = match[1];  // 씬 이름
        const number = parseInt(match[2]); // 대사 번호
        // [dialog, <scene_name>, <number>] 리스트 형식으로 태그가 부여되어야 합니다
        const systemNumber = number - 1; // 대화 데이터는 0부터 시작하므로, 시스템에서는 1을 빼줍니다.
        const currnetScene = dialogData[scenename][systemNumber];

        if (charaterColorMap[currnetScene[0]]) {
            currnetScene[0] = charaterColorMap[currnetScene[0]] + currnetScene[0] + "§f";
        }
        player.runcommandAsync(`tellraw @s {"rawtext":[{"text":"${currnetScene[0]}: ${currnetScene[1]}"}]}`);
        player.removeTag(`dialog_${scenename}_${number}`); // 대화가 끝나면 태그 제거

    }
}

