// =======================================
// A function about the Gamemusic (BGM)
// =======================================

export const MUSIC_DATA = {
    // ======================================= 
    stopsound: {
        title: "멈춰랏! (이스터에그, 이걸 찾는 사람이 있을까?)",
        id: "stopsound",
        durationTwoTicks: 0, //노래는 멈추는 것이므로 지속시간은 0
        volume: 0,
    },
    // ======================================== 

    theme1: {
        title: "차원의 도서관",
        id: "theme1",
        durationTwoTicks: 857, // Duration in ticks (2 tick = 1/10 second)
        volume: 1,
    },
    theme2: {
        title: "이상한 호텔",
        id: "theme2",
        durationTwoTicks: 837,
        volume: 1,
    },
    lobby: {
        title: "차원의 도서관 로비",
        id: "lobby",
        durationTwoTicks: 475,
        volume: 1,
    },
    theme4: {
        title: "자히 도서관",
        id: "theme4",
        durationTwoTicks: 620,
        volume: 1,
    },
    theme5: {
        title: "창백한 꽃의 이야기",
        id: "theme5",
        durationTwoTicks: 500,
        volume: 1,
    },
}
