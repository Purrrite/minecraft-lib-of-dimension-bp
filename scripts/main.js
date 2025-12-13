import { system } from "@minecraft/server";
import { musicSystemTick } from "./gamemusic/index.js";
import { dialogFunction } from "./dialog/dialogfunction.js";
import { managePlayerTags } from "./processtag.js";

// === Fractal spacial module ===
import { fractalFunction } from "./dev/fractal.js";
fractalFunction();
// ==============================

// メインループ
let tickCounter = 0;

system.runInterval(() => {
    tickCounter = tickCounter >= 200 ? 0 : tickCounter + 1;

    managePlayerTags();
    dialogFunction();

    if (tickCounter % 2 === 0) {
        musicSystemTick();
    }

}, 1);

// ====================================
// 2025.9.6
// AI에게 리팩토링을 맡겨보았다. 잘했는데, 남아있는 문제는 해결되지 않았다.
// 남은 문제는 내가 직접 해결해야 할 듯.
// 함수 실행을 2틱마다가 아니라 1틱마다 실행해야 했다. 1회성 실행인 경우를 감지하지를 못하는 문제가 있었으나 해결이 되었다.
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

// ====================================
// 2025.11.14
// 노드 모듈이라는게 있었구나.. 다운로드 받으니깐 메서드 다뜨고 사용법 다뜨고 신세계다.
//=====================================

