// --- MODUŁ AUDIO ---
const audioSelekt = new Audio('selekt.wav');
const audioCpr = new Audio('nowe zdarzenie odbierz.mp3');
const audioMotorola = new Audio('motorola.ogg');

function playSound(type) {
    if (type === 'cpr') {
        audioCpr.currentTime = 0;
        audioCpr.play().catch(e => {});
    } else if (type === 'motorola') {
        audioMotorola.currentTime = 0;
        audioMotorola.play().catch(e => {});
    }
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
            }).catch(e => {});
        }
    }
    playNext();
}

// --- KLUCZE API ---
const _k = {
    g: "Z3NrX2dEQkRQMWhzenZtVjBQc010OWlXR2d5YjNGWUhzYW5FZ2twUEg2anNIWnY2WGFyY2o0QzM=",
    m: "QVEuQWI4Uk42SlNrZnU5ODBDQnBJUUZ0cnAtTEUxYkJYdU94ZzI0NmZmZUJXTmFSZUZkZ1E=",
    o: "c2stcHJvai1wRHZBV05wbDRnUzRzWlpFUkVSeWMtcGdxVGdXZEp1d3E5Y3pCMnhsc0JQZWd3Z3prbi16OEtidFVlQ2NxMHVlV2lnb0dhWDNpS1QzQmxia0ZKNk55MjJtWjMwTm41NnhjTlpZTYUzM3FUM3BtcUF6aGRfb3E4S2N1MTdCenRLVHQ4b1FkUUM5SFhuQlZsOWxxM2pxalBmbUE="
};

function decodeKey(b64) {
    try { return atob(b64); } catch(e) { return ""; }
}

// --- BEZPIECZNY SILNIK AI ---
async function callUniversalAI(systemPrompt, userPrompt, jsonMode = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${decodeKey(_k.g)}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.5,
                max_tokens: 160,
                ...(jsonMode ? { response_format: { type: "json_object" } } : {})
            })
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data.choices && data.choices[0]?.message?.content) {
            return data.choices[0].message.content.trim();
        }
    } catch (e) {}
    
    // Awaryjnie Pollinations
    try {
        const response = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'openai',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                temperature: 0.5,
                jsonMode: jsonMode
            })
        });
        if (response.ok) {
            const data = await response.json();
            if (data.choices && data.choices[0]?.message?.content) {
                return data.choices[0].message.content.trim();
            }
        }
    } catch (err) {}

    throw new Error("AI Offline");
}

// --- BAZA LOKALIZACJI ---
const locationsDatabase = {
    "Bolszewo": "gm. Wejherowo, pow. wejherowski, woj. pomorskie",
    "Wejherowo": "m. Wejherowo, pow. wejherowski, woj. pomorskie",
    "Rumia": "m. Rumia, pow. wejherowski, woj. pomorskie",
    "Reda": "m. Reda, pow. wejherowski, woj. pomorskie",
    "Gościcino": "gm. Wejherowo, pow. wejherowski, woj. pomorskie",
    "Gniewowo": "gm. Wejherowo, pow. wejherowski, woj. pomorskie",
    "Gowino": "gm. Wejherowo, pow. wejherowski, woj. pomorskie",
    "Góra": "gm. Wejherowo, pow. wejherowski, woj. pomorskie",
    "Kniewo": "gm. Wejherowo, pow. wejherowski, woj. pomorskie",
    "Nowy Dwór Wejherowski": "gm. Wejherowo, pow. wejherowski, woj. pomorskie",
    "Orle": "gm. Wejherowo, pow. wejherowski, woj. pomorskie",
    "Zbychowo": "gm. Wejherowo, pow. wejherowski, woj. pomorskie",
    "Luzino": "gm. Luzino, pow. wejherowski, woj. pomorskie",
    "Zelewo": "gm. Luzino, pow. wejherowski, woj. pomorskie",
    "Milwino": "gm. Luzino, pow. wejherowski, woj. pomorskie",
    "Szemud": "gm. Szemud, pow. wejherowski, woj. pomorskie",
    "Kielno": "gm. Szemud, pow. wejherowski, woj. pomorskie",
    "Bojano": "gm. Szemud, pow. wejherowski, woj. pomorskie",
    "Częstkowo": "gm. Szemud, pow. wejherowski, woj. pomorskie",
    "Łebno": "gm. Szemud, pow. wejherowski, woj. pomorskie",
    "Przetoczyno": "gm. Szemud, pow. wejherowski, woj. pomorskie",
    "Gniewino": "gm. Gniewino, pow. wejherowski, woj. pomorskie",
    "Nadole": "gm. Gniewino, pow. wejherowski, woj. pomorskie",
    "Kostkowo": "gm. Gniewino, pow. wejherowski, woj. pomorskie",
    "Rybno": "gm. Gniewino, pow. wejherowski, woj. pomorskie",
    "Opalino": "gm. Gniewino, pow. wejherowski, woj. pomorskie",
    "Choczewo": "gm. Choczewo, pow. wejherowski, woj. pomorskie",
    "Słajszewo": "gm. Choczewo, pow. wejherowski, woj. pomorskie",
    "Sasino": "gm. Choczewo, pow. wejherowski, woj. pomorskie",
    "Kopalino": "gm. Choczewo, pow. wejherowski, woj. pomorskie",
    "Linia": "gm. Linia, pow. wejherowski, woj. pomorskie",
    "Strzepcz": "gm. Linia, pow. wejherowski, woj. pomorskie",
    "Lewino": "gm. Linia, pow. wejherowski, woj. pomorskie",
    "Łęczyce": "gm. Łęczyce, pow. wejherowski, woj. pomorskie",
    "Bożepole Wielkie": "gm. Łęczyce, pow. wejherowski, woj. pomorskie",
    "Rozłazino": "gm. Łęczyce, pow. wejherowski, woj. pomorskie",
    "Kaczkowo": "gm. Łęczyce, pow. wejherowski, woj. pomorskie"
};

const townsList = Object.keys(locationsDatabase);

const coordsMap = {
    "Wejherowo": { x: 0, y: 0 },
    "Bolszewo": { x: -4, y: 1 },
    "Gościcino": { x: -6, y: 0 },
    "Gowino": { x: -5, y: -3 },
    "Góra": { x: -5, y: 4 },
    "Orle": { x: -6, y: 3 },
    "Kniewo": { x: -7, y: 5 },
    "Rybno": { x: -9, y: 8 },
    "Gniewowo": { x: 4, y: -4 },
    "Zbychowo": { x: 3, y: -6 },
    "Nowy Dwór Wejherowski": { x: 0, y: -6 },
    "Reda": { x: 7, y: -1 },
    "Rumia": { x: 12, y: -3 },
    "Luzino": { x: -11, y: -1 },
    "Zelewo": { x: -9, y: 3 },
    "Milwino": { x: -11, y: -5 },
    "Szemud": { x: -5, y: -13 },
    "Przetoczyno": { x: -4, y: -9 },
    "Częstkowo": { x: -8, y: -9 },
    "Łebno": { x: -11, y: -12 },
    "Kielno": { x: 1, y: -15 },
    "Bojano": { x: 4, y: -14 },
    "Gniewino": { x: -14, y: 13 },
    "Nadole": { x: -14, y: 16 },
    "Kostkowo": { x: -12, y: 10 },
    "Opalino": { x: -12, y: 15 },
    "Choczewo": { x: -22, y: 16 },
    "Słajszewo": { x: -27, y: 19 },
    "Sasino": { x: -29, y: 20 },
    "Kopalino": { x: -24, y: 20 },
    "Linia": { x: -24, y: -11 },
    "Strzepcz": { x: -16, y: -11 },
    "Lewino": { x: -18, y: -9 },
    "Łęczyce": { x: -19, y: 1 },
    "Bożepole Wielkie": { x: -15, y: -1 },
    "Rozłazino": { x: -21, y: -3 },
    "Kaczkowo": { x: -18, y: 4 }
};

// Współrzędne GPS dla mapy Leaflet
const gpsCoords = {
    "Wejherowo": [54.6059, 18.2443],
    "Bolszewo": [54.5982, 18.2014],
    "Rumia": [54.5714, 18.3879],
    "Reda": [54.6062, 18.3475],
    "Gościcino": [54.5824, 18.1513],
    "Gniewowo": [54.5422, 18.2691],
    "Gowino": [54.5711, 18.2001],
    "Góra": [54.6394, 18.1923],
    "Kniewo": [54.6644, 18.1064],
    "Nowy Dwór Wejherowski": [54.5412, 18.2215],
    "Orle": [54.6291, 18.1812],
    "Zbychowo": [54.5211, 18.2812],
    "Luzino": [54.5434, 18.0822],
    "Zelewo": [54.5812, 18.0514],
    "Milwino": [54.5121, 18.0412],
    "Szemud": [54.4533, 18.2011],
    "Kielno": [54.4412, 18.3214],
    "Bojano": [54.4712, 18.3912],
    "Częstkowo": [54.4711, 18.1012],
    "Łebno": [54.4512, 18.0712],
    "Przetoczyno": [54.5122, 18.1412],
    "Gniewino": [54.7214, 17.9712],
    "Nadole": [54.7412, 18.0312],
    "Kostkowo": [54.6812, 18.0112],
    "Rybno": [54.6812, 18.0812],
    "Opalino": [54.7012, 18.0512],
    "Choczewo": [54.7412, 17.9112],
    "Słajszewo": [54.7812, 17.8512],
    "Sasino": [54.7912, 17.7812],
    "Kopalino": [54.8112, 17.8112],
    "Linia": [54.4312, 17.9312],
    "Strzepcz": [54.4412, 18.0212],
    "Lewino": [54.4712, 17.9012],
    "Łęczyce": [54.6112, 18.0112],
    "Bożepole Wielkie": [54.5812, 17.9312],
    "Rozłazino": [54.5812, 17.8612],
    "Kaczkowo": [54.6212, 17.9312]
};

const unitBaseTown = {
    "JRG 1 Wejherowo": "Wejherowo",
    "KP PSP Wejherowo": "Wejherowo",
    "JRG 2 Rumia": "Rumia",
    ".OSP KSRG Bolszewo": "Bolszewo",
    ".OSP KSRG Gościcino": "Gościcino",
    ".OSP KSRG Wejherowo": "Wejherowo",
    ".OSP KSRG Reda": "Reda",
    ".OSP KSRG Luzino": "Luzino",
    ".OSP KSRG Zelewo": "Zelewo",
    ".OSP KSRG Szemud": "Szemud",
    ".OSP KSRG Kielno": "Kielno",
    ".OSP KSRG Bojano": "Bojano",
    ".OSP KSRG Gniewino": "Gniewino",
    ".OSP KSRG Nadole": "Nadole",
    ".OSP KSRG Kostkowo": "Kostkowo",
    ".OSP KSRG Choczewo": "Choczewo",
    ".OSP KSRG Słajszewo": "Słajszewo",
    ".OSP KSRG Sasino": "Sasino",
    ".OSP KSRG Linia": "Linia",
    ".OSP KSRG Strzepcz": "Strzepcz",
    ".OSP KSRG Łęczyce": "Łęczyce",
    ".OSP KSRG Rozłazino": "Rozłazino",
    ".OSP KSRG Bożepole Wielkie": "Bożepole Wielkie",
    "OSP Kopalino": "Kopalino",
    "OSP Rybno": "Rybno",
    "OSP Lewino": "Lewino",
    "OSP Milwino": "Milwino",
    "OSP Kaczkowo": "Kaczkowo",
    "OSP Częstkowo": "Częstkowo",
    "OSP Łebno": "Łebno",
    "OSP Przetoczyno": "Przetoczyno",
    "OSP Gowino": "Gowino",
    "OSP Kniewo": "Kniewo",
    "OSP Orle": "Orle",
    "OSP Zbychowo": "Zbychowo",
    "OSP Gniewowo": "Gniewowo",
    "OSP Góra": "Góra",
    "OSP Opalino": "Opalino",
    "OSP Nowy Dwór Wejherowski": "Nowy Dwór Wejherowski"
};

