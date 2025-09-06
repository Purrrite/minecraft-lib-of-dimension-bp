import { world, system, Player } from "@minecraft/server";
import { musicSystemTick, musicCoolDown, DATA_ABOUT_MUSIC } from "./gamemusic/index.js";
import { dialogFunction } from "./dialog/dialogfunction.js";

let tickCounter = 0;

// 메인 루프
system.runInterval(() => {
    tickCounter++;

    managePlayerTags();
    dialogFunction();

    if (tickCounter % 2 === 0) {
        musicSystemTick();
    }

    if (tickCounter >= 200) tickCounter = 0;
}, 1);

/**
 * 모든 플레이어의 태그를 관리하는 메인 함수
 */
function managePlayerTags() {
    const players = world.getAllPlayers();
    const armorStands = world.getDimension("overworld").getEntities({ type: "minecraft:armor_stand" });

    for (const player of players) {
        processSinglePlayer(player, armorStands);
    }
}

/**
 * 단일 플레이어의 태그 로직을 처리하는 함수
 * @param {Player} player 처리할 플레이어 객체
 * @param {Entity[]} armorStands 감지할 아머 스탠드 배열
 */

function processSinglePlayer(player, armorStands) {
    // 1. 'removetag' 또는 'stopsound' 태그가 있으면 모든 태그를 즉시 제거하고 로직 종료
    if (player.hasTag("removetag") || player.hasTag("stopsound")) {
        const stopSound = player.hasTag("stopsound");
        clearPlayerTags(player, { stopSound });
        return; // 이 플레이어에 대한 추가 처리를 중단
    }

    // 2. '__cleared' 상태 관리
    const tags = player.getTags();
    const hasClearedTag = tags.includes("__cleared");
    const hasOtherTags = tags.some(tag => tag !== "__cleared");

    if (!hasClearedTag && !hasOtherTags) {
        player.addTag("__cleared");
    } else if (hasClearedTag && hasOtherTags) {
        player.removeTag("__cleared");
    }

    // 3. 아머 스탠드 근처에 있는지 확인하고 태그 부여/제거 로직 실행
    for (const stand of armorStands) {
        if (!isPlayerNearStand(player, stand)) continue;

        const nameTag = stand.nameTag?.trim();
        if (!nameTag) continue;

        // 플레이어가 아머스탠드와 상호작용했으므로 루프를 중단하여 중복 처리를 방지
        handleArmorStandInteraction(player, nameTag);
        break;
    }
}

/**
 * 플레이어와 아머 스탠드의 상호작용을 처리
 * @param {Player} player 
 * @param {string} nameTag 
 */
function handleArmorStandInteraction(player, nameTag) {
    // '__cleared' 상태일 때만 태그 제거 로직이 작동하도록 함
    const canBeCleared = !player.hasTag("__cleared");

    switch (nameTag) {
        case "removetag":
            if (canBeCleared) clearPlayerTags(player, { stopSound: false });
            break;

        case "stopsound":
            if (canBeCleared) clearPlayerTags(player, { stopSound: true });
            break;

        default:
            // 아직 해당 태그가 없을 때만 새로 추가
            if (!player.hasTag(nameTag)) {
                addTagToPlayer(player, nameTag);
            }
            break;
    }
}

/**
 * 플레이어의 모든 태그를 정리하고 상태를 초기화하는 함수
 * @param {Player} player 
 * @param {{stopSound: boolean}} options 
 */
function clearPlayerTags(player, { stopSound = false }) {
    const tagsToRemove = player.getTags().filter(tag => tag !== "__cleared");

    for (const tag of tagsToRemove) {
        player.removeTag(tag);
    }

    if (stopSound) {
        player.runCommandAsync(`stopsound "${player.name}"`);
    }

    musicCoolDown.delete(player.id);
    player.addTag("__cleared");
    console.log(`${player.name}의 태그가 정리되었습니다. (옵션: ${JSON.stringify({ stopSound })})`);
}

/**
 * 특정 플레이어에게 태그를 추가하는 함수
 * @param {Player} player 
 * @param {string} tag 
 */
function addTagToPlayer(player, tag) {
    player.addTag(tag);
    player.removeTag("__cleared"); // 새로운 태그가 생겼으므로 __cleared 상태는 제거

    // 추가된 태그가 음악 관련 태그인지 확인
    if (DATA_ABOUT_MUSIC.hasOwnProperty(tag)) {
        musicCoolDown.delete(player.id);
    }
    console.log(`'${tag}' 태그를 ${player.name}에게 부여함`);
}

/**
 * 플레이어가 아머 스탠드의 특정 범위 내에 있는지 확인
 * @param {Player} player 
 * @param {Entity} stand 
 * @returns {boolean}
 */
function isPlayerNearStand(player, stand) {
    const playerLoc = player.location;
    const standLoc = stand.location;

    const isVerticallyAligned = playerLoc.y >= standLoc.y + 3 && playerLoc.y <= standLoc.y + 3.1;
    const isHorizontallyAligned = Math.abs(playerLoc.x - standLoc.x) <= 0.5 && Math.abs(playerLoc.z - standLoc.z) <= 0.5;

    return isVerticallyAligned && isHorizontallyAligned;
}

// ====================================
// 2025.9.6
// AI에게 리팩토링을 맡겨보았다. 잘했는데, 남아있는 문제는 해결되지 않았다.
// 남은 문제는 내가 직접 해결해야 할 듯.
// 함수 실행을 2틱마다가 아니라 1틱마다 실행해야 했다. 1회성 실행인 경우를 감지하지를 못하는 문제가 있었다.
// 이렇게 허무하다고..?
//=====================================

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