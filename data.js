// =========================================================================
// PLIK 1: data.js - BAZA DANYCH, 6 POWIATÓW, POGODA I WSZYSTKIE GRUPY SGR
// =========================================================================

const APP_VERSION = "SWDST 0.38";

const audioSelekt = new Audio('selekt.wav');
const audioCpr = new Audio('nowe zdarzenie odbierz.mp3');
const audioMotorola = new Audio('motorola.ogg');

function playSound(type) {
    if (type === 'cpr') { audioCpr.currentTime = 0; audioCpr.play().catch(() => {}); }
    else if (type === 'motorola') { audioMotorola.currentTime = 0; audioMotorola.play().catch(() => {}); }
}

let currentWeatherData = {
    condition: "NORMAL",
    label: "☀️ Słonecznie / Stabilnie",
    multiplier: 1.0,
    cprFreqMultiplier: 1.0
};

const weatherScenarios = [
    { condition: "NORMAL", label: "☀️ Słonecznie / Stabilnie", mult: 1.0, freq: 1.0, alert: null },
    { condition: "DROUGHT", label: "🔥 Susza i wysokie zagrożenie pożarowe", mult: 1.3, freq: 1.2, alert: "Komunikat KW PSP: W związku z długotrwałą suszą obowiązuje 3. stopień zagrożenia pożarowego lasów!" },
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
        audioCpr.currentTime = 0; audioCpr.play().catch(() => {});
        logToMainRadio("STANOWISKO KIEROWANIA KW PSP", nextW.alert, "#ff00ff", true);
    }
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
        desc: "Woj. pomorskie • JRG 1 Wejherowo, JRG 2 Rumia, wszystkie SGR + OSP",
        voivodeship: "pomorskie", countyName: "pow. wejherowski", mapCenter: [54.6052, 18.2345], bbox: "17.65,54.38,18.50,54.85",
        jrgList: ["JRG 1 Wejherowo", "JRG 2 Rumia"], defaultTown: "Bolszewo",
        towns: [
            ["Wejherowo", "m. Wejherowo", 54.6052, 18.2345, ["ul. Jana III Sobieskiego", "ul. 12 Marca", "ul. Gdańska", "ul. Tartaczna"]],
            ["Bolszewo", "gm. Wejherowo", 54.6155, 18.1772, ["ul. Zamostna", "ul. Strażacka", "ul. Główna"]],
            ["Rumia", "m. Rumia", 54.5798, 18.3973, ["ul. Grunwaldzka", "ul. Dąbrowskiego", "ul. Starowiejska"]]
        ],
        psp: [
            ["JRG 1 Wejherowo", "Wejherowo", "ul. Tartaczna 5", 54.6075, 18.2195, true, [
                ["551[G]21", "GBA 2,5/16 Volvo", 6], ["551[G]25", "GCBA 5,4/25 Man", 4], ["551[G]53", "SH-40 Volvo", 2]
            ]],
            ["JRG 2 Rumia", "Rumia", "ul. Świętego Floriana 1", 54.5798, 18.3973, true, [
                ["552[G]21", "GBAPr 2,5/28 MB", 4], ["552[G]25", "GCBA 5/32 Scania", 4]
            ]],
            ["SGRChem Gdynia", "Gdynia", "ul. Władysława IV 12", 54.5221, 18.5364, true, [
                ["431[G]60", "SRChem Iveco Eurocargo (Ciężki Chemiczny)", 3],
                ["431[G]61", "SLRRChem Mercedes Sprinter (Rozpoznanie)", 2],
                ["431[G]64", "SLRR Ford Ranger (Rozpoznawczo-Ratowniczy)", 2]
            ]],
            ["SGRT Tczew", "Tczew", "ul. 1 Maja 10", 54.0912, 18.7831, true, [
                ["401[G]43", "SCRt Volvo / MEGA-CITY (Techniczny)", 3],
                ["401[G]71", "SCDz 70 Liebherr (Ciężki Dźwig Samochodowy)", 3],[cite: 1]
                ["401[G]90", "SLOp Nissan Qashqai (Dowodzenie)", 2][cite: 1]
            ]],
            ["SGRWys Rumia", "Rumia", "ul. Świętego Floriana 1", 54.5798, 18.3973, true, [
                ["552[G]72", "SRWys Mercedes Atego (Wysokościowy)", 3],
                ["552[G]51", "SD-32 Mercedes Atego (Podnośnik)", 2]
            ]],
            ["SGRWN Gdańsk", "Gdańsk", "ul. Siennicka 29", 54.3522, 18.6752, true, [
                ["302[G]81", "SRw Mercedes Atego 4x4 (Wodno-Nurkowy)", 4],[cite: 3]
                ["302[G]Ł1", "Przyczepa z łodzią motorową", 2]
            ]],
            ["SGRWN Kościerzyna", "Kościerzyna", "ul. Wojska Polskiego", 54.1200, 17.9800, true, [
                ["441[G]81", "SRW Iveco (Wodno-Nurkowy)", 3],[cite: 4]
                ["441[G]90", "SLKw Nissan Navara (Kwaterunkowy)", 2],[cite: 4]
                ["441[G]Ł1", "Łódź ratownicza z silnikiem zaburtowym", 2][cite: 4]
            ]]
        ],
        osp: [
            [".OSP KSRG Bolszewo", "Bolszewo", "ul. Zamostna 4A", 54.6156, 18.1772, true, [["559[G]56", "GBA 2,5/16 Star", 6], ["559[G]Q01", "Quad CF MOTO", 1]]]
        ]
    },
    {
        id: "pucki", name: "KP PSP Puck (Powiat Pucki)", radioCallsign: "Puck 998",
        desc: "Woj. pomorskie • JRG Puck + SGR + OSP",
        voivodeship: "pomorskie", countyName: "pow. pucki", mapCenter: [54.7180, 18.4080], bbox: "18.00,54.55,18.85,54.85",
        jrgList: ["JRG Puck"], defaultTown: "Puck",
        towns: [["Puck", "m. Puck", 54.7178, 18.4083, ["ul. Żarnowiecka", "ul. 1 Maja"]]],
        psp: [
            ["JRG Puck", "Puck", "ul. Żarnowiecka 7", 54.7185, 18.3976, true, [["501[G]21", "GBA MAN", 6], ["501[G]43", "SRt Scania", 3]]],
            ["SGRT Tczew", "Tczew", "ul. 1 Maja 10", 54.0912, 18.7831, true, [["401[G]43", "SCRt Volvo", 3], ["401[G]71", "SCDz 70 Liebherr", 3]]][cite: 1]
        ],
        osp: [[".OSP KSRG Władysławowo", "Władysławowo", "ul. Gdańska", 54.7865, 18.4042, true, [["509[G]64", "GBA Volvo", 6]]]]
    },
    {
        id: "leborski", name: "KP PSP Lębork (Powiat Lęborski)", radioCallsign: "Lębork 998",
        desc: "Woj. pomorskie • JRG Lębork + SGR + OSP",
        voivodeship: "pomorskie", countyName: "pow. lęborski", mapCenter: [54.5442, 17.7525], bbox: "17.40,54.35,17.95,54.80",
        jrgList: ["JRG Lębork"], defaultTown: "Lębork",
        towns: [["Lębork", "m. Lębork", 54.5442, 17.7525, ["ul. Ogniowa"]]],
        psp: [
            ["JRG Lębork", "Lębork", "ul. Ogniowa 2", 54.5446, 17.7532, true, [["451[G]21", "GBAPr MAN", 6], ["451[G]43", "SRt Scania", 3]]],
            ["SGRWys Rumia", "Rumia", "ul. Świętego Floriana 1", 54.5798, 18.3973, true, [["552[G]72", "SRWys Mercedes", 3]]]
        ],
        osp: [[".OSP KSRG Łeba", "Łeba", "ul. Kościuszki", 54.7608, 17.5561, true, [["459[G]21", "GBA Iveco", 6]]]]
    },
    {
        id: "gdynia", name: "KM PSP Gdynia (Miasto Gdynia)", radioCallsign: "Gdynia 998",
        desc: "Woj. pomorskie • JRG 1-4 + SGR + OSP",
        voivodeship: "pomorskie", countyName: "m. Gdynia", mapCenter: [54.5189, 18.5305], bbox: "18.35,54.43,18.60,54.58",
        jrgList: ["JRG 1 Gdynia Śródmieście", "JRG 2 Gdynia Chylonia"], defaultTown: "Gdynia Śródmieście",
        towns: [["Gdynia Śródmieście", "m. Gdynia", 54.5189, 18.5305, ["ul. Władysława IV"]]],
        psp: [
            ["JRG 1 Gdynia Śródmieście", "Gdynia", "ul. Władysława IV", 54.5221, 18.5364, true, [["341[G]21", "GBA MAN", 6]]],
            ["SGRChem Gdynia", "Gdynia", "ul. Władysława IV 12", 54.5221, 18.5364, true, [
                ["431[G]60", "SRChem Iveco", 3], ["431[G]61", "SLRRChem Mercedes", 2], ["431[G]64", "SLRR Ford", 2]
            ]]
        ],
        osp: [[".OSP KSRG Gdynia-Wiczlino", "Gdynia", "ul. Filipkowskiego", 54.4925, 18.4219, true, [["349[G]01", "GBA Star", 6]]]]
    },
    {
        id: "gdansk", name: "KM PSP Gdańsk (Miasto Gdańsk)", radioCallsign: "Gdańsk 998",
        desc: "Woj. pomorskie • JRG 1-6 + SGR + OSP",
        voivodeship: "pomorskie", countyName: "m. Gdańsk", mapCenter: [54.3520, 18.6466], bbox: "18.42,54.27,18.95,54.45",
        jrgList: ["JRG 1 Gdańsk Wrzeszcz", "JRG 2 Gdańsk Śródmieście"], defaultTown: "Gdańsk Śródmieście",
        towns: [["Gdańsk Śródmieście", "m. Gdańsk", 54.3485, 18.6532, ["ul. Długa"]]],
        psp: [
            ["JRG 1 Gdańsk Wrzeszcz", "Gdańsk", "ul. Sosnowa 2", 54.3768, 18.5985, true, [["301[G]21", "GBA Renault", 6]]],
            ["SGRWN Gdańsk", "Gdańsk", "ul. Siennicka 29", 54.3522, 18.6752, true, [["302[G]81", "SRw Mercedes Atego 4x4", 4], ["302[G]Ł1", "Łódź motorowa", 2]]][cite: 3]
        ],
        osp: [[".OSP KSRG Gdańsk-Sobieszewo", "Gdańsk", "ul. Turystyczna", 54.3375, 18.8285, true, [["309[G]31", "GBA Mercedes", 6]]]]
    },
    {
        id: "raciborski", name: "KP PSP Racibórz (Powiat Raciborski)", radioCallsign: "Racibórz 998",
        desc: "Woj. śląskie • JRG Racibórz + SGR Śląsk + OSP",
        voivodeship: "śląskie", countyName: "pow. raciborski", mapCenter: [50.0919, 18.2198], bbox: "17.95,49.90,18.55,50.25",
        jrgList: ["JRG Racibórz"], defaultTown: "Racibórz",
        towns: [["Racibórz", "m. Racibórz", 50.0919, 18.2198, ["ul. Reymonta"]]],
        psp: [
            ["JRG Racibórz", "Racibórz", "ul. Reymonta 8", 50.0956, 18.2215, true, [["561[S]21", "GBA Renault", 6]]],
            ["SGRChem Gliwice", "Gliwice", "ul. Toszecka", 50.3120, 18.6750, true, [["602[S]60", "SRChem MAN", 3], ["602[S]64", "SLRRChem", 2]]]
        ],
        osp: [[".OSP KSRG Racibórz-Markowice", "Racibórz", "ul. Myśliwca", 50.1197, 18.2683, true, [["569[S]67", "GBA Volvo", 6]]]]
    }
];