function getUnitProximity(unitName, city) {
    const baseTown = unitBaseTown[unitName] || "Wejherowo";
    const targetTown = Object.keys(coordsMap).find(
        c => c.toLowerCase() === (city || "").trim().toLowerCase()
    ) || "Wejherowo";

    if (baseTown.toLowerCase() === targetTown.toLowerCase()) {
        const isJRG = unitName.includes("JRG");
        return { sec: isJRG ? 15 : 18, km: isJRG ? "1.2 km" : "1.5 km" };
    }

    const c1 = coordsMap[baseTown] || { x: 0, y: 0 };
    const c2 = coordsMap[targetTown] || { x: 0, y: 0 };
    const dist = Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2)) * 1.25;
    const kmRounded = Math.max(1.5, Math.round(dist * 10) / 10);
    const secCalc = Math.max(20, Math.round(kmRounded * 4.5));

    return { sec: secCalc, km: `${kmRounded.toFixed(1)} km` };
}

function calculateTravelTimeSeconds(unitName, city) {
    return getUnitProximity(unitName, city).sec;
}

function autoSelectJRGByCity(city) {
    const c = (city || "").trim().toLowerCase();
    const jrgVal = (c === "rumia" || c === "reda" || c === "bojano" || c === "kielno") ? "JRG 2 Rumia" : "JRG 1 Wejherowo";
    const elJrg = document.getElementById('inp-ev-jrg');
    const elLead = document.getElementById('inp-ev-lead');
    const elArea = document.getElementById('inp-ev-area');
    if(elJrg) elJrg.value = jrgVal;
    if(elLead) elLead.value = jrgVal;
    if(elArea) elArea.value = jrgVal;
}

const streetNames = ["Gdańska", "Sobieskiego", "Zamkowa", "Leśna", "Szkolna", "Przemysłowa", "Długa", "Kwiatowa", "Słoneczna", "Łąkowa", "Krótka", "Mickiewicza", "Polna", "Ogrodowa", "Kaszubska", "Morska", "Kolejowa", "Parkowa", "Lipowa", "Brzozowa"];

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

let unitsPSP = [
    {
        name: "JRG 1 Wejherowo",
        vehicles: [
            { id: "551[G]21", name: "GBA 2,5/16 Volvo FL280/Bocar", status: "green", obsada: 6 },
            { id: "551[G]25", name: "GCBA 5,4/25 Man TGM 18.320/Bocar", status: "green", obsada: 4 },
            { id: "551[G]26", name: "GCBA 9,5/60 Man TGS 26.440/Stolarczyk", status: "green", obsada: 3 },
            { id: "551[G]53", name: "SH-40 Volvo FM12/Bumar", status: "green", obsada: 2 },
            { id: "551[G]90", name: "SLRr Ford Ranger", status: "green", obsada: 2 },
            { id: "551[G]P05", name: "Przyczepa EKO", status: "green", obsada: 0 },
            { id: "551[G]Ł01", name: "Przyczepa z pontonem", status: "green", obsada: 0 },
            { id: "551[G]Ł02", name: "Przyczepa z łodzią hybrydową", status: "green", obsada: 0 }
        ]
    },
    {
        name: "JRG 2 Rumia",
        vehicles: [
            { id: "552[G]21", name: "GBAPr 2,5/28/250 MB Atego/Bocar", status: "green", obsada: 4 },
            { id: "552[G]25", name: "GCBA 5/32 Scania P410/WISS", status: "green", obsada: 4 },
            { id: "552[G]51", name: "SD-32 Mercedes Atego/Rosenbauer", status: "green", obsada: 2 },
            { id: "552[G]72", name: "SRWys Mercedes Atego/Bocar", status: "green", obsada: 3 },
            { id: "552[G]90", name: "SLRr Isuzu D-Max", status: "green", obsada: 2 },
            { id: "552[G]Q01", name: "Quad CF Moto", status: "green", obsada: 1 }
        ]
    },
    {
        name: "KP PSP Wejherowo",
        vehicles: [
            { id: "550[G]81", name: "SLKw VW T6", status: "green", obsada: 2 },
            { id: "550[G]90", name: "SLOp Skoda Octavia", status: "green", obsada: 1 },
            { id: "550[G]92", name: "SLOp Skoda Yeti", status: "green", obsada: 1 }
        ]
    }
];

let unitsOSP = [
    {
        name: ".OSP KSRG Bolszewo",
        vehicles: [
            { id: "559[G]56", name: "GBA 2,5/16 Star 12.185/Stolarczyk", status: "green", obsada: 6 },
            { id: "559[G]57", name: "SLRr Toyota Hilux", status: "green", obsada: 3 },
            { id: "559[G]58", name: "GCBA 5/32 MB Atego/Mototruck", status: "green", obsada: 4 },
            { id: "559[G]59", name: "SLKw Ford Transit/Stolarczyk", status: "green", obsada: 2 },
            { id: "559[G]Q01", name: "Quad CF MOTO 500-2A", status: "green", obsada: 1 }
        ]
    },
    {
        name: ".OSP KSRG Gościcino",
        vehicles: [
            { id: "559[G]63", name: "GBA 2,5/16 Volvo/Bocar", status: "green", obsada: 6 }
        ]
    },
    {
        name: ".OSP KSRG Wejherowo",
        vehicles: [
            { id: "559[G]66", name: "GBA Scania", status: "green", obsada: 6 },
            { id: "559[G]67", name: "SLRr Nissan Navara", status: "green", obsada: 3 },
            { id: "559[G]68", name: "GBA 2,5/24 Renault Midlum/WISS", status: "green", obsada: 6 },
            { id: "559[G]69", name: "SLKw Mitsubishi Canter/Szczęśniak", status: "green", obsada: 3 }
        ]
    },
    {
        name: ".OSP KSRG Reda",
        vehicles: [
            { id: "559[G]41", name: "GBA 2,5/16 MB Atego/Mototruck", status: "green", obsada: 6 },
            { id: "559[G]42", name: "GBA 2,5/16 Star 12.185/Stolarczyk", status: "green", obsada: 6 },
            { id: "559[G]43", name: "GCBA Scania", status: "green", obsada: 6 }
        ]
    },
    {
        name: ".OSP KSRG Luzino",
        vehicles: [
            { id: "559[G]26", name: "GBA 3,5/25 Man TGM/Mototruck", status: "green", obsada: 6 },
            { id: "559[G]27", name: "GCBA 5/32 Man TGM/Mototruck", status: "green", obsada: 6 },
            { id: "559[G]28", name: "SLRt Ford Transit/Stolarczyk", status: "green", obsada: 3 },
            { id: "559[G]29", name: "SLOp Toyota Avensis", status: "green", obsada: 2 }
        ]
    },
    {
        name: ".OSP KSRG Zelewo",
        vehicles: [
            { id: "559[G]87", name: "GBA Man TGM/Mototruck", status: "green", obsada: 6 }
        ]
    },
    {
        name: ".OSP KSRG Szemud",
        vehicles: [
            { id: "559[G]51", name: "GBA 2,5/25 Man 13.290/Stolarczyk", status: "green", obsada: 6 },
            { id: "559[G]52", name: "GBA 2,5/16 Man TGL/Stolarczyk", status: "green", obsada: 6 },
            { id: "559[G]53", name: "GCBA 5/32 Scania P400/WISS", status: "green", obsada: 6 }
        ]
    },
    {
        name: ".OSP KSRG Kielno",
        vehicles: [
            { id: "559[G]46", name: "GCBA 5/42 MB Axor/Mototruck", status: "green", obsada: 6 },
            { id: "559[G]47", name: "GCBA 8,3/60 MAN KAT.1 Buffalo/Rosenbauer", status: "green", obsada: 3 },
            { id: "559[G]48", name: "GBA 3/24 Man TGM/Mototruck", status: "green", obsada: 6 }
        ]
    },
    {
        name: ".OSP KSRG Bojano",
        vehicles: [
            { id: "559[G]76", name: "GCBA 5/32 Man TGM/Stolarczyk", status: "green", obsada: 6 },
            { id: "559[G]77", name: "GBA Man TGM/Stolarczyk", status: "green", obsada: 6 },
            { id: "559[G]78", name: "SLRr Nissan Navara", status: "green", obsada: 3 }
        ]
    },
    {
        name: ".OSP KSRG Choczewo",
        vehicles: [
            { id: "559[G]01", name: "GCBA 5/32 Man TGM 18.340/Mototruck", status: "green", obsada: 6 },
            { id: "559[G]02", name: "GBA 2,5/16 Star 244/JZS", status: "green", obsada: 6 },
            { id: "559[G]03", name: "SLRt Ford Transit/Bocar", status: "green", obsada: 3 }
        ]
    },
    {
        name: ".OSP KSRG Słajszewo",
        vehicles: [
            { id: "559[G]81", name: "GBA 4,5/30 Man TGM 18.340/Moto-Truck", status: "green", obsada: 6 }
        ]
    },
    {
        name: ".OSP KSRG Sasino",
        vehicles: [
            { id: "559[G]91", name: "GBA Volvo FL280/Bocar", status: "green", obsada: 6 },
            { id: "559[G]92", name: "SLRr Ford Ranger", status: "green", obsada: 3 }
        ]
    },
    {
        name: ".OSP KSRG Gniewino",
        vehicles: [
            { id: "559[G]06", name: "GBA 2,5/25 Man TGM/Stolarczyk", status: "green", obsada: 6 },
            { id: "559[G]07", name: "SLKw Ford Transit/Stolarczyk", status: "green", obsada: 3 }
        ]
    },
    {
        name: ".OSP KSRG Nadole",
        vehicles: [
            { id: "559[G]11", name: "GCBA 5/32 Volvo FMX/Bocar", status: "green", obsada: 6 },
            { id: "559[G]12", name: "SLRt Renault Master/Pasikonik", status: "green", obsada: 3 }
        ]
    },
    {
        name: ".OSP KSRG Kostkowo",
        vehicles: [
            { id: "559[G]71", name: "GBA 2/24 Renault Midlum/Wawrzaszek", status: "green", obsada: 6 },
            { id: "559[G]72", name: "GCBA 7/42 Scania P450/Szczęśniak", status: "green", obsada: 6 }
        ]
    },
    {
        name: ".OSP KSRG Linia",
        vehicles: [
            { id: "559[G]16", name: "GBA 2,5/16 Volvo FL280/Bocar", status: "green", obsada: 6 },
            { id: "559[G]17", name: "GCBA 5/35 Man TGM/Stolarczyk", status: "green", obsada: 6 },
            { id: "559[G]18", name: "SLRt Lublin III/FSO", status: "green", obsada: 3 }
        ]
    },
    {
        name: ".OSP KSRG Strzepcz",
        vehicles: [
            { id: "559[G]21", name: "GBA 2,5/16 MB Atego/Mototruck", status: "green", obsada: 6 },
            { id: "559[G]22", name: "SLRt Ford Transit/Stolarczyk", status: "green", obsada: 3 }
        ]
    },
    {
        name: ".OSP KSRG Bożepole Wielkie",
        vehicles: [
            { id: "559[G]31", name: "GBA 2,5/16 MB Atego/Mototruck", status: "green", obsada: 6 },
            { id: "559[G]32", name: "SLRt Iveco Daily/PS", status: "green", obsada: 3 }
        ]
    },
    {
        name: ".OSP KSRG Łęczyce",
        vehicles: [
            { id: "559[G]36", name: "GCBA 5/32 Man TGM/Mototruck", status: "green", obsada: 6 },
            { id: "559[G]37", name: "GBA Man TGM", status: "green", obsada: 6 }
        ]
    },
    {
        name: ".OSP KSRG Rozłazino",
        vehicles: [
            { id: "559[G]96", name: "GBA Volvo FL280/Bocar", status: "green", obsada: 6 }
        ]
    },
    {
        name: "OSP Gowino",
        vehicles: [
            { id: "557[G]66", name: "GBA 4,5/32 Scania P370/Szczęśniak", status: "green", obsada: 6 },
            { id: "557[G]67", name: "GLBA Iveco Daily/Bocar", status: "green", obsada: 6 }
        ]
    },
    {
        name: "OSP Orle",
        vehicles: [
            { id: "557[G]76", name: "GCBA 5/37 MB Atego/Szczęśniak", status: "green", obsada: 6 },
            { id: "557[G]77", name: "SLRr Mitsubishi L200", status: "green", obsada: 3 }
        ]
    },
    {
        name: "OSP Kniewo",
        vehicles: [
            { id: "557[G]71", name: "GBA Mercedes Benz 1124/Ziegler", status: "green", obsada: 6 }
        ]
    },
    {
        name: "OSP Zbychowo",
        vehicles: [
            { id: "557[G]81", name: "GBA 2,5/16 MB Atego/Mototruck", status: "green", obsada: 6 }
        ]
    },
    {
        name: "OSP Gniewowo",
        vehicles: [
            { id: "557[G]86", name: "GBA 2/20 Renault Midliner M210/Wawrzaszek", status: "green", obsada: 6 },
            { id: "557[G]87", name: "GBM 2,5/8 Star 244/JZS", status: "green", obsada: 6 }
        ]
    },
    {
        name: "OSP Góra",
        vehicles: [
            { id: "557[G]91", name: "GBA Iveco Eurocargo/Sides", status: "green", obsada: 6 }
        ]
    },
    {
        name: "OSP Nowy Dwór Wejherowski",
        vehicles: [
            { id: "558[G]01", name: "GLM 8 Volkswagen T4", status: "green", obsada: 6 },
            { id: "558[G]02", name: "GLBA Iveco Daily/Szczęśniak", status: "green", obsada: 6 }
        ]
    },
    {
        name: "OSP Rybno",
        vehicles: [
            { id: "557[G]11", name: "GBA 2,5/16 Mercedes Atego/Mototruck", status: "green", obsada: 6 }
        ]
    },
    {
        name: "OSP Opalino",
        vehicles: [
            { id: "557[G]96", name: "GCBA 5/24 Jelcz 422/JZS", status: "green", obsada: 4 }
        ]
    },
    {
        name: "OSP Kopalino",
        vehicles: [
            { id: "557[G]01", name: "GLM 8 Ford Transit/Stolarczyk", status: "green", obsada: 6 }
        ]
    },
    {
        name: "OSP Lewino",
        vehicles: [
            { id: "557[G]21", name: "GBA 2,5/16 Mercedes 1619", status: "green", obsada: 6 }
        ]
    },
    {
        name: "OSP Milwino",
        vehicles: [
            { id: "557[G]26", name: "GBA 2,5/16 Renault Midlum/Camiva", status: "green", obsada: 6 }
        ]
    },
    {
        name: "OSP Kaczkowo",
        vehicles: [
            { id: "557[G]36", name: "GBA Renault Range D/Mototruck", status: "green", obsada: 6 }
        ]
    },
    {
        name: "OSP Częstkowo",
        vehicles: [
            { id: "557[G]51", name: "GCBA Scania", status: "green", obsada: 6 }
        ]
    },
    {
        name: "OSP Łebno",
        vehicles: [
            { id: "557[G]56", name: "GBA 2,5/16 Mercedes Atego/Bonex", status: "green", obsada: 6 }
        ]
    },
    {
        name: "OSP Przetoczyno",
        vehicles: [
            { id: "557[G]61", name: "GBA 2,5/16 Magirus", status: "green", obsada: 6 }
        ]
    }
];

