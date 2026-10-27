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
    const timeoutId = setTimeout(() => controller.abort(), 4000);

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
                temperature: 0.4,
                max_tokens: 150,
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
                temperature: 0.4,
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

const locationsDatabase = {
    "Wejherowo": { desc: "m. Wejherowo, pow. wejherowski, woj. pomorskie", lat: 54.6059, lng: 18.2443 },
    "Bolszewo": { desc: "gm. Wejherowo, pow. wejherowski, woj. pomorskie", lat: 54.5982, lng: 18.2014 },
    "Rumia": { desc: "m. Rumia, pow. wejherowski, woj. pomorskie", lat: 54.5714, lng: 18.3879 },
    "Reda": { desc: "m. Reda, pow. wejherowski, woj. pomorskie", lat: 54.6062, lng: 18.3475 },
    "Gościcino": { desc: "gm. Wejherowo, pow. wejherowski, woj. pomorskie", lat: 54.5824, lng: 18.1513 },
    "Gniewowo": { desc: "gm. Wejherowo, pow. wejherowski, woj. pomorskie", lat: 54.5422, lng: 18.2691 },
    "Gowino": { desc: "gm. Wejherowo, pow. wejherowski, woj. pomorskie", lat: 54.5711, lng: 18.2001 },
    "Góra": { desc: "gm. Wejherowo, pow. wejherowski, woj. pomorskie", lat: 54.6394, lng: 18.1923 },
    "Kniewo": { desc: "gm. Wejherowo, pow. wejherowski, woj. pomorskie", lat: 54.6644, lng: 18.1064 },
    "Nowy Dwór Wejherowski": { desc: "gm. Wejherowo, pow. wejherowski, woj. pomorskie", lat: 54.5412, lng: 18.2215 },
    "Orle": { desc: "gm. Wejherowo, pow. wejherowski, woj. pomorskie", lat: 54.6291, lng: 18.1812 },
    "Zbychowo": { desc: "gm. Wejherowo, pow. wejherowski, woj. pomorskie", lat: 54.5211, lng: 18.2812 },
    "Luzino": { desc: "gm. Luzino, pow. wejherowski, woj. pomorskie", lat: 54.5434, lng: 18.0822 },
    "Zelewo": { desc: "gm. Luzino, pow. wejherowski, woj. pomorskie", lat: 54.5812, lng: 18.0514 },
    "Milwino": { desc: "gm. Luzino, pow. wejherowski, woj. pomorskie", lat: 54.5121, lng: 18.0412 },
    "Szemud": { desc: "gm. Szemud, pow. wejherowski, woj. pomorskie", lat: 54.4533, lng: 18.2011 },
    "Kielno": { desc: "gm. Szemud, pow. wejherowski, woj. pomorskie", lat: 54.4412, lng: 18.3214 },
    "Bojano": { desc: "gm. Szemud, pow. wejherowski, woj. pomorskie", lat: 54.4712, lng: 18.3912 },
    "Częstkowo": { desc: "gm. Szemud, pow. wejherowski, woj. pomorskie", lat: 54.4711, lng: 18.1012 },
    "Łebno": { desc: "gm. Szemud, pow. wejherowski, woj. pomorskie", lat: 54.4512, lng: 18.0712 },
    "Przetoczyno": { desc: "gm. Szemud, pow. wejherowski, woj. pomorskie", lat: 54.5122, lng: 18.1412 },
    "Gniewino": { desc: "gm. Gniewino, pow. wejherowski, woj. pomorskie", lat: 54.7214, lng: 17.9712 },
    "Nadole": { desc: "gm. Gniewino, pow. wejherowski, woj. pomorskie", lat: 54.7412, lng: 18.0312 },
    "Kostkowo": { desc: "gm. Gniewino, pow. wejherowski, woj. pomorskie", lat: 54.6812, lng: 18.0112 },
    "Rybno": { desc: "gm. Gniewino, pow. wejherowski, woj. pomorskie", lat: 54.6812, lng: 18.0812 },
    "Opalino": { desc: "gm. Gniewino, pow. wejherowski, woj. pomorskie", lat: 54.7012, lng: 18.0512 },
    "Choczewo": { desc: "gm. Choczewo, pow. wejherowski, woj. pomorskie", lat: 54.7412, lng: 17.9112 },
    "Słajszewo": { desc: "gm. Choczewo, pow. wejherowski, woj. pomorskie", lat: 54.7812, lng: 17.8512 },
    "Sasino": { desc: "gm. Choczewo, pow. wejherowski, woj. pomorskie", lat: 54.7912, lng: 17.7812 },
    "Kopalino": { desc: "gm. Choczewo, pow. wejherowski, woj. pomorskie", lat: 54.8112, lng: 17.8112 },
    "Linia": { desc: "gm. Linia, pow. wejherowski, woj. pomorskie", lat: 54.4312, lng: 17.9312 },
    "Strzepcz": { desc: "gm. Linia, pow. wejherowski, woj. pomorskie", lat: 54.4412, lng: 18.0212 },
    "Lewino": { desc: "gm. Linia, pow. wejherowski, woj. pomorskie", lat: 54.4712, lng: 17.9012 },
    "Łęczyce": { desc: "gm. Łęczyce, pow. wejherowski, woj. pomorskie", lat: 54.6112, lng: 18.0112 },
    "Bożepole Wielkie": { desc: "gm. Łęczyce, pow. wejherowski, woj. pomorskie", lat: 54.5812, lng: 17.9312 },
    "Rozłazino": { desc: "gm. Łęczyce, pow. wejherowski, woj. pomorskie", lat: 54.5812, lng: 17.8612 },
    "Kaczkowo": { desc: "gm. Łęczyce, pow. wejherowski, woj. pomorskie", lat: 54.6212, lng: 17.9312 }
};

