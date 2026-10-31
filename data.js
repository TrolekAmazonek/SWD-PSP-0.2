// =========================================================================
// PLIK 1: data.js - BAZA DANYCH, 6 POWIATÓW, POGODA I WSZYSTKIE GRUPY SGR
// =========================================================================

const APP_VERSION = "SWDST 0.43";

// Całkowita blokada głosowego czytania komunikatów radiowych (TTS)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak = function() {};
    } catch (e) {}
}

const audioSelekt = new Audio('selekt.wav');
const audioCpr = new Audio('nowe zdarzenie odbierz.mp3');
const audioMotorola = new Audio('motorola.ogg');

function playSound(type) {
    if (type === 'cpr') { audioCpr.currentTime = 0; audioCpr.play().catch(() => {}); }
    else if (type === 'motorola') { audioMotorola.currentTime = 0; audioMotorola.play().catch(() => {}); }
}

function playOspAlarmRepeated(ospCount) {
    if (ospCount <= 0) return;
    let played = 0;
    function playNext() {
        if (played < ospCount) {
            audioSelekt.currentTime = 0;
            audioSelekt.play().then(() => {
                played++;
                if (played < ospCount) setTimeout(playNext, 3000);
            }).catch(() => {});
        }
    }
    playNext();
}

let currentWeatherData = {
    condition: "NORMAL",
    label: "☀️ Słonecznie / Stabilnie",
    multiplier: 1.0,
    cprFreqMultiplier: 1.0
};

const weatherScenarios = [
    { condition: "NORMAL", label: "☀️ Słonecznie / Stabilnie", mult: 1.0, freq: 1.0, alert: null },
    { condition: "DROUGHT", label: "🔥 Susza (3. st. zagrożenia pożarowego)", mult: 1.3, freq: 1.2, alert: "Komunikat KW PSP: W związku z długotrwałą suszą obowiązuje 3. stopień zagrożenia pożarowego lasów!" },
    { condition: "STORM", label: "⛈️ Ulewy i gwałtowne burze", mult: 1.2, freq: 1.8, alert: "Ostrzeżenie Meteorologiczne KW PSP: Front burzowy z ulewnymi opadami deszczu!" },
    { condition: "WIND", label: "💨 Silny wiatr i nawałnica", mult: 1.4, freq: 1.6, alert: "Alarm KW PSP: Front silnego wiatru w powiecie! Liczne powalone drzewa i uszkodzenia dachów!" }
];

function triggerWeatherChange() {
    const nextW = weatherScenarios[Math.floor(Math.random() * weatherScenarios.length)];
    currentWeatherData.condition = nextW.condition;
    currentWeatherData.label = nextW.label;
    currentWeatherData.multiplier = nextW.mult;
    currentWeatherData.cprFreqMultiplier = nextW.freq;

    const badge = document.getElementById('weather-status-badge');
    if (badge) badge.innerText = nextW.label;

    if (nextW.alert && typeof logToMainRadio === 'function') {
        logToMainRadio("STANOWISKO KIEROWANIA KW PSP", nextW.alert, "#ff00ff", false);
    }
}

// --- BAZA SPECJALISTYCZNYCH GRUP RATOWNICZYCH (W OSOBNYM OKIENKU SGR) ---
const EXTERNAL_SPECIAL_GROUPS = {
    pomorskie: [
        {
            groupName: "SGRChem Gdynia (JRG 1 Gdynia Śródmieście)",
            unitName: "JRG 1 Gdynia (SGRChem)",
            town: "Gdynia", address: "ul. Władysława IV 12/14, Gdynia", lat: 54.5221, lng: 18.5364,
            vehicles: [
                { id: "431[G]60", name: "SRChem Iveco Eurocargo (Ciężki Chemiczny)", status: "green", obsada: 3 },
                { id: "431[G]61", name: "SLRRChem Mercedes Sprinter (Rozpoznanie Chemiczne)", status: "green", obsada: 2 },
                { id: "431[G]64", name: "SLRR Ford Ranger (Rozpoznawczo-Ratowniczy)", status: "green", obsada: 2 },
                { id: "431[G]90", name: "SLRR Ford Ranger (Dowodzenie/Sztab)", status: "green", obsada: 2 }
            ]
        },
        {
            groupName: "SGRT Tczew (JRG Tczew)",
            unitName: "JRG Tczew (SGRT)",
            town: "Tczew", address: "ul. Lecha 11, Tczew", lat: 54.0912, lng: 18.7831,
            vehicles: [
                { id: "401[G]43", name: "SCRt Volvo (Ciężki Ratownictwa Technicznego)", status: "green", obsada: 3 },
                { id: "401[G]49", name: "SCRt MEGA-CITY Volvo (Ciężki Techniczny)", status: "green", obsada: 3 },
                { id: "401[G]71", name: "SCDz 70 Liebherr (Ciężki Dźwig Samochodowy)", status: "green", obsada: 2 },
                { id: "401[G]90", name: "SLOp Nissan Qashqai (Operacyjny Dowódcy)", status: "green", obsada: 2 }
            ]
        },
        {
            groupName: "SGRWys Rumia (JRG 2 Rumia)",
            unitName: "JRG 2 Rumia (SGRWys)",
            town: "Rumia", address: "ul. Świętego Floriana 1, Rumia", lat: 54.5798, lng: 18.3973,
            vehicles: [
                { id: "552[G]72", name: "SRWys Mercedes Atego/Bocar (Ratownictwo Wysokościowe)", status: "green", obsada: 3 },
                { id: "552[G]51", name: "SD-32 Mercedes Atego/Rosenbauer (Drabina)", status: "green", obsada: 2 }
            ]
        },
        {
            groupName: "SGRWN Gdańsk (JRG 2 Gdańsk Śródmieście)",
            unitName: "JRG 2 Gdańsk (SGRWN)",
            town: "Gdańsk", address: "ul. Siennicka 29, Gdańsk", lat: 54.3522, lng: 18.6752,
            vehicles: [
                { id: "302[G]71", name: "SRw Mercedes Atego 4x4 (Wodno-Nurkowy)", status: "green", obsada: 4 },
                { id: "302[G]Ł1", name: "Łódź pontonowa z silnikiem śrubowym", status: "green", obsada: 0 }
            ]
        },
        {
            groupName: "SGRWN Kościerzyna (JRG Kościerzyna)",
            unitName: "JRG Kościerzyna (SGRWN)",
            town: "Kościerzyna", address: "ul. Traugutta 6, Kościerzyna", lat: 54.1215, lng: 17.9812,
            vehicles: [
                { id: "441[G]81", name: "SRW Iveco (Specjalistyczny Wodno-Nurkowy)", status: "green", obsada: 3 },
                { id: "441[G]90", name: "SLKw Nissan Navara (Lekki Kwatermistrzowski)", status: "green", obsada: 2 },
                { id: "441[G]Ł1", name: "Łódź 6-osobowa z silnikiem zaburtowym", status: "green", obsada: 0 },
                { id: "441[G]Ł2", name: "Łódź 5-osobowa z silnikiem zaburtowym", status: "green", obsada: 0 }
            ]
        }
    ],
    slaskie: [
        {
            groupName: "SGRChem Gliwice (JRG 2 Gliwice-Łabędy)",
            unitName: "JRG 2 Gliwice (SGRChem)",
            town: "Gliwice", address: "ul. Mechaników 9, Gliwice", lat: 50.3340, lng: 18.6180,
            vehicles: [
                { id: "452[S]60", name: "SRChem MAN TGM (Ciężki Chemiczny)", status: "green", obsada: 3 },
                { id: "452[S]64", name: "SLRRChem Mercedes Sprinter (Rozpoznanie Chemiczne)", status: "green", obsada: 2 },
                { id: "452[S]90", name: "SLRR Isuzu D-Max (Dowodzenie SGRChem)", status: "green", obsada: 2 }
            ]
        },
        {
            groupName: "SGRT Gliwice / Wodzisław Śląski",
            unitName: "JRG Wodzisław Śl. (SGRT)",
            town: "Wodzisław Śląski", address: "ul. Pszowska 91, Wodzisław Śląski", lat: 50.0080, lng: 18.4450,
            vehicles: [
                { id: "681[S]43", name: "SCRt MAN TGM (Ciężki Ratownictwa Technicznego)", status: "green", obsada: 3 },
                { id: "681[S]71", name: "SCDz Jelcz / Żuraw (Ciężki Dźwig Samochodowy)", status: "green", obsada: 2 },
                { id: "681[S]90", name: "SLOp Ford Ranger (Dowodzenie SGRT)", status: "green", obsada: 2 }
            ]
        },
        {
            groupName: "SGRWys Jastrzębie-Zdrój (JRG Jastrzębie-Zdrój)",
            unitName: "JRG Jastrzębie-Zdrój (SGRWys)",
            town: "Jastrzębie-Zdrój", address: "ul. Jagiełły 3, Jastrzębie-Zdrój", lat: 49.9500, lng: 18.5750,
            vehicles: [
                { id: "471[S]72", name: "SRWys Iveco (Ratownictwo Wysokościowe)", status: "green", obsada: 3 },
                { id: "471[S]51", name: "SD-37 Iveco Magirus (Drabina Mechaniczna)", status: "green", obsada: 2 }
            ]
        },
        {
            groupName: "SGRWN Bytom (JRG Bytom)",
            unitName: "JRG Bytom (SGRWN)",
            town: "Bytom", address: "ul. Strażacka 3, Bytom", lat: 50.3480, lng: 18.9150,
            vehicles: [
                { id: "411[S]71", name: "SRw Mercedes Atego (Wodno-Nurkowy)", status: "green", obsada: 4 },
                { id: "411[S]90", name: "SLKw Ford Ranger (Wsparcie Nurkowe)", status: "green", obsada: 2 },
                { id: "411[S]Ł1", name: "Łódź ratownicza z silnikiem zaburtowym", status: "green", obsada: 0 }
            ]
        }
    ]
};

function getCurrentRegionSgrGroups() {
    const regionKey = (currentCountyId === 'raciborski') ? 'slaskie' : 'pomorskie';
    return EXTERNAL_SPECIAL_GROUPS[regionKey] || EXTERNAL_SPECIAL_GROUPS.pomorskie;
}

