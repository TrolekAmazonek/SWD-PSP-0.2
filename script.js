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

// --- BŁYSKAWICZNY SILNIK AI (DLA RADIA) ---
async function callUniversalAI(systemPrompt, userPrompt, jsonMode = false) {
    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
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
                temperature: 0.7,
                max_tokens: 75
            })
        });
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
                temperature: 0.7
            })
        });
        if (response.ok) {
            const data = await response.json();
            if (data.choices && data.choices[0]?.message?.content) {
                return data.choices[0].message.content.trim();
            }
        }
    } catch (err) {}

    throw new Error("Brak połączenia z AI.");
}

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
    document.getElementById('inp-ev-jrg').value = jrgVal;
    document.getElementById('inp-ev-lead').value = jrgVal;
    document.getElementById('inp-ev-area').value = jrgVal;
}

const streetNames = ["Gdańska", "Sobieskiego", "Zamkowa", "Leśna", "Szkolna", "Przemysłowa", "Długa", "Kwiatowa", "Słoneczna", "Łąkowa", "Krótka", "Mickiewicza", "Polna", "Ogrodowa", "Kaszubska", "Morska", "Kolejowa", "Parkowa", "Lipowa", "Brzozowa"];

const eventTemplatesPool = [
    { category: "bus_stop", type: "P", subtype: "P - Śmietniska, wysypiska", desc: "Zgłoszenie pożaru śmietnika w wiacie przystankowej. Zagrożenie dla oczekujących pasażerów." },
    { category: "residential", type: "P", subtype: "P - Obiekty mieszkalne", desc: "Ogień na balkonie w budynku wielorodzinnym. Widoczne płomienie i duże zadymienie." },
    { category: "industry", type: "P", subtype: "P - Obiekty produkcyjne, instalacje technologiczne", desc: "Alarm pożarowy z systemu SSP w zakładzie przemysłowym. Widoczny dym z dachu hali." },
    { category: "industry", type: "P", subtype: "P - Obiekty magazynowe, place składowe", desc: "Pożar składowiska palet i materiałów izolacyjnych na placu zewnętrznym zakładu." },
    { category: "residential", type: "P", subtype: "P - Obiekty mieszkalne", desc: "Zgłoszenie zadymienia na klatce schodowej w budynku mieszkalnym. Domownicy ewakuowani na zewnątrz." },
    { category: "residential", type: "P", subtype: "P - Inne pożary", desc: "Pożar sadzy w przewodzie kominowym w budynku jednorodzinnym. Iskry wydobywające się z komina." },
    { category: "industry", type: "P", subtype: "P - Obiekty gospodarcze i inne rolnicze", desc: "Pożar w budynku gospodarczym – zapłon składowanej słomy i sprzętu rolniczego." },
    { category: "bus_stop", type: "P", subtype: "P - Środki transportu drogowego (np. autobus)", desc: "Pożar w komorze silnika samochodu osobowego podczas jazdy. Kierowca ewakuowany." },
    { category: "residential", type: "P", subtype: "P - Trawy, torfowiska, lasy, pola, stogi", desc: "Szybko rozprzestrzeniający się pożar nieużytków rolnych i suchej trawy blisko lasu." },
    { category: "industry", type: "P", subtype: "P - Instytucje, obiekty użyteczności publicznej", desc: "Zgłoszenie zadymienia w piwnicy budynku użyteczności publicznej (szkoła/urząd)." },
    { category: "bus_stop", type: "MZ", subtype: "MZ - Zwierzęta", desc: "Niebezpieczne gniazdo os / szerszeni pod dachem budynku użyteczności publicznej." },
    { category: "road", type: "MZ", subtype: "MZ - Wypadek", desc: "Zderzenie czołowe dwóch samochodów osobowych. Zablokowany jeden pas ruchu, wyciek płynów." },
    { category: "road", type: "MZ", subtype: "MZ - Chemiczne", desc: "Duża plama oleju napędowego na jezdni na odcinku kilkudziesięciu metrów." },
    { category: "residential", type: "MZ", subtype: "MZ - Pomoc w otwarciu mieszkania, podejrzenie zgonu", desc: "Brak kontaktu ze starszą osobą w mieszkaniu. Wezwanie od sąsiadów i ZRM." },
    { category: "road", type: "MZ", subtype: "MZ - Kolizja", desc: "Kolizja trzech aut na skrzyżowaniu. Uszkodzone barierki ochronne, brak rannych." },
    { category: "residential", type: "MZ", subtype: "MZ - Budowlane", desc: "Zagrożenie oderwaniem się elementów blachy z dachu kamienicy po silnym wietrze." },
    { category: "road", type: "MZ", subtype: "MZ - Atmosferyczne", desc: "Drzewo powalone na pas jezdni tamujące całkowicie ruch w obu kierunkach." },
    { category: "residential", type: "MZ", subtype: "MZ - Pomoc innym służbom", desc: "Pomoc zespołowi ratownictwa medycznego w zniesieniu ciężkiego pacjenta z mieszkania." },
    { category: "residential", type: "MZ", subtype: "MZ - Poszukiwanie osób zaginionych", desc: "Zgłoszenie zaginięcia starszej osoby z zaburzeniami pamięci w rejonie kompleksu leśnego." },
    { category: "road", type: "MZ", subtype: "MZ - Wodne", desc: "Zgłoszenie podtopienia piwnic w budynku mieszkalnym po intensywnych opadach deszczu." }
];

