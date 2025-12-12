import { world, BlockPermutation } from "@minecraft/server";
import { isGlobalMenger, isGyroid, isSierpinski } from "./fractalfunctions.js";

// 설정값
const CONFIG = {
    RADIUS: 12,
    BLOCKS_LIST: [
        "minecraft:quartz_block",
    ]
};

// 함수 레지스트리 (아이템 ID와 함수 연결)
const FRACTAL_REGISTRY = {
    "minecraft:wooden_axe": { func: isGlobalMenger, name: "멩거 스펀지" },       // 나무 도끼
    "minecraft:stone_axe": { func: isSierpinski, name: "시에르핀스키 피라미드" }, // 돌 도끼
    "minecraft:golden_axe": { func: isGyroid, name: "자이로이드 미로" }           // 금 도끼
};

let isInitialized = false;
const airBlock = BlockPermutation.resolve("minecraft:air");

const loadedPalette = CONFIG.BLOCKS_LIST.map(blockName => {
    return BlockPermutation.resolve(blockName);
});

export function fractalFunction() {
    if (isInitialized) return;
    isInitialized = true;

    world.afterEvents.itemUse.subscribe((event) => {
        const item = event.itemStack;

        // 1. 현재 든 아이템이 레지스트리에 등록된 도구인지 확인
        const selectedMode = FRACTAL_REGISTRY[item.typeId];

        // 등록된 도구라면 실행 (selectedMode가 undefined가 아님)
        if (selectedMode) {
            const player = event.source;
            const dim = player.dimension;
            const center = player.location;

            const cx = Math.floor(center.x);
            const cy = Math.floor(center.y);
            const cz = Math.floor(center.z);

            // 해당 모드의 이름 출력
            player.sendMessage(`§7[!] ${selectedMode.name} 생성 시작.`);
            let blockCount = 0;

            // 2. 실행할 함수를 변수에 저장 (함수 포인터 개념)
            const targetFunction = selectedMode.func;

            for (let x = -CONFIG.RADIUS; x <= CONFIG.RADIUS; x++) {
                for (let y = -CONFIG.RADIUS; y <= CONFIG.RADIUS; y++) {
                    for (let z = -CONFIG.RADIUS; z <= CONFIG.RADIUS; z++) {

                        const gX = cx + x;
                        const gY = cy + y;
                        const gZ = cz + z;

                        /**
                        * 블록 하나하나에 대해 공식에 맞는지 아닌지 판단해 true/false 반환
                        */
                        const isSolid = targetFunction(gX, gY, gZ);


                        try {
                            const currentBlock = dim.getBlock({ x: gX, y: gY, z: gZ });
                            if (!currentBlock) continue;

                            if (isSolid) {
                                // [생성]
                                const randomIndex = Math.floor(Math.random() * loadedPalette.length);
                                const randomBlock = loadedPalette[randomIndex];

                                if (!CONFIG.BLOCKS_LIST.includes(currentBlock.typeId)) {
                                    currentBlock.setPermutation(randomBlock);
                                    blockCount++;
                                }

                            } else {
                                // [삭제/조각]
                                if (currentBlock.typeId !== "minecraft:air") {
                                    currentBlock.setPermutation(airBlock);
                                }
                            }
                        } catch (e) { }
                    }
                }
            }
            player.sendMessage(`§a[!] ${selectedMode.name} 패턴으로 ${blockCount}개 블록 처리됨.`);
        }
    });
}