// --- DEKOMPRESOR PROFILI POWIATÓW ---
function unpackProfile(raw) {
    const locationsDatabase = {}, gpsCoords = {}, realStreetsByTown = {}, unitExactLocations = {};
    raw.towns.forEach(([tName, regionDesc, lat, lng, streets]) => {
        locationsDatabase[tName] = `${regionDesc}, ${raw.countyName}, woj. ${raw.voivodeship}`;
        gpsCoords[tName] = [lat, lng];
        realStreetsByTown[tName] = streets;
    });
    const mapUnitList = (list) => list.map(([uName, town, addr, lat, lng, locked, vehs]) => {
        unitExactLocations[uName] = { town, address: addr, lat, lng, locked: !!locked };
        return {
            name: uName,
            vehicles: vehs.map(([id, name, obsada]) => ({ id, name, status: "green", obsada: obsada ?? 6 }))
        };
    });
    return {
        id: raw.id, name: raw.name, radioCallsign: raw.radioCallsign, desc: raw.desc,
        voivodeship: raw.voivodeship, countyName: raw.countyName, mapCenter: raw.mapCenter,
        bbox: raw.bbox, jrgList: raw.jrgList, defaultTown: raw.defaultTown,
        locationsDatabase, gpsCoords, realStreetsByTown, unitExactLocations,
        unitsPSP: mapUnitList(raw.psp), unitsOSP: mapUnitList(raw.osp)
    };
}