const callersList = [
    "Jan Kowalski (tel. 601-234-567)",
    "Krystyna Lewandowska (tel. 502-888-112)",
    "Piotr Wiśniewski (tel. 791-332-100)",
    "Ochrona Obiektu (tel. 58-671-00-22)",
    "Dyspozytor CPR / Świadek (tel. 605-112-998)"
];

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

// --- LOSOWANIE OBSADY DLA OSP (OD 3 DO 6 OSÓB) ---
unitsOSP.forEach(u => {
    u.vehicles.forEach(v => {
        v.obsada = Math.floor(Math.random() * 4) + 3; // Generuje losowo 3, 4, 5 lub 6
    });
});

let events = [];
let activeEditingId = null;
let selectedEvIdForRadio = null;
let selectedVehicles = [];
let servicesState = { prm: false, police: false };
let currentCPRData = null;
let cprCounter = 101;
let currentRadioVehicle = null;

// --- MECHANIZM PRZESUWANIA (POSITION: FIXED) ---
function makeDraggable(elmnt, header) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    header.onmousedown = dragMouseDown;

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
    const radioModal = document.getElementById('radio-modal');
    if (radioModal) makeDraggable(radioModal, radioModal.querySelector('.modal-header'));

    const eventModal = document.querySelector('#modal-event .modal-window');
    if (eventModal) makeDraggable(eventModal, document.querySelector('#modal-event .modal-header'));

    const cprModal = document.getElementById('cpr-modal');
    if (cprModal) makeDraggable(cprModal, cprModal.querySelector('.cpr-header'));
});

