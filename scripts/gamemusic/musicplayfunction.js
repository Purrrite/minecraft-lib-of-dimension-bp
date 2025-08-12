import { world, system } from "@minecraft/server";
import { DATA_ABOUT_MUSIC } from "./dataaboutmusic.js";

/**
 * 플레이어별 음악 상태를 저장하는 Map 객체입니다.
 * Key: player.id (플레이어의 고유 ID)
 * Value: { currentSong: string, cooldown: number } (현재 곡 ID, 남은 쿨다운 시간)
 */
export const musicCoolDown = new Map();

/**
 * 2틱(0.1초)마다 실행되며, 음악 태그를 가진 플레이어에게 음악을 재생합니다.
 * 이 함수는 main.js의 글로벌 Interval에 의해 호출됩니다.
 */
export function musicSystemTick() {
    try {
        // --- 1. 기존 플레이어들의 쿨다운 상태 업데이트 및 정리 ---
        for (const [playerId, state] of musicCoolDown.entries()) {
            const playerEntity = world.getEntity(playerId);

            // 만약 플레이어가 게임을 나갔다면, Map에서 데이터를 삭제하여 메모리 누수를 방지합니다.
            if (!playerEntity) {
                musicCoolDown.delete(playerId);
                console.log(`[MusicDebug] 접속 종료한 플레이어(${playerId})의 음악 상태를 정리했습니다.`);
                continue;
            }

            // 쿨다운 시간을 1 감소시킵니다. (이 함수가 2틱마다 호출되므로, 2틱당 1씩 감소)
            state.cooldown--;

            // 쿨다운이 0 이하로 내려가면, 플레이어 상태를 Map에서 제거하여 새 음악을 받을 수 있도록 합니다.
            if (state.cooldown <= 0) {
                musicCoolDown.delete(playerId);
                console.log(`[MusicDebug] ${playerEntity.name}의 쿨다운이 종료되었습니다.`);
            }
        }

        // --- 2. 음악이 없는 플레이어에게 새 음악 재생 ---
        for (const player of world.getAllPlayers()) {
            // 이미 음악이 재생 중(쿨다운 상태)인 플레이어는 건너뜁니다.
            if (musicCoolDown.has(player.id)) {
                continue;
            }

            // MUSIC_DATA를 순회하며 플레이어가 가진 태그와 일치하는 음악을 찾습니다.
            for (const musicId in DATA_ABOUT_MUSIC) {
                const musicInfo = DATA_ABOUT_MUSIC[musicId];

                if (player.hasTag(musicInfo.id)) {
                    player.runCommandAsync(`playsound ${musicInfo.id} @s ~ ~ ~ ${musicInfo.volume} 1`);

                    // 쿨다운 값을 계산합니다. (노래 전체 길이(tick) / 2)
                    const cooldownValue = Math.ceil(musicInfo.durationTwoTicks);

                    // 플레이어의 상태를 Map에 기록합니다.
                    musicCoolDown.set(player.id, {
                        currentSong: musicInfo.id,
                        cooldown: cooldownValue
                    });

                    // 디버깅을 위한 로그를 출력합니다.
                    console.log(`[MusicDebug] ${player.name}에게 '${musicInfo.title}' 재생 시작. (쿨다운: ${cooldownValue}회)`);
                    break;
                }
            }
        }
    } catch (error) {
        // 스크립트 실행 중 오류 발생 시, 전체 시스템이 멈추지 않도록 로그만 남깁니다.
        console.error(`[MusicSystem Error] musicSystemTick 함수에서 오류가 발생했습니다: ${error}`);
    }
    // --- 3. 디버그 메시지 출력 ---
    const players = world.getAllPlayers();
    for (const player of players) {
        const tags = player.getTags();
        const cooldownValue = musicCoolDown.has(player.id) ? musicCoolDown.get(player.id).cooldown : 0;
        player.runCommandAsync(`title @s actionbar ${player.name}의 태그: ${tags}, 쿨다운: ${cooldownValue}`);
    }

}