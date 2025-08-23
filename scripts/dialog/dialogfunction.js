import { world } from "@minecraft/server";
import { dialogData, charaterColorMap } from "./dialogdata.js";


/**
 * 주어진 대화 배열을 처리하고 플레이어에게 출력합니다.
 * @param {object} player - 대사를 출력할 플레이어 객체
 * @param {Array<string>} dialogueArray - 대사 데이터 배열 (예: ["화자", "대사 내용"] 또는 ["대사 내용"])
 */
function displayDialogue(player, dialogueArray) {
    // 대사 배열의 길이를 확인하여 화자와 대사 내용을 분리합니다.
    const hasSpeaker = dialogueArray.length >= 2;
    const speakerText = hasSpeaker ? dialogueArray[0] : "";
    const dialogueText = hasSpeaker ? dialogueArray[1] : dialogueArray[0];

    // 화자 색상 적용 (배열 자체는 변경하지 않고 임시 변수 사용)
    const speaker = charaterColorMap[speakerText]
        ? charaterColorMap[speakerText] + speakerText + "§f"
        : speakerText;

    // 대사 출력
    let tellrawCommand;
    if (speakerText === "") {
        // 화자가 없는 경우 " : " 없이 대사만 출력
        tellrawCommand = `tellraw @a {"rawtext":[{"text":"${dialogueText}"}]}`;
    } else {
        // 화자가 있는 경우 " : "와 함께 출력
        tellrawCommand = `tellraw @a {"rawtext":[{"text":"${speaker} : ${dialogueText}"}]}`;
    }

    player.runCommandAsync(tellrawCommand);
}
/**
 * dialogFunction은 플레이어가 특정 태그를 가지고 있을 때, 해당 태그에 맞는 대화 데이터를 불러와 처리하는 함수입니다.
 * 발판은 밟은 경우 dialogData에 정의된 대화 내용을 플레이어에게 보여줍니다.
 * `tag dialog_<scene_name>_<number>` 형식으로 플레이어에게 부여되어야 합니다.
 * number가 0일 경우 해당 씬의 모든 대사가 출력됩니다.
 */
export function dialogFunction() {
    for (const player of world.getAllPlayers()) {
        for (const tag of player.getTags()) {
            if (!tag.startsWith("dialog_")) continue;

            const match = tag.match(/^dialog_(.+)_(\d+)$/);
            if (!match) continue;

            const scenename = match[1];     // 씬 이름
            const number = parseInt(match[2]);  // 대사 번호

            if (!(scenename in dialogData)) {
                console.warn(`대화 데이터 "${scenename}"이(가) 정의되어 있지 않습니다.`);
                player.removeTag(tag);
                continue;
            }

            // 만약 number가 0이면 모든 대사 출력
            if (number === 0) {
                const scene = dialogData[scenename];
                for (const dialogue of scene) {
                    displayDialogue(player, dialogue);
                }
            } else {
                const systemNumber = number - 1; // 배열 인덱스용 0부터 시작

                // 대사 번호 범위 체크
                if (systemNumber < 0 || systemNumber >= dialogData[scenename].length) {
                    console.warn(`대화 번호 "${number}"이(가) 범위를 벗어났습니다. "${scenename}" 씬의 대화는 ${dialogData[scenename].length}개입니다.`);
                    player.removeTag(tag);
                    continue;
                }

                const currentDialogue = dialogData[scenename][systemNumber];
                displayDialogue(player, currentDialogue);
            }
            player.removeTag(tag);
        }
    }
}