// --- MELDUNEK Z DOJAZDU (SZYBKI) ---
async function triggerArrivalRadioReport(ev, vehicle) {
    currentRadioVehicle = vehicle.id;
    selectedEvIdForRadio = ev.id;
    if (!ev.radioLogs) ev.radioLogs = [];
    openRadioForEvent(ev.id);

    const sysPrompt = `Jesteś dowódcą (${vehicle.id}). Odpowiedz ultra-krótko (max 1 zdanie), żargonem strażackim.`;
    const usrPrompt = `Dojechaliście do: ${ev.city}, ${ev.street}. Zgł.: "${ev.desc}". Napisz meldunek zaczynając od: "Wejherowo 998, tu ${vehicle.id}. Jesteśmy na miejscu..." i skończ "Bez odbioru."`;

    let reportText = "";
    try {
        reportText = await callUniversalAI(sysPrompt, usrPrompt, false);
        reportText = reportText.replace(/^["']|["']$/g, '');
    } catch (e) {
        reportText = `Wejherowo 998, tu ${vehicle.id}. Jesteśmy na miejscu. Działamy. Bez odbioru.`;
    }

    audioMotorola.currentTime = 0;
    audioMotorola.play().catch(e => {});

    const initialMsg = `<div class="chat-msg chat-kdr"><b>[${new Date().toLocaleTimeString()}] ${vehicle.id} ➔ Wejherowo 998:</b><br>"${reportText}"</div>`;
    ev.radioLogs.push(initialMsg);
    openRadioForEvent(ev.id);
}

function openRadioForEvent(evId) {
    const ev = events.find(e => e.id === evId);
    if (!ev) return;
    selectedEvIdForRadio = ev.id;
    const chat = document.getElementById('radio-chat');
    document.getElementById('radio-title').innerText = `📻 Korespondencja Radiowa - Zdarzenie ID: ${ev.id} (${ev.city})`;
    chat.innerHTML = (ev.radioLogs || []).join('');
    document.getElementById('radio-modal').style.display = 'flex';
    document.getElementById('btn-open-radio').style.display = 'block';
    chat.scrollTop = chat.scrollHeight;
}

function openRadioForSelectedEvent() {
    if (selectedEvIdForRadio !== null) openRadioForEvent(selectedEvIdForRadio);
    else if (events.length > 0) openRadioForEvent(events[0].id);
    else alert('Brak aktywnych zdarzeń.');
}

// --- ROZMOWA RADIOWA (SZYBKA) ---
async function sendRadioReply() {
    const input = document.getElementById('inp-radio-reply');
    const text = input.value.trim();
    if (!text || selectedEvIdForRadio === null) return;

    audioMotorola.currentTime = 0;
    audioMotorola.play().catch(e => {});

    const ev = events.find(e => e.id === selectedEvIdForRadio);
    if (!ev) return;

    const timeStr = new Date().toLocaleTimeString();
    const userMsg = `<div class="chat-msg chat-sk"><b>[${timeStr}] Wejherowo 998 ➔ KDR:</b><br>"${text}"</div>`;
    
    if (!ev.radioLogs) ev.radioLogs = [];
    ev.radioLogs.push(userMsg);

    const chatBox = document.getElementById('radio-chat');
    chatBox.innerHTML = ev.radioLogs.join('') + `<div id="ai-typing" style="color:#aaa; font-style:italic; padding:4px;">⏳ ${currentRadioVehicle || 'KDR'} nadaje...</div>`;
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    const systemPrompt = `Jesteś dowódcą akcji (${currentRadioVehicle || 'KDR'}). Odpowiadaj ultra-krótko (1 zdanie), profesjonalnym żargonem strażackim. Zacznij od "Wejherowo 998, tu ${currentRadioVehicle || 'KDR'}..." i skończ "Bez odbioru."`;

    let aiReply = "";
    try {
        aiReply = await callUniversalAI(systemPrompt, text, false);
        aiReply = aiReply.replace(/^["']|["']$/g, '');
    } catch (err) {
        aiReply = `Wejherowo 998, tu ${currentRadioVehicle || 'KDR'}. Przyjąłem, działamy. Bez odbioru.`;
    }

    audioMotorola.currentTime = 0;
    audioMotorola.play().catch(e => {});

    const respMsg = `<div class="chat-msg chat-kdr"><b>[${new Date().toLocaleTimeString()}] ${currentRadioVehicle || 'KDR'} ➔ Wejherowo 998:</b><br>"${aiReply}"</div>`;
    
    ev.radioLogs.push(respMsg);
    chatBox.innerHTML = ev.radioLogs.join('');
    chatBox.scrollTop = chatBox.scrollHeight;
}

function quickReply(text) {
    document.getElementById('inp-radio-reply').value = text;
    sendRadioReply();
}

function closeRadio() { document.getElementById('radio-modal').style.display = 'none'; }

function minimizeRadio() {
    document.getElementById('radio-modal').style.display = 'none';
    const bar = document.getElementById('minimized-bar');
    const item = document.createElement('div');
    item.className = 'minimized-item';
    item.innerHTML = `📻 Radio (ID: ${selectedEvIdForRadio})`;
    item.onclick = () => { openRadioForEvent(selectedEvIdForRadio); item.remove(); };
    bar.appendChild(item);
}

// --- BŁYSKAWICZNE GENEROWANIE CPR (LOKALNE - 0 SEKUND OPÓŹNIENIA) ---
function simulateIncomingCPR() {
    audioCpr.currentTime = 0;
    audioCpr.play().catch(e => {});

    const newCprId = `WCPR-2026-${cprCounter++}`;
    const randomTpl = eventTemplatesPool[Math.floor(Math.random() * eventTemplatesPool.length)];
    const chosenLoc = getRandomStreet(randomTpl.category);
    const chosenCaller = callersList[Math.floor(Math.random() * callersList.length)];

    currentCPRData = {
        id: newCprId,
        city: chosenLoc.city,
        street: chosenLoc.street,
        type: randomTpl.type,
        subtype: randomTpl.subtype,
        desc: randomTpl.desc,
        caller: chosenCaller
    };

    document.getElementById('cpr-id').innerText = currentCPRData.id;
    document.getElementById('cpr-city').innerText = currentCPRData.city;
    document.getElementById('cpr-street').innerText = currentCPRData.street;
    document.getElementById('cpr-type').innerText = `${currentCPRData.type} - ${currentCPRData.subtype}`;
    document.getElementById('cpr-caller').innerText = currentCPRData.caller;
    document.getElementById('cpr-desc').innerText = currentCPRData.desc;
    document.getElementById('cpr-modal').style.display = 'flex';
}

function getRandomStreet(category) {
    const town = townsList[Math.floor(Math.random() * townsList.length)];
    const stName = streetNames[Math.floor(Math.random() * streetNames.length)];
    const num = Math.floor(Math.random() * 80) + 1;

    if (category === "bus_stop") {
        return { city: town, street: `Przystanek Autobusowy ul. ${stName}` };
    } else if (category === "industry") {
        const industries = [
            { city: "Bolszewo", street: `Balex-Metal, ul. Wejherowska ${num}` },
            { city: "Wejherowo", street: `Markisol Polska, ul. Fabryczna ${num}` },
            { city: "Rumia", street: `Hala Magazynowa, ul. Przemysłowa ${num}` }
        ];
        return industries[Math.floor(Math.random() * industries.length)];
    } else if (category === "residential") {
        return { city: town, street: `ul. ${stName} ${num}` };
    } else {
        return { city: town, street: `ul. ${stName} ${num}` };
    }
}

function closeCPR() { document.getElementById('cpr-modal').style.display = 'none'; }

function minimizeCPR() {
    if (!currentCPRData) return;
    document.getElementById('cpr-modal').style.display = 'none';
    const bar = document.getElementById('minimized-bar');
    const item = document.createElement('div');
    item.className = 'minimized-item';
    item.innerHTML = `🚨 Zgłoszenie CPR (${currentCPRData.city})`;
    item.onclick = () => { document.getElementById('cpr-modal').style.display = 'flex'; item.remove(); };
    bar.appendChild(item);
}

function acceptCPRToEvent() {
    if (!currentCPRData) return;
    openNewEventModal();

    document.getElementById('inp-ev-received').value = 'CPR';
    document.getElementById('inp-ev-city').value = currentCPRData.city;
    document.getElementById('inp-ev-region').value = locationsDatabase[currentCPRData.city] || '';
    document.getElementById('inp-ev-street').value = currentCPRData.street;
    document.getElementById('inp-ev-desc').value = currentCPRData.desc;

    autoSelectJRGByCity(currentCPRData.city);

    const radioP = document.querySelector('input[name="ev-type"][value="P"]');
    if (radioP) radioP.checked = true;
    updateSubtypes('P');

    document.getElementById('inp-caller-name').value = currentCPRData.caller.split(' ')[0] || '';
    document.getElementById('inp-caller-surname').value = currentCPRData.caller.split(' ')[1] || '';

    closeCPR();
    const minItem = document.getElementById(`min-cpr-${currentCPRData.id}`);
    if (minItem) minItem.remove();
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
    select.innerHTML = '';
    
    if (type === 'PZR') {
        group.style.display = 'none';
        return;
    } else {
        group.style.display = 'flex';
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
    if (servicesState[service]) btn.classList.add('active');
    else btn.classList.remove('active');
}

function renderUnits() {
    document.getElementById('grid-psp').innerHTML = unitsPSP.map(u => createUnitHTML(u)).join('');
    document.getElementById('grid-osp').innerHTML = unitsOSP.map(u => createUnitHTML(u)).join('');
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
}

function selectEvent(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;

    selectedEvIdForRadio = ev.id;
    document.getElementById('btn-open-radio').style.display = 'block';
    document.getElementById('details-title').innerText = `Szczegóły zdarzenia ID: ${ev.id} - ${ev.city}`;
    
    renderEvents();

    const sisBody = document.getElementById('details-sis-body');
    if (ev.vehicles.length === 0) {
        sisBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888;">Brak zadysponowanych SiS</td></tr>';
        return;
    }

    sisBody.innerHTML = ev.vehicles.map(v => {
        let statusText = v.travelTime > 0 ? `<span style="color: #f39c12; font-weight: bold;">Dojazd (${v.travelTime}s)</span>` : (ev.status === 'ACTIVE' ? `<span style="color: #ff3333; font-weight: bold;">Na miejscu</span>` : `<span style="color: #00ff00;">Wolny</span>`);
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

function switchTab(tab) {
    document.getElementById('grid-psp').style.display = tab === 'PSP' ? 'grid' : 'none';
    document.getElementById('grid-osp').style.display = tab === 'OSP' ? 'grid' : 'none';
    document.getElementById('btn-tab-psp').className = 'tab-btn ' + (tab === 'PSP' ? 'active' : '');
    document.getElementById('btn-tab-osp').className = 'tab-btn ' + (tab === 'OSP' ? 'active' : '');
}

function handleCityInput(input) {
    const val = input.value.trim().toLowerCase();
    const suggestionsBox = document.getElementById('city-suggestions');
    suggestionsBox.innerHTML = '';

    if (!val) { suggestionsBox.style.display = 'none'; return; }

    const matches = Object.keys(locationsDatabase).filter(c => c.toLowerCase().startsWith(val));
    if (matches.length > 0) {
        matches.forEach(c => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerText = c;
            div.onclick = () => {
                document.getElementById('inp-ev-city').value = c;
                document.getElementById('inp-ev-region').value = locationsDatabase[c];
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
    document.getElementById('btn-service-prm').classList.remove('active');
    document.getElementById('btn-service-police').classList.remove('active');

    document.getElementById('modal-event-title').innerText = "Nowa Karta Zdarzenia";
    document.getElementById('inp-ev-time').value = new Date().toLocaleTimeString();
    document.getElementById('inp-ev-city').value = '';
    document.getElementById('inp-ev-region').value = '';
    document.getElementById('inp-ev-street').value = '';
    document.getElementById('inp-ev-desc').value = '';
    document.getElementById('inp-caller-name').value = '';
    document.getElementById('inp-caller-surname').value = '';
    document.getElementById('inp-caller-phone').value = '';
    document.getElementById('lbl-selected-count').innerText = "Wybrano pojazdów: 0";

    const radioP = document.querySelector('input[name="ev-type"][value="P"]');
    if (radioP) radioP.checked = true;
    updateSubtypes('P');

    switchModalTab('dane');
    document.getElementById('modal-event').style.display = 'flex';
}

function openEditEventModal(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;

    activeEditingId = id;
    selectedVehicles = [...ev.vehicles];

    document.getElementById('modal-event-title').innerText = `Edycja zdarzenia ID: ${ev.id}`;
    document.getElementById('inp-ev-time').value = ev.time;
    document.getElementById('inp-ev-city').value = ev.city;
    document.getElementById('inp-ev-region').value = ev.region;
    document.getElementById('inp-ev-street').value = ev.street;
    document.getElementById('inp-ev-desc').value = ev.desc;
    document.getElementById('lbl-selected-count').innerText = "Wybrano pojazdów: " + selectedVehicles.length;

    const radio = document.querySelector(`input[name="ev-type"][value="${ev.type}"]`);
    if (radio) radio.checked = true;
    updateSubtypes(ev.type);
    if (ev.type !== 'PZR') document.getElementById('inp-ev-subtype').value = ev.subtype || "";

    servicesState = { ...ev.services };
    if (servicesState.prm) document.getElementById('btn-service-prm').classList.add('active');
    else document.getElementById('btn-service-prm').classList.remove('active');
    if (servicesState.police) document.getElementById('btn-service-police').classList.add('active');
    else document.getElementById('btn-service-police').classList.remove('active');

    switchModalTab('dane');
    document.getElementById('modal-event').style.display = 'flex';
}

function openDispatchModal() {
    const container = document.getElementById('dispatch-list');
    const infoBar = document.getElementById('dispatch-info-bar');
    const targetCity = document.getElementById('inp-ev-city').value.trim();
    container.innerHTML = '';

    infoBar.innerHTML = targetCity ? `📍 Kolejność wg odległości dla: <span style="color:#b30000;">${targetCity}</span>` : `⚠️ Brak miejscowości`;

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

    document.getElementById('modal-dispatch').style.display = 'flex';
}

function confirmDispatch() {
    const checkboxes = document.querySelectorAll('#dispatch-list input:checked');
    const targetCity = document.getElementById('inp-ev-city').value.trim() || "Bolszewo";
    selectedVehicles = [];

    checkboxes.forEach(cb => {
        [...unitsPSP, ...unitsOSP].forEach(u => {
            const v = u.vehicles.find(veh => veh.id === cb.value);
            if (v) selectedVehicles.push({ ...v, unitName: u.name, travelTime: calculateTravelTimeSeconds(u.name, targetCity) });
        });
    });

    document.getElementById('lbl-selected-count').innerText = "Wybrano pojazdów: " + selectedVehicles.length;
    closeModal('modal-dispatch');
}

function saveEvent() {
    const city = document.getElementById('inp-ev-city').value;
    if (!city) { alert('Proszę podać miejscowość!'); return; }

    const typeVal = document.querySelector('input[name="ev-type"]:checked').value;
    const subtypeVal = typeVal === 'PZR' ? 'Zabezpieczenie rejonu' : document.getElementById('inp-ev-subtype').value;
    const descVal = document.getElementById('inp-ev-desc').value;

    selectedVehicles.forEach(sv => {
        if (sv.travelTime === undefined || activeEditingId === null) sv.travelTime = calculateTravelTimeSeconds(sv.unitName, city);
    });

    let countedOspNames = [];
    selectedVehicles.forEach(sv => {
        if (!sv.unitName.includes("JRG") && !sv.unitName.includes("KP PSP") && !countedOspNames.includes(sv.unitName)) {
            countedOspNames.push(sv.unitName);
        }
    });

    playOspAlarmRepeated(countedOspNames.length);

    if (activeEditingId === null) {
        const newEv = {
            id: events.length + 1,
            time: document.getElementById('inp-ev-time').value,
            city: city,
            region: document.getElementById('inp-ev-region').value,
            street: document.getElementById('inp-ev-street').value,
            desc: descVal,
            type: typeVal,
            subtype: subtypeVal,
            remainingSeconds: 180,
            firstArrived: false,
            radioReported: false,
            radioLogs: [],
            jrg: document.getElementById('inp-ev-jrg').value,
            services: { ...servicesState },
            vehicles: [...selectedVehicles],
            status: 'ACTIVE'
        };
        events.push(newEv);
        selectEvent(newEv.id);
    } else {
        const ev = events.find(e => e.id === activeEditingId);
        ev.city = city;
        ev.desc = descVal;
        ev.type = typeVal;
        ev.subtype = subtypeVal;
        ev.services = { ...servicesState };
        ev.vehicles = [...selectedVehicles];
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
    if (activeEditingId === null) return;
    const ev = events.find(e => e.id === activeEditingId);
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
    document.getElementById('modal-tab-dane-content').style.display = tab === 'dane' ? 'block' : 'none';
    document.getElementById('modal-tab-czasy-content').style.display = tab === 'czasy' ? 'block' : 'none';
    document.getElementById('tab-modal-dane').className = 'tab-btn ' + (tab === 'dane' ? 'active' : '');
    document.getElementById('tab-modal-czasy').className = 'tab-btn ' + (tab === 'czasy' ? 'active' : '');
}

function openSiSModal() { document.getElementById('modal-sis').style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

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
}, 1000);

renderUnits();
