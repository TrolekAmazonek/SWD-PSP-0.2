// =========================================================================
// PLIK 1: data.js - BAZA DANYCH, 6 POWIATÓW, POGODA I WSZYSTKIE GRUPY SGR
// =========================================================================

const APP_VERSION = "SWDST 0.44";

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
            ["Wejherowo", "m. Wejherowo", 54.6052, 18.2345, ["ul. Jana III Sobieskiego", "ul. 12 Marca", "ul. Gdańska", "ul. Tartaczna", "ul. 3 Maja"]],
            ["Bolszewo", "gm. Wejherowo", 54.6155, 18.1772, ["ul. Zamostna", "ul. Strażacka", "ul. Główna", "ul. Wejherowska"]],
            ["Rumia", "m. Rumia", 54.5798, 18.3973, ["ul. Grunwaldzka", "ul. Dąbrowskiego", "ul. Starowiejska"]],
            ["Reda", "m. Reda", 54.6053, 18.3478, ["ul. Wejherowska", "ul. Gdańska", "ul. Pucka"]],
            ["Gościcino", "gm. Wejherowo", 54.5975, 18.1458, ["ul. Drzewiarza", "ul. Wejherowska"]]
        ],
        psp: [
            ["JRG 1 Wejherowo", "Wejherowo", "ul. Tartaczna 5", 54.6075, 18.2195, true, [
                ["551[G]21", "GBA 2,5/16 Volvo", 6], ["551[G]25", "GCBA 5,4/25 Man", 4], ["551[G]53", "SH-40 Volvo", 2], ["551[G]90", "SLRr Ford", 2]
            ]],
            ["JRG 2 Rumia", "Rumia", "ul. Świętego Floriana 1", 54.5798, 18.3973, true, [
                ["552[G]21", "GBAPr 2,5/28 MB", 4], ["552[G]25", "GCBA 5/32 Scania", 4], ["552[G]72", "SRWys Mercedes (SGRWys)", 3]
            ]],
            ["KP PSP Wejherowo", "Wejherowo", "ul. Tartaczna 5", 54.6077, 18.2199, true, [["550[G]90", "SLOp Skoda", 1]]]
        ],
        osp: [
            [".OSP KSRG Bolszewo", "Bolszewo", "ul. Zamostna 4A", 54.6156, 18.1772, true, [["559[G]56", "GBA 2,5/16 Star", 6], ["559[G]Q01", "Quad CF MOTO", 1]]],
            ["OSP Rumia", "Rumia", "ul. Św. Floriana 1", 54.5798, 18.3973, false, [["557[G]06", "GBA 3/16 Volvo FL 320", 6]]]
        ]
    },
    {
        id: "raciborski", name: "KP PSP Racibórz (Powiat Raciborski)", radioCallsign: "Racibórz 998",
        desc: "Woj. śląskie • JRG Racibórz + OSP KSRG",
        voivodeship: "śląskie", countyName: "pow. raciborski", mapCenter: [50.0919, 18.2198], bbox: "17.95,49.90,18.55,50.25",
        jrgList: ["JRG Racibórz"], defaultTown: "Racibórz",
        towns: [
            ["Racibórz", "m. Racibórz", 50.0919, 18.2198, ["ul. Władysława Reymonta", "ul. Opawska", "ul. Głubczycka"]],
            ["Kuźnia Raciborska", "gm. Kuźnia Raciborska", 50.2014, 18.3094, ["ul. Słowackiego", "ul. Staszica"]]
        ],
        psp: [
            ["JRG Racibórz", "Racibórz", "ul. Władysława Reymonta 8", 50.0956, 18.2215, true, [
                ["561[S]21", "GBA 2,5/24 Renault", 6], ["561[S]25", "GCBA 8/50 Renault", 4], ["561[S]90", "SLRr Ford", 2]
            ]],
            ["KP PSP Racibórz", "Racibórz", "ul. Władysława Reymonta 8", 50.0958, 18.2219, true, [["560[S]90", "SLOp Skoda", 1]]]
        ],
        osp: [
            [".OSP KSRG Racibórz-Markowice", "Racibórz", "ul. Myśliwca 9", 50.1197, 18.2683, true, [["569[S]67", "GBA 3/16 Volvo", 6]]],
            [".OSP KSRG Rudy", "Rudy", "ul. Rogera 2", 50.1942, 18.4481, false, [["569[S]28", "GBA Volvo", 6]]]
        ]
    }
];

const COUNTY_PROFILES = {};
RAW_PROFILES.forEach(rp => { COUNTY_PROFILES[rp.id] = unpackProfile(rp); });

const subtypesData = {
    "P": ["P - Inne pożary", "P - Obiekty mieszkalne", "P - Trawy i lasy"],
    "MZ": ["Inne MZ", "MZ - Drogowe", "MZ - Chemiczne", "MZ - Wypadek", "MZ - Topienie się"],
    "AF": ["AF - Alarm fałszywy"],
    "CW": ["CW - Ćwiczenia"],
    "WG": ["WG - Wyjazd gospodarczy"],
    "BL": ["BL - Budynek zagrożony"],
    "ZPR": ["ZPR - Promeniotwórcze"],
    "PZR": ["PZR - Przekazanie na zabezpieczenie rejonu]
};

const callersMaleFirst = ["Jan", "Piotr", "Tomasz", "Michał", "Krzysztof", "Andrzej", "Paweł", "Marek", "Adam", "Łukasz"];
const callersMaleLast = ["Kowalski", "Nowak", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński"];
const callersFemaleFirst = ["Anna", "Katarzyna", "Magdalena", "Agnieszka", "Małgorzata", "Krystyna", "Barbara", "Ewa"];
const callersFemaleLast = ["Kowalska", "Nowak", "Wiśniewska", "Wójcik", "Kowalczyk", "Kamińska", "Lewandowska"];

const fallbackPhrasesP = [
    "Pali się sadza w kominie", "Czarny dym z budynku gospodarczego", "Pożar trawy w pobliżu lasu", "Pożar samochodu osobowego", "Pożar sadzy w kominie budynku mieszkalnego"
];

const fallbackPhrasesMZ = [
    "Samochód uderzył w drzewo, zakleszczony kierowca", "Silny wiatr zerwał dach", "Wyciek substancji chemicznej na drodze", "Drzewo tarasuje jezdnię po silnym wietrze"
];

function generateRandomPolishCaller() {
    const isFemale = Math.random() < 0.48;
    const first = isFemale ? callersFemaleFirst[Math.floor(Math.random() * callersFemaleFirst.length)] : callersMaleFirst[Math.floor(Math.random() * callersMaleFirst.length)];
    const last = isFemale ? callersFemaleLast[Math.floor(Math.random() * callersFemaleLast.length)] : callersMaleLast[Math.floor(Math.random() * callersMaleLast.length)];
    return `${first} ${last} (tel. 50${Math.floor(Math.random() * 9000000 + 1000000)})`;
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