const COUNTY_PROFILES = {};
RAW_PROFILES.forEach(rp => { COUNTY_PROFILES[rp.id] = unpackProfile(rp); });

const subtypesData = {
    "P": ["P - Inne pożary", "P - Obiekty mieszkalne", "P - Trawy i lasy"],
    "MZ": ["Inne MZ", "MZ - Drogowe", "MZ - Chemiczne", "MZ - Wypadek", "MZ - Topienie się"],
    "AF": ["AF - Fałszywy z instalacji"],
    "CW": ["CW - Zagrożenie chemiczne"],
    "WG": ["WG - Wybuch gazu"],
    "BL": ["BL - Budynek zagrożony"],
    "ZPR": ["ZPR - Promeniotwórcze"],
    "PZR": []
};

const callersMaleFirst = ["Jan", "Piotr", "Tomasz", "Michał", "Krzysztof", "Andrzej", "Paweł", "Marek", "Adam", "Łukasz"];
const callersMaleLast = ["Kowalski", "Nowak", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński"];
const callersFemaleFirst = ["Anna", "Katarzyna", "Magdalena", "Agnieszka", "Małgorzata", "Krystyna", "Barbara", "Ewa"];
const callersFemaleLast = ["Kowalska", "Nowak", "Wiśniewska", "Wójcik", "Kowalczyk", "Kamińska", "Lewandowska"];

const fallbackPhrasesP = ["Pali się sadza w kominie", "Czarny dym z budynku gospodarczego", "Pożar trawy w pobliżu lasu", "Pożar samochodu osobowego"];
const fallbackPhrasesMZ = ["Samochód uderzył w drzewo, zakleszczony kierowca", "Silny wiatr zerwał dach", "Wyciek substancji chemicznej na drodze"];

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
