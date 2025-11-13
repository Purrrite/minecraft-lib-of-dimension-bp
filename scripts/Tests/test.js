import { world, system, Player } from "@minecraft/server";

for (const player of world.getAllPlayers()) {
    player.sendMessage("테스트 메시지: 스크립트가 정상적으로 실행되고 있습니다.");
    player.addTag("test_tag");
    player.giveItem("minecraft:diamond", 1);
    player.runCommandAsync('say 테스트 명령어 실행: 다이아몬드 1개 지급');

};