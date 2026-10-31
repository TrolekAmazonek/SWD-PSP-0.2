// =========================================================================
// PLIK 1: data.js - BAZA DANYCH, PROFILE, POGODA I PEŁNE ZESPOŁY SGR
// =========================================================================

const APP_VERSION = "SWDST 0.32";

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
        if (typeof showKwAlertModal === 'function') showKwAlertModal(nextW.alert);
    }
}

// --- OFICJALNE ZESPOŁY SPECJALISTYCZNE SGR (ZGODNE Z GOV.PL I PSP) ---
const EXTERNAL_SPECIAL_GROUPS = {
    pomorskie: {
        sgrchem: [
            {
                groupName: "SGRChem Gdynia (JRG 1 Śródmieście)",
                vehicles: [
                    { id: "431[G]60", unitName: "JRG 1 Gdynia", name: "SRChem Iveco Eurocargo (Ciężki Chemiczny)", obsada: 3 },
                    { id: "431[G]61", unitName: "JRG 1 Gdynia", name: "SLRRChem Mercedes Sprinter (Rozpoznanie Chemiczne)", obsada: 2 },
                    { id: "431[G]64", unitName: "JRG 1 Gdynia", name: "SLRR Ford Ranger (Rozpoznawczo-Ratowniczy)", obsada: 2 },
                    { id: "431[G]90", unitName: "JRG 1 Gdynia", name: "SLRR Ford Ranger (Logistyka/Sztab)", obsada: 2 }
                ]
            }
        ],
        sgrt: [
            {
                groupName: "SGRT Tczew (JRG Tczew)",
                vehicles: [
                    { id: "401[G]43", unitName: "JRG Tczew", name: "SCRt Volvo / MEGA-CITY (Ciężki Tech)", obsada: 3 },
                    { id: "401[G]71", unitName: "JRG Tczew", name: "SCDz 70 Liebherr (Ciężki Dźwig Samochodowy)", obsada: 3 },
                    { id: "401[G]90", unitName: "JRG Tczew", name: "SLOp Nissan Qashqai (Dowodzenie)", obsada: 2 }
                ]
            }
        ],
        sgrwys: [
            {
                groupName: "SGRWys Rumia (JRG 2 Rumia)",
                vehicles: [
                    { id: "552[G]72", unitName: "JRG 2 Rumia", name: "SRWys Mercedes Atego (Ratownictwo Wysokościowe)", obsada: 3 },
                    { id: "552[G]51", unitName: "JRG 2 Rumia", name: "SD-32 Mercedes Atego (Podnośnik Hydrauliczny)", obsada: 2 }
                ]
            }
        ],
        sgrwn: [
            {
                groupName: "SGRWN Gdańsk (JRG 2 Śródmieście)",
                vehicles: [
                    { id: "302[G]81", unitName: "JRG 2 Gdańsk", name: "SRw Mercedes Atego 4x4 (Wodno-Nurkowy)", obsada: 4 },
                    { id: "302[G]Ł1", unitName: "JRG 2 Gdańsk", name: "Przyczepa transportowa z łodzią motorową", obsada: 2 }
                ]
            },
            {
                groupName: "SGRWN Kościerzyna (JRG Kościerzyna)",
                vehicles: [
                    { id: "441[G]81", unitName: "JRG Kościerzyna", name: "SRW Iveco (Wodno-Nurkowy)", obsada: 3 },
                    { id: "441[G]90", unitName: "JRG Kościerzyna", name: "SLKw Nissan Navara (Kwaterunkowy/Wsparcie)", obsada: 2 },
                    { id: "441[G]Ł1", unitName: "JRG Kościerzyna", name: "Łódź ratownicza z silnikiem zaburtowym", obsada: 2 }
                ]
            }
        ]
    },
    slaskie: {
        sgrchem: [
            {
                groupName: "SGRChem Gliwice (JRG 2)",
                vehicles: [
                    { id: "602[S]60", unitName: "JRG 2 Gliwice", name: "SRChem MAN TGM (Chemiczny)", obsada: 3 },
                    { id: "602[S]64", unitName: "JRG 2 Gliwice", name: "SLRRChem Mercedes (Rozpoznanie)", obsada: 2 }
                ]
            }
        ],
        sgrt: [
            {
                groupName: "SGRT Wodzisław Śląski (JRG)",
                vehicles: [
                    { id: "681[S]43", unitName: "JRG Wodzisław Śl.", name: "SRt MAN TGM (Techniczny)", obsada: 3 },
                    { id: "681[S]71", unitName: "JRG Wodzisław Śl.", name: "SCRt Jelcz (Ciężki Dźwig)", obsada: 3 }
                ]
            }
        ],
        sgrwys: [
            {
                groupName: "SGRWys JRG 1 Katowice",
                vehicles: [
                    { id: "601[S]72", unitName: "JRG 1 Katowice", name: "SRWys Iveco (Wysokościowy)", obsada: 3 },
                    { id: "601[S]51", unitName: "JRG 1 Katowice", name: "SD-42 Iveco (Drabina)", obsada: 2 }
                ]
            }
        ],
        sgrwn: [
            {
                groupName: "SGRWN Częstochowa (JRG 1)",
                vehicles: [
                    { id: "221[S]81", unitName: "JRG 1 Częstochowa", name: "SRW Iveco (Wodno-Nurkowy)", obsada: 3 }
                ]
            }
        ]
    }
};

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
            ["Wejherowo", "m. Wejherowo", 54.6052, 18.2345, ["ul. Jana III Sobieskiego", "ul. 12 Marca", "ul. Gdańska", "ul. Tartaczna", "ul. 3 Maja"]],
            ["Bolszewo", "gm. Wejherowo", 54.6155, 18.1772, ["ul. Zamostna", "ul. Strażacka", "ul. Główna", "ul. Wejherowska"]],
            ["Rumia", "m. Rumia", 54.5798, 18.3973, ["ul. Grunwaldzka", "ul. Dąbrowskiego", "ul. Starowiejska"]],
            ["Reda", "m. Reda", 54.6053, 18.3478, ["ul. Wejherowska", "ul. Gdańska", "ul. Pucka"]],
            ["Gościcino", "gm. Wejherowo", 54.5975, 18.1458, ["ul. Drzewiarza", "ul. Wejherowska"]]
        ],
        psp: [
            ["JRG 1 Wejherowo", "Wejherowo", "ul. Tartaczna 5", 54.6075, 18.2195, true, [
                ["551[G]21", "GBA 2,5/16 Volvo FL280/Bocar", 6], ["551[G]25", "GCBA 5,4/25 Man TGM/Bocar", 4],
                ["551[G]53", "SH-40 Volvo/Bumar", 2], ["551[G]90", "SLRr Ford Ranger", 2], ["551[G]P05", "Przyczepa EKO", 0], ["551[G]Ł01", "Przyczepa z pontonem", 0]
            ]],
            ["JRG 2 Rumia", "Rumia", "ul. Świętego Floriana 1", 54.5798, 18.3973, true, [
                ["552[G]21", "GBAPr 2,5/28 MB Atego", 4], ["552[G]25", "GCBA 5/32 Scania", 4], ["552[G]90", "SLRr Isuzu", 2]
            ]],
            ["KP PSP Wejherowo", "Wejherowo", "ul. Tartaczna 5", 54.6077, 18.2199, true, [["550[G]90", "SLOp Skoda", 1]]]
        ],
        osp: [
            [".OSP KSRG Bolszewo", "Bolszewo", "ul. Zamostna 4A", 54.6156, 18.1772, true, [["559[G]56", "GBA 2,5/16 Star", 6], ["559[G]Q01", "Quad CF MOTO", 1]]],
            [".OSP KSRG Gościcino", "Gościcino", "ul. Drzewiarza 22", 54.5975, 18.1458, false, [["559[G]63", "GBA 2,5/16 Volvo", 6]]]
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
            [".OSP KSRG Racibórz-Markowice", "Racibórz", "ul. Kpt. St. Myśliwca 9", 50.1197, 18.2683, true, [["569[S]67", "GBA 3/16 Volvo", 6]]]
        ]
    }
];

const COUNTY_PROFILES = {};
RAW_PROFILES.forEach(rp => { COUNTY_PROFILES[rp.id] = unpackProfile(rp); });

const subtypesData = {
    "P": ["P - Inne pożary", "P - Obiekty mieszkalne", "P - Obiekty gospodarcze", "P - Trawy i lasy"],
    "MZ": ["Inne MZ", "MZ - Drogowe", "MZ - Chemiczne", "MZ - Atmosferyczne", "MZ - Poszukiwanie osób"],
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