const RAW_PROFILES = [
    {
        id: "wejherowski", name: "KP PSP Wejherowo (Powiat Wejherowski)", radioCallsign: "Wejherowo 998",
        desc: "Woj. pomorskie • JRG 1 Wejherowo, JRG 2 Rumia + 36 jednostek OSP",
        voivodeship: "pomorskie", countyName: "pow. wejherowski", mapCenter: [54.6052, 18.2345], bbox: "17.65,54.38,18.50,54.85",
        jrgList: ["JRG 1 Wejherowo", "JRG 2 Rumia"], defaultTown: "Bolszewo",
        towns: [
            ["Wejherowo", "m. Wejherowo", 54.6052, 18.2345, ["ul. Jana III Sobieskiego", "ul. 12 Marca", "ul. Gdańska", "ul. Tartaczna", "ul. 3 Maja", "ul. Przemysłowa", "ul. Kalwaryjska", "ul. Sikorskiego", "ul. Chopina"]],
            ["Bolszewo", "gm. Wejherowo", 54.6155, 18.1772, ["ul. Zamostna", "ul. Strażacka", "ul. Główna", "ul. Wejherowska", "ul. Szkolna", "ul. Długa", "ul. Leśna", "ul. Polna"]],
            ["Rumia", "m. Rumia", 54.5798, 18.3973, ["ul. Grunwaldzka", "ul. Dąbrowskiego", "ul. Starowiejska", "ul. Świętego Floriana", "ul. Kosynierów", "ul. Pomorska", "ul. Gdańska"]],
            ["Reda", "m. Reda", 54.6053, 18.3478, ["ul. Wejherowska", "ul. Gdańska", "ul. Pucka", "ul. Gniewowska", "ul. Obwodowa", "ul. Łąkowa", "ul. Cechowa"]],
            ["Gościcino", "gm. Wejherowo", 54.5975, 18.1458, ["ul. Drzewiarza", "ul. Wejherowska", "ul. Lęborska", "ul. Słoneczna", "ul. Fabryczna"]],
            ["Gniewowo", "gm. Wejherowo", 54.5655, 18.2995, ["ul. Jakuba Wejhera", "ul. Słoneczna", "ul. Leśna", "ul. Długa"]],
            ["Gowino", "gm. Wejherowo", 54.5682, 18.2025, ["ul. Wejherowska", "ul. Szkolna", "ul. Długa", "ul. Kwiatowa"]],
            ["Góra", "gm. Wejherowo", 54.6368, 18.1492, ["ul. Wiejska", "ul. Długa", "ul. Szkolna", "ul. Polna"]],
            ["Kniewo", "gm. Wejherowo", 54.6548, 18.1408, ["al. Lipowa", "ul. Strażacka", "ul. Długa"]],
            ["Nowy Dwór Wejherowski", "gm. Wejherowo", 54.5365, 18.2575, ["ul. Wejherowska", "ul. Kwiatowa", "ul. Leśna"]],
            ["Orle", "gm. Wejherowo", 54.6295, 18.1765, ["ul. Strażacka", "ul. Zamostna", "ul. Główna"]],
            ["Zbychowo", "gm. Wejherowo", 54.5528, 18.3275, ["ul. Kamienna", "ul. Białogórska", "ul. Jeziorna"]],
            ["Luzino", "gm. Luzino", 54.5608, 18.1038, ["ul. Ofiar Stutthofu", "ul. Kościelna", "ul. Młyńska", "ul. Wilczka", "ul. Szkolna"]],
            ["Zelewo", "gm. Luzino", 54.6146, 18.0825, ["ul. Długa", "ul. Słoneczna", "ul. Leśna"]],
            ["Milwino", "gm. Luzino", 54.5185, 18.1345, ["ul. Strażacka", "ul. Długa", "ul. Leśna"]],
            ["Szemud", "gm. Szemud", 54.4862, 18.2278, ["ul. Wejherowska", "ul. Samorządowa", "ul. Kartuska", "ul. Szkolna"]],
            ["Kielno", "gm. Szemud", 54.4552, 18.3475, ["ul. Oliwska", "ul. Szkolna", "ul. Jeziorna"]],
            ["Bojano", "gm. Szemud", 54.4776, 18.3842, ["ul. Józefa Wybickiego", "ul. Majora H. Sucharskiego", "ul. Kartuska"]],
            ["Częstkowo", "gm. Szemud", 54.5045, 18.1745, ["ul. Strażacka", "ul. Długa"]],
            ["Łebno", "gm. Szemud", 54.4555, 18.1365, ["ul. Kartuska", "ul. Szkolna"]],
            ["Przetoczyno", "gm. Szemud", 54.5345, 18.2045, ["ul. Pomorska", "ul. Strażacka"]],
            ["Gniewino", "gm. Gniewino", 54.7161, 18.0156, ["ul. Strażacka", "ul. Szkolna", "ul. Pomorska"]],
            ["Nadole", "gm. Gniewino", 54.7495, 18.0365, ["ul. Strażacka", "ul. Bałtycka"]],
            ["Kostkowo", "gm. Gniewino", 54.6755, 18.0385, ["ul. Wejherowska", "ul. Ks. Stanisława Galasa"]],
            ["Rybno", "gm. Gniewino", 54.6775, 18.1055, ["ul. Dębowa", "ul. Długa"]],
            ["Opalino", "gm. Gniewino", 54.7185, 18.0615, ["Opalino", "ul. Długa"]],
            ["Choczewo", "gm. Choczewo", 54.7422, 17.8915, ["ul. Pierwszych Osadników", "ul. Świerkowa", "ul. Pucka"]],
            ["Słajszewo", "gm. Choczewo", 54.7695, 17.8048, ["ul. Bursztynowa", "ul. Morska"]],
            ["Sasino", "gm. Choczewo", 54.7628, 17.7562, ["ul. Brukowa", "ul. Strażacka"]],
            ["Kopalino", "gm. Choczewo", 54.7895, 17.8485, ["ul. Bursztynowa", "ul. Strażacka"]],
            ["Linia", "gm. Linia", 54.4503, 17.9355, ["ul. Turystyczna", "ul. Długa", "ul. Kaszubska"]],
            ["Strzepcz", "gm. Linia", 54.4590, 18.0398, ["ul. Ks. Józefa Rotty", "ul. Długa"]],
            ["Lewino", "gm. Linia", 54.4815, 17.9945, ["ul. Długa", "ul. Leśna"]],
            ["Łęczyce", "gm. Łęczyce", 54.5992, 17.8685, ["ul. Długa", "ul. Sportowa", "ul. Kościelna"]],
            ["Bożepole Wielkie", "gm. Łęczyce", 54.5745, 17.9682, ["ul. Chmieleniecka", "ul. Strażacka"]],
            ["Rozłazino", "gm. Łęczyce", 54.5445, 17.8615, ["ul. Długa", "ul. Kościelna"]],
            ["Kaczkowo", "gm. Łęczyce", 54.6215, 17.8925, ["Kaczkowo"]]
        ],
        psp: [
            ["JRG 1 Wejherowo", "Wejherowo", "ul. Tartaczna 5, 84-200 Wejherowo", 54.6075, 18.2195, true, [
                ["551[G]21", "GBA 2,5/16 Volvo FL280/Bocar", 6], ["551[G]25", "GCBA 5,4/25 Man TGM 18.320/Bocar", 4],
                ["551[G]26", "GCBA 9,5/60 Man TGS 26.440/Stolarczyk", 3], ["551[G]53", "SH-40 Volvo FM12/Bumar", 2],
                ["551[G]90", "SLRr Ford Ranger", 2], ["551[G]P05", "Przyczepa EKO", 0], ["551[G]Ł01", "Przyczepa z pontonem", 0], ["551[G]Ł02", "Przyczepa z łodzią hybrydową", 0]
            ]],
            ["JRG 2 Rumia", "Rumia", "ul. Świętego Floriana 1, 84-230 Rumia", 54.5798, 18.3973, true, [
                ["552[G]21", "GBAPr 2,5/28/250 MB Atego/Bocar", 4], ["552[G]25", "GCBA 5/32 Scania P410/WISS", 4],
                ["552[G]51", "SD-32 Mercedes Atego/Rosenbauer", 2], ["552[G]72", "SRWys Mercedes Atego/Bocar", 3],
                ["552[G]90", "SLRr Isuzu D-Max", 2], ["552[G]Q01", "Quad CF Moto", 1]
            ]],
            ["KP PSP Wejherowo", "Wejherowo", "ul. Tartaczna 5, 84-200 Wejherowo", 54.6077, 18.2199, true, [
                ["550[G]81", "SLKw VW T6", 2], ["550[G]90", "SLOp Skoda Octavia", 1], ["550[G]92", "SLOp Skoda Yeti", 1]
            ]]
        ],
        osp: [
            [".OSP KSRG Bolszewo", "Bolszewo", "ul. Zamostna 4A, 84-239 Bolszewo", 54.6156, 18.1772, true, [["559[G]56", "GBA 2,5/16 Star 12.185/Stolarczyk", 6], ["559[G]57", "SLRr Toyota Hilux", 3], ["559[G]58", "GCBA 5/32 MB Atego/Mototruck", 4], ["559[G]59", "SLKw Ford Transit/Stolarczyk", 2], ["559[G]Q01", "Quad CF MOTO 500-2A", 1], ["559[G]P17", "Przyczepa pompowa", 0]]],
            [".OSP KSRG Gościcino", "Gościcino", "ul. Drzewiarza 22, 84-241 Gościcino", 54.5975, 18.1458, false, [["559[G]63", "GBA 2,5/16 Volvo/Bocar", 6]]],
            [".OSP KSRG Wejherowo", "Wejherowo", "ul. 3 Maja 2, 84-200 Wejherowo", 54.6014, 18.2333, true, [["559[G]66", "GBA Scania", 6], ["559[G]67", "SLRr Nissan Navara", 3], ["559[G]68", "GBA 2,5/24 Renault Midlum/WISS", 6], ["559[G]69", "SLKw Mitsubishi Canter/Szczęśniak", 3], ["559[G]89", "SD-30 Iveco Magirus", 2]]],
            [".OSP KSRG Reda", "Reda", "ul. Pucka 1, 84-240 Reda", 54.6053, 18.3478, false, [["559[G]41", "GBA 2,5/16 MB Atego/Mototruck", 6], ["559[G]42", "GBA 2,5/16 Star 12.185/Stolarczyk", 6], ["559[G]43", "GCBA 5/36 Scania P420 XT", 6]]],
            [".OSP KSRG Luzino", "Luzino", "ul. Ofiar Stutthofu 39, 84-242 Luzino", 54.5608, 18.1038, false, [["559[G]26", "GBA 3,5/25 Man TGM/Mototruck", 6], ["559[G]27", "GCBA 5/32 Man TGM/Mototruck", 6], ["559[G]28", "SLRt Ford Transit/Stolarczyk", 3], ["559[G]29", "SLOp Toyota Avensis", 2], ["559[G]Q02", "Quad ratowniczy ATV", 1]]],
            [".OSP KSRG Zelewo", "Zelewo", "ul. Długa 31, 84-252 Zelewo", 54.6146, 18.0825, false, [["559[G]87", "GBA Man TGM/Mototruck", 6]]],
            [".OSP KSRG Szemud", "Szemud", "ul. Samorządowa 3, 84-217 Szemud", 54.4862, 18.2278, false, [["559[G]51", "GBA 2,5/25 Man 13.290/Stolarczyk", 6], ["559[G]52", "GBA 2,5/16 Man TGL/Stolarczyk", 6], ["559[G]53", "GCBA 5/32 Scania P400/WISS", 6], ["559[G]54", "SLOp", 2]]],
            [".OSP KSRG Kielno", "Kielno", "ul. Oliwska 85, 84-208 Kielno", 54.4552, 18.3475, false, [["559[G]46", "GCBA 5/42 MB Axor/Mototruck", 6], ["559[G]47", "GCBA 8,3/60 MAN KAT.1 Buffalo", 3], ["559[G]48", "GBA 3/24 Man TGM/Mototruck", 6], ["559[G]49", "SLRr Mitsubishi L200", 3]]],
            [".OSP KSRG Bojano", "Bojano", "ul. Józefa Wybickiego 16, 84-207 Bojano", 54.4776, 18.3842, false, [["559[G]76", "GCBA 5/32 Man TGM/Stolarczyk", 6], ["559[G]77", "GBA Man TGM/Stolarczyk", 6], ["559[G]78", "SLRr Nissan Navara", 3], ["559[G]Q04", "Quad ratowniczy ATV", 1]]],
            [".OSP KSRG Choczewo", "Choczewo", "ul. Świerkowa 8, 84-210 Choczewo", 54.7422, 17.8915, false, [["559[G]01", "GCBA 5/32 Man TGM/Mototruck", 6], ["559[G]02", "GBA 2,5/16 Star 244/JZS", 6], ["559[G]03", "SLRt Ford Transit/Bocar", 3]]],
            [".OSP KSRG Słajszewo", "Słajszewo", "ul. Bursztynowa 67, 84-210 Słajszewo", 54.7695, 17.8048, false, [["559[G]81", "GBA 4,5/30 Man TGM/Moto-Truck", 6]]],
            [".OSP KSRG Sasino", "Sasino", "ul. Brukowa 3, 84-210 Sasino", 54.7628, 17.7562, false, [["559[G]91", "GBA Volvo FL280/Bocar", 6], ["559[G]92", "SLRr Ford Ranger", 3]]],
            [".OSP KSRG Gniewino", "Gniewino", "ul. Strażacka 2, 84-250 Gniewino", 54.7161, 18.0156, false, [["559[G]06", "GBA 2,5/25 MAN TGM/Stolarczyk", 6], ["559[G]07", "SLKw Ford Transit/Stolarczyk", 3]]],
            [".OSP KSRG Nadole", "Nadole", "ul. Strażacka 20, 84-250 Nadole", 54.7495, 18.0365, false, [["559[G]11", "GCBA 5/32 Volvo FMX/Bocar", 6], ["559[G]12", "SLRt Renault Master", 3]]],
            [".OSP KSRG Kostkowo", "Kostkowo", "ul. Wejherowska 24A, 84-251 Kostkowo", 54.6755, 18.0385, false, [["559[G]71", "GBA 2/24 Renault Midlum/WISS", 6], ["559[G]72", "GCBA 7/42 Scania P450/Szczęśniak", 6]]],
            [".OSP KSRG Linia", "Linia", "ul. Turystyczna 3, 84-223 Linia", 54.4503, 17.9355, false, [["559[G]16", "GBA 2,5/16 Volvo FL280/Bocar", 6], ["559[G]17", "GCBA 5/35 Man TGM/Stolarczyk", 6], ["559[G]18", "SLRt Lublin III", 3]]],
            [".OSP KSRG Strzepcz", "Strzepcz", "ul. Ks. Józefa Rotty 15, 84-223 Strzepcz", 54.4590, 18.0398, false, [["559[G]21", "GBA 2,5/16 MB Atego/Mototruck", 6], ["559[G]22", "SLRt Ford Transit", 3]]],
            [".OSP KSRG Bożepole Wielkie", "Bożepole Wielkie", "ul. Chmieleniecka 40, 84-214 Bożepole Wielkie", 54.5745, 17.9682, false, [["559[G]31", "GBA 2,5/16 MB Atego/Mototruck", 6], ["559[G]32", "SLRt Iveco Daily", 3]]],
            [".OSP KSRG Łęczyce", "Łęczyce", "ul. Sportowa 5, 84-218 Łęczyce", 54.5992, 17.8685, false, [["559[G]36", "GCBA 5/32 Man TGM/Mototruck", 6], ["559[G]37", "GBA Man TGM", 6], ["559[G]38", "SLOp VW Polo", 2], ["559[G]Q03", "Quad ratowniczy ATV", 1]]],
            [".OSP KSRG Rozłazino", "Rozłazino", "ul. Długa 26, 84-218 Rozłazino", 54.5445, 17.8615, false, [["559[G]96", "GBA Volvo FL280/Bocar", 6]]],
            ["OSP Rumia", "Rumia", "ul. Świętego Floriana 1, 84-230 Rumia", 54.5798, 18.3973, false, [["557[G]06", "GBA 3/16 Volvo FL 320 4x4", 6]]],
            ["OSP Gowino", "Gowino", "ul. Wejherowska 58, 84-215 Gowino", 54.5682, 18.2025, false, [["557[G]66", "GBA 4,5/32 Scania P370/Szczęśniak", 6], ["557[G]67", "GLBA Iveco Daily/Bocar", 6], ["557[G]Q01", "Quad ratowniczy ATV", 1]]],
            ["OSP Orle", "Orle", "ul. Strażacka 2, 84-252 Orle", 54.6295, 18.1765, false, [["557[G]76", "GCBA 5/37 MB Atego/Szczęśniak", 6], ["557[G]77", "SLRr Mitsubishi L200", 3], ["557[G]Q02", "Quad ratowniczy ATV", 1]]],
            ["OSP Kniewo", "Kniewo", "al. Lipowa 14, 84-252 Kniewo", 54.6548, 18.1408, false, [["557[G]71", "GBA Mercedes Benz 1124/Ziegler", 6], ["557[G]Q03", "Quad ratowniczy ATV", 1]]],
            ["OSP Zbychowo", "Zbychowo", "ul. Kamienna 2, 84-206 Zbychowo", 54.5528, 18.3275, false, [["557[G]81", "GBA 2,5/16 MB Atego/Mototruck", 6]]],
            ["OSP Gniewowo", "Gniewowo", "ul. Jakuba Wejhera 16, 84-240 Gniewowo", 54.5655, 18.2995, false, [["557[G]86", "GBA 2/20 Renault Midliner M210", 6], ["557[G]87", "GBM 2,5/8 Star 244", 6]]],
            ["OSP Góra", "Góra", "ul. Wiejska 14, 84-252 Góra", 54.6368, 18.1492, false, [["557[G]91", "GBA Iveco Eurocargo/Sides", 6]]],
            ["OSP Nowy Dwór Wejherowski", "Nowy Dwór Wejherowski", "ul. Kwiatowa 16, 84-206 Nowy Dwór Wejherowski", 54.5365, 18.2575, false, [["558[G]01", "GLM 8 Volkswagen T4", 6], ["558[G]02", "GLBA Iveco Daily", 6]]],
            ["OSP Rybno", "Rybno", "ul. Dębowa 7, 84-251 Rybno", 54.6775, 18.1055, false, [["557[G]11", "GBA 2,5/16 Mercedes Atego", 6]]],
            ["OSP Opalino", "Opalino", "Opalino 4, 84-250 Gniewino", 54.7185, 18.0615, false, [["557[G]96", "GCBA 5/24 Jelcz 422", 4]]],
            ["OSP Kopalino", "Kopalino", "ul. Bursztynowa 24, 84-210 Kopalino", 54.7895, 17.8485, false, [["557[G]01", "GLM 8 Ford Transit", 6]]],
            ["OSP Lewino", "Lewino", "ul. Długa 28, 84-223 Lewino", 54.4815, 17.9945, false, [["557[G]21", "GBA 2,5/16 Mercedes 1619", 6]]],
            ["OSP Milwino", "Milwino", "ul. Strażacka 5, 84-242 Milwino", 54.5185, 18.1345, false, [["557[G]26", "GBA 2,5/16 Renault Midlum", 6]]],
            ["OSP Kaczkowo", "Kaczkowo", "Kaczkowo 18B, 84-218 Kaczkowo", 54.6215, 17.8925, false, [["557[G]36", "GBA Renault Range D", 6]]],
            ["OSP Częstkowo", "Częstkowo", "ul. Strażacka 1, 84-217 Częstkowo", 54.5045, 18.1745, false, [["557[G]51", "GCBA Scania", 6]]],
            ["OSP Łebno", "Łebno", "ul. Kartuska 10, 84-217 Łebno", 54.4555, 18.1365, false, [["557[G]56", "GBA 3,6/16 Mercedes Atego", 6]]],
            ["OSP Przetoczyno", "Przetoczyno", "ul. Pomorska 21, 84-217 Przetoczyno", 54.5345, 18.2045, false, [["557[G]61", "GBA 2,5/16 Magirus", 6]]]
        ]
    },
    {
        id: "pucki", name: "KP PSP Puck (Powiat Pucki)", radioCallsign: "Puck 998",
        desc: "Woj. pomorskie • JRG Puck + 14 jednostek OSP",
        voivodeship: "pomorskie", countyName: "pow. pucki", mapCenter: [54.7180, 18.4080], bbox: "18.00,54.55,18.85,54.85",
        jrgList: ["JRG Puck"], defaultTown: "Puck",
        towns: [
            ["Puck", "m. Puck", 54.7178, 18.4083, ["ul. Żarnowiecka", "ul. 1 Maja", "ul. Wejherowska", "ul. Kopernika", "ul. Morska"]],
            ["Władysławowo", "gm. Władysławowo", 54.7909, 18.4036, ["ul. Gdańska", "ul. Starowiejska", "ul. Hallera", "ul. Morska"]],
            ["Jastarnia", "gm. Jastarnia", 54.6983, 18.6766, ["ul. Ks. P. Stefańskiego", "ul. Adama Mickiewicza", "ul. Bałtycka"]],
            ["Hel", "m. Hel", 54.6081, 18.8013, ["ul. Kuracyjna", "ul. Wiejska", "ul. Adm. Steyera", "ul. Leśna"]],
            ["Kosakowo", "gm. Kosakowo", 54.6186, 18.4682, ["ul. Chrzanowskiego", "ul. Żeromskiego", "ul. Derdowskiego"]],
            ["Krokowa", "gm. Krokowa", 54.7738, 18.1619, ["ul. Żarnowiecka", "ul. Wejherowska", "ul. Zamkowa"]],
            ["Żelistrzewo", "gm. Puck", 54.6761, 18.4239, ["ul. Lipowa", "ul. Pucka", "ul. Rzemieślnicza"]],
            ["Chłapowo", "gm. Władysławowo", 54.8031, 18.3742, ["ul. Władysławowska", "ul. Żeromskiego"]],
            ["Karwia", "gm. Władysławowo", 54.8286, 18.2119, ["ul. Wojska Polskiego", "ul. Kopernika"]],
            ["Jastrzębia Góra", "gm. Władysławowo", 54.8305, 18.3095, ["ul. Rozewska", "ul. Królewska"]],
            ["Leśniewo", "gm. Puck", 54.6789, 18.2683, ["ul. Krótka", "ul. Wejherowska"]],
            ["Starzyno", "gm. Puck", 54.7561, 18.3164, ["ul. Długa", "ul. Szkolna"]],
            ["Strzelno", "gm. Puck", 54.7825, 18.3711, ["ul. Świerkowa", "ul. Pucka"]],
            ["Wierzchucino", "gm. Krokowa", 54.7919, 18.0189, ["ul. Abrahama", "ul. Szkolna"]],
            ["Gnieżdżewo", "gm. Puck", 54.7564, 18.3992, ["ul. Klonowa", "ul. Gdańska"]],
            ["Smolno", "gm. Puck", 54.6881, 18.3842, ["ul. Główna", "ul. Szkolna"]]
        ],
        psp: [
            ["JRG Puck", "Puck", "ul. Żarnowiecka 7, 84-100 Puck", 54.7185, 18.3976, true, [
                ["501[G]21", "GBA 2,5/24 MAN TGM 13.290/Stolarczyk", 6], ["501[G]25", "GCBA 5/32 Scania P410/Szczęśniak", 4],
                ["501[G]43", "SRt Scania P370/Szczęśniak", 3], ["501[G]53", "SHD-23 MAN TGL 12.250/Bumar", 2], ["501[G]90", "SLRr Ford Ranger", 2]
            ]],
            ["KP PSP Puck", "Puck", "ul. Żarnowiecka 7, 84-100 Puck", 54.7187, 18.3980, true, [
                ["500[G]90", "SLOp Skoda Octavia", 1], ["500[G]81", "SLKw Renault Trafic", 2]
            ]]
        ],
        osp: [
            [".OSP KSRG Władysławowo", "Władysławowo", "ul. Gdańska 59, 84-120 Władysławowo", 54.7865, 18.4042, true, [["509[G]64", "GBA 2,5/16 Volvo FL/Bocar", 6], ["509[G]65", "GCBA 5/32 MAN TGM", 6], ["509[G]66", "SLRr Ford Ranger", 3]]],
            [".OSP KSRG Jastarnia", "Jastarnia", "ul. Ks. P. Stefańskiego 5, 84-140 Jastarnia", 54.6983, 18.6766, true, [["509[G]31", "GBA 3/28 Mercedes Atego/Bocar", 6], ["509[G]32", "GCBA 4/32 Mercedes", 6]]],
            [".OSP KSRG Hel", "Hel", "ul. Kuracyjna 3, 84-150 Hel", 54.6081, 18.8013, true, [["509[G]21", "GBA 2,5/16 MAN TGM", 6], ["509[G]22", "SLRr Nissan Navara", 3]]],
            [".OSP KSRG Kosakowo", "Kosakowo", "ul. Chrzanowskiego 44, 81-198 Kosakowo", 54.6186, 18.4682, true, [["509[G]41", "GBA 2,5/25 MAN TGM/Stolarczyk", 6], ["509[G]42", "GCBA 5/32 Scania", 6]]],
            [".OSP KSRG Krokowa", "Krokowa", "ul. Żarnowiecka 29, 84-110 Krokowa", 54.7738, 18.1619, true, [["509[G]51", "GBA 3/25 MAN TGM/Mototruck", 6], ["509[G]52", "GCBA 5/32 Jelcz", 4]]],
            [".OSP KSRG Żelistrzewo", "Żelistrzewo", "ul. Lipowa 17, 84-100 Żelistrzewo", 54.6761, 18.4239, false, [["509[G]01", "GBA 2,5/16 Mercedes Atego", 6], ["509[G]02", "GCBA 5/32 MAN", 6]]],
            [".OSP KSRG Chłapowo", "Chłapowo", "ul. Władysławowska 87, 84-120 Chłapowo", 54.8031, 18.3742, false, [["509[G]61", "GBA 2,5/16 MAN TGM", 6]]],
            [".OSP KSRG Karwia", "Karwia", "ul. Wojska Polskiego 71, 84-105 Karwia", 54.8286, 18.2119, false, [["509[G]67", "GBA 2,5/24 Mercedes Atego", 6]]],
            [".OSP KSRG Leśniewo", "Leśniewo", "ul. Krótka 2, 84-106 Leśniewo", 54.6789, 18.2683, false, [["509[G]04", "GBA 3/16 Volvo FL", 6]]],
            [".OSP KSRG Starzyno", "Starzyno", "ul. Długa 21, 84-107 Starzyno", 54.7561, 18.3164, false, [["509[G]07", "GBA 2,5/16 Star 14.225", 6]]],
            [".OSP KSRG Strzelno", "Strzelno", "ul. Świerkowa 2, 84-103 Strzelno", 54.7825, 18.3711, false, [["509[G]11", "GBA 2,5/16 Mercedes", 6]]],
            [".OSP KSRG Wierzchucino", "Wierzchucino", "ul. Abrahama 11, 84-113 Wierzchucino", 54.7919, 18.0189, false, [["509[G]56", "GBA 2,5/16 MAN", 6]]],
            ["OSP Gnieżdżewo", "Gnieżdżewo", "ul. Klonowa 2, 84-100 Gnieżdżewo", 54.7564, 18.3992, false, [["507[G]01", "GBA 2,5/16 Star", 6]]],
            ["OSP Smolno", "Smolno", "ul. Główna 32, 84-100 Smolno", 54.6881, 18.3842, false, [["507[G]05", "GBA 2,5/16 Volvo", 6]]]
        ]
    },
    {
        id: "leborski", name: "KP PSP Lębork (Powiat Lęborski)", radioCallsign: "Lębork 998",
        desc: "Woj. pomorskie • JRG Lębork + 11 jednostek OSP",
        voivodeship: "pomorskie", countyName: "pow. lęborski", mapCenter: [54.5442, 17.7525], bbox: "17.40,54.35,17.95,54.80",
        jrgList: ["JRG Lębork"], defaultTown: "Lębork",
        towns: [
            ["Lębork", "m. Lębork", 54.5442, 17.7525, ["ul. Ogniowa", "ul. Aleja Wolności", "ul. Abrahama", "ul. Staromiejska", "ul. Słupska", "ul. Gdańska", "ul. Wojska Polskiego", "ul. Krzywoustego"]],
            ["Łeba", "m. Łeba", 54.7608, 17.5561, ["ul. Kościuszki", "ul. 11 Listopada", "ul. Nadmorska", "ul. Turystyczna", "ul. Morska", "ul. Portowa"]],
            ["Nowa Wieś Lęborska", "gm. Nowa Wieś Lęborska", 54.5681, 17.7289, ["ul. Grunwaldzka", "ul. Lęborska", "ul. Młynarska", "ul. Łebska"]],
            ["Cewice", "gm. Cewice", 54.4325, 17.7419, ["ul. Witosa", "ul. Lęborska", "ul. Osiedle Na Wzgórzu", "ul. Długa"]],
            ["Wicko", "gm. Wicko", 54.6681, 17.6164, ["ul. Słupska", "ul. Łebska", "ul. Szkolna"]],
            ["Krępa Kaszubska", "gm. Nowa Wieś Lęborska", 54.6119, 17.7511, ["Krępa Kaszubska", "ul. Kolejowa"]],
            ["Maszewo Lęborskie", "gm. Cewice", 54.4619, 17.7214, ["ul. Szkolna", "ul. Długa"]],
            ["Bukowina", "gm. Cewice", 54.4019, 17.8314, ["Bukowina"]],
            ["Charbrowo", "gm. Wicko", 54.6914, 17.5819, ["ul. Długa", "ul. Łebska"]],
            ["Pogorszewo", "gm. Nowa Wieś Lęborska", 54.5819, 17.6811, ["Pogorszewo"]],
            ["Tawęcino", "gm. Nowa Wieś Lęborska", 54.6281, 17.8114, ["Tawęcino"]]
        ],
        psp: [
            ["JRG Lębork", "Lębork", "ul. Ogniowa 2, 84-300 Lębork", 54.5446, 17.7532, true, [
                ["451[G]21", "GBAPr 2,5/25 MAN TGM 13.290/Stolarczyk", 6], ["451[G]25", "GCBA 5/32 MAN TGM 18.340/Moto-Truck", 4],
                ["451[G]43", "SRt Scania P370/Szczęśniak", 3], ["451[G]53", "SHD-25 MAN TGL 12.250/Bumar", 2], ["451[G]90", "SLRr Ford Ranger", 2]
            ]],
            ["KP PSP Lębork", "Lębork", "ul. Ogniowa 2, 84-300 Lębork", 54.5448, 17.7535, true, [
                ["450[G]90", "SLOp Skoda Octavia", 1], ["450[G]81", "SLKw Ford Transit", 2]
            ]]
        ],
        osp: [
            [".OSP KSRG Łeba", "Łeba", "ul. Kościuszki 92, 84-360 Łeba", 54.7608, 17.5561, true, [["459[G]21", "GBA 3,5/27 Iveco Eurocargo", 6], ["459[G]22", "GCBA 5/32 MAN TGM", 6], ["459[G]23", "SLRr Mitsubishi L200", 3]]],
            [".OSP KSRG Nowa Wieś Lęborska", "Nowa Wieś Lęborska", "ul. Grunwaldzka 28, 84-351 Nowa Wieś Lęborska", 54.5681, 17.7289, true, [["459[G]01", "GBA 3/16 Volvo FL/Bocar", 6], ["459[G]02", "GCBA 5/32 Scania", 6]]],
            [".OSP KSRG Cewice", "Cewice", "ul. Witosa 29, 84-312 Cewice", 54.4325, 17.7419, true, [["459[G]31", "GBA 2,5/24 Renault Midlum/WISS", 6], ["459[G]32", "GCBA 5/32 MAN", 6]]],
            [".OSP KSRG Wicko", "Wicko", "Wicko 32, 84-352 Wicko", 54.6681, 17.6164, true, [["459[G]41", "GBA 3/28 Volvo FL/Bocar", 6]]],
            [".OSP KSRG Lębork", "Lębork", "ul. Staszica 8, 84-300 Lębork", 54.5412, 17.7495, true, [["459[G]51", "GBA 2,5/16 Mercedes Atego", 6]]],
            [".OSP KSRG Krępa Kaszubska", "Krępa Kaszubska", "Krępa Kaszubska 19, 84-351 Nowa Wieś Lęborska", 54.6119, 17.7511, false, [["459[G]06", "GBA 2,5/16 MAN TGM", 6]]],
            [".OSP KSRG Maszewo Lęborskie", "Maszewo Lęborskie", "Maszewo Lęborskie 12, 84-312 Cewice", 54.4619, 17.7214, false, [["459[G]35", "GBA 2,5/16 Star", 6]]],
            [".OSP KSRG Bukowina", "Bukowina", "Bukowina 40, 84-311 Bukowina", 54.4019, 17.8314, false, [["459[G]38", "GBA 2,5/16 Volvo", 6]]],
            [".OSP KSRG Charbrowo", "Charbrowo", "ul. Długa 10, 84-352 Charbrowo", 54.6914, 17.5819, false, [["459[G]44", "GBA 2,5/16 Mercedes", 6]]],
            ["OSP Pogorszewo", "Pogorszewo", "Pogorszewo 8, 84-351 Nowa Wieś Lęborska", 54.5819, 17.6811, false, [["457[G]04", "GLM Ford Transit", 6]]],
            ["OSP Tawęcino", "Tawęcino", "Tawęcino 15, 84-351 Nowa Wieś Lęborska", 54.6281, 17.8114, false, [["457[G]08", "GBA 2,5/16 Star 244", 6]]]
        ]
    },
    {
        id: "gdynia", name: "KM PSP Gdynia (Miasto Gdynia)", radioCallsign: "Gdynia 998",
        desc: "Woj. pomorskie • JRG 1 Śródmieście, JRG 2 Chylonia, JRG 3 Oksywie, JRG 4 Wielki Kack + OSP",
        voivodeship: "pomorskie", countyName: "m. Gdynia", mapCenter: [54.5189, 18.5305], bbox: "18.35,54.43,18.60,54.58",
        jrgList: ["JRG 1 Gdynia Śródmieście", "JRG 2 Gdynia Chylonia", "JRG 3 Gdynia Oksywie", "JRG 4 Gdynia Wielki Kack"], defaultTown: "Gdynia Śródmieście",
        towns: [
            ["Gdynia Śródmieście", "m. Gdynia", 54.5189, 18.5305, ["ul. Władysława IV", "ul. Świętojańska", "ul. 10 Lutego", "ul. Starowiejska", "ul. Śląska", "al. Jana Pawła II", "ul. Portowa"]],
            ["Gdynia Chylonia", "m. Gdynia", 54.5442, 18.4589, ["ul. Hutnicza", "ul. Morska", "ul. Chylońska", "ul. Kartuska", "ul. Pucka", "ul. Rozewska"]],
            ["Gdynia Oksywie", "m. Gdynia", 54.5481, 18.5392, ["ul. Bosmańska", "ul. Benisławskiego", "ul. Zielona", "ul. Dickmana", "ul. Śmidowicza"]],
            ["Gdynia Obłuże", "m. Gdynia", 54.5556, 18.5089, ["ul. Unruga", "ul. Kwiatkowskiego", "ul. Płk. Dąbka", "ul. Boisko"]],
            ["Gdynia Pogórze", "m. Gdynia", 54.5681, 18.4981, ["ul. Płk. Dąbka", "ul. Porębskiego", "ul. Paderewskiego"]],
            ["Gdynia Cisowa", "m. Gdynia", 54.5528, 18.4319, ["ul. Morska", "ul. Chylońska", "ul. Owsiana", "ul. Kcyńska"]],
            ["Gdynia Redłowo", "m. Gdynia", 54.4919, 18.5481, ["al. Zwycięstwa", "ul. Powstania Styczniowego", "ul. Legionów", "ul. Stryjska"]],
            ["Gdynia Orłowo", "m. Gdynia", 54.4792, 18.5542, ["al. Zwycięstwa", "ul. Orłowska", "ul. Wielkopolska", "ul. Wrocławska"]],
            ["Gdynia Wielki Kack", "m. Gdynia", 54.4698, 18.4945, ["ul. Wielkopolska", "ul. Nowodworcowa", "ul. Starodworcowa", "ul. Źródło Marii"]],
            ["Gdynia Karwiny", "m. Gdynia", 54.4775, 18.4819, ["ul. Wielkopolska", "ul. Sopocka", "ul. Tuwima", "ul. Brzechwy"]],
            ["Gdynia Dąbrowa", "m. Gdynia", 54.4719, 18.4525, ["ul. Rdestowa", "ul. Miętowa", "ul. Szafranowa", "ul. Nagietkowa"]],
            ["Gdynia Chwarzno-Wiczlino", "m. Gdynia", 54.4925, 18.4219, ["ul. Chwarznieńska", "ul. Wiczlińska", "ul. Filipkowskiego", "ul. Jowisza"]],
            ["Gdynia Witomino", "m. Gdynia", 54.4986, 18.5019, ["ul. Małokacka", "ul. Rolnicza", "ul. Chwarznieńska", "ul. Konwaliowa"]],
            ["Gdynia Grabówek", "m. Gdynia", 54.5289, 18.4911, ["ul. Morska", "ul. Kalksztajnów", "ul. Mireckiego"]]
        ],
        psp: [
            ["JRG 1 Gdynia Śródmieście", "Gdynia Śródmieście", "ul. Władysława IV 12/14, 81-353 Gdynia", 54.5221, 18.5364, true, [
                ["341[G]21", "GBAPr 2,5/30 MAN TGM 15.290/Stolarczyk", 6], ["341[G]25", "GCBA 5/32 MAN TGM 18.340/Stolarczyk", 4],
                ["341[G]43", "SRt Mercedes Atego/Bocar", 3], ["341[G]51", "SD-37 Iveco Magirus", 2], ["341[G]90", "SLRr Nissan Navara", 2]
            ]],
            ["JRG 2 Gdynia Chylonia", "Gdynia Chylonia", "ul. Hutnicza 15, 81-061 Gdynia", 54.5442, 18.4589, true, [
                ["342[G]21", "GBA 2,5/25 MAN TGM/Stolarczyk", 6], ["342[G]25", "GCBA 8/50 Renault K440/WISS", 4],
                ["342[G]60", "SRChem Iveco Eurocargo", 3], ["342[G]90", "SLRr Ford Ranger", 2]
            ]],
            ["JRG 3 Gdynia Oksywie", "Gdynia Oksywie", "ul. Bosmańska 103, 81-116 Gdynia", 54.5481, 18.5392, true, [
                ["343[G]21", "GBA 2,5/24 Renault D16/WISS", 6], ["343[G]25", "GCBA 5/32 Scania P410/Szczęśniak", 4], ["343[G]90", "SLRr Isuzu D-Max", 2]
            ]],
            ["JRG 4 Gdynia Wielki Kack", "Gdynia Wielki Kack", "ul. Wielkopolska 250, 81-531 Gdynia", 54.4698, 18.4945, true, [
                ["344[G]21", "GBA 2,5/25 MAN TGM/Bocar", 6], ["344[G]25", "GCBA 5/32 Scania P370/Szczęśniak", 4], ["344[G]90", "SLRr Toyota Hilux", 2]
            ]],
            ["KM PSP Gdynia", "Gdynia Śródmieście", "ul. Władysława IV 12/14, 81-353 Gdynia", 54.5224, 18.5368, true, [
                ["340[G]90", "SLOp Skoda Octavia", 1], ["340[G]81", "SLKw VW Crafter", 2]
            ]]
        ],
        osp: [
            [".OSP KSRG Gdynia-Wiczlino", "Gdynia Chwarzno-Wiczlino", "ul. Filipkowskiego 12, 81-578 Gdynia", 54.4925, 18.4219, true, [["349[G]01", "GBA 2,5/16 Star Man", 6], ["349[G]02", "SLRt Ford Transit", 3]]],
            ["OSP Gdynia-Karwiny", "Gdynia Karwiny", "ul. Wielkopolska 402, 81-531 Gdynia", 54.4775, 18.4819, true, [["347[G]01", "GLM 8 Renault Master", 6]]]
        ]
    },
    {
        id: "gdansk", name: "KM PSP Gdańsk (Miasto Gdańsk)", radioCallsign: "Gdańsk 998",
        desc: "Woj. pomorskie • JRG 1-6 + OSP",
        voivodeship: "pomorskie", countyName: "m. Gdańsk", mapCenter: [54.3520, 18.6466], bbox: "18.42,54.27,18.95,54.45",
        jrgList: ["JRG 1 Gdańsk Wrzeszcz", "JRG 2 Gdańsk Śródmieście", "JRG 3 Gdańsk Orunia", "JRG 4 Gdańsk Przymorze", "JRG 5 Gdańsk Kokoszki", "JRG 6 Gdańsk Przeróbka"], defaultTown: "Gdańsk Śródmieście",
        towns: [
            ["Gdańsk Śródmieście", "m. Gdańsk", 54.3485, 18.6532, ["ul. Długa", "ul. Podwale Przedmiejskie", "ul. Okopowa", "ul. Wały Jagiellońskie", "ul. Siennicka", "ul. Elbląska"]],
            ["Gdańsk Wrzeszcz", "m. Gdańsk", 54.3805, 18.6042, ["al. Grunwaldzka", "ul. Sosnowa", "ul. Słowackiego", "ul. Kościuszki", "ul. Hallera", "ul. Do Studzienki"]],
            ["Gdańsk Orunia", "m. Gdańsk", 54.3161, 18.6345, ["ul. Trakt Św. Wojciecha", "ul. Małomiejska", "ul. Gościnna", "ul. Starogardzka"]],
            ["Gdańsk Chełm", "m. Gdańsk", 54.3319, 18.6085, ["ul. Witosa", "ul. Sikorskiego", "ul. Cienista", "ul. Jabłońskiego", "al. Havla"]],
            ["Gdańsk Przymorze", "m. Gdańsk", 54.4065, 18.5895, ["ul. Beniowskiego", "ul. Kołobrzeska", "ul. Chłopska", "ul. Obrońców Wybrzeża", "al. Rzeczypospolitej"]],
            ["Gdańsk Oliwa", "m. Gdańsk", 54.4119, 18.5625, ["al. Grunwaldzka", "ul. Spacerowa", "ul. Polanki", "ul. Bażyńskiego"]],
            ["Gdańsk Osowa", "m. Gdańsk", 54.4265, 18.4785, ["ul. Kielnieńska", "ul. Wodnika", "ul. Jednorożca", "ul. Biwakowa"]],
            ["Gdańsk Kokoszki", "m. Gdańsk", 54.3545, 18.4912, ["ul. Kalinowa", "ul. Kartuska", "ul. Budowlanych", "ul. Nowatorów"]],
            ["Gdańsk Przeróbka", "m. Gdańsk", 54.3642, 18.6945, ["ul. Siennicka", "ul. Stryjewskiego", "ul. Pokoleń Lechii Gdańsk", "ul. Ku Ujściu"]],
            ["Gdańsk Sobieszewo", "m. Gdańsk", 54.3375, 18.8285, ["ul. Turystyczna", "ul. Nadwiślańska", "ul. Przegalińska", "ul. Boguckiego"]]
        ],
        psp: [
            ["JRG 1 Gdańsk Wrzeszcz", "Gdańsk Wrzeszcz", "ul. Sosnowa 2, 80-251 Gdańsk", 54.3768, 18.5985, true, [
                ["301[G]21", "GBA 2,5/24 Renault D16/WISS", 6], ["301[G]25", "GCBA 5/36 Scania P410/Szczęśniak", 4],
                ["301[G]43", "SRt Scania P370/Szczęśniak", 3], ["301[G]51", "SD-40 Iveco Magirus", 2], ["301[G]90", "SLRr Ford Ranger", 2]
            ]],
            ["JRG 2 Gdańsk Śródmieście", "Gdańsk Śródmieście", "ul. Siennicka 29, 80-758 Gdańsk", 54.3522, 18.6752, true, [
                ["302[G]21", "GBA 2,5/25 MAN TGM/Stolarczyk", 6], ["302[G]25", "GCBA 5/32 MAN TGM/Bocar", 4],
                ["302[G]71", "SRw Mercedes Atego", 3], ["302[G]90", "SLRr Isuzu D-Max", 2]
            ]],
            ["JRG 3 Gdańsk Orunia", "Gdańsk Orunia", "ul. Trakt Św. Wojciecha 253, 80-018 Gdańsk", 54.3161, 18.6345, true, [
                ["303[G]21", "GBA 2,5/16 Volvo FL280/Bocar", 6], ["303[G]25", "GCBA 5/32 Scania P370", 4], ["303[G]90", "SLRr Nissan Navara", 2]
            ]],
            ["JRG 4 Gdańsk Przymorze", "Gdańsk Przymorze", "ul. Beniowskiego 7, 80-382 Gdańsk", 54.4142, 18.5795, true, [
                ["304[G]21", "GBA 2,5/24 Renault D16/WISS", 6], ["304[G]25", "GCBA 5/32 MAN TGM", 4],
                ["304[G]51", "SD-37 Iveco Magirus", 2], ["304[G]90", "SLRr Toyota Hilux", 2]
            ]],
            ["JRG 5 Gdańsk Kokoszki", "Gdańsk Kokoszki", "ul. Kalinowa 4, 80-298 Gdańsk", 54.3545, 18.4912, true, [
                ["305[G]21", "GBA 2,5/25 MAN TGM", 6], ["305[G]25", "GCBA 8/50 Renault K440/WISS", 4], ["305[G]90", "SLRr Ford Ranger", 2]
            ]],
            ["JRG 6 Gdańsk Przeróbka", "Gdańsk Przeróbka", "ul. Pokoleń Lechii Gdańsk 1, 80-560 Gdańsk", 54.3895, 18.6412, true, [
                ["306[G]21", "GBA 2,5/24 MAN TGM", 6], ["306[G]25", "GCBA 5/32 Scania", 4], ["306[G]60", "SRChem Scania", 3], ["306[G]90", "SLRr Mitsubishi L200", 2]
            ]],
            ["KM PSP Gdańsk", "Gdańsk Wrzeszcz", "ul. Sosnowa 2, 80-251 Gdańsk", 54.3770, 18.5988, true, [
                ["300[G]90", "SLOp Skoda Octavia", 1], ["300[G]81", "SLKw Renault Master", 2]
            ]]
        ],
        osp: [
            [".OSP KSRG Gdańsk-Sobieszewo", "Gdańsk Sobieszewo", "ul. Turystyczna 28, 80-680 Gdańsk", 54.3375, 18.8285, true, [["309[G]31", "GBA 2,5/24 Mercedes Atego", 6], ["309[G]32", "GCBA 5/32 MAN TGM", 6]]],
            ["OSP Gdańsk-Świbno", "Gdańsk Sobieszewo", "ul. Boguckiego 98, 80-690 Gdańsk", 54.3312, 18.9285, true, [["309[G]41", "GBA 2,5/16 Star 12.185", 6]]],
            ["OSP Gdańsk-Osowa", "Gdańsk Osowa", "ul. Kielnieńska 126, 80-299 Gdańsk", 54.4265, 18.4785, true, [["307[G]21", "GLM 8 Ford Transit", 6]]]
        ]
    },
    {
        id: "raciborski", name: "KP PSP Racibórz (Powiat Raciborski)", radioCallsign: "Racibórz 998",
        desc: "Woj. śląskie • JRG Racibórz, KP PSP Racibórz + 21 jednostek OSP KSRG",
        voivodeship: "śląskie", countyName: "pow. raciborski", mapCenter: [50.0919, 18.2198], bbox: "17.95,49.90,18.55,50.25",
        jrgList: ["JRG Racibórz"], defaultTown: "Racibórz",
        towns: [
            ["Racibórz", "m. Racibórz", 50.0919, 18.2198, ["ul. Władysława Reymonta", "ul. Opawska", "ul. Głubczycka", "ul. Rybnicka", "ul. Bosacka", "ul. Nowa", "ul. Długa", "ul. Mickiewicza"]],
            ["Kuźnia Raciborska", "gm. Kuźnia Raciborska", 50.2014, 18.3094, ["ul. Słowackiego", "ul. Staszica", "ul. Klasztorna", "ul. Rudzka", "ul. Moniuszki"]],
            ["Rudy", "gm. Kuźnia Raciborska", 50.1942, 18.4481, ["ul. Rogera", "ul. Cysterska", "ul. Raciborska", "ul. Szkolna"]],
            ["Krzanowice", "gm. Krzanowice", 50.0206, 18.1264, ["ul. Zawadzkiego", "ul. Morawska", "ul. Opawska", "ul. Rynek"]],
            ["Bojanów", "gm. Krzanowice", 50.0381, 18.1653, ["ul. Raciborska", "ul. Główna", "ul. Krzanowicka"]],
            ["Wojnowice", "gm. Krzanowice", 50.0522, 18.1489, ["ul. Pocztowa", "ul. Wojska Polskiego", "ul. Szkolna"]],
            ["Krzyżanowice", "gm. Krzyżanowice", 49.9881, 18.2697, ["ul. Główna", "ul. Kolejowa", "ul. Tworkowska"]],
            ["Tworków", "gm. Krzyżanowice", 50.0244, 18.2325, ["ul. Parkowa", "ul. Główna", "ul. Raciborska"]],
            ["Bieńkowice", "gm. Krzyżanowice", 50.0369, 18.2144, ["ul. Pomnikowa", "ul. Raciborska", "ul. Szkolna"]],
            ["Chałupki", "gm. Krzyżanowice", 49.9261, 18.3128, ["ul. Bogumińska", "ul. Raciborska", "ul. Graniczna"]],
            ["Zabełków", "gm. Krzyżanowice", 49.9461, 18.2975, ["ul. Powstańców Śląskich", "ul. Nowa"]],
            ["Nędza", "gm. Nędza", 50.1592, 18.3133, ["ul. Strażacka", "ul. Jana III Sobieskiego", "ul. Kolejowa"]],
            ["Górki Śląskie", "gm. Nędza", 50.1419, 18.3742, ["ul. Ofiar Oświęcimskich", "ul. Rudzka"]],
            ["Pietrowice Wielkie", "gm. Pietrowice Wielkie", 50.0789, 18.0936, ["ul. 1 Maja", "ul. Szkolna", "ul. Konopnickiej"]],
            ["Krowiarki", "gm. Pietrowice Wielkie", 50.1306, 18.1058, ["ul. Wyzwolenia", "ul. Parkowa"]],
            ["Rudnik", "gm. Rudnik", 50.1264, 18.1819, ["ul. Słoneczna", "ul. Kozielska", "ul. Szkolna"]],
            ["Szonowice", "gm. Rudnik", 50.1711, 18.1561, ["ul. Słowackiego", "ul. Główna"]],
            ["Kornowac", "gm. Kornowac", 50.0819, 18.3347, ["ul. Zacisze", "ul. Raciborska"]],
            ["Pogrzebień", "gm. Kornowac", 50.0886, 18.3039, ["ul. Pamiątki", "ul. Brzezka"]]
        ],
        psp: [
            ["JRG Racibórz", "Racibórz", "ul. Władysława Reymonta 8, 47-400 Racibórz", 50.0956, 18.2215, true, [
                ["561[S]21", "GBA 2,5/24 Renault D15/WISS", 6], ["561[S]25", "GCBA 8/50 Renault K440/WISS", 4],
                ["561[S]26", "GCBA 5/32 MAN TGM 18.340/Stolarczyk", 4], ["561[S]43", "SRt Mercedes Atego/Bocar", 3],
                ["561[S]51", "SD-37 Iveco EuroFire/Magirus", 2], ["561[S]90", "SLRr Ford Ranger", 2]
            ]],
            ["KP PSP Racibórz", "Racibórz", "ul. Władysława Reymonta 8, 47-400 Racibórz", 50.0958, 18.2219, true, [
                ["560[S]90", "SLOp Skoda Octavia", 1], ["560[S]81", "SLKw Opel Vivaro", 2]
            ]]
        ],
        osp: [
            [".OSP KSRG Racibórz-Markowice", "Racibórz", "ul. Kpt. St. Myśliwca 9, 47-400 Racibórz", 50.1197, 18.2683, true, [["569[S]67", "GBA 3/16 Volvo FL280/Bocar", 6], ["569[S]68", "SLRr Nissan Pickup", 3]]],
            [".OSP KSRG Racibórz-Brzezie", "Racibórz", "ul. Bitwy Olzańskiej 28, 47-400 Racibórz", 50.0725, 18.2750, true, [["569[S]65", "GBA 2,5/16 Mercedes Atego/Bocar", 6]]],
            [".OSP KSRG Racibórz-Sudół", "Racibórz", "ul. Hulczyńska 164, 47-400 Racibórz", 50.0560, 18.2045, true, [["569[S]70", "GBA 2,5/16 Renault Midlum", 6]]],
            [".OSP KSRG Racibórz-Miedonia", "Racibórz", "ul. Podmiejska 29, 47-400 Racibórz", 50.1112, 18.1872, true, [["569[S]69", "GBA 3/29 Volvo FL/Bocar", 6]]],
            [".OSP KSRG Kuźnia Raciborska", "Kuźnia Raciborska", "ul. Słowackiego 4, 47-420 Kuźnia Raciborska", 50.2014, 18.3094, false, [["569[S]26", "GBA 2,5/16 Mercedes Atego", 6], ["569[S]27", "GCBA 5/32 Tatra 815", 4]]],
            [".OSP KSRG Rudy", "Rudy", "ul. Rogera 2, 47-430 Rudy", 50.1942, 18.4481, false, [["569[S]28", "GBA 3/16 Volvo FL/Bocar", 6], ["569[S]29", "GCBA 6/32 Jelcz", 4]]],
            [".OSP KSRG Krzanowice", "Krzanowice", "ul. Zawadzkiego 3, 47-470 Krzanowice", 50.0206, 18.1264, false, [["569[S]11", "GBA 2,5/16 Mercedes Atego", 6], ["569[S]12", "GCBA 5/32 Scania", 6]]],
            [".OSP KSRG Bojanów", "Bojanów", "ul. Raciborska 36, 47-470 Bojanów", 50.0381, 18.1653, false, [["569[S]13", "GBA 2,5/24 Renault Midlum", 6]]],
            [".OSP KSRG Wojnowice", "Wojnowice", "ul. Pocztowa 19A, 47-470 Wojnowice", 50.0522, 18.1489, false, [["569[S]16", "GBA 2,5/16 Volvo FL", 6]]],
            [".OSP KSRG Krzyżanowice", "Krzyżanowice", "ul. Główna 3, 47-450 Krzyżanowice", 49.9881, 18.2697, false, [["569[S]34", "GBA 3/16 Volvo FL/Bocar", 6]]],
            [".OSP KSRG Tworków", "Tworków", "ul. Parkowa 6, 47-451 Tworków", 50.0244, 18.2325, false, [["569[S]38", "GBA 2,5/16 Mercedes Atego", 6], ["569[S]39", "GLM Ford Transit", 4]]],
            [".OSP KSRG Bieńkowice", "Bieńkowice", "ul. Pomnikowa 11, 47-451 Bieńkowice", 50.0369, 18.2144, false, [["569[S]31", "GBA 3/16 Volvo FL/Bocar", 6]]],
            [".OSP KSRG Chałupki", "Chałupki", "ul. Bogumińska 30, 47-460 Chałupki", 49.9261, 18.3128, false, [["569[S]33", "GBA 2,5/16 MAN TGL", 6]]],
            [".OSP KSRG Nędza", "Nędza", "ul. Strażacka 2, 47-440 Nędza", 50.1592, 18.3133, false, [["569[S]43", "GBA 3/16 Volvo FL/Bocar", 6]]],
            [".OSP KSRG Górki Śląskie", "Górki Śląskie", "ul. Ofiar Oświęcimskich 57, 47-440 Górki Śląskie", 50.1419, 18.3742, false, [["569[S]41", "GBA 2,5/16 Renault", 6]]],
            [".OSP KSRG Pietrowice Wielkie", "Pietrowice Wielkie", "ul. 1 Maja 8B, 47-480 Pietrowice Wielkie", 50.0789, 18.0936, false, [["569[S]51", "GBA 2,5/16 Mercedes Atego", 6], ["569[S]52", "GCBA 5/32 Jelcz", 4]]],
            [".OSP KSRG Krowiarki", "Krowiarki", "ul. Wyzwolenia 20, 47-480 Krowiarki", 50.1306, 18.1058, false, [["569[S]48", "GBA 2,5/16 MAN", 6]]],
            [".OSP KSRG Rudnik", "Rudnik", "ul. Słoneczna 4, 47-411 Rudnik", 50.1264, 18.1819, false, [["569[S]56", "GBA 2,5/16 Mercedes Atego", 6]]],
            [".OSP KSRG Szonowice", "Szonowice", "ul. Słowackiego 19, 47-411 Szonowice", 50.1711, 18.1561, false, [["569[S]61", "GBA 2,5/16 Star Man", 6]]],
            [".OSP KSRG Kornowac", "Kornowac", "ul. Zacisze 4, 47-485 Kornowac", 50.0819, 18.3347, false, [["569[S]01", "GBA 2,5/16 Volvo", 6]]],
            [".OSP KSRG Pogrzebień", "Pogrzebień", "ul. Pamiątki 23, 47-485 Pogrzebień", 50.0886, 18.3039, false, [["569[S]03", "GBA 2,5/16 Mercedes", 6]]]
        ]
    }
];