const townsList = Object.keys(locationsDatabase);

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
    const targetTown = Object.keys(locationsDatabase).find(
        c => c.toLowerCase() === (city || "").trim().toLowerCase()
    ) || "Wejherowo";

    if (baseTown.toLowerCase() === targetTown.toLowerCase()) {
        const isJRG = unitName.includes("JRG");
        return { sec: isJRG ? 15 : 18, km: isJRG ? "1.2 km" : "1.5 km" };
    }

    const c1 = locationsDatabase[baseTown];
    const c2 = locationsDatabase[targetTown];
    const dist = Math.sqrt(Math.pow(c1.lat - c2.lat, 2) + Math.pow(c1.lng - c2.lng, 2)) * 111;
    const kmRounded = Math.max(1.5, Math.round(dist * 10) / 10);
    const secCalc = Math.max(20, Math.round(kmRounded * 45));

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

// --- MAPA LEAFLET ---
let leafletMap = null;
let mapMarkersLayer = null;

function initLeafletMap() {
    if (leafletMap) return;
    leafletMap = L.map('leaflet-map').setView([54.6059, 18.2443], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(leafletMap);
    mapMarkersLayer = L.layerGroup().addTo(leafletMap);
    updateMapMarkers();
}

function updateMapMarkers() {
    if (!mapMarkersLayer) return;
    mapMarkersLayer.clearLayers();

    Object.keys(unitBaseTown).forEach(unitName => {
        const town = unitBaseTown[unitName];
        const loc = locationsDatabase[town];
        if (loc) {
            const marker = L.marker([loc.lat, loc.lng], {
                icon: L.divIcon({
                    className: 'map-unit-marker',
                    html: `<div style="background:#0a246a; color:#fff; border:1px solid #fff; border-radius:3px; padding:1px 4px; font-size:9px; font-weight:bold; white-space:nowrap;">🚒 ${unitName}</div>`
                })
            });
            marker.bindPopup(`<b>Jednostka:</b> ${unitName}<br><b>Lokalizacja:</b> ${town}`);
            mapMarkersLayer.addLayer(marker);
        }
    });

    events.forEach(ev => {
        const loc = locationsDatabase[ev.city];
        if (loc) {
            const marker = L.marker([loc.lat, loc.lng], {
                icon: L.divIcon({
                    className: 'map-event-marker',
                    html: `<div style="background:#b30000; color:#fff; border:2px solid #ffcc00; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; box-shadow:0 0 5px rgba(0,0,0,0.5);">🔥</div>`
                })
            });
            marker.bindPopup(`<b>Zdarzenie ID: ${ev.id}</b><br><b>Miasto:</b> ${ev.city}, ${ev.street}<br><b>Opis:</b> ${ev.desc}<br><b>Status:</b> ${ev.status}`);
            mapMarkersLayer.addLayer(marker);
        }
    });
}

function switchMainView(viewType) {
    const unitsContainer = document.getElementById('view-units-container');
    const mapContainer = document.getElementById('view-map-container');
    const btnMap = document.getElementById('btn-tab-map');

    if (viewType === 'map') {
        if(unitsContainer) unitsContainer.style.display = 'none';
        if(mapContainer) mapContainer.style.display = 'block';
        if(btnMap) btnMap.classList.add('active');
        setTimeout(() => { initLeafletMap(); leafletMap.invalidateSize(); }, 200);
    } else {
        if(unitsContainer) unitsContainer.style.display = 'flex';
        if(mapContainer) mapContainer.style.display = 'none';
        if(btnMap) btnMap.classList.remove('active');
    }
}

// --- OKNO RAPORTÓW I STATYSTYK ---
function openReportsModal() {
    const total = events.length;
    const active = events.filter(e => e.status === 'ACTIVE').length;
    const finished = events.filter(e => e.status === 'FINISHED').length;

    let prmCount = 0, prmActive = 0, prmFin = 0;
    let pspCount = 0, pspActive = 0, pspFin = 0;
    let polCount = 0, polActive = 0, polFin = 0;

    const catCounts = {};
    const townCounts = {};

    events.forEach(ev => {
        if (ev.services && ev.services.prm) {
            prmCount++;
            if (ev.status === 'ACTIVE') prmActive++; else prmFin++;
        }
        if (ev.services && ev.services.police) {
            polCount++;
            if (ev.status === 'ACTIVE') polActive++; else polFin++;
        }
        pspCount++;
        if (ev.status === 'ACTIVE') pspActive++; else pspFin++;

        const cat = ev.type || 'Inne';
        catCounts[cat] = (catCounts[cat] || 0) + 1;

        const town = ev.city || 'Nieznana';
        townCounts[town] = (townCounts[town] || 0) + 1;
    });

    safeSetElementText('stat-total', total);
    safeSetElementText('stat-active', active);
    safeSetElementText('stat-finished', finished);

    safeSetElementText('stat-prm-count', prmCount);
    safeSetElementText('stat-prm-active', prmActive);
    safeSetElementText('stat-prm-fin', prmFin);

    safeSetElementText('stat-psp-count', pspCount);
    safeSetElementText('stat-psp-active', pspActive);
    safeSetElementText('stat-psp-fin', pspFin);

    safeSetElementText('stat-pol-count', polCount);
    safeSetElementText('stat-pol-active', polActive);
    safeSetElementText('stat-pol-fin', polFin);

    const catBody = document.getElementById('stat-cat-body');
    if (catBody) {
        if (Object.keys(catCounts).length === 0) {
            catBody.innerHTML = '<tr><td>Brak danych</td><td>0</td></tr>';
        } else {
            catBody.innerHTML = Object.entries(catCounts).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
        }
    }

    const townBody = document.getElementById('stat-town-body');
    if (townBody) {
        if (Object.keys(townCounts).length === 0) {
            townBody.innerHTML = '<tr><td>Brak danych</td><td>0</td></tr>';
        } else {
            townBody.innerHTML = Object.entries(townCounts).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
        }
    }

    const modal = document.getElementById('modal-reports');
    if (modal) modal.style.display = 'flex';
}

// --- DRAGGABLE WINDOWS ---
function makeDraggable(elmnt, header) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (header) header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if (e.target.closest('.modal-close, .modal-min')) return;
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

window.addEventListener('DOMContentLoaded', () => {
    const eventModal = document.querySelector('#modal-event .modal-window');
    if (eventModal) makeDraggable(eventModal, document.querySelector('#modal-event .modal-header'));

    const cprModal = document.getElementById('cpr-modal');
    if (cprModal) makeDraggable(cprModal, cprModal.querySelector('.cpr-header'));

    const repModal = document.querySelector('#modal-reports .modal-window');
    if (repModal) makeDraggable(repModal, document.querySelector('#modal-reports .modal-header'));
});

function generateSmartKdrResponse(kdrCallsign, userQuestion, ev) {
    const q = userQuestion.toLowerCase();
    if (q.includes("pogotow") || q.includes("zrm")) return `Wejherowo 998, tu ${kdrCallsign}. Tak, proszę zadysponować ZRM na miejsce. Bez odbioru.`;
    if (q.includes("policj")) return `Wejherowo 998, tu ${kdrCallsign}. Proszę o patrol Policji do kierowania ruchem. Bez odbioru.`;
    return `Wejherowo 998, tu ${kdrCallsign}. Działamy zgodnie z procedurą. Bez odbioru.`;
}

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
    modal.style.left = 'calc(50% - 220px)';
    modal.style.top = 'calc(50% - 210px)';

    modal.innerHTML = `
        <div style="background: #c0c0c0; border: 2px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; box-shadow: 2px 2px 5px rgba(0,0,0,0.5);">
            <div class="radio-win-header" style="background: linear-gradient(90deg, #004080, #1060b0); color: #ffffff; padding: 3px 6px; font-weight: bold; font-size: 13px; display: flex; justify-content: space-between; align-items: center; cursor: move;">
                <span>🖵 Korespondencja Radiowa - Zdarzenie ID: ${ev.id} (${ev.city})</span>
                <div style="display: flex; gap: 2px;">
                    <button onclick="closeRadioWindow(${ev.id})">✕</button>
                </div>
            </div>
            <div style="padding: 6px; background: #c0c0c0;">
                <div id="radio-chat-${evId}" style="background: #000000; color: #ffcc00; font-family: 'Courier New', monospace; font-weight: bold; font-size: 12px; height: 195px; padding: 6px; overflow-y: auto; border: 2px solid #808080;"></div>
                <div style="display: flex; gap: 4px; margin-top: 6px;">
                    <input type="text" id="inp-radio-reply-${evId}" placeholder="Wpisz treść..." style="flex: 1; padding: 4px;" onkeypress="if(event.key==='Enter') sendCustomInputRadio(${ev.id})">
                    <button onclick="sendCustomInputRadio(${ev.id})" style="font-weight: bold;">Nadaj</button>
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

function openRadioForEvent(evId) {
    selectedEvIdForRadio = evId;
    createRadioWindow(evId);
    document.getElementById('btn-open-radio').style.display = 'block';
}

function openRadioForSelectedEvent() {
    if (selectedEvIdForRadio !== null) openRadioForEvent(selectedEvIdForRadio);
    else if (events.length > 0) openRadioForEvent(events[0].id);
}

function sendCustomInputRadio(evId) {
    const input = document.getElementById(`inp-radio-reply-${evId}`);
    if (!input || !input.value.trim()) return;
    const val = input.value.trim();
    input.value = '';
    sendRadioReplyDynamic(evId, val);
}

async function triggerArrivalRadioReport(ev, vehicle) {
    if (!ev.radioLogs) ev.radioLogs = [];
    createRadioWindow(ev.id);

    const sysPrompt = `Jesteś KDR (${vehicle.id}). Przybyłeś na miejsce w ${ev.city}. Zdarzenie: "${ev.desc}". Podaj krótki meldunek z dojazdu. Zacznij od: "Wejherowo 998, tu ${vehicle.id}." i zakończ "Bez odbioru."`;
    let reportText = "";
    try {
        reportText = await callUniversalAI(sysPrompt, "Meldunek z dojazdu", false);
        reportText = reportText.replace(/^["']|["']$/g, '');
    } catch (e) {
        reportText = `Wejherowo 998, tu ${vehicle.id}. Jesteśmy na miejscu (${ev.city}, ${ev.street}). Działamy. Bez odbioru.`;
    }

    const timeStr = new Date().toLocaleTimeString();
    ev.radioLogs.push(`<div style="margin-bottom: 6px;">[${timeStr}] ${vehicle.id} ➔ Wejherowo 998:<br>"${reportText}"</div>`);
    ev.kdrVehicleId = vehicle.id;
    updateRadioChatDynamic(ev.id);
}

async function sendRadioReplyDynamic(evId, text) {
    const ev = events.find(e => e.id === evId);
    if (!ev) return;

    const kdrName = ev.kdrVehicleId || (ev.vehicles[0] ? ev.vehicles[0].id : 'KDR');
    const timeStr = new Date().toLocaleTimeString();
    ev.radioLogs.push(`<div style="margin-bottom: 6px; color: #00ff00;">[${timeStr}] Wejherowo 998 ➔ ${kdrName}:<br>"${text}"</div>`);
    updateRadioChatDynamic(evId);

    const systemPrompt = `Jesteś dowódcą (${kdrName}) w ${ev.city}. Opis: "${ev.desc}". Dyspozytor pyta: "${text}". Odpowiedz krótko w żargonie strażackim, zaczynając od "Wejherowo 998, tu ${kdrName}..." i kończąc "Bez odbioru."`;
    
    let aiReply = "";
    try {
        aiReply = await callUniversalAI(systemPrompt, text, false);
        aiReply = aiReply.replace(/^["']|["']$/g, '');
    } catch (e) {
        aiReply = generateSmartKdrResponse(kdrName, text, ev);
    }

    ev.radioLogs.push(`<div style="margin-bottom: 6px; color: #ffcc00;">[${new Date().toLocaleTimeString()}] ${kdrName} ➔ Wejherowo 998:<br>"${aiReply}"</div>`);
    updateRadioChatDynamic(evId);
}

// CPR & Event Management
async function simulateIncomingCPR() {
    audioCpr.currentTime = 0;
    audioCpr.play().catch(e => {});

    const newCprId = `WCPR-2026-${cprCounter++}`;
    const randomTown = townsList[Math.floor(Math.random() * townsList.length)];
    const chosenType = Math.random() < 0.5 ? "P" : "MZ";
    const randomSubtype = subtypesData[chosenType][Math.floor(Math.random() * subtypesData[chosenType].length)];

    currentCPRData = {
        id: newCprId,
        city: randomTown,
        street: `ul. ${streetNames[Math.floor(Math.random() * streetNames.length)]} ${Math.floor(Math.random() * 50) + 1}`,
        type: chosenType,
        subtype: randomSubtype,
        desc: `Zgłoszenie zdarzenia typu ${randomSubtype}`,
        caller: "Jan Kowalski (tel. 601-234-567)"
    };

    safeSetElementText('cpr-id', currentCPRData.id);
    safeSetElementText('cpr-city', currentCPRData.city);
    safeSetElementText('cpr-street', currentCPRData.street);
    safeSetElementText('cpr-caller', currentCPRData.caller);
    safeSetElementText('cpr-desc', currentCPRData.desc);
    document.getElementById('cpr-modal').style.display = 'flex';
}

function closeCPR() { document.getElementById('cpr-modal').style.display = 'none'; }
function minimizeCPR() { closeCPR(); }

function acceptCPRToEvent() {
    if (!currentCPRData) return;
    openNewEventModal();
    document.getElementById('inp-ev-received').value = 'CPR';
    document.getElementById('inp-ev-city').value = currentCPRData.city;
    document.getElementById('inp-ev-region').value = locationsDatabase[currentCPRData.city].desc;
    document.getElementById('inp-ev-street').value = currentCPRData.street;
    document.getElementById('inp-ev-desc').value = currentCPRData.desc;
    autoSelectJRGByCity(currentCPRData.city);
    updateSubtypes(currentCPRData.type);
    closeCPR();
}

function updateSubtypes(type) {
    const select = document.getElementById('inp-ev-subtype');
    if(!select) return;
    select.innerHTML = '';
    (subtypesData[type] || ["Brak"]).forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub; opt.innerText = sub;
        select.appendChild(opt);
    });
}

function toggleService(service) {
    servicesState[service] = !servicesState[service];
    const btn = document.getElementById(service === 'prm' ? 'btn-service-prm' : 'btn-service-police');
    if (btn) btn.classList.toggle('active', servicesState[service]);
}

function renderUnits() {
    document.getElementById('grid-psp').innerHTML = unitsPSP.map(createUnitHTML).join('');
    document.getElementById('grid-osp').innerHTML = unitsOSP.map(createUnitHTML).join('');
}

function createUnitHTML(unit) {
    return `
        <div class="unit-box">
            <div class="unit-header">${unit.name}</div>
            <div>${unit.vehicles.map(v => `<div class="vehicle-row"><span class="status-dot ${v.status}"></span><span><b>${v.id}</b> - ${v.name}</span></div>`).join('')}</div>
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
        tr.onclick = () => selectEvent(ev.id);
        tr.innerHTML = `
            <td>${ev.id}/2026</td>
            <td>${ev.time}</td>
            <td>KP PSP</td>
            <td>${ev.jrg}</td>
            <td>${ev.city}</td>
            <td>${ev.vehicles.length}</td>
            <td>${ev.type}</td>
            <td>${ev.desc}</td>
            <td><b>${ev.status === 'FINISHED' ? 'Zakończono' : formatMMSS(ev.remainingSeconds)}</b></td>
            <td>MELD-${ev.id}</td>
        `;
        tbody.appendChild(tr);
    });
    updateMapMarkers();
}

