import { ItemStack, world } from "@minecraft/server";

/**
 * 플레이어에게 특정 아이템을 안전하게 지급하는 함수
 * @param {import("@minecraft/server").Player} player - 아이템을 받을 플레이어
 * @param {string} itemId - 지급할 아이템의 ID (예: "minecraft:nether_reactor_core")
 * @param {number} amount - 지급할 개수
 */
export function giveIllegalItem(player, itemId, amount = 1) {
    const inventory = player.getComponent("inventory")?.container;

    if (!inventory) {
        console.warn(`${player.name}의 인벤토리를 찾을 수 없습니다.`);
        return;
    }

    try {
        // 1. 아이템 스택 생성
        const itemStack = new ItemStack(itemId, amount);

        // 2. 인벤토리에 추가
        inventory.addItem(itemStack);

        player.sendMessage(`§e[시스템] §f${itemId} 아이템을 지급했습니다.`);
    } catch (error) {
        // 아이템 ID가 존재하지 않거나 현재 버전에서 막힌 경우 에러 처리
        console.error(`아이템 생성 실패: ${itemId}`);
        player.sendMessage(`§c[오류] '${itemId}'는 이 월드에서 불러올 수 없는 아이템입니다.`);
    }
}