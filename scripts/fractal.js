import { world, BlockPermutation } from "@minecraft/server";

// === 설정값 ===
const CONFIG = {
    RADIUS: 12, // 플레이어 기준 반경
    // 사용할 무작위 색깔 팔레트 (원하는 블록을 추가/삭제하세요)
    COLOR_PALETTE: [
        "minecraft:red_concrete",
        "minecraft:orange_concrete",
        "minecraft:yellow_concrete",
        "minecraft:lime_concrete",
        "minecraft:light_blue_concrete",
        "minecraft:blue_concrete",
        "minecraft:purple_concrete",
        "minecraft:magenta_concrete",
        "minecraft:white_concrete",
        "minecraft:black_concrete"
    ]
};

// === 시스템 변수 ===
let isInitialized = false;
const airBlock = BlockPermutation.resolve("minecraft:air");

// [최적화] 팔레트의 모든 블록 정보를 미리 로드해서 배열에 저장
const loadedPalette = CONFIG.COLOR_PALETTE.map(blockName => {
    return BlockPermutation.resolve(blockName);
});

export function fractalFunction() {
    if (isInitialized) return;
    isInitialized = true;

    world.afterEvents.itemUse.subscribe((event) => {
        if (event.itemStack.typeId === "minecraft:wooden_axe") {
            const player = event.source;
            const dim = player.dimension;
            const center = player.location;

            const cx = Math.floor(center.x);
            const cy = Math.floor(center.y);
            const cz = Math.floor(center.z);

            player.sendMessage(`§e[랜덤 생성] 알록달록한 프랙탈을 생성합니다...`);
            let blockCount = 0;

            // 범위 루프 실행
            for (let x = -CONFIG.RADIUS; x <= CONFIG.RADIUS; x++) {
                for (let y = -CONFIG.RADIUS; y <= CONFIG.RADIUS; y++) {
                    for (let z = -CONFIG.RADIUS; z <= CONFIG.RADIUS; z++) {


                        const gX = cx + x;
                        const gY = cy + y;
                        const gZ = cz + z;

                        const isSolid = isGlobalMenger(gX, gY, gZ);

                        try {
                            const currentBlock = dim.getBlock({ x: gX, y: gY, z: gZ });
                            if (!currentBlock) continue;

                            if (isSolid) {
                                // [생성] 블록을 설치해야 할 때


                                // 1. 팔레트에서 랜덤 인덱스 뽑기 (0 ~ 배열길이-1)
                                const randomIndex = Math.floor(Math.random() * loadedPalette.length);
                                // 2. 미리 로드된 블록 중 하나 선택
                                const randomBlock = loadedPalette[randomIndex];

                                // 현재 블록이 팔레트에 없는 블록이거나 공기라면, 랜덤 블록 설치
                                if (!CONFIG.COLOR_PALETTE.includes(currentBlock.typeId)) {
                                    currentBlock.setPermutation(randomBlock);
                                    blockCount++;
                                }

                            } else {
                                // [삭제] 구멍이어야 할 곳에 블록이 있으면 파괴
                                if (currentBlock.typeId !== "minecraft:air") {
                                    currentBlock.setPermutation(airBlock);
                                }
                            }
                        } catch (e) {
                            // 에러 무시
                        }
                    }
                }
            }
            player.sendMessage(`§a[완료] 총 ${blockCount}개의 블록을 설치했습니다.`);
        }
    });
}

// === 절대 좌표 멩거 스펀지 공식 (변경 없음) ===
function isGlobalMenger(x, y, z) {
    let cx = Math.abs(x);
    let cy = Math.abs(y);
    let cz = Math.abs(z);

    while (cx > 0 || cy > 0 || cz > 0) {
        const rX = cx % 3;
        const rY = cy % 3;
        const rZ = cz % 3;

        if ((rX === 1 && rY === 1) ||
            (rX === 1 && rZ === 1) ||
            (rY === 1 && rZ === 1)) {
            return false; // 구멍
        }
        cx = Math.floor(cx / 3);
        cy = Math.floor(cy / 3);
        cz = Math.floor(cz / 3);
    }
    return true; // 블록
}