// --- LOSOWANIE OBSADY DLA OSP ---
unitsOSP.forEach(u => {
    u.vehicles.forEach(v => {
        v.obsada = Math.floor(Math.random() * 4) + 3;
    });
});

let events = [];
let activeEditingId = null;
let selectedEvIdForRadio = null;
let selectedVehicles = [];
let servicesState = { prm: false, police: false };
let currentCPRData = null;
let cprCounter = 101;
let openRadioWindows = {};

// Statystyki służby (CPR + zdarzenia)
let shiftStats = {
    cprTotalGenerated: 0,
    cprAccepted: 0,
    cprRefused: 0,
    refusalReasons: {}
};

// --- MAPA OPERACYJNA LEAFLET ---
let leafletMap = null;
let mapMarkersLayer = null;

function ensureLeafletLoaded(callback) {
    if (window.L) {
        callback();
        return;
    }
    if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = callback;
    document.head.appendChild(script);
}

function initLeafletMap() {
    ensureLeafletLoaded(() => {
        const mapEl = document.getElementById('leaflet-map');
        if (!mapEl) return;
        if (!leafletMap) {
            leafletMap = L.map('leaflet-map').setView([54.6059, 18.2443], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap'
            }).addTo(leafletMap);
            mapMarkersLayer = L.layerGroup().addTo(leafletMap);
        }
        leafletMap.invalidateSize();
        updateMapMarkers();
    });
}

function updateMapMarkers() {
    if (!leafletMap || !mapMarkersLayer || !window.L) return;
    mapMarkersLayer.clearLayers();

    // 1. Jednostki PSP i OSP (z lekkim przesunięciem, gdy kilka jednostek jest w tym samym mieście)
    const townOffsetCounter = {};
    [...unitsPSP, ...unitsOSP].forEach(u => {
        const town = unitBaseTown[u.name] || "Wejherowo";
        const baseCoords = gpsCoords[town] || [54.6059, 18.2443];
        townOffsetCounter[town] = (townOffsetCounter[town] || 0) + 1;
        const offsetIdx = townOffsetCounter[town] - 1;
        const lat = baseCoords[0] + (offsetIdx * 0.0035);
        const lng = baseCoords[1] + (offsetIdx * 0.005);

        const isPSP = u.name.includes("JRG") || u.name.includes("KP PSP");
        const bgColor = isPSP ? "#b30000" : "#0a246a";
        const vehListHtml = u.vehicles.map(v => {
            const color = v.status === 'green' ? '#2ecc71' : (v.status === 'orange' ? '#f39c12' : '#e74c3c');
            return `<div style="font-size:11px;"><span style="color:${color};">●</span> <b>${v.id}</b> - ${v.name}</div>`;
        }).join('');

        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'custom-unit-icon',
                html: `<div style="background:${bgColor}; color:#fff; border:1px solid #fff; border-radius:3px; padding:1px 5px; font-size:10px; font-weight:bold; white-space:nowrap; box-shadow:1px 1px 3px rgba(0,0,0,0.5);">🚒 ${u.name}</div>`,
                iconSize: [120, 20],
                iconAnchor: [60, 10]
            })
        });
        marker.bindPopup(`<div style="min-width:200px;"><div style="font-weight:bold; color:${bgColor}; border-bottom:1px solid #ccc; margin-bottom:4px; padding-bottom:2px;">${u.name} (${town})</div>${vehListHtml}</div>`);
        mapMarkersLayer.addLayer(marker);
    });

    // 2. Aktywne zdarzenia na mapie
    events.forEach(ev => {
        if (ev.status !== 'ACTIVE') return;
        const coords = gpsCoords[ev.city] || [54.6059, 18.2443];
        const evLat = coords[0] - 0.004;
        const evLng = coords[1] + 0.004;

        const marker = L.marker([evLat, evLng], {
            icon: L.divIcon({
                className: 'custom-ev-icon',
                html: `<div style="background:#ff0000; color:#ffff00; border:2px solid #ffff00; border-radius:4px; padding:2px 6px; font-size:11px; font-weight:bold; white-space:nowrap; box-shadow:0 0 8px #ff0000;">🚨 [${ev.type}] ID:${ev.id} ${ev.city}</div>`,
                iconSize: [140, 24],
                iconAnchor: [70, 12]
            })
        });

        const sisList = ev.vehicles.map(v => `${v.id} (${v.travelTime > 0 ? 'W drodze: ' + v.travelTime + 's' : 'Na miejscu'})`).join('<br>');
        marker.bindPopup(`
            <div style="min-width:220px;">
                <b style="color:#b30000;">ZDARZENIE ID: ${ev.id}/2026 (${ev.type})</b><br>
                <b>Lokalizacja:</b> ${ev.city}, ${ev.street}<br>
                <b>Opis:</b> ${ev.desc}<br>
                <b>Zadysponowane SiS (${ev.vehicles.length}):</b><br>${sisList || 'Brak'}<br>
                <div style="margin-top:6px; display:flex; gap:4px;">
                    <button class="btn-win" onclick="openEditEventModal(${ev.id})">Edytuj kartę</button>
                    <button class="btn-win" onclick="openRadioForEvent(${ev.id})">📻 Radio</button>
                </div>
            </div>
        `);
        mapMarkersLayer.addLayer(marker);
    });
}

function switchMainView(viewType) {
    let mapContainer = document.getElementById('view-map-container');
    const pspGrid = document.getElementById('grid-psp');
    const ospGrid = document.getElementById('grid-osp');
    const btnPsp = document.getElementById('btn-tab-psp');
    const btnOsp = document.getElementById('btn-tab-osp');
    const btnMap = document.getElementById('btn-tab-map');

    if (viewType === 'map') {
        if (pspGrid) pspGrid.style.display = 'none';
        if (ospGrid) ospGrid.style.display = 'none';
        if (mapContainer) mapContainer.style.display = 'block';
        if (btnPsp) btnPsp.classList.remove('active');
        if (btnOsp) btnOsp.classList.remove('active');
        if (btnMap) btnMap.classList.add('active');
        setTimeout(() => initLeafletMap(), 100);
    } else {
        if (mapContainer) mapContainer.style.display = 'none';
        if (btnMap) btnMap.classList.remove('active');
        switchTab('PSP');
    }
}

// --- MECHANIZM PRZESUWANIA OKIEN ---
function makeDraggable(elmnt, header) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (header) header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if (e.target.closest('.modal-close, .modal-min, button')) return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        const rect = elmnt.getBoundingClientRect();
        elmnt.style.position = 'fixed';
        elmnt.style.left = rect.left + 'px';
        elmnt.style.top = rect.top + 'px';
        elmnt.style.margin = '0';
        elmnt.style.right = 'auto';
        elmnt.style.bottom = 'auto';
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + 'px';
        elmnt.style.left = (elmnt.offsetLeft - pos1) + 'px';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// --- AUTOMATYCZNA INICJALIZACJA INTERFEJSU (MAPA, RAPORTY, SIŁY I ŚRODKI, ZEGAR) ---
window.addEventListener('DOMContentLoaded', () => {
    // 1. Podpięcie górnego menu (niezależnie od wersji index.html)
    document.querySelectorAll('.top-menu .menu-item').forEach(item => {
        const txt = item.innerText.trim().toLowerCase();
        if (txt.includes('siły i środki')) {
            item.onclick = () => openSiSModal();
        } else if (txt.includes('mapy')) {
            item.onclick = () => switchMainView('map');
        } else if (txt.includes('podział bojowy') || txt.includes('widok')) {
            item.onclick = () => switchMainView('table');
        } else if (txt.includes('zestawienia') || txt.includes('raporty') || txt.includes('rejestr')) {
            item.onclick = () => openReportsModal();
        }
    });

    // 2. Dodanie zakładki Mapy obok PSP / OSP jeśli jej nie ma
    const tabsBar = document.querySelector('.workspace .tabs-bar');
    if (tabsBar && !document.getElementById('btn-tab-map')) {
        const mapTabBtn = document.createElement('button');
        mapTabBtn.className = 'tab-btn';
        mapTabBtn.id = 'btn-tab-map';
        mapTabBtn.innerHTML = '🗺️ Mapa Operacyjna';
        mapTabBtn.onclick = () => switchMainView('map');
        tabsBar.appendChild(mapTabBtn);

        const repTabBtn = document.createElement('button');
        repTabBtn.className = 'tab-btn';
        repTabBtn.innerHTML = '📊 Zestawienia i Raporty';
        repTabBtn.onclick = () => openReportsModal();
        tabsBar.appendChild(repTabBtn);
    }

    // 3. Wstrzyknięcie kontenera mapy, jeśli nie ma go w HTML
    const pspGrid = document.getElementById('grid-psp');
    if (pspGrid && !document.getElementById('view-map-container')) {
        const mapWrap = document.createElement('div');
        mapWrap.id = 'view-map-container';
        mapWrap.style.cssText = 'flex: 1; display: none; width: 100%; min-height: 260px; border: 1px solid #7f9db9; position: relative;';
        mapWrap.innerHTML = '<div id="leaflet-map" style="width: 100%; height: 100%;"></div>';
        pspGrid.parentNode.insertBefore(mapWrap, pspGrid);
    }

    // 4. Upewnienie się, że istnieje modal Siły i Środki (#modal-sis)
    ensureSiSModalExists();

    // 5. Upewnienie się, że istnieje modal Raporty — Statystyka (#modal-reports)
    ensureReportsModalExists();

    // 6. Przesuwanie okien
    const eventModal = document.querySelector('#modal-event .modal-window');
    if (eventModal) makeDraggable(eventModal, document.querySelector('#modal-event .modal-header'));

    const cprModal = document.getElementById('cpr-modal');
    if (cprModal) makeDraggable(cprModal, cprModal.querySelector('.cpr-header'));
});

