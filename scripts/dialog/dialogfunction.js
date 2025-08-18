import { world } from "@minecraft/server";
import { dialogData, charaterColorMap } from "./dialogdata.js";

/**
 * dialogFunction은 플레이어가 특정 태그를 가지고 있을 때, 해당 태그에 맞는 대화 데이터를 불러와 처리하는 함수입니다.
 * 발판은 밟은 경우 dialogData에 정의된 대화 내용을 플레이어에게 보여줍니다.
 * `tag dialog_<scene_name>_<number>` 형식으로 플레이어에게 부여되어야 합니다.
 */
export function dialogFunction() {
    for (const player of world.getAllPlayers()) {
        for (const tag of player.getTags()) {
            if (!tag.startsWith("dialog_")) continue;

            const match = tag.match(/^dialog_(.+)_(\d+)$/);
            if (!match) continue;

            const scenename = match[1];           // 씬 이름
            const number = parseInt(match[2]);    // 대사 번호
            const systemNumber = number - 1;      // 배열 인덱스용 0부터 시작

            // 씬 존재 여부 체크
            if (!(scenename in dialogData)) {
                console.warn(`대화 데이터 "${scenename}"이(가) 정의되어 있지 않습니다.`);
                player.removeTag(tag);
                continue;
            }

            // 대사 번호 범위 체크
            if (systemNumber < 0 || systemNumber >= dialogData[scenename].length) {
                console.warn(`대화 번호 "${number}"이(가) 범위를 벗어났습니다. "${scenename}" 씬의 대화는 ${dialogData[scenename].length}개입니다.`);
                player.removeTag(tag);
                continue;
            }

            const currnetScene = dialogData[scenename][systemNumber];

            // 화자 색상 적용 (배열 자체는 변경하지 않고 임시 변수 사용)
            const speaker = charaterColorMap[currnetScene[0]]
                ? charaterColorMap[currnetScene[0]] + currnetScene[0] + "§f"
                : currnetScene[0];

            // 대사 출력
            player.runCommandAsync(`tellraw @a {"rawtext":[{"text":"${speaker} : ${currnetScene[1]}"}]}`);

            // 태그 제거 (대화가 끝난 후)
            player.removeTag(tag);
        }
    }
}