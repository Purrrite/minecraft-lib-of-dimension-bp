import { world, system } from "@minecraft/server";
import { musicSystemTick, musicCoolDown } from "./gamemusic/index.js";
import { dialogFunction } from "./dialog/dialogfunction.js";

let tickCounter = 0;
//Global tick counter for managing intervals
system.runInterval(() => {
    tickCounter++;

    if (tickCounter % 2 === 0) {
        playerTagManager(); // 2 틱마다 실행
        musicSystemTick()
        dialogFunction()
    }

    if (tickCounter >= 200) {
        tickCounter = 0;
    }

}, 1);
/**
 * playerTagManager는 플레이어의 위치와 태그를 관리하는 함수입니다.
 * 플레이어가 아머스탠드 위에 있을 때, 해당 아머스탠드의 이름표에 따라 플레이어에게 태그를 부여하거나 제거합니다.
 */
function playerTagManager() {
    const dimension = world.getDimension("overworld");
    const armorStands = dimension.getEntities({ type: "minecraft:armor_stand" });

    for (const player of world.getAllPlayers()) {
        const playerLoc = player.location;
        const playerTag = player.getTags()
        const tagsWithoutCleared = player.getTags().filter(tag => tag !== "__cleared");
        const hasCleared = playerTag.includes("__cleared");

        if (player.hasTag("removetag") || player.hasTag("stopsound")) {
            // 플레이어가 "removetag" 또는 "stopsound" 태그를 가지고 있다면, 해당 태그를 가진 플레이어의 모든 태그를 제거합니다.
            const tagsWithoutClearedNOW = player.getTags().filter(tag => tag !== "__cleared"); //한번 더 가져오기
            if (tagsWithoutClearedNOW.includes("stopsound")) {
                dimension.runCommandAsync(`stopsound "${player.name}"`);
                musicCoolDown.delete(player.id);
            }
            for (const tag of tagsWithoutClearedNOW) {
                player.removeTag(tag);
            }

            // ====================================
            // 이 부분은 만들면서 상당히 고생을 했지만 아직도 문제가 해결되지 않았습니다.
            // 아예 코드 구조를 바꿔야 할 것 같습니다.
            // 미묘한 타이밍 문제라고 단정짓기에는 너무나도 불안정한 부분입니다.
            //=====================================

            player.addTag("__cleared");
            console.log(`${player.name}의 태그 제거됨 (removetag 또는 stopsound 태그 존재함)`);
            continue; // 태그 제거 후 다음 플레이어로 넘어갑니다.
        }

        if (playerTag.length === 0) player.addTag("__cleared");
        if (hasCleared && tagsWithoutCleared.length > 0) player.removeTag("__cleared");

        /**
        *   플레이어가 아머스탠드보다 3~3.1블록 위에 있을 때, xz좌표는 0.5 범위
        */
        for (const stand of armorStands) {
            const standLoc = stand.location;
            const nameTag = stand.nameTag?.trim();

            if (standLoc.y + 3.1 >= playerLoc.y && playerLoc.y >= standLoc.y + 3 &&
                standLoc.x + 0.5 >= playerLoc.x && playerLoc.x >= standLoc.x - 0.5 &&
                standLoc.z + 0.5 >= playerLoc.z && playerLoc.z >= standLoc.z - 0.5
            ) { //방향은? 이쪽으로! 이쪽으로! <============
                if (!nameTag) continue;

                // removetag: 모든 태그 제거 (단, __cleared 태그 없을 때만)
                if (!player.hasTag("__cleared") && nameTag === "removetag") {

                    for (const tag of tagsWithoutCleared) {
                        player.removeTag(tag);
                    }
                    player.addTag("__cleared");
                    musicCoolDown.delete(player.id);
                    console.log(`${player.name}의 태그 제거됨`);
                    continue; // 태그 제거 후 다음 플레이어로 넘어갑니다.
                }

                // stopsound: 모든 태그 제거 + 음악 재생 중지 (단, __cleared 태그 없을 때만)
                if (!player.hasTag("__cleared") && nameTag === "stopsound") {
                    for (const tag of tagsWithoutCleared) {
                        player.removeTag(tag);
                    }
                    player.addTag("__cleared");
                    dimension.runCommandAsync(`stopsound "${player.name}"`);
                    musicCoolDown.delete(player.id);
                    console.log(`${player.name}의 사운드 정지 및 태그 제거됨`);
                    continue; // 태그 제거 후 다음 플레이어로 넘어갑니다.
                }


                // 일반 태그 부여
                if (!player.hasTag(nameTag) && nameTag !== "removetag" && nameTag !== "stopsound") {
                    addTagToAllPlayers(nameTag)// __cleared 태그 제거
                    musicCoolDown.delete(player.id); // 음악 쿨다운 초기화
                    console.log(`태그 '${nameTag}'를 ${player.name}에게 부여함`);
                }
            }
        }
    }
}
function addTagToAllPlayers(tag) {
    for (const player of world.getAllPlayers()) {
        player.addTag(tag);
        player.removeTag("__cleared");
    }
}

function removeTagFromAllPlayers(tag) {
    for (const player of world.getAllPlayers()) {
        const playerTag = player.getTags()
        const tagsWithoutCleared = player.getTags().filter(tag => tag !== "__cleared");
        const hasCleared = playerTag.includes("__cleared");
        if (tagsWithoutCleared.includes(tag)) {
            player.removeTag(tag);
            if (tagsWithoutCleared.length === 1 && !hasCleared) {
                player.addTag("__cleared");
            }
            console.log(`태그 '${tag}'를 ${player.name}에게서 제거함`);
        }
    }
}
// ====================================
// 2025.9.4
// 아 함수 리팩토링 머리아파.. 아직 미완성. 디버깅도 해야될거에요.
// 좀 쉬었다 해야지.
// I HATE PlayerTagManager Function !
//=====================================

// ====================================
// 2025.9.4
// 현재 이 코드는 일회성 실행이 너무나도 많아서 함수를 여려개 만들기로 리팩토링을 할 필요가 있습니다.
//=====================================