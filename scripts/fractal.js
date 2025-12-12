import { world, system, BlockPermutation } from "@minecraft/server";

// === 설정값 ===
const CONFIG = {
    SIZE: 27,           // 한 번 클릭할 때 생성할 큐브 크기 (3의 배수 추천: 9, 27, 81)
    BATCH_SIZE: 64,     // 한 틱에 처리할 블록 수 (렉 걸리면 줄이세요)
    BLOCK_TYPE: "minecraft:quartz_block" // 생성할 블록
};

// === 시스템 변수 ===
let isInitialized = false;
const jobQueue = []; // 작업 대기열

// 블록 정보 미리 로드
const fractalBlock = BlockPermutation.resolve(CONFIG.BLOCK_TYPE);

/**
 * 메인 함수: main.js에서 한 번만 호출하세요.
 */
export function fractalFunction() {
    if (isInitialized) return;
    isInitialized = true;

    // 1. 작업 처리기 (Worker) - 매 틱 실행
    system.runInterval(() => {
        processQueue();
    }, 1);

    // 2. 이벤트 감지기 (Trigger)
    world.afterEvents.itemUse.subscribe((event) => {
        const item = event.itemStack;
        const player = event.source;

        // 나무 도끼 감지
        if (item.typeId === "minecraft:wooden_axe") {
            player.sendMessage(`§a[로딩 시작] ${CONFIG.SIZE}x${CONFIG.SIZE}x${CONFIG.SIZE} 영역을 계산합니다...`);

            const startPos = player.location;
            const dimension = player.dimension;

            // 클릭한 위치 기준으로 SIZE만큼 작업을 큐에 추가
            addToQueue(startPos, dimension);
        }
    });
}

/**
 * 좌표(x, y, z)가 멩거 스펀지의 일부인지 확인하는 '절대 공식'
 */
function isGlobalMenger(x, y, z) {
    // 절대값 처리로 음수 좌표 대응
    let cx = Math.abs(x);
    let cy = Math.abs(y);
    let cz = Math.abs(z);

    while (cx > 0 || cy > 0 || cz > 0) {
        const rX = cx % 3;
        const rY = cy % 3;
        const rZ = cz % 3;

        // 중앙 구멍 조건
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

/**
 * 작업을 대기열에 추가하는 함수
 */
function addToQueue(startPos, dimension) {
    const startX = Math.floor(startPos.x);
    const startY = Math.floor(startPos.y);
    const startZ = Math.floor(startPos.z);

    for (let x = 0; x < CONFIG.SIZE; x++) {
        for (let y = 0; y < CONFIG.SIZE; y++) {
            for (let z = 0; z < CONFIG.SIZE; z++) {
                // 절대 좌표 계산
                const globalX = startX + x;
                const globalY = startY + y;
                const globalZ = startZ + z;

                // 큐에 작업 등록 (좌표 정보만)
                jobQueue.push({
                    x: globalX,
                    y: globalY,
                    z: globalZ,
                    dimension: dimension
                });
            }
        }
    }
}

/**
 * 대기열을 조금씩 처리하여 블록을 설치하는 함수
 */
function processQueue() {
    if (jobQueue.length === 0) return;

    let processed = 0;

    // 배치 사이즈만큼만 반복
    while (processed < CONFIG.BATCH_SIZE && jobQueue.length > 0) {
        const job = jobQueue.shift(); // 작업 하나 꺼냄

        // 절대 공식 대입
        if (isGlobalMenger(job.x, job.y, job.z)) {
            try {
                // 해당 위치의 블록 가져오기
                const block = job.dimension.getBlock({ x: job.x, y: job.y, z: job.z });

                // 공기가 아니고, 이미 같은 블록이 아닐 때만 설치 (최적화)
                if (block && block.typeId !== CONFIG.BLOCK_TYPE) {
                    block.setPermutation(fractalBlock);
                }
            } catch (e) {
                // 로딩 안 된 청크 에러 무시
            }
        }
        processed++;
    }
}