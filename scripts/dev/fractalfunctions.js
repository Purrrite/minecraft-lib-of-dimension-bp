/** 
 * 멩거 스펀지 공식
 * @param {*} x 
 * @param {*} y 
 * @param {*} z 
 * @returns {boolean} 이 블록이 꽉 찬 블록인지 여부
 */
export function isGlobalMenger(x, y, z) {
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
            return false; // 구멍입니다.
        }
        cx = Math.floor(cx / 3);
        cy = Math.floor(cy / 3);
        cz = Math.floor(cz / 3);
    }
    return true; // 블록입니다.
}

/**
 * 시에르핀스키 피라미드 공식
 * @param {*} x 
 * @param {*} y 
 * @param {*} z 
 * @returns {boolean} 이 블록이 꽉 찬 블록인지 여부
 */
export function isSierpinski(x, y, z) {
    // 절대값 처리
    let cx = Math.abs(x);
    let cy = Math.abs(y);
    let cz = Math.abs(z);

    // 핵심 공식: 비트 연산 AND(&)
    // 두 좌표의 비트가 겹치는 부분이 없어야 함
    // 이 조건이 '피라미드' 모양을 만듭니다.
    return (cx & cy) === 0 && (cy & cz) === 0 && (cz & cx) === 0; // 이거 이해 못하겠음
}

/**
 * 자이로이드 공식
 * @param {*} x 
 * @param {*} y 
 * @param {*} z 
 * @returns {boolean} 이 블록이 꽉 찬 블록인지 여부
 */
export function isGyroid(x, y, z) {
    // 스케일 조정 (작을수록 구멍이 커짐. 0.05 ~ 0.2 추천)
    const scale = 0.1;

    // 삼각함수 공식
    const value = Math.sin(x * scale) * Math.cos(y * scale) +
        Math.sin(y * scale) * Math.cos(z * scale) +
        Math.sin(z * scale) * Math.cos(x * scale);

    // value > 0 이면 꽉 찬 지형
    // -0.2 < value < 0.2 이면 껍질만 남은 지형 (추천)
    return Math.abs(value) < 0.2;
}