function selectEvent(id) {
    selectedEvIdForRadio = id;
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    document.getElementById('btn-open-radio').style.display = 'block';
    document.getElementById('details-title').innerText = `Szczegóły zdarzenia ID: ${ev.id} - ${ev.city}`;
    renderEvents();
}

function openNewEventModal() {
    activeEditingId = null;
    selectedVehicles = [];
    servicesState = { prm: false, police: false };
    const btnPrm = document.getElementById('btn-service-prm');
    const btnPol = document.getElementById('btn-service-police');
    if(btnPrm) btnPrm.classList.remove('active');
    if(btnPol) btnPol.classList.remove('active');

    document.getElementById('inp-ev-time').value = new Date().toLocaleTimeString();
    document.getElementById('inp-ev-city').value = '';
    document.getElementById('inp-ev-street').value = '';
    document.getElementById('inp-ev-desc').value = '';
    document.getElementById('lbl-selected-count').innerText = "Wybrano pojazdów: 0";
    document.getElementById('modal-event').style.display = 'flex';
}

function openDispatchModal() {
    const container = document.getElementById('dispatch-list');
    const cityInput = document.getElementById('inp-ev-city');
    const targetCity = cityInput ? cityInput.value.trim() : "";
    container.innerHTML = '';

    const availableUnits = [...unitsPSP, ...unitsOSP].map(u => ({ ...u, ...getUnitProximity(u.name, targetCity) })).sort((a, b) => a.sec - b.sec);
    availableUnits.forEach((u, index) => {
        container.innerHTML += `
            <div class="dispatch-unit-group">
                <div class="dispatch-unit-header">${index + 1}. ${u.name} (~${u.sec}s)</div>
                ${u.vehicles.map(v => `<label class="dispatch-vehicle-item"><input type="checkbox" value="${v.id}" ${selectedVehicles.some(sv => sv.id === v.id) ? 'checked' : ''}><b>${v.id}</b> - ${v.name}</label>`).join('')}
            </div>
        `;
    });
    document.getElementById('modal-dispatch').style.display = 'flex';
}

