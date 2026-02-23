import { world, system, BlockPermutation } from "@minecraft/server";
import { isMengerSponge, isGyroid, isSierpinski } from "./fractalfunctions.js";

// === 설정값 ===
const CONFIG = {
    RADIUS: 10,             // 플레이어 기준 반경 (지름 21칸)
    Y_MIN: 60,             // 최소 높이
    Y_MAX: 320,             // 최대 높이
    COLUMNS_PER_TICK: 8,
    BLOCK_LIST: [
        "minecraft:nether_reactor_core",
        "minecraft:glowing_obsidian",
        "minecraft:info_update"
    ]
};

// === 시스템 변수 ===
// 작업 대기열 (처리할 기둥의 x, z 좌표가 들어감)
const jobQueue = [];
let isProcessing = false;
let totalJobs = 0; // 진행률 표시용

// 블록 팔레트 미리 로드
const loadedPalette = CONFIG.BLOCK_LIST.map(name => BlockPermutation.resolve(name));
const airBlock = BlockPermutation.resolve("minecraft:air");

// 함수 레지스트리
const FRACTAL_REGISTRY = {
    "minecraft:wooden_axe": { func: isMengerSponge, name: "멩거 스펀지" },
    "minecraft:stone_axe": { func: isSierpinski, name: "시에르핀스키 피라미드" },
    "minecraft:golden_axe": { func: isGyroid, name: "자이로이드 미로" }
};

let isInitialized = false;

export function fractalFunction() {
    if (isInitialized) return;
    isInitialized = true;

    // 1. 작업 처리기 (Worker) - 매 틱 실행되어 큐를 비움
    system.runInterval(() => {
        processQueue();
    }, 1);

    // 2. 이벤트 감지 (Trigger)
    world.afterEvents.itemUse.subscribe((event) => {
        const item = event.itemStack;
        const selectedMode = FRACTAL_REGISTRY[item.typeId];

        if (selectedMode) {
            const player = event.source;

            // 이미 작업 중이라면 중복 실행 방지 (선택 사항)
            if (jobQueue.length > 0) {
                player.sendMessage("§c현재 작업이 진행 중입니다. 잠시만 기다려주세요.");
                return;
            }

            const center = player.location;
            const cx = Math.floor(center.x);
            const cz = Math.floor(center.z);

            player.sendMessage(`§e[시스템] ${selectedMode.name} 연산 시작 (범위: ${CONFIG.RADIUS}, 높이: 전체)`);
            player.sendMessage(`§7- 총 ${((CONFIG.RADIUS * 2 + 1) ** 2)}개의 기둥을 순차적으로 생성합니다.`);

            // 작업을 큐에 등록 (기둥 단위)
            addToQueue(cx, cz, player.dimension, selectedMode.func);
        }
    });
}

/**
 * 작업을 큐에 추가하는 함수 (Column 단위)
 */
function addToQueue(centerX, centerZ, dimension, algoFunc) {
    // 반경 내 모든 X, Z 좌표를 큐에 넣음
    for (let x = -CONFIG.RADIUS; x <= CONFIG.RADIUS; x++) {
        for (let z = -CONFIG.RADIUS; z <= CONFIG.RADIUS; z++) {
            jobQueue.push({
                x: centerX + x,
                z: centerZ + z,
                dimension: dimension,
                algo: algoFunc
            });
        }
    }
    totalJobs = jobQueue.length; // 전체 작업량 저장
}

/**
 * 큐에서 작업을 꺼내 실제 블록을 설치하는 함수
 */
function processQueue() {
    if (jobQueue.length === 0) return;

    let processedCount = 0;

    // 설정된 배치 크기(COLUMNS_PER_TICK)만큼 반복
    while (processedCount < CONFIG.COLUMNS_PER_TICK && jobQueue.length > 0) {

        // 1. 큐에서 기둥(Column) 하나 꺼내기
        const job = jobQueue.shift();
        const { x, z, dimension, algo } = job;

        // 2. 해당 기둥의 Y축 전체(-64 ~ 320) 스캔
        for (let y = CONFIG.Y_MIN; y <= CONFIG.Y_MAX; y++) {

            // 프랙탈 공식 대입 (절대 좌표)
            const isSolid = algo(x, y, z);

            try {
                // 블록 가져오기 (가장 비용이 큰 작업 중 하나)
                const currentBlock = dimension.getBlock({ x: x, y: y, z: z });

                if (currentBlock) {
                    if (isSolid) {
                        // [생성] 블록이어야 하고, 현재 지정된 블록이 아닐 때만 설치
                        // (최적화: typeId 비교가 setPermutation보다 훨씬 빠름)
                        if (!CONFIG.BLOCK_LIST.includes(currentBlock.typeId)) {
                            // 랜덤 색상 선택
                            const randomBlock = loadedPalette[Math.floor(Math.random() * loadedPalette.length)];
                            currentBlock.setPermutation(randomBlock);
                        }
                    } else {
                        // [조각] 구멍이어야 하고, 공기가 아닐 때만 파괴
                        if (currentBlock.typeId !== "minecraft:air") {
                            currentBlock.setPermutation(airBlock);
                        }
                    }
                }
            } catch (e) {
                world.sendMessage(`잘못된 블록 생성 오류 발생`);
            }
        }
        processedCount++;
    }

    // 진행률 표시 (Action Bar)
    if (jobQueue.length > 0) {
        const percent = Math.floor(((totalJobs - jobQueue.length) / totalJobs) * 100);
        world.sendMessage(`§7생성 ${percent} / 100 완료...`);
        // 여기선 부하를 줄이기 위해 생략하거나 디버그용으로 사용 가능
    } else {
        world.sendMessage("§a모든 작업이 끝났습니다.");
    }
}