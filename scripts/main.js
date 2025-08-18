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

    if (tickCounter % 2 === 0) {
        // debugLog(); // 20 틱마다 디버그 메시지 출력
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
            if (player.hasTag("stopsound")) {
                dimension.runCommandAsync(`stopsound "${player.name}"`);
                musicCoolDown.delete(player.id);
            }

            const tagsWithoutClearedNOW = player.getTags().filter(tag => tag !== "__cleared"); //한번 더 가져오기
            for (const tag of tagsWithoutClearedNOW) {
                player.removeTag(tag);
            }

            player.addTag("__cleared");
            console.log(`${player.name}의 태그 제거됨 (removetag 또는 stopsound 태그 존재함)`);
            continue; // 태그 제거 후 다음 플레이어로 넘어갑니다.
        }

        if (playerTag.length === 0) player.addTag("__cleared");

        if (hasCleared && tagsWithoutCleared.length > 0) {
            player.removeTag("__cleared");
        }



        /**
        *   플레이어가 아머스탠드보다 3~3.1블록 위에 있을 때
        */
        for (const stand of armorStands) {
            const standLoc = stand.location;
            const nameTag = stand.nameTag?.trim();

            if (standLoc.y + 3.1 >= playerLoc.y && playerLoc.y >= standLoc.y + 3 &&
                standLoc.x + 0.5 >= playerLoc.x && playerLoc.x >= standLoc.x - 0.5 &&
                standLoc.z + 0.5 >= playerLoc.z && playerLoc.z >= standLoc.z - 0.5
            ) {
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
                    player.addTag(nameTag);
                    player.removeTag("__cleared"); // __cleared 태그 제거
                    musicCoolDown.delete(player.id); // 음악 쿨다운 초기화
                    console.log(`태그 '${nameTag}'를 ${player.name}에게 부여함`);
                }
            }
        }
    }
}

function debugLog() {
    // 디버그 메시지를 콘솔에 출력
    const players = world.getAllPlayers();
    for (const player of players) {
        const tags = player.getTags();

        player.runCommandAsync(`title @s actionbar ${player.name}의 태그: ${tags}, cooldown: ${cooldownValue}`);
    }
}