function confirmDispatch() {
    selectedVehicles = [];
    document.querySelectorAll('#dispatch-list input:checked').forEach(cb => {
        [...unitsPSP, ...unitsOSP].forEach(u => {
            const v = u.vehicles.find(veh => veh.id === cb.value);
            if (v) selectedVehicles.push({ ...v, unitName: u.name, travelTime: 20 });
        });
    });
    document.getElementById('lbl-selected-count').innerText = "Wybrano pojazdów: " + selectedVehicles.length;
    closeModal('modal-dispatch');
}

function saveEvent() {
    const city = document.getElementById('inp-ev-city').value;
    if (!city) { alert('Podaj miejscowość!'); return; }
    
    const newEv = {
        id: events.length + 1,
        time: document.getElementById('inp-ev-time').value,
        city: city,
        street: document.getElementById('inp-ev-street').value,
        desc: document.getElementById('inp-ev-desc').value,
        type: document.querySelector('input[name="ev-type"]:checked').value,
        subtype: document.getElementById('inp-ev-subtype').value,
        remainingSeconds: 180,
        firstArrived: true,
        radioLogs: [],
        jrg: document.getElementById('inp-ev-jrg').value,
        services: { ...servicesState },
        vehicles: [...selectedVehicles],
        status: 'ACTIVE'
    };
    events.push(newEv);
    renderEvents();
    closeModal('modal-event');
}

function finishCurrentEvent() {
    if (activeEditingId === null && selectedEvIdForRadio !== null) activeEditingId = selectedEvIdForRadio;
    const ev = events.find(e => e.id === activeEditingId);
    if (ev) ev.status = 'FINISHED';
    renderEvents();
    closeModal('modal-event');
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function switchModalTab(tab) {}
function openSiSModal() { alert('Panel SiS'); }

function safeSetElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

renderUnits();