const COUNTY_PROFILES = {};
RAW_PROFILES.forEach(rp => { COUNTY_PROFILES[rp.id] = unpackProfile(rp); });

const subtypesData = {
    "P": [
        "P - Inne pożary", "P - Instytucje, obiekty użyteczności publicznej", "P - Obiekty gospodarcze i inne rolnicze",
        "P - Obiekty magazynowe, place składowe", "P - Obiekty mieszkalne", "P - Obiekty produkcyjne, instalacje technologiczne",
        "P - Śmietniska, wysypiska", "P - Środki transportu drogowego (np. autobus)", "P - Środki transportu kolejowego",
        "P - Środki transportu lotniczego", "P - Środki transportu wodnego", "P - Trawy, torfowiska, lasy, pola, stogi"
    ],
    "MZ": [
        "Inne MZ", "MZ - Atmosferyczne", "MZ - Budowlane", "MZ - Chemiczne", "MZ - Drogowe", "MZ - Kolejowe",
        "MZ - Kolizja", "MZ - Lotnicze", "MZ - Wodne", "MZ - Palenie ognisk w miejscach niedozwolonych",
        "MZ - Podejrzenie podłożenia ładunku", "MZ - Pomoc innym służbom", "MZ - Pomoc Policji", "MZ - Pomoc PRM",
        "MZ - Pomoc w otwarciu mieszkania, podejrzenie zgonu", "MZ - Poszukiwanie osób zaginionych", "MZ - Próba samobójcza",
        "MZ - Sanitarno-epidemiologiczne", "MZ - Topienie się", "MZ - Wypadek", "MZ - Zabezpieczenie ładunku", "MZ - Zwierzęta"
    ],
    "AF": ["AF - Fałszywy z instalacji", "AF - Złośliwy", "AF - W dobrej wierze"],
    "CW": ["CW - Zagrożenie chemiczne", "CW - Zagrożenie ekologiczne"],
    "WG": ["WG - Wybuch gazu", "WG - Inne zagrożenie wybuchem"],
    "BL": ["BL - Budynek zagrożony zawaleniem"],
    "ZPR": ["ZPR - Zagrożenie promieniotwórcze"],
    "PZR": []
};

