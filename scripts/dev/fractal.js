import { world, BlockPermutation } from "@minecraft/server";
import { isMengerSponge, isGyroid, isSierpinski } from "./fractalfunctions.js";

// === 설정값 ===
const CONFIG = {
    RADIUS: 8,       // X, Z 축 반경 (기둥의 두께 결정)
    Y_MIN: 100,         // 생성할 최저 높이 (고정)
    Y_MAX: 200,       // 생성할 최고 높이 (고정)
    BLOCK: [
        "minecraft:quartz_block"
    ]
};

// 함수 레지스트리
const FRACTAL_REGISTRY = {
    "minecraft:wooden_axe": { func: isMengerSponge, name: "멩거 스펀지" },
    "minecraft:stone_axe": { func: isSierpinski, name: "시에르핀스키 피라미드" },
    "minecraft:golden_axe": { func: isGyroid, name: "자이로이드 미로" }
};

let isInitialized = false;
const airBlock = BlockPermutation.resolve("minecraft:air");

const loadedPalette = CONFIG.BLOCK.map(blockName => {
    return BlockPermutation.resolve(blockName);
});

export function fractalFunction() {
    if (isInitialized) return;
    isInitialized = true;

    world.afterEvents.itemUse.subscribe((event) => {
        const item = event.itemStack;

        const selectedMode = FRACTAL_REGISTRY[item.typeId];

        if (selectedMode) {
            const player = event.source;
            const dim = player.dimension;
            const center = player.location;

            // 플레이어의 현재 X, Z 좌표만 가져옴 (Y는 무시)
            const cx = Math.floor(center.x);
            const cz = Math.floor(center.z);

            player.sendMessage(`§7[!] ${selectedMode.name} 기둥 생성 시작 (Y: ${CONFIG.Y_MIN}~${CONFIG.Y_MAX})`);
            let blockCount = 0;

            const targetFunction = selectedMode.func;

            for (let x = -CONFIG.RADIUS; x <= CONFIG.RADIUS; x++) {
                for (let z = -CONFIG.RADIUS; z <= CONFIG.RADIUS; z++) {

                    // 플레이어 높이와 상관없이 땅바닥부터 하늘까지 훑습니다.
                    for (let y = CONFIG.Y_MIN; y <= CONFIG.Y_MAX; y++) {

                        const gX = cx + x;
                        const gZ = cz + z;
                        const gY = y; // 여기는 y를 그대로 사용 (절대좌표)

                        // 프랙탈 공식 계산
                        const isSolid = targetFunction(gX, gY, gZ);

                        try {
                            const currentBlock = dim.getBlock({ x: gX, y: gY, z: gZ });
                            if (!currentBlock) continue;

                            if (isSolid) {
                                // [생성]
                                const randomIndex = Math.floor(Math.random() * loadedPalette.length);
                                const randomBlock = loadedPalette[randomIndex];

                                // 기존 블록이 설정된 블록이 아니면 교체
                                if (!CONFIG.BLOCK.includes(currentBlock.typeId)) {
                                    currentBlock.setPermutation(randomBlock);
                                    blockCount++;
                                }

                            } else {
                                // [삭제/조각]
                                if (currentBlock.typeId !== "minecraft:air") {
                                    currentBlock.setPermutation(airBlock);
                                }
                            }
                        } catch (e) {
                            // 로딩되지 않은 청크 에러 무시
                        }
                    }
                }
            }
            player.sendMessage(`§a[!] ${selectedMode.name} 패턴으로 ${blockCount}개 블록 처리됨.`);
        }
    });
}