function ensureSiSModalExists() {
    let sisModal = document.getElementById('modal-sis');
    if (!sisModal) {
        sisModal = document.createElement('div');
        sisModal.className = 'modal-overlay';
        sisModal.id = 'modal-sis';
        document.body.appendChild(sisModal);
    }
    sisModal.innerHTML = `
        <div class="modal-window" style="width: 720px; height: 480px;">
            <div class="modal-header">
                <span>🚒 Zarządzanie Siłami i Środkami (Podział Bojowy KP PSP Wejherowo)</span>
                <div class="modal-close" onclick="closeModal('modal-sis')">×</div>
            </div>
            <div class="modal-body" style="display:flex; flex-direction:column; gap:8px;">
                <div style="display: flex; gap: 8px;">
                    <div class="form-box" style="flex:1;">
                        <div class="form-title">Państwowa Straż Pożarna (JRG)</div>
                        <div style="display:flex; gap:6px; margin-top:6px;">
                            <button class="btn-win" onclick="addCustomUnit('PSP')">➕ Dodaj jednostkę PSP</button>
                            <button class="btn-win" onclick="addCustomVehicle('PSP')">🚒 Dodaj pojazd PSP</button>
                        </div>
                    </div>
                    <div class="form-box" style="flex:1;">
                        <div class="form-title">Ochotnicza Straż Pożarna (OSP)</div>
                        <div style="display:flex; gap:6px; margin-top:6px;">
                            <button class="btn-win" onclick="addCustomUnit('OSP')">➕ Dodaj jednostkę OSP</button>
                            <button class="btn-win" onclick="addCustomVehicle('OSP')">🚒 Dodaj pojazd OSP</button>
                        </div>
                    </div>
                </div>
                <div class="form-box" style="flex:1; overflow-y:auto;">
                    <div class="form-title">Zestawienie statusów wszystkich pojazdów (kliknij status, aby zmienić ręcznie):</div>
                    <div id="sis-manager-list" style="max-height:280px; overflow-y:auto;"></div>
                </div>
            </div>
            <div style="padding: 6px; background: #e1e1e1; display: flex; justify-content: flex-end;">
                <button class="btn-win" onclick="closeModal('modal-sis')">Zamknij</button>
            </div>
        </div>
    `;
    const win = sisModal.querySelector('.modal-window');
    const hdr = sisModal.querySelector('.modal-header');
    if (win && hdr) makeDraggable(win, hdr);
}

