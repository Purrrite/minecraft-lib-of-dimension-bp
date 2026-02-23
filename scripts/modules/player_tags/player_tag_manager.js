import { world, Player } from "@minecraft/server";
import { musicCoolDown, DATA_ABOUT_MUSIC } from "../music/index.js";

/**
 * Main function for managing player tags.
 */
export function managePlayerTags() {
    const players = world.getAllPlayers();
    const armorStands = world.getDimension("overworld").getEntities({ type: "minecraft:armor_stand" });

    for (const player of players) {
        processSinglePlayer(player, armorStands);
    }
}

/**
 * Processes tag logic for a single player.
 * @param {Player} player - The player object to process.
 * @param {Entity[]} armorStands - Array of armor stands to detect.
 */

function processSinglePlayer(player, armorStands) {
    // 1. If 'removetag' or 'stopsound' tags are present, clear tags and exit.
    if (player.hasTag("removetag") || player.hasTag("stopsound")) {
        const stopSound = player.hasTag("stopsound");
        clearPlayerTags(player, { stopSound });
        return;
    }

    // 2. Manage '__cleared' state.
    const tags = player.getTags();
    const hasClearedTag = tags.includes("__cleared");
    const hasOtherTags = tags.some(tag => tag !== "__cleared");

    if (!hasClearedTag && !hasOtherTags) {
        player.addTag("__cleared");
    } else if (hasClearedTag && hasOtherTags) {
        player.removeTag("__cleared");
    }

    // 3. Check for nearby armor stands and execute tag 부여/제거 logic.
    for (const stand of armorStands) {
        if (!isPlayerNearStand(player, stand)) continue;

        const nameTag = stand.nameTag?.trim();
        if (!nameTag) continue;

        // Player interacted with an armor stand, so break the loop to avoid duplicate processing.
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
 * Checks if a player is near an armor stand within a specific range.
 * @param {Player} player - The player object.
 * @param {Entity} stand - The armor stand entity.
 * @returns {boolean} - True if the player is near the stand, false otherwise.
 */
function isPlayerNearStand(player, stand) {
    const playerLoc = player.location;
    const standLoc = stand.location;

    const isVerticallyAligned = playerLoc.y >= standLoc.y + 3 && playerLoc.y <= standLoc.y + 3.4;
    const isHorizontallyAligned = Math.abs(playerLoc.x - standLoc.x) <= 0.5 && Math.abs(playerLoc.z - standLoc.z) <= 0.5;
    
    return isVerticallyAligned && isHorizontallyAligned;
}