const callersMaleFirst = ["Jan", "Piotr", "Tomasz", "Michał", "Krzysztof", "Andrzej", "Paweł", "Marek", "Adam", "Łukasz", "Marcin", "Jakub", "Mateusz", "Wojciech", "Henryk", "Dawid", "Szymon", "Kamil", "Robert", "Rafał", "Jacek", "Grzegorz", "Dariusz", "Mariusz", "Zbigniew", "Sławomir", "Jarosław", "Mirosław", "Ryszard", "Tadeusz", "Artur", "Sebastian", "Patryk", "Damian", "Przemysław", "Maciej", "Bartosz", "Dominik", "Karol", "Filip", "Hubert", "Kacper", "Mikołaj", "Błażej", "Cezary", "Leszek", "Waldemar", "Roman", "Kazimierz", "Wiesław"];
const callersMaleLast = ["Kowalski", "Nowak", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński", "Szymański", "Woźniak", "Dąbrowski", "Kozłowski", "Jankowski", "Mazur", "Kwiatkowski", "Wojciechowski", "Krawczyk", "Kaczmarek", "Piotrowski", "Grabowski", "Zając", "Pawłowski", "Michalski", "Król", "Wieczorek", "Jabłoński", "Wróbel", "Nowakowski", "Majewski", "Olszewski", "Stępień", "Malinowski", "Jaworski", "Adamczyk", "Dudek", "Nowicki", "Pawlak", "Górski", "Witkowski", "Walczak", "Sikora", "Baran", "Rutkowski", "Michalak", "Szewczyk", "Ostrowski", "Tomaszewski", "Pietrzak", "Zalewski", "Wróblewski", "Kreft", "Formela", "Kwidziński", "Labuda", "Hirsz", "Damps", "Treder", "Gaffke", "Kunkel", "Rohde", "Bistram", "Bojke", "Ceynowa", "Dettlaff", "Gruba", "Kohnke", "Liedtke", "Miotk", "Płotka", "Richert"];
const callersFemaleFirst = ["Anna", "Katarzyna", "Magdalena", "Agnieszka", "Małgorzata", "Krystyna", "Barbara", "Ewa", "Elżbieta", "Zofia", "Teresa", "Joanna", "Monika", "Danuta", "Natalia", "Karolina", "Marta", "Beata", "Dorota", "Halina", "Jadwiga", "Aleksandra", "Irena", "Alicja", "Paulina", "Justyna", "Renata", "Bożena", "Urszula", "Weronika", "Sylwia", "Agata", "Patrycja", "Izabela", "Aneta", "Emilia", "Ewelina", "Kinga", "Martyna", "Klaudia", "Dominika", "Julia", "Zuzanna", "Maja", "Hanna", "Oliwia", "Wiktoria", "Kamila", "Edyta", "Marzena"];
const callersFemaleLast = ["Kowalska", "Nowak", "Wiśniewska", "Wójcik", "Kowalczyk", "Kamińska", "Lewandowska", "Zielińska", "Szymańska", "Woźniak", "Dąbrowska", "Kozłowska", "Jankowska", "Mazur", "Kwiatkowska", "Wojciechowska", "Krawczyk", "Kaczmarek", "Piotrowska", "Grabowska", "Zając", "Pawłowska", "Michalska", "Król", "Wieczorek", "Jabłońska", "Wróbel", "Nowakowska", "Majewska", "Olszewska", "Stępień", "Malinowska", "Jaworska", "Adamczyk", "Dudek", "Nowicka", "Pawlak", "Górska", "Witkowska", "Walczak", "Sikora", "Baran", "Rutkowska", "Michalak", "Szewczyk", "Ostrowska", "Tomaszewska", "Pietrzak", "Zalewska", "Wróblewska", "Kreft", "Formela", "Kwidzińska", "Labuda", "Hirsz", "Damps", "Treder", "Gaffke", "Kunkel", "Rohde", "Bistram", "Bojke", "Ceynowa", "Dettlaff", "Gruba", "Kohnke", "Liedtke", "Miotk", "Płotka", "Richert"];

const fallbackPhrasesP = [
    "Pali się sadza w kominie, z komina lecą iskry na dach budynku",
    "Mieszkaniec zgłasza gęsty czarny dym z budynku gospodarczego",
    "Widzę płomienie wydostające się przez dach pustostanu",
    "Właściciel zgłasza pożar trawy i suchego ścierniska blisko lasu",
    "Pożar samochodu osobowego na poboczu drogi, ogień pod maską",
    "Pali się altana śmietnikowa przy budynku wielorodzinnym",
    "Zadymienie na klatce schodowej w bloku, czuć spaleniznę z mieszkania na parterze",
    "Pożar poddasza w domu jednorodzinnym, domownicy ewakuowali się na zewnątrz",
    "Pali się sterta gałęzi i drewniana szopa na terenie ogródków działkowych",
    "Pożar ciągnika rolniczego podczas prac polowych, ogień obejmuje kabinę",
    "Z okna mieszkania na drugim piętrze wydobywa się gęsty szary dym, brak kontaktu z lokatorem",
    "Pali się rozdzielnia elektryczna na korytarzu budynku usługowego",
    "Pożar poszycia leśnego, ogień szybko przesuwa się z wiatrem w stronę młodnika",
    "Płonie stodoła wypełniona słomą, zagrożony sąsiedni budynek mieszkalny",
    "Pożar kotłowni na paliwo stałe w piwnicy domu jednorodzinnego, silne zadymienie",
    "Pali się kuchnia w mieszkaniu, zapalił się olej na kuchence gazowej",
    "Pożar naczepy samochodu ciężarowego na drodze, palą się opony",
    "Zauważono ogień w opuszczonej hali magazynowej, słychać trzask pękającego eternitu",
    "Pali się kontener budowlany oraz składowane obok materiały styropianowe",
    "Pożar instalacji fotowoltaicznej na dachu budynku mieszkalnego, widać iskrzenie i dym",
    "Płonie garaż blaszany przy posesji, w środku znajduje się samochód i butla z gazem",
    "Pożar bel słomy złożonych na skraju pola, silne zadymienie widoczne z kilku kilometrów",
    "Dym wydobywający się spod maski autobusu komunikacji lokalnej, pasażerowie opuścili pojazd",
    "Pali się drewniana wiata rekreacyjna oraz składowane pod nią drewno opałowe",
    "Pożar w warsztacie samochodowym, gęsty czarny dym wydostaje się przez bramę wjazdową",
    "Wzbudzenie czujki dymu oraz wyczuwalny zapach spalenizny w piwnicy budynku mieszkalnego"
];

const fallbackPhrasesMZ = [
    "Samochód uderzył w przydrożne drzewo, kierowca zakleszczony w pojeździe",
    "Silny wiatr zerwał połowę dachu z budynku mieszkalnego, blacha zwisa nad chodnikiem",
    "Podejrzenie silnego wycieku gazu z instalacji w piwnicy budynku",
    "Duże drzewo całkowicie zablokowało oba pasy ruchu na drodze powiatowej",
    "Zderzenie dwóch samochodów osobowych na skrzyżowaniu, wyciek płynów eksploatacyjnych, jedna osoba ranna",
    "Czujnik tlenku węgla włączył się w łazience, dziecko skarży się na zawroty głowy i nudności",
    "Starsza osoba nie otwiera drzwi od wczoraj, słychać wołanie o pomoc z wnętrza mieszkania",
    "Plama oleju napędowego ciągnąca się na długości około 400 metrów na łuku drogi",
    "Samochód dostawczy wjechał do przydrożnego rowu i przewrócił się na bok, kierowca nie może wyjść",
    "Nadłamany gruby konar drzewa wisi bezpośrednio nad linią energetyczną i placem zabaw",
    "Zalana piwnica oraz kotłownia w budynku mieszkalnym po gwałtownej ulewie",
    "Gniazdo szerszeni pod podbitką dachową tuż nad wejściem do budynku mieszkalnego",
    "Wywrócona łódka wędkarska na jeziorze, dwie osoby w wodzie trzymają się kadłuba",
    "Rozszczelnienie mauzera z nieznaną substancją chemiczną na terenie bazy transportowej",
    "Potrącenie pieszego na przejściu, poszkodowany nieprzytomny, brak wolnej karetki PRM w rejonie",
    "Koń wpadł do głębokiego rowu melioracyjnego i nie jest w stanie samodzielnie wyjść",
    "Uszkodzona rura gazowa średniego ciśnienia podczas prac koparką na posesji",
    "Zatrzaśnięte małe dziecko w samochodzie osobowym na parkingu przed sklepem",
    "Zawalenie się części stropu w remontowanym starym budynku, jedna osoba przygnieciona gruzem",
    "Zespół Ratownictwa Medycznego prosi o pomoc w zniesieniu otyłego pacjenta z trzeciego piętra",
    "Pęknięta ściana nośna w starej kamienicy, słychać trzaski konstrukcji, mieszkańcy obawiają się zawalenia",
    "Samochód ciężarowy uszkodził barierki energochłonne, rozbity zbiornik paliwa, wyciek ropy do rowu",
    "Mężczyzna spadł z rusztowania podczas prac elewacyjnych na wysokości około 6 metrów",
    "Zaginiona starsza osoba chora na alzheimera wyszła z domu w kierunku kompleksu leśnego",
    "Zerwana linia niskiego napięcia iskrzy na mokrej nawierzchni drogi po uderzeniu wiatru",
    "Sarna uwięziona między metalowymi przęsłami ogrodzenia posesji, rani się próbując uwolnić"
];

function generateRandomPolishCaller() {
    const isFemale = Math.random() < 0.48;
    const first = isFemale ? callersFemaleFirst[Math.floor(Math.random() * callersFemaleFirst.length)] : callersMaleFirst[Math.floor(Math.random() * callersMaleFirst.length)];
    const last = isFemale ? callersFemaleLast[Math.floor(Math.random() * callersFemaleLast.length)] : callersMaleLast[Math.floor(Math.random() * callersMaleLast.length)];
    const prefixes = ["50", "51", "53", "57", "60", "66", "69", "72", "78", "79", "88"];
    const numStr = `${prefixes[Math.floor(Math.random() * prefixes.length)]}${Math.floor(Math.random() * 9000000 + 1000000)}`;
    return `${first} ${last} (tel. ${numStr.slice(0, 3)}-${numStr.slice(3, 6)}-${numStr.slice(6, 9)})`;
}

let currentCountyId = "wejherowski";
let currentCountyCallsign = "Wejherowo 998";
let currentUserRank = "asp.";
let currentUserName = "";

let locationsDatabase = { ...COUNTY_PROFILES.wejherowski.locationsDatabase };
let townsList = Object.keys(locationsDatabase);
let realStreetsByTown = { ...COUNTY_PROFILES.wejherowski.realStreetsByTown };
let gpsCoords = { ...COUNTY_PROFILES.wejherowski.gpsCoords };
let unitExactLocations = JSON.parse(JSON.stringify(COUNTY_PROFILES.wejherowski.unitExactLocations));
let unitsPSP = JSON.parse(JSON.stringify(COUNTY_PROFILES.wejherowski.unitsPSP));
let unitsOSP = JSON.parse(JSON.stringify(COUNTY_PROFILES.wejherowski.unitsOSP));

let events = [];
let activeEditingId = null;
let selectedEvIdForRadio = null;
let selectedVehicles = [];
let servicesState = { prm: false, police: false };
let currentCPRData = null;
let cprCounter = 101;
let openRadioWindows = {};
let mainRadioLogs = [];
let mainRadioModalEl = null;

let simSpeed = 1;
let simIntervalId = null;
let autoCprTimeoutId = null;
let shiftStats = { cprTotalGenerated: 0, cprAccepted: 0, cprRefused: 0, refusalReasons: {} };