function renderSiSManagerList() {
    const container = document.getElementById('sis-manager-list');
    if (!container) return;
    let html = `<table class="sis-table"><thead><tr><th>Jednostka</th><th>Kryptonim</th><th>Typ / Nazwa pojazdu</th><th>Obsada</th><th>Status</th><th>Zmiana statusu</th></tr></thead><tbody>`;
    [...unitsPSP, ...unitsOSP].forEach(u => {
        u.vehicles.forEach(v => {
            const stText = v.status === 'green' ? 'W bazie (Gotowy)' : (v.status === 'orange' ? 'W drodze' : 'Na miejscu akcji');
            const stColor = v.status === 'green' ? '#155724' : (v.status === 'orange' ? '#b36b00' : '#b30000');
            html += `
                <tr>
                    <td><b>${u.name}</b></td>
                    <td><b>${v.id}</b></td>
                    <td>${v.name}</td>
                    <td>${v.obsada}</td>
                    <td style="color:${stColor}; font-weight:bold;">${stText}</td>
                    <td>
                        <button class="btn-win" style="font-size:10px; padding:1px 6px;" onclick="setVehicleStatusManual('${v.id}', 'green')">Wolny</button>
                        <button class="btn-win" style="font-size:10px; padding:1px 6px;" onclick="setVehicleStatusManual('${v.id}', 'red')">W akcji</button>
                    </td>
                </tr>
            `;
        });
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function setVehicleStatusManual(vehId, newStatus) {
    [...unitsPSP, ...unitsOSP].forEach(u => {
        const v = u.vehicles.find(x => x.id === vehId);
        if (v) v.status = newStatus;
    });
    renderUnits();
    renderSiSManagerList();
    updateMapMarkers();
}

function addCustomUnit(type) {
    const name = prompt(`Podaj nazwę nowej jednostki ${type} (np. OSP KSRG Bolszewo II):`);
    if (!name || !name.trim()) return;
    const town = prompt(`Podaj miejscowość stacjonowania jednostki (np. Bolszewo, Wejherowo, Rumia):`, "Wejherowo") || "Wejherowo";
    unitBaseTown[name.trim()] = town.trim();
    if (type === 'PSP') unitsPSP.push({ name: name.trim(), vehicles: [] });
    else unitsOSP.push({ name: name.trim(), vehicles: [] });
    renderUnits();
    renderSiSManagerList();
    updateMapMarkers();
}

function addCustomVehicle(type) {
    const targetArray = type === 'PSP' ? unitsPSP : unitsOSP;
    const unitName = prompt(`Podaj dokładną nazwę jednostki ${type}, do której chcesz dodać pojazd:`, targetArray[0]?.name || "");
    if (!unitName) return;
    const unit = targetArray.find(u => u.name.toLowerCase() === unitName.trim().toLowerCase());
    if (!unit) {
        alert("Nie znaleziono takiej jednostki na liście!");
        return;
    }
    const id = prompt("Podaj numer operacyjny pojazdu (np. 559[G]99):", "559[G]99");
    const vName = prompt("Podaj typ i markę pojazdu (np. GBA 2,5/16 MAN):", "GBA 2,5/16 MAN");
    if (id && vName) {
        unit.vehicles.push({ id: id.trim(), name: vName.trim(), status: "green", obsada: 6 });
        renderUnits();
        renderSiSManagerList();
        updateMapMarkers();
    }
}

// --- OKNO RAPORTÓW I STATYSTYK (WZÓR SWD ZE ZDJĘCIA) ---
function ensureReportsModalExists() {
    if (document.getElementById('modal-reports')) return;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modal-reports';
    modal.innerHTML = `
        <div class="modal-window" style="width: 920px; height: 660px; background: #d4d0c8; border: 2px solid #0a246a;">
            <div class="modal-header" style="background: #0a246a; color: #fff; padding: 4px 8px;">
                <span>Raporty — Statystyka</span>
                <div class="modal-close" onclick="closeModal('modal-reports')">×</div>
            </div>
            <div class="modal-body" style="padding: 8px; background: #d4d0c8; display: flex; flex-direction: column; gap: 8px; overflow-y: auto;">
                
                <!-- Pasek zakresu -->
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <b>Zakres:</b>
                        <button class="btn-win" style="background: #eef4ff; font-weight: bold;">Dzień</button>
                        <button class="btn-win">Miesiąc</button>
                        <button class="btn-win">Rok</button>
                        <button class="btn-win">Wszystkie</button>
                        <span id="rep-date-sub" style="color: #444; margin-left: 6px;">Statystyka z dnia 27.10.2026</span>
                    </div>
                    <button class="btn-win" style="padding: 4px 16px; font-weight: bold;" onclick="window.print()">Drukuj</button>
                </div>

                <div style="background: #ece9d8; border: 1px solid #999; padding: 6px 8px;">
                    <b>Tryb statystyk:</b> online / lokalny (SWD). Dane obejmują wszystkie zdarzenia i formatki z bieżącej służby.
                </div>

                <!-- 8 boksów podsumowania -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;">
                        <div style="font-weight: bold; color: #222;">Zgłoszenia ogółem</div>
                        <div id="rep-total" style="font-size: 20px; font-weight: bold; margin-top: 4px; color:#000;">0</div>
                    </div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;">
                        <div style="font-weight: bold; color: #222;">Aktywne</div>
                        <div id="rep-active" style="font-size: 20px; font-weight: bold; margin-top: 4px; color:#000;">0</div>
                    </div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;">
                        <div style="font-weight: bold; color: #222;">Zakończone</div>
                        <div id="rep-finished" style="font-size: 20px; font-weight: bold; margin-top: 4px; color:#000;">0</div>
                    </div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;">
                        <div style="font-weight: bold; color: #222;">Średni czas obsługi</div>
                        <div id="rep-avg-time" style="font-size: 16px; font-weight: bold; margin-top: 6px; color:#000;">00:03:00</div>
                    </div>

                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;">
                        <div style="font-weight: bold; color: #222;">Odmowy / Anulowane CPR</div>
                        <div id="rep-refused" style="font-size: 20px; font-weight: bold; margin-top: 4px; color:#000;">0</div>
                    </div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;">
                        <div style="font-weight: bold; color: #222;">Zdarzenia powiązane (CPR)</div>
                        <div id="rep-cpr-linked" style="font-size: 20px; font-weight: bold; margin-top: 4px; color:#000;">0</div>
                    </div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;">
                        <div style="font-weight: bold; color: #222;">Nowe powyżej 2 min</div>
                        <div id="rep-over-2m" style="font-size: 20px; font-weight: bold; margin-top: 4px; color:#000;">0</div>
                    </div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;">
                        <div style="font-weight: bold; color: #222;">Zakres</div>
                        <div id="rep-range-box" style="font-size: 13px; font-weight: bold; margin-top: 6px; color:#000;">Statystyka z bieżącej służby</div>
                    </div>
                </div>

                <!-- Tabela SŁUŻBY -->
                <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px;">
                    <div style="background: #cccccc; padding: 4px 6px; font-weight: bold; border: 1px solid #aaa; margin-bottom: 6px;">
                        SŁUŻBY — PRM / PSP / POLICJA
                    </div>
                    <table class="sis-table" style="background: #fff;">
                        <thead>
                            <tr>
                                <th>Służba</th>
                                <th style="text-align:right;">Zadysponowano</th>
                                <th style="text-align:right;">Oczekuje (Dojazd)</th>
                                <th style="text-align:right;">Obsługa (Na miejscu)</th>
                                <th style="text-align:right;">Zakończono</th>
                                <th style="text-align:right;">Śr. reakcja</th>
                                <th style="text-align:right;">Śr. obsługa</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>PRM / ZRM</td>
                                <td id="rep-prm-disp" style="text-align:right;">0</td>
                                <td id="rep-prm-wait" style="text-align:right;">0</td>
                                <td id="rep-prm-act" style="text-align:right;">0</td>
                                <td id="rep-prm-fin" style="text-align:right;">0</td>
                                <td style="text-align:right;">00:01:20</td>
                                <td style="text-align:right;">00:03:00</td>
                            </tr>
                            <tr>
                                <td>PSP / OSP</td>
                                <td id="rep-psp-disp" style="text-align:right;">0</td>
                                <td id="rep-psp-wait" style="text-align:right;">0</td>
                                <td id="rep-psp-act" style="text-align:right;">0</td>
                                <td id="rep-psp-fin" style="text-align:right;">0</td>
                                <td style="text-align:right;">00:00:35</td>
                                <td style="text-align:right;">00:03:00</td>
                            </tr>
                            <tr>
                                <td>Policja</td>
                                <td id="rep-pol-disp" style="text-align:right;">0</td>
                                <td id="rep-pol-wait" style="text-align:right;">0</td>
                                <td id="rep-pol-act" style="text-align:right;">0</td>
                                <td id="rep-pol-fin" style="text-align:right;">0</td>
                                <td style="text-align:right;">00:01:45</td>
                                <td style="text-align:right;">00:03:00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- 6 dolnych sekcji (2 kolumny x 3 wiersze jak na zrzucie) -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px;">
                        <div style="background: #cccccc; padding: 4px 6px; font-weight: bold; border: 1px solid #aaa; margin-bottom: 4px;">STATUSY CPR</div>
                        <table class="sis-table" style="background: #fff;">
                            <thead><tr><th>Nazwa</th><th style="width:70px; text-align:right;">Liczba</th></tr></thead>
                            <tbody id="rep-cpr-statuses"></tbody>
                        </table>
                    </div>

                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px;">
                        <div style="background: #cccccc; padding: 4px 6px; font-weight: bold; border: 1px solid #aaa; margin-bottom: 4px;">OPERATORZY</div>
                        <table class="sis-table" style="background: #fff;">
                            <thead><tr><th>Nazwa</th><th style="width:70px; text-align:right;">Liczba</th></tr></thead>
                            <tbody id="rep-operators"></tbody>
                        </table>
                    </div>

                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px;">
                        <div style="background: #cccccc; padding: 4px 6px; font-weight: bold; border: 1px solid #aaa; margin-bottom: 4px;">TOP KATEGORIE</div>
                        <table class="sis-table" style="background: #fff;">
                            <thead><tr><th>Nazwa</th><th style="width:70px; text-align:right;">Liczba</th></tr></thead>
                            <tbody id="rep-top-cats"></tbody>
                        </table>
                    </div>

                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px;">
                        <div style="background: #cccccc; padding: 4px 6px; font-weight: bold; border: 1px solid #aaa; margin-bottom: 4px;">TOP PODKATEGORIE</div>
                        <table class="sis-table" style="background: #fff;">
                            <thead><tr><th>Nazwa</th><th style="width:70px; text-align:right;">Liczba</th></tr></thead>
                            <tbody id="rep-top-subcats"></tbody>
                        </table>
                    </div>

                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px;">
                        <div style="background: #cccccc; padding: 4px 6px; font-weight: bold; border: 1px solid #aaa; margin-bottom: 4px;">POWODY ODMÓW / ANULOWAŃ</div>
                        <table class="sis-table" style="background: #fff;">
                            <thead><tr><th>Nazwa</th><th style="width:70px; text-align:right;">Liczba</th></tr></thead>
                            <tbody id="rep-refusals-body"></tbody>
                        </table>
                    </div>

                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px;">
                        <div style="background: #cccccc; padding: 4px 6px; font-weight: bold; border: 1px solid #aaa; margin-bottom: 4px;">MIEJSCOWOŚCI / ADRESY</div>
                        <table class="sis-table" style="background: #fff;">
                            <thead><tr><th>Nazwa</th><th style="width:70px; text-align:right;">Liczba</th></tr></thead>
                            <tbody id="rep-locations-body"></tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const win = modal.querySelector('.modal-window');
    const hdr = modal.querySelector('.modal-header');
    if (win && hdr) makeDraggable(win, hdr);
}

function openReportsModal() {
    ensureReportsModalExists();

    const total = events.length;
    const active = events.filter(e => e.status === 'ACTIVE').length;
    const finished = events.filter(e => e.status === 'FINISHED').length;

    safeSetElementText('rep-total', total);
    safeSetElementText('rep-active', active);
    safeSetElementText('rep-finished', finished);
    safeSetElementText('rep-refused', shiftStats.cprRefused);
    safeSetElementText('rep-cpr-linked', shiftStats.cprAccepted);
    safeSetElementText('rep-over-2m', events.filter(e => e.vehicles.length >= 2).length);

    let prmDisp = 0, prmWait = 0, prmAct = 0, prmFin = 0;
    let pspDisp = 0, pspWait = 0, pspAct = 0, pspFin = 0;
    let polDisp = 0, polWait = 0, polAct = 0, polFin = 0;

    const catMap = {};
    const subcatMap = {};
    const locMap = {};

    events.forEach(ev => {
        const isWaiting = ev.status === 'ACTIVE' && !ev.firstArrived;
        const isOnSite = ev.status === 'ACTIVE' && ev.firstArrived;
        const isDone = ev.status === 'FINISHED';

        if (ev.services && ev.services.prm) {
            prmDisp++;
            if (isWaiting) prmWait++;
            else if (isOnSite) prmAct++;
            else if (isDone) prmFin++;
        }
        if (ev.services && ev.services.police) {
            polDisp++;
            if (isWaiting) polWait++;
            else if (isOnSite) polAct++;
            else if (isDone) polFin++;
        }
        if (ev.vehicles && ev.vehicles.length > 0) {
            pspDisp += ev.vehicles.length;
            ev.vehicles.forEach(v => {
                if (ev.status === 'FINISHED') pspFin++;
                else if (v.travelTime > 0) pspWait++;
                else pspAct++;
            });
        }

        const catKey = ev.type || 'P';
        catMap[catKey] = (catMap[catKey] || 0) + 1;

        const subKey = ev.subtype || 'Brak podkategorii';
        subcatMap[subKey] = (subcatMap[subKey] || 0) + 1;

        const locKey = `${ev.city}${ev.street ? ', ' + ev.street : ''}`;
        locMap[locKey] = (locMap[locKey] || 0) + 1;
    });

    safeSetElementText('rep-prm-disp', prmDisp);
    safeSetElementText('rep-prm-wait', prmWait);
    safeSetElementText('rep-prm-act', prmAct);
    safeSetElementText('rep-prm-fin', prmFin);

    safeSetElementText('rep-psp-disp', pspDisp);
    safeSetElementText('rep-psp-wait', pspWait);
    safeSetElementText('rep-psp-act', pspAct);
    safeSetElementText('rep-psp-fin', pspFin);

    safeSetElementText('rep-pol-disp', polDisp);
    safeSetElementText('rep-pol-wait', polWait);
    safeSetElementText('rep-pol-act', polAct);
    safeSetElementText('rep-pol-fin', polFin);

    // Wypełnienie 6 dolnych tabel
    const cprStatBody = document.getElementById('rep-cpr-statuses');
    if (cprStatBody) {
        if (shiftStats.cprTotalGenerated === 0 && total === 0) {
            cprStatBody.innerHTML = `<tr><td colspan="2" style="color:#666;">Brak statusów</td></tr>`;
        } else {
            cprStatBody.innerHTML = `
                <tr><td>Wygenerowane zgłoszenia 112</td><td style="text-align:right;">${shiftStats.cprTotalGenerated}</td></tr>
                <tr><td>Przyjęte do obsługi (Karty SWD)</td><td style="text-align:right;">${shiftStats.cprAccepted}</td></tr>
                <tr><td>Odrzucone / Zamknięte formatki</td><td style="text-align:right;">${shiftStats.cprRefused}</td></tr>
            `;
        }
    }

    const opBody = document.getElementById('rep-operators');
    if (opBody) {
        if (total === 0) {
            opBody.innerHTML = `<tr><td colspan="2" style="color:#666;">Brak danych operatorów</td></tr>`;
        } else {
            opBody.innerHTML = `<tr><td>aspirant damja (Dyspozytor SKKP)</td><td style="text-align:right;">${total}</td></tr>`;
        }
    }

    const fillTable = (tbodyId, dataObj, emptyLabel) => {
        const el = document.getElementById(tbodyId);
        if (!el) return;
        const entries = Object.entries(dataObj).sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) {
            el.innerHTML = `<tr><td colspan="2" style="color:#666;">${emptyLabel}</td></tr>`;
        } else {
            el.innerHTML = entries.map(([k, v]) => `<tr><td>${k}</td><td style="text-align:right;">${v}</td></tr>`).join('');
        }
    };

    fillTable('rep-top-cats', catMap, 'Brak kategorii');
    fillTable('rep-top-subcats', subcatMap, 'Brak podkategorii');
    fillTable('rep-refusals-body', shiftStats.refusalReasons, 'Brak odmów w wybranym zakresie');
    fillTable('rep-locations-body', locMap, 'Brak danych adresowych');

    const modal = document.getElementById('modal-reports');
    if (modal) modal.style.display = 'flex';
}

// --- LOKALNY SILNIK INTELIGENTNYCH ODPOWIEDZI KDR (FALLBACK) ---
function generateSmartKdrResponse(kdrCallsign, userQuestion, ev) {
    const q = userQuestion.toLowerCase();
    const desc = (ev.desc || "").toLowerCase();
    const isSmall = desc.includes("śmietnik") || desc.includes("os") || desc.includes("szerszeni") || desc.includes("plama") || desc.includes("konar") || desc.includes("drzewo");
    const hasPrm = q.includes("pogotow") || q.includes("zrm") || q.includes("karetk") || q.includes("medyczn");
    const hasPol = q.includes("policj") || q.includes("patrol");
    const hasSis = q.includes("dodatkow") || q.includes("siły") || q.includes("środki") || q.includes("srodki") || q.includes("zastęp") || q.includes("podnośnik") || q.includes("drabin");

    if (hasPrm && hasPol) {
        return `Wejherowo 998, tu ${kdrCallsign}. Przyda się u nas zarówno ZRM, jak i patrol Policji do zabezpieczenia miejsca. Bez odbioru.`;
    } else if (hasPrm) {
        return isSmall 
            ? `Wejherowo 998, tu ${kdrCallsign}. Nie ma osób poszkodowanych, ZRM nie jest potrzebny. Bez odbioru.`
            : `Wejherowo 998, tu ${kdrCallsign}. Tak, mamy osobę wymagającą przebadania, poproszę ZRM na miejsce. Bez odbioru.`;
    } else if (hasPol) {
        return `Wejherowo 998, tu ${kdrCallsign}. Tak, przyda się patrol Policji na miejscu. Bez odbioru.`;
    } else if (hasSis) {
        return isSmall
            ? `Wejherowo 998, tu ${kdrCallsign}. Siły i środki całkowicie wystarczające, radzimy sobie tym co mamy na miejscu. Bez odbioru.`
            : `Wejherowo 998, tu ${kdrCallsign}. Na ten moment siły na miejscu wystarczają, działamy. Bez odbioru.`;
    }

    if (q.includes("przyjąłem") || q.includes("zrozumiałem")) {
        return `Wejherowo 998, tu ${kdrCallsign}. Zrozumiałem, działamy dalej. Bez odbioru.`;
    }

    return `Wejherowo 998, tu ${kdrCallsign}. Sytuacja na miejscu opanowana, kończymy rozpoznanie i prowadzimy działania. Bez odbioru.`;
}

// --- OKNO RADIA: WYGLĄD RETRO + POLE TEKSTOWE NA SAMYM DOLE ---
function createRadioWindow(evId) {
    if (openRadioWindows[evId]) {
        openRadioWindows[evId].style.display = 'block';
        return openRadioWindows[evId];
    }

    const ev = events.find(e => e.id === evId);
    if (!ev) return null;

    const modal = document.createElement('div');
    modal.id = `radio-modal-${evId}`;
    modal.style.position = 'fixed';
    modal.style.zIndex = '1050';
    modal.style.width = '440px';
    
    const windowCount = Object.keys(openRadioWindows).length;
    const offset = (windowCount * 25) % 150;
    modal.style.left = `calc(50% - 220px + ${offset}px)`;
    modal.style.top = `calc(50% - 210px + ${offset}px)`;

    modal.innerHTML = `
        <div style="background: #c0c0c0; border: 2px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; box-shadow: 2px 2px 5px rgba(0,0,0,0.5); font-family: 'Segoe UI', Tahoma, sans-serif;">
            <div class="radio-win-header" style="background: linear-gradient(90deg, #004080, #1060b0); color: #ffffff; padding: 3px 6px; font-weight: bold; font-size: 13px; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none;">
                <span id="radio-title-${evId}">🖵 Korespondencja Radiowa - Zdarzenie ID: ${ev.id} (${ev.city})</span>
                <div style="display: flex; gap: 2px;">
                    <button style="background: #c0c0c0; border: 1px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; width: 18px; height: 16px; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;" onclick="minimizeRadioWindow(${ev.id})">_</button>
                    <button style="background: #c0c0c0; border: 1px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; width: 18px; height: 16px; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;" onclick="closeRadioWindow(${ev.id})">✕</button>
                </div>
            </div>
            <div style="padding: 6px; background: #c0c0c0;">
                <div id="radio-chat-${evId}" style="background: #000000; color: #ffcc00; font-family: 'Courier New', monospace; font-weight: bold; font-size: 12px; height: 195px; padding: 6px; overflow-y: auto; border: 2px solid #808080; border-right-color: #ffffff; border-bottom-color: #ffffff; box-sizing: border-box; line-height: 1.3;"></div>
                
                <!-- Przyciski szybkiej odpowiedzi -->
                <div style="display: flex; gap: 4px; margin-top: 6px; justify-content: space-between;">
                    <button style="flex: 1; padding: 4px 2px; font-size: 11px; background: #e1e1e1; border: 2px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; cursor: pointer; font-weight: bold; color: #000; text-align: center;" onclick="sendRadioReplyDynamic(${ev.id}, 'Przyjąłem.')">
                        <span style="color: green;">✔</span> Przyjąłem
                    </button>
                    <button style="flex: 1; padding: 4px 2px; font-size: 11px; background: #e1e1e1; border: 2px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; cursor: pointer; font-weight: bold; color: #000; text-align: center;" onclick="sendRadioReplyDynamic(${ev.id}, 'Wejherowo 998, czy na miejscu wymagany jest zespół ZRM?')">
                        <span style="color: red;">🚑</span> Wymagany ZRM?
                    </button>
                    <button style="flex: 1; padding: 4px 2px; font-size: 11px; background: #e1e1e1; border: 2px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; cursor: pointer; font-weight: bold; color: #000; text-align: center;" onclick="sendRadioReplyDynamic(${ev.id}, 'Wejherowo 998, czy potrzebny jest patrol Policji?')">
                        <span style="color: blue;">🚔</span> Potrzebna Policja?
                    </button>
                    <button style="flex: 1; padding: 4px 2px; font-size: 11px; background: #e1e1e1; border: 2px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; cursor: pointer; font-weight: bold; color: #000; text-align: center;" onclick="sendRadioReplyDynamic(${ev.id}, 'Wejherowo 998, czy potrzebne są dodatkowe siły i środki?')">
                        <span style="color: darkred;">🚒</span> Dodatkowe SiS?
                    </button>
                </div>

                <!-- Pole wpisywania własnej wiadomości na samym dole -->
                <div style="display: flex; gap: 4px; margin-top: 6px; align-items: center;">
                    <input type="text" id="inp-radio-reply-${ev.id}" placeholder="Wpisz treść wiadomości radiowej..." style="flex: 1; padding: 5px 8px; font-size: 12px; background: #ffffff; border: 2px solid #808080; border-right-color: #ffffff; border-bottom-color: #ffffff; outline: none;" onkeypress="if(event.key==='Enter') sendCustomInputRadio(${ev.id})">
                    <button style="padding: 5px 12px; font-size: 11px; background: #e1e1e1; border: 2px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; cursor: pointer; font-weight: bold;" onclick="sendCustomInputRadio(${ev.id})">Nadaj</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    makeDraggable(modal, modal.querySelector('.radio-win-header'));

    openRadioWindows[evId] = modal;
    updateRadioChatDynamic(evId);

    return modal;
}

function updateRadioChatDynamic(evId) {
    const ev = events.find(e => e.id === evId);
    if (!ev) return;
    const chat = document.getElementById(`radio-chat-${evId}`);
    if (chat) {
        chat.innerHTML = (ev.radioLogs || []).join('');
        chat.scrollTop = chat.scrollHeight;
    }
}

function closeRadioWindow(evId) {
    if (openRadioWindows[evId]) {
        openRadioWindows[evId].remove();
        delete openRadioWindows[evId];
    }
}

function minimizeRadioWindow(evId) {
    if (openRadioWindows[evId]) {
        openRadioWindows[evId].style.display = 'none';
        const bar = document.getElementById('minimized-bar');
        if (bar) {
            const item = document.createElement('div');
            item.className = 'minimized-item';
            item.id = `min-radio-${evId}`;
            item.innerHTML = `📻 Radio (ID: ${evId})`;
            item.onclick = () => {
                if (openRadioWindows[evId]) openRadioWindows[evId].style.display = 'block';
                item.remove();
            };
            bar.appendChild(item);
        }
    }
}

function openRadioForEvent(evId) {
    selectedEvIdForRadio = evId;
    createRadioWindow(evId);
    const btnOpen = document.getElementById('btn-open-radio');
    if (btnOpen) btnOpen.style.display = 'block';
}

function openRadioForSelectedEvent() {
    if (selectedEvIdForRadio !== null) openRadioForEvent(selectedEvIdForRadio);
    else if (events.length > 0) openRadioForEvent(events[0].id);
    else alert('Brak aktywnych zdarzeń.');
}

function sendCustomInputRadio(evId) {
    const input = document.getElementById(`inp-radio-reply-${evId}`);
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    input.value = '';
    sendRadioReplyDynamic(evId, val);
}

// --- MELDUNEK Z DOJAZDU ---
async function triggerArrivalRadioReport(ev, vehicle) {
    if (!ev.radioLogs) ev.radioLogs = [];
    createRadioWindow(ev.id);

    const sysPrompt = `Jesteś dowódcą zastępu straży pożarnej (${vehicle.id}). Dojechałeś na miejsce w miejscowości ${ev.city} (${ev.street || ''}). Zdarzenie: "${ev.desc}". 
Napisz krótki, naturalny 1-zdaniowy meldunek przez radio co zastaliście na miejscu i co robicie (normalnym językiem strażaka, bez sztywnych formułek). 
Rozpocznij od: "Wejherowo 998, tu ${vehicle.id}." i zakończ: "Bez odbioru."`;

    let reportText = "";
    try {
        reportText = await callUniversalAI(sysPrompt, "Meldunek z rozpoznania", false);
        reportText = reportText.replace(/^["']|["']$/g, '');
    } catch (e) {}

    if (!reportText) {
        reportText = `Wejherowo 998, tu ${vehicle.id}. Jesteśmy na miejscu w ${ev.city} (${ev.street || ''}) – potwierdzam zgłoszenie: ${ev.desc}, przystępujemy do działań. Bez odbioru.`;
    }

    audioMotorola.currentTime = 0;
    audioMotorola.play().catch(e => {});

    const timeStr = new Date().toLocaleTimeString();
    const initialMsg = `<div style="margin-bottom: 6px;">[${timeStr}] ${vehicle.id} ➔ Wejherowo 998:<br>"${reportText}"</div>`;
    ev.radioLogs.push(initialMsg);

    ev.kdrVehicleId = vehicle.id;
    updateRadioChatDynamic(ev.id);
}

// --- WYSYŁANIE ODPOWIEDZI W DYNAMICZNYM OKNIE ---
async function sendRadioReplyDynamic(evId, text) {
    if (!text) return;

    const ev = events.find(e => e.id === evId);
    if (!ev) return;

    audioMotorola.currentTime = 0;
    audioMotorola.play().catch(e => {});

    const kdrName = ev.kdrVehicleId || (ev.vehicles[0] ? ev.vehicles[0].id : 'KDR');
    const timeStr = new Date().toLocaleTimeString();
    const userMsg = `<div style="margin-bottom: 6px; color: #00ff00;">[${timeStr}] Wejherowo 998 ➔ ${kdrName}:<br>"${text}"</div>`;
    
    if (!ev.radioLogs) ev.radioLogs = [];
    ev.radioLogs.push(userMsg);

    const chatBox = document.getElementById(`radio-chat-${evId}`);
    if (chatBox) {
        chatBox.innerHTML = ev.radioLogs.join('') + `<div id="ai-typing-${evId}" style="color:#aaa; font-style:italic; padding:2px;">⏳ ${kdrName} nadaje...</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    const vehiclesListStr = ev.vehicles.map(v => `${v.id} (${v.name})`).join(', ');
    const systemPrompt = `Jesteś dowódcą akcji straży pożarnej (${kdrName}) na miejscu w miejscowości ${ev.city}.
Opis zdarzenia: "${ev.desc}". Zadysponowane wozy: ${vehiclesListStr}.
Dyspozytor (Wejherowo 998) mówi do Ciebie przez radio: "${text}".
Odpowiedz naturalnie, krótko i konkretnie na pytanie dyspozytora, jak prawdziwy strażak (dostosuj odpowiedź do wielkości zdarzenia, np. do śmietnika nie wzywaj podnośnika).
Format: "Wejherowo 998, tu ${kdrName}. [Krótka odpowiedź]. Bez odbioru."`;

    let aiReply = "";
    try {
        aiReply = await callUniversalAI(systemPrompt, text, false);
        aiReply = aiReply.replace(/^["']|["']$/g, '');
    } catch (err) {}

    if (!aiReply) {
        aiReply = generateSmartKdrResponse(kdrName, text, ev);
    }

    audioMotorola.currentTime = 0;
    audioMotorola.play().catch(e => {});

    const respMsg = `<div style="margin-bottom: 6px; color: #ffcc00;">[${new Date().toLocaleTimeString()}] ${kdrName} ➔ Wejherowo 998:<br>"${aiReply}"</div>`;
    
    ev.radioLogs.push(respMsg);
    updateRadioChatDynamic(evId);
}

function safeSetElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function generateFallbackDescription(subtype) {
    let cleanSub = (subtype || "").replace(/^(P|MZ|AF|CW|WG|BL|ZPR)\s*-\s*/i, "").trim();
    if (!cleanSub || cleanSub.toLowerCase().includes("inne")) {
        cleanSub = "Zdarzenie miejscowe wymagające interwencji straży pożarnej";
    }
    return cleanSub.charAt(0).toUpperCase() + cleanSub.slice(1);
}

// --- SYMULACJA ZGŁOSZENIA CPR (112) ---
async function simulateIncomingCPR() {
    audioCpr.currentTime = 0;
    audioCpr.play().catch(e => {});

    shiftStats.cprTotalGenerated++;

    const newCprId = `WCPR-2026-${cprCounter++}`;
    const randomTown = townsList[Math.floor(Math.random() * townsList.length)];
    const chosenType = Math.random() < 0.5 ? "P" : "MZ";
    const possibleSubtypes = subtypesData[chosenType];
    const randomSubtype = possibleSubtypes[Math.floor(Math.random() * possibleSubtypes.length)];

    safeSetElementText('cpr-id', newCprId);
    safeSetElementText('cpr-city', randomTown);
    safeSetElementText('cpr-street', "Ustalanie lokalizacji...");
    safeSetElementText('cpr-caller', "Łączenie z 112...");
    safeSetElementText('cpr-desc', "🤖 Generowanie opisu zdarzenia...");
    
    const cprModal = document.getElementById('cpr-modal');
    if (cprModal) cprModal.style.display = 'flex';

    const sysPrompt = `Jesteś operatorem CPR 112. Wygeneruj zgłoszenie w formacie JSON (bez znaczników markdown):
{
  "street": "ulica i numer w miejscowości ${randomTown}",
  "caller": "Imię Nazwisko (tel. 6xx-xxx-xxx)",
  "desc": "Naturalny, potoczny opis co się dzieje (1-2 zdania, np. 'Spod maski samochodu osobowego wydobywa się dym' albo 'Drzewo przewróciło się na jezdnię i blokuje przejazd'). Nie pisz kodów P ani MZ."
}`;
    const usrPrompt = `Miejscowość: ${randomTown}, Temat: ${randomSubtype}`;

    try {
        const rawJson = await callUniversalAI(sysPrompt, usrPrompt, true);
        const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
        const cleaned = jsonMatch ? jsonMatch[0] : rawJson.replace(/```json|```/g, '').trim();
        const aiEvent = JSON.parse(cleaned);

        let finalDesc = aiEvent.desc || generateFallbackDescription(randomSubtype);
        finalDesc = finalDesc.replace(/^(P|MZ|AF|CW|WG|BL|ZPR)\s*-\s*/i, "").trim();

        currentCPRData = {
            id: newCprId,
            city: randomTown,
            street: aiEvent.street || `ul. ${streetNames[Math.floor(Math.random() * streetNames.length)]} ${Math.floor(Math.random() * 50) + 1}`,
            type: chosenType,
            subtype: randomSubtype,
            desc: finalDesc,
            caller: aiEvent.caller || "Jan Kowalski (tel. 601-234-567)"
        };
    } catch (e) {
        const stName = streetNames[Math.floor(Math.random() * streetNames.length)];
        currentCPRData = {
            id: newCprId,
            city: randomTown,
            street: `ul. ${stName} ${Math.floor(Math.random() * 50) + 1}`,
            type: chosenType,
            subtype: randomSubtype,
            desc: generateFallbackDescription(randomSubtype),
            caller: "Jan Kowalski (tel. 601-234-567)"
        };
    }

    safeSetElementText('cpr-id', currentCPRData.id);
    safeSetElementText('cpr-city', currentCPRData.city);
    safeSetElementText('cpr-street', currentCPRData.street);
    safeSetElementText('cpr-caller', currentCPRData.caller);
    safeSetElementText('cpr-desc', currentCPRData.desc);
}

function closeCPR(isAccepted = false) { 
    if (!isAccepted && currentCPRData) {
        shiftStats.cprRefused++;
        const reason = "Zamknięto formatkę CPR bez otwarcia karty";
        shiftStats.refusalReasons[reason] = (shiftStats.refusalReasons[reason] || 0) + 1;
        currentCPRData = null;
    }
    const modal = document.getElementById('cpr-modal');
    if(modal) modal.style.display = 'none'; 
}

function minimizeCPR() {
    if (!currentCPRData) return;
    const modal = document.getElementById('cpr-modal');
    if(modal) modal.style.display = 'none';
    const bar = document.getElementById('minimized-bar');
    if(bar) {
        const item = document.createElement('div');
        item.className = 'minimized-item';
        item.innerHTML = `🚨 Zgłoszenie CPR (${currentCPRData.city})`;
        item.onclick = () => { 
            const m = document.getElementById('cpr-modal');
            if(m) m.style.display = 'flex'; 
            item.remove(); 
        };
        bar.appendChild(item);
    }
}

function acceptCPRToEvent() {
    if (!currentCPRData) return;
    shiftStats.cprAccepted++;
    openNewEventModal();

    const inpRec = document.getElementById('inp-ev-received');
    const inpCity = document.getElementById('inp-ev-city');
    const inpReg = document.getElementById('inp-ev-region');
    const inpStreet = document.getElementById('inp-ev-street');
    const inpDesc = document.getElementById('inp-ev-desc');
    if(inpRec) inpRec.value = 'CPR';
    if(inpCity) inpCity.value = currentCPRData.city;
    if(inpReg) inpReg.value = locationsDatabase[currentCPRData.city] || '';
    if(inpStreet) inpStreet.value = currentCPRData.street;
    
    let cleanDesc = (currentCPRData.desc || "").replace(/^(P|MZ|AF|CW|WG|BL|ZPR)\s*-\s*/i, "").trim();
    if (inpDesc) inpDesc.value = cleanDesc;

    autoSelectJRGByCity(currentCPRData.city);

    // Dyspozytor sam wybiera rodzaj i podrodzaj zdarzenia!
    const radioP = document.querySelector('input[name="ev-type"][value="P"]');
    if (radioP) radioP.checked = true;
    updateSubtypes('P');

    const callerParts = currentCPRData.caller.split(' ');
    const nameInp = document.getElementById('inp-caller-name');
    const surInp = document.getElementById('inp-caller-surname');
    if(nameInp) nameInp.value = callerParts[0] || '';
    if(surInp) surInp.value = callerParts[1] || '';

    closeCPR(true);
    currentCPRData = null;
}

function formatMMSS(sec) {
    if (sec < 0) return "Zabezpieczenie rejonu";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s} min`;
}

function updateSubtypes(type) {
    const select = document.getElementById('inp-ev-subtype');
    const group = document.getElementById('subtype-group');
    if(!select) return;
    select.innerHTML = '';
    
    if (group) {
        if (type === 'PZR') {
            group.style.display = 'none';
            return;
        } else {
            group.style.display = 'flex';
        }
    }

    const list = subtypesData[type] || ["Brak"];
    list.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.innerText = sub;
        select.appendChild(opt);
    });
}

function toggleService(service) {
    servicesState[service] = !servicesState[service];
    const btn = document.getElementById(service === 'prm' ? 'btn-service-prm' : 'btn-service-police');
    if (btn) {
        if (servicesState[service]) btn.classList.add('active');
        else btn.classList.remove('active');
    }
}

function renderUnits() {
    const pspGrid = document.getElementById('grid-psp');
    const ospGrid = document.getElementById('grid-osp');
    if(pspGrid) pspGrid.innerHTML = unitsPSP.map(u => createUnitHTML(u)).join('');
    if(ospGrid) ospGrid.innerHTML = unitsOSP.map(u => createUnitHTML(u)).join('');
}

function createUnitHTML(unit) {
    let vehiclesHTML = unit.vehicles.length === 0 ? `<div style="padding: 4px; color: #888; font-style: italic;">Brak pojazdów</div>` :
        unit.vehicles.map(v => `
            <div class="vehicle-row">
                <span class="status-dot ${v.status}"></span>
                <span><b>${v.id}</b> - ${v.name}</span>
            </div>
        `).join('');

    return `
        <div class="unit-box">
            <div class="unit-header">${unit.name}</div>
            <div>${vehiclesHTML}</div>
        </div>
    `;
}

function renderEvents() {
    const tbody = document.getElementById('events-body');
    if(!tbody) return;
    tbody.innerHTML = '';

    events.forEach(ev => {
        const tr = document.createElement('tr');
        tr.className = (ev.status === 'ACTIVE' ? 'active-ev' : 'finished-ev') + (selectedEvIdForRadio === ev.id ? ' selected-ev' : '');
        tr.ondblclick = () => openEditEventModal(ev.id);
        tr.onclick = () => selectEvent(ev.id);

        let timeDisplay = ev.status === 'FINISHED' ? "0:00 min (Zakończono)" : (!ev.firstArrived ? `Oczekiwanie... (${formatMMSS(ev.remainingSeconds)})` : formatMMSS(ev.remainingSeconds));

        tr.innerHTML = `
            <td>${ev.id}/???/2026</td>
            <td>${ev.time}</td>
            <td>${ev.jrg}</td>
            <td>${ev.jrg}</td>
            <td>${ev.city}</td>
            <td>${ev.vehicles.length}</td>
            <td>${ev.type}</td>
            <td>${ev.desc}</td>
            <td><b>${timeDisplay}</b></td>
            <td>???-0000${ev.id}</td>
        `;
        tbody.appendChild(tr);
    });
    updateMapMarkers();
}

function renderSelectedEventDetails() {
    if (selectedEvIdForRadio === null) return;
    const ev = events.find(e => e.id === selectedEvIdForRadio);
    if (!ev) return;

    const sisBody = document.getElementById('details-sis-body');
    if (!sisBody) return;

    if (ev.vehicles.length === 0) {
        sisBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888;">Brak zadysponowanych SiS</td></tr>';
        return;
    }

    sisBody.innerHTML = ev.vehicles.map(v => {
        let statusText = v.travelTime > 0 
            ? `<span style="color: #f39c12; font-weight: bold;">Dojazd (${v.travelTime}s)</span>` 
            : (ev.status === 'ACTIVE' 
                ? `<span style="color: #ff3333; font-weight: bold;">Na miejscu</span>` 
                : `<span style="color: #00ff00;">Wolny</span>`);
                
        return `
            <tr>
                <td><b>${v.id}</b> - ${v.name}</td>
                <td>${v.obsada}</td>
                <td>${v.unitName}</td>
                <td>${statusText}</td>
            </tr>
        `;
    }).join('');
}

function selectEvent(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;

    selectedEvIdForRadio = ev.id;
    const btnOpen = document.getElementById('btn-open-radio');
    const detailsTitle = document.getElementById('details-title');
    if(btnOpen) btnOpen.style.display = 'block';
    if(detailsTitle) detailsTitle.innerText = `Szczegóły zdarzenia ID: ${ev.id} - ${ev.city}`;
    
    renderEvents();
    renderSelectedEventDetails();
}

function switchTab(tab) {
    const pspGrid = document.getElementById('grid-psp');
    const ospGrid = document.getElementById('grid-osp');
    const mapContainer = document.getElementById('view-map-container');
    const btnPsp = document.getElementById('btn-tab-psp');
    const btnOsp = document.getElementById('btn-tab-osp');
    const btnMap = document.getElementById('btn-tab-map');

    if(mapContainer) mapContainer.style.display = 'none';
    if(btnMap) btnMap.classList.remove('active');

    if(pspGrid) pspGrid.style.display = tab === 'PSP' ? 'grid' : 'none';
    if(ospGrid) ospGrid.style.display = tab === 'OSP' ? 'grid' : 'none';
    if(btnPsp) btnPsp.className = 'tab-btn ' + (tab === 'PSP' ? 'active' : '');
    if(btnOsp) btnOsp.className = 'tab-btn ' + (tab === 'OSP' ? 'active' : '');
}

function handleCityInput(input) {
    if(!input) return;
    const val = input.value.trim().toLowerCase();
    const suggestionsBox = document.getElementById('city-suggestions');
    if(!suggestionsBox) return;
    suggestionsBox.innerHTML = '';

    if (!val) { suggestionsBox.style.display = 'none'; return; }

    const matches = Object.keys(locationsDatabase).filter(c => c.toLowerCase().startsWith(val));
    if (matches.length > 0) {
        matches.forEach(c => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerText = c;
            div.onclick = () => {
                const cityInp = document.getElementById('inp-ev-city');
                const regInp = document.getElementById('inp-ev-region');
                if(cityInp) cityInp.value = c;
                if(regInp) regInp.value = locationsDatabase[c];
                autoSelectJRGByCity(c);
                suggestionsBox.style.display = 'none';
            };
            suggestionsBox.appendChild(div);
        });
        suggestionsBox.style.display = 'block';
    } else {
        suggestionsBox.style.display = 'none';
    }
}

function openNewEventModal() {
    activeEditingId = null;
    selectedVehicles = [];
    servicesState = { prm: false, police: false };
    
    const btnPrm = document.getElementById('btn-service-prm');
    const btnPol = document.getElementById('btn-service-police');
    if(btnPrm) btnPrm.classList.remove('active');
    if(btnPol) btnPol.classList.remove('active');

    const titleEl = document.getElementById('modal-event-title');
    const timeEl = document.getElementById('inp-ev-time');
    const cityEl = document.getElementById('inp-ev-city');
    const regEl = document.getElementById('inp-ev-region');
    const streetEl = document.getElementById('inp-ev-street');
    const descEl = document.getElementById('inp-ev-desc');
    const nameEl = document.getElementById('inp-caller-name');
    const surEl = document.getElementById('inp-caller-surname');
    const phoneEl = document.getElementById('inp-caller-phone');
    const countEl = document.getElementById('lbl-selected-count');
    const modalEl = document.getElementById('modal-event');

    if(titleEl) titleEl.innerText = "Nowa Karta Zdarzenia";
    if(timeEl) timeEl.value = new Date().toLocaleTimeString();
    if(cityEl) cityEl.value = '';
    if(regEl) regEl.value = '';
    if(streetEl) streetEl.value = '';
    if(descEl) descEl.value = '';
    if(nameEl) nameEl.value = '';
    if(surEl) surEl.value = '';
    if(phoneEl) phoneEl.value = '';
    if(countEl) countEl.innerText = "Wybrano pojazdów: 0";

    const radioP = document.querySelector('input[name="ev-type"][value="P"]');
    if (radioP) radioP.checked = true;
    updateSubtypes('P');

    switchModalTab('dane');
    if(modalEl) modalEl.style.display = 'flex';
}

function openEditEventModal(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;

    activeEditingId = id;
    selectedVehicles = [...ev.vehicles];

    const titleEl = document.getElementById('modal-event-title');
    const timeEl = document.getElementById('inp-ev-time');
    const cityEl = document.getElementById('inp-ev-city');
    const regEl = document.getElementById('inp-ev-region');
    const streetEl = document.getElementById('inp-ev-street');
    const descEl = document.getElementById('inp-ev-desc');
    const countEl = document.getElementById('lbl-selected-count');
    const modalEl = document.getElementById('modal-event');

    if(titleEl) titleEl.innerText = `Edycja zdarzenia ID: ${ev.id}`;
    if(timeEl) timeEl.value = ev.time;
    if(cityEl) cityEl.value = ev.city;
    if(regEl) regEl.value = ev.region;
    if(streetEl) streetEl.value = ev.street;
    if(descEl) descEl.value = ev.desc;
    if(countEl) countEl.innerText = "Wybrano pojazdów: " + selectedVehicles.length;

    const radio = document.querySelector(`input[name="ev-type"][value="${ev.type}"]`);
    if (radio) radio.checked = true;
    updateSubtypes(ev.type);
    const subSel = document.getElementById('inp-ev-subtype');
    if (ev.type !== 'PZR' && subSel) subSel.value = ev.subtype || "";

    servicesState = { ...ev.services };
    const btnPrm = document.getElementById('btn-service-prm');
    const btnPol = document.getElementById('btn-service-police');
    if (btnPrm) {
        if (servicesState.prm) btnPrm.classList.add('active');
        else btnPrm.classList.remove('active');
    }
    if (btnPol) {
        if (servicesState.police) btnPol.classList.add('active');
        else btnPol.classList.remove('active');
    }

    switchModalTab('dane');
    if(modalEl) modalEl.style.display = 'flex';
}

function openDispatchModal() {
    const container = document.getElementById('dispatch-list');
    const infoBar = document.getElementById('dispatch-info-bar');
    const cityInput = document.getElementById('inp-ev-city');
    const modalDisp = document.getElementById('modal-dispatch');
    
    if(!container) return;
    const targetCity = cityInput ? cityInput.value.trim() : "";
    container.innerHTML = '';

    if(infoBar) {
        infoBar.innerHTML = targetCity ? `📍 Kolejność wg odległości dla: <span style="color:#b30000;">${targetCity}</span>` : `⚠️ Brak miejscowości`;
    }

    const availableUnits = [...unitsPSP, ...unitsOSP]
        .filter(u => u.vehicles.length > 0)
        .map(u => ({ ...u, ...getUnitProximity(u.name, targetCity) }))
        .sort((a, b) => a.sec - b.sec);

    availableUnits.forEach((u, index) => {
        const isClosest = index === 0 && targetCity !== "";
        const groupDiv = document.createElement('div');
        groupDiv.className = 'dispatch-unit-group';

        groupDiv.innerHTML = `
            <div class="dispatch-unit-header ${isClosest ? 'closest' : ''}">
                <span>${index + 1}. ${u.name} ${isClosest ? '⭐ (Najbliższa)' : ''}</span>
                <span>${u.km} | Dojazd: ~${u.sec}s</span>
            </div>
            ${u.vehicles.map(v => `
                <label class="dispatch-vehicle-item" style="cursor:pointer;">
                    <input type="checkbox" value="${v.id}" ${selectedVehicles.some(sv => sv.id === v.id) ? 'checked' : ''}>
                    <span class="status-dot ${v.status}"></span>
                    <span><b>${v.id}</b> - ${v.name}</span>
                </label>
            `).join('')}
        `;
        container.appendChild(groupDiv);
    });

    if(modalDisp) modalDisp.style.display = 'flex';
}

function confirmDispatch() {
    const checkboxes = document.querySelectorAll('#dispatch-list input:checked');
    const cityInput = document.getElementById('inp-ev-city');
    const targetCity = (cityInput && cityInput.value.trim()) ? cityInput.value.trim() : "Bolszewo";
    selectedVehicles = [];

    checkboxes.forEach(cb => {
        [...unitsPSP, ...unitsOSP].forEach(u => {
            const v = u.vehicles.find(veh => veh.id === cb.value);
            if (v) selectedVehicles.push({ ...v, unitName: u.name, travelTime: calculateTravelTimeSeconds(u.name, targetCity) });
        });
    });

    const countLbl = document.getElementById('lbl-selected-count');
    if(countLbl) countLbl.innerText = "Wybrano pojazdów: " + selectedVehicles.length;
    closeModal('modal-dispatch');
}

function saveEvent() {
    const cityInput = document.getElementById('inp-ev-city');
    const city = cityInput ? cityInput.value.trim() : "";
    if (!city) { alert('Proszę podać miejscowość!'); return; }

    const typeChecked = document.querySelector('input[name="ev-type"]:checked');
    const typeVal = typeChecked ? typeChecked.value : 'P';
    const subSel = document.getElementById('inp-ev-subtype');
    const subtypeVal = typeVal === 'PZR' ? 'Zabezpieczenie rejonu' : (subSel ? subSel.value : '');
    
    const descInput = document.getElementById('inp-ev-desc');
    let descVal = descInput ? descInput.value : '';
    descVal = descVal.replace(/^(P|MZ|AF|CW|WG|BL|ZPR)\s*-\s*/i, "").trim();

    selectedVehicles.forEach(sv => {
        if (sv.travelTime === undefined || activeEditingId === null) {
            sv.travelTime = calculateTravelTimeSeconds(sv.unitName, city);
        }
    });

    if (activeEditingId === null) {
        let countedOspNames = [];
        selectedVehicles.forEach(sv => {
            if (!sv.unitName.includes("JRG") && !sv.unitName.includes("KP PSP") && !countedOspNames.includes(sv.unitName)) {
                countedOspNames.push(sv.unitName);
            }
        });
        playOspAlarmRepeated(countedOspNames.length);

        const timeInput = document.getElementById('inp-ev-time');
        const regInput = document.getElementById('inp-ev-region');
        const streetInput = document.getElementById('inp-ev-street');
        const jrgInput = document.getElementById('inp-ev-jrg');

        const newEv = {
            id: events.length + 1,
            time: timeInput && timeInput.value ? timeInput.value : new Date().toLocaleTimeString(),
            city: city,
            region: regInput ? regInput.value : (locationsDatabase[city] || ''),
            street: streetInput ? streetInput.value : '',
            desc: descVal,
            type: typeVal,
            subtype: subtypeVal,
            remainingSeconds: 180,
            firstArrived: false,
            radioReported: false,
            radioLogs: [],
            jrg: jrgInput ? jrgInput.value : 'JRG 1 Wejherowo',
            services: { ...servicesState },
            vehicles: [...selectedVehicles],
            status: 'ACTIVE'
        };
        events.push(newEv);
        selectEvent(newEv.id);
    } else {
        const ev = events.find(e => e.id === activeEditingId);
        if (ev) {
            ev.city = city;
            ev.desc = descVal;
            ev.type = typeVal;
            ev.subtype = subtypeVal;
            ev.services = { ...servicesState };
            ev.vehicles = [...selectedVehicles];
        }
    }

    selectedVehicles.forEach(sv => {
        [...unitsPSP, ...unitsOSP].forEach(u => {
            const v = u.vehicles.find(veh => veh.id === sv.id);
            if (v && v.status === 'green') v.status = 'orange';
        });
    });

    renderUnits();
    renderEvents();
    closeModal('modal-event');
}

function finishCurrentEvent() {
    const targetId = activeEditingId !== null ? activeEditingId : selectedEvIdForRadio;
    if (targetId === null) return;
    const ev = events.find(e => e.id === targetId);
    if (ev) {
        ev.status = 'FINISHED';
        ev.remainingSeconds = 0;
        ev.vehicles.forEach(sv => {
            [...unitsPSP, ...unitsOSP].forEach(u => {
                const v = u.vehicles.find(veh => veh.id === sv.id);
                if (v) v.status = 'green';
            });
        });
    }
    renderUnits();
    renderEvents();
    closeModal('modal-event');
}

function switchModalTab(tab) {
    const daneContent = document.getElementById('modal-tab-dane-content');
    const czasyContent = document.getElementById('modal-tab-czasy-content');
    const tabDane = document.getElementById('tab-modal-dane');
    const tabCzasy = document.getElementById('tab-modal-czasy');

    if(daneContent) daneContent.style.display = tab === 'dane' ? 'block' : 'none';
    if(czasyContent) czasyContent.style.display = tab === 'czasy' ? 'block' : 'none';
    if(tabDane) tabDane.className = 'tab-btn ' + (tab === 'dane' ? 'active' : '');
    if(tabCzasy) tabCzasy.className = 'tab-btn ' + (tab === 'czasy' ? 'active' : '');
}

function openSiSModal() { 
    ensureSiSModalExists();
    renderSiSManagerList();
    const modal = document.getElementById('modal-sis');
    if(modal) modal.style.display = 'flex'; 
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'none'; 
}

// --- GŁÓWNA PĘTLA CZASU SYMULATORA (DOJAZD, CZAS AKCJI, ZEGAR) ---
setInterval(() => {
    let needsRender = false;
    events.forEach(ev => {
        if (ev.status === 'ACTIVE') {
            ev.vehicles.forEach(v => {
                if (v.travelTime > 0) {
                    v.travelTime--;
                    needsRender = true;
                } else {
                    [...unitsPSP, ...unitsOSP].forEach(u => {
                        const veh = u.vehicles.find(vObj => vObj.id === v.id);
                        if (veh && veh.status === 'orange') {
                            veh.status = 'red';
                            if (!ev.firstArrived) {
                                ev.firstArrived = true;
                                if (!ev.radioReported) {
                                    ev.radioReported = true;
                                    triggerArrivalRadioReport(ev, v);
                                }
                            }
                            needsRender = true;
                        }
                    });
                }
            });

            if (ev.firstArrived && ev.remainingSeconds > 0) {
                ev.remainingSeconds--;
                needsRender = true;
            } else if (ev.firstArrived && ev.remainingSeconds === 0) {
                ev.status = 'FINISHED';
                ev.vehicles.forEach(sv => {
                    [...unitsPSP, ...unitsOSP].forEach(u => {
                        const veh = u.vehicles.find(vObj => vObj.id === sv.id);
                        if (veh) veh.status = 'green';
                    });
                });
                needsRender = true;
            }
        }
    });
    if (needsRender) {
        renderUnits();
        renderEvents();
    }
    
    renderSelectedEventDetails();

    const clockEl = document.getElementById('clock-box');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toISOString().slice(0, 10) + ' ' + now.toLocaleTimeString();
    }
}, 1000);

// --- AUTOMATYCZNE GENEROWANIE ZGŁOSZEŃ ---
function scheduleNextAutoCPR() {
    const randomTime = Math.floor(Math.random() * (90000 - 45000 + 1)) + 45000;
    setTimeout(() => {
        const cprModal = document.getElementById('cpr-modal');
        if (!cprModal || cprModal.style.display !== 'flex') {
            simulateIncomingCPR();
        }
        scheduleNextAutoCPR();
    }, randomTime);
}

scheduleNextAutoCPR();
renderUnits();
