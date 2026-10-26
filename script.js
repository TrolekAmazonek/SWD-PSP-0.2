// --- MODUŁ AUDIO ---
const audioSelekt = new Audio('selekt.wav');
const audioCpr = new Audio('nowe zdarzenie odbierz.mp3');
const audioMotorola = new Audio('motorola.ogg');

function playSound(type) {
    if (type === 'cpr') {
        audioCpr.currentTime = 0;
        audioCpr.play().catch(e => console.log("Audio CPR zablokowane"));
    } else if (type === 'motorola') {
        audioMotorola.currentTime = 0;
        audioMotorola.play().catch(e => console.log("Audio Motorola zablokowane"));
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
                if (played < ospCount) {
                    setTimeout(playNext, 3000);
                }
            }).catch(e => console.log("Audio OSP zablokowane"));
        }
    }
    playNext();
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

const streetNames = ["Gdańska", "Sobieskiego", "Zamkowa", "Leśna", "Szkolna", "Przemysłowa", "Długa", "Kwiatowa", "Słoneczna", "Łąkowa", "Krótka", "Mickiewicza", "Polna", "Ogrodowa"];

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
            { city: "Rumia", street: `Hala Magazynowa, ul. Przemysłowa ${num}` },
            { city: "Wejherowo", street: `Tartak / Skład Drzewny, ul. Przemysłowa ${num}` }
        ];
        return industries[Math.floor(Math.random() * industries.length)];
    } else if (category === "residential") {
        const types = [`ul. ${stName} ${num}`, `Kamienica, ul. ${stName} ${num}`, `Blok mieszkalny, ul. ${stName} ${num}/` + (Math.floor(Math.random()*15)+1)];
        return { city: town, street: types[Math.floor(Math.random() * types.length)] };
    } else {
        return { city: town, street: `ul. ${stName} ${num}` };
    }
}

const eventTemplatesPool = [
    {
        category: "bus_stop",
        type: "P",
        subtype: "P - Śmietniska, wysypiska",
        desc: "Zgłoszenie pożaru śmietnika w wiacie przystankowej. Zagrożenie dla oczekujących pasażerów."
    },
    {
        category: "bus_stop",
        type: "MZ",
        subtype: "MZ - Zwierzęta",
        desc: "Gniazdo os / szerszeni pod dachem wiaty przystankowej. Zagrożenie dla podróżnych."
    },
    {
        category: "industry",
        type: "P",
        subtype: "P - Obiekty produkcyjne, instalacje technologiczne",
        desc: "Alarm pożarowy z systemu SSP w zakładzie przemysłowym. Widoczny dym z dachu hali."
    },
    {
        category: "industry",
        type: "P",
        subtype: "P - Obiekty magazynowe, place składowe",
        desc: "Pożar składowiska palet i materiałów izolacyjnych na placu zewnętrznym zakładu."
    },
    {
        category: "road",
        type: "MZ",
        subtype: "MZ - Wypadek",
        desc: "Zderzenie czołowe dwóch samochodów osobowych. Zablokowany jeden pas ruchu, wyciek płynów."
    },
    {
        category: "road",
        type: "MZ",
        subtype: "MZ - Chemiczne",
        desc: "Duża plama oleju napędowego na jezdni na odcinku kilkudziesięciu metrów."
    },
    {
        category: "residential",
        type: "P",
        subtype: "P - Obiekty mieszkalne",
        desc: "Zgłoszenie ognia w mieszkaniu / na balkonie w budynku wielorodzinnym. Widoczny płomień."
    },
    {
        category: "residential",
        type: "P",
        subtype: "P - Obiekty mieszkalne",
        desc: "Zgłoszenie zadymienia na klatce schodowej w budynku mieszkalnym. Domownicy ewakuowani na zewnątrz."
    },
    {
        category: "residential",
        type: "MZ",
        subtype: "MZ - Pomoc w otwarciu mieszkania, podejrzenie zgonu",
        desc: "Brak kontaktu ze starszą osobą w mieszkaniu. Wezwanie od sąsiadów i ZRM."
    }
];

const callersList = [
    "Jan Kowalski (tel. 601-234-567)",
    "Krystyna Lewandowska (tel. 502-888-112)",
    "Piotr Wiśniewski (tel. 791-332-100)",
    "Ochrona Obiektu (tel. 58-671-00-22)",
    "Dyspozytor / Świadek (tel. 605-112-998)"
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

let events = [];
let activeEditingId = null;
let selectedEvIdForRadio = null;
let selectedVehicles = [];
let servicesState = { prm: false, police: false };
let currentCPRData = null;
let cprCounter = 101;
let currentRadioVehicle = null;

function triggerArrivalRadioReport(ev, vehicle) {
    currentRadioVehicle = vehicle.id;
    selectedEvIdForRadio = ev.id;
    
    audioMotorola.currentTime = 0;
    audioMotorola.play().catch(e => console.log("Audio motorola zablokowane"));

    if (!ev.radioLogs) ev.radioLogs = [];

    const descLower = (ev.desc + " " + ev.subtype).toLowerCase();

    if (!ev.tacticalState) {
        if (descLower.includes("wypadek") || descLower.includes("kolizja")) {
            const victimsCount = descLower.includes("wypadek") ? Math.floor(Math.random() * 3) + 1 : 0;
            ev.tacticalState = { type: 'ACCIDENT', victims: victimsCount, trapped: victimsCount > 0 };
        } else if (descLower.includes("szerszeni") || descLower.includes("os") || descLower.includes("zwierzęta")) {
            ev.tacticalState = { type: 'INSECTS', victims: 0 };
        } else if (descLower.includes("plama") || descLower.includes("chemiczne")) {
            ev.tacticalState = { type: 'SPILL', victims: 0 };
        } else if (descLower.includes("pożar") || descLower.includes("dym") || descLower.includes("ognia")) {
            const severe = descLower.includes("hala") || descLower.includes("magazyn") || descLower.includes("mieszkaniu");
            ev.tacticalState = { type: 'FIRE', severe: severe, victims: 0 };
        } else {
            ev.tacticalState = { type: 'OTHER', victims: 0 };
        }
    }

    let reportText = "";
    const st = ev.tacticalState;

    if (st.type === 'ACCIDENT') {
        if (st.victims === 0) {
            reportText = `Wejherowo 998, tu ${vehicle.id}. Jesteśmy na miejscu (${ev.city}, ${ev.street}). Zastano kolizję drogową. Brak osób poszkodowanych. Zabezpieczamy miejsce zdarzenia.`;
        } else {
            reportText = `Wejherowo 998, tu ${vehicle.id}. Dojechaliśmy na miejsce wypadku. Mamy ${st.victims} osoby poszkodowane. Udzielamy KPP, wzywamy ZRM.`;
        }
    } else if (st.type === 'INSECTS') {
        reportText = `Wejherowo 998, tu ${vehicle.id}. Jesteśmy na miejscu (${ev.city}, ${ev.street}). Zastano gniazdo owadów błonkoskrzydłych w obiekcie. Przystępujemy do jego neutralizacji w kombinezonach.`;
    } else if (st.type === 'SPILL') {
        reportText = `Wejherowo 998, tu ${vehicle.id}. Jesteśmy na miejscu. Zastano wyciek płynów eksploatacyjnych / plamę na jezdni. Neutralizujemy przy użyciu sorbentu.`;
    } else if (st.type === 'FIRE') {
        if (st.severe) {
            reportText = `Wejherowo 998, tu ${vehicle.id}. Jesteśmy na miejscu (${ev.city}, ${ev.street}). Po dojeździe zastano rozwinięty pożar! Podajemy prądy wody w natarciu!`;
        } else {
            reportText = `Wejherowo 998, tu ${vehicle.id}. Dojechaliśmy na miejsce. Pożar w zarodku / śmietnika, podajemy 1 prąd wody. Sytuacja opanowana.`;
        }
    } else {
        reportText = `Wejherowo 998, tu ${vehicle.id}. Dojechaliśmy na miejsce zdarzenia, prowadzimy działania rozpoznawcze.`;
    }

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
}

function openRadioForSelectedEvent() {
    if (selectedEvIdForRadio !== null) {
        openRadioForEvent(selectedEvIdForRadio);
    } else if (events.length > 0) {
        openRadioForEvent(events[0].id);
    } else {
        alert('Brak aktywnych zdarzeń do otwarcia radia.');
    }
}

// --- INTEGRACJA Z OPENAI API (SKRYPT Z TWOIM KLUCZEM) ---
async function sendRadioReply() {
    const input = document.getElementById('inp-radio-reply');
    const text = input.value.trim();
    if (!text || selectedEvIdForRadio === null) return;

    audioMotorola.currentTime = 0;
    audioMotorola.play().catch(e => console.log("Audio motorola zablokowane"));

    const ev = events.find(e => e.id === selectedEvIdForRadio);
    if (!ev) return;

    const timeStr = new Date().toLocaleTimeString();
    const userMsg = `<div class="chat-msg chat-sk"><b>[${timeStr}] Wejherowo 998 ➔ KDR:</b><br>"${text}"</div>`;
    
    if (!ev.radioLogs) ev.radioLogs = [];
    ev.radioLogs.push(userMsg);
    document.getElementById('radio-chat').innerHTML = ev.radioLogs.join('');
    input.value = '';

    const chatBox = document.getElementById('radio-chat');
    chatBox.scrollTop = chatBox.scrollHeight;

    // Twój klucz OpenAI API został wklejony poniżej
    const OPENAI_API_KEY = "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";

    let messages = [
        {
            role: "system",
            content: `Jesteś Dowódcą Działania Ratowniczego (KDR) straży pożarnej na miejscu akcji (kryptonim: ${currentRadioVehicle || 'dowódca'}). Rozmawiasz przez radio ze Stanowiskiem Kierowania (Wejherowo 998).
SZCZEGÓŁY ZDARZENIA: Lokalizacja: ${ev.city}, ${ev.street}. Opis: "${ev.desc}". Podrodzaj: ${ev.subtype}.
ZASADY: Odpowiadaj krótko, sensownie i logicznie na pytania dyspozytora. Bazuj wyłącznie na opisie zdarzenia – wymyślaj realistyczne rozwinięcia sytuacji adekwatnie do zgłoszenia. Używaj radiowego żargonu (rozpocznij od "Wejherowo 998, tu ${currentRadioVehicle || 'KDR'}...", zakończ "Bez odbioru").`
        }
    ];

    ev.radioLogs.forEach(log => {
        if (log.includes("Wejherowo 998")) {
            const msgText = log.split('<br>"')[1]?.slice(0, -1) || "";
            messages.push({ role: "user", content: msgText });
        } else {
            const msgText = log.split('<br>"')[1]?.slice(0, -1) || "";
            messages.push({ role: "assistant", content: msgText });
        }
    });

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: messages,
                max_tokens: 150
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("OpenAI API Error:", data.error);
            throw new Error(data.error.message || "Błąd zapytania do OpenAI");
        }

        let aiReply = `Wejherowo 998, tu ${currentRadioVehicle || 'KDR'}. Działamy na miejscu. Bez odbioru.`;
        if (data.choices && data.choices[0].message && data.choices[0].message.content) {
            aiReply = data.choices[0].message.content.trim();
        }

        setTimeout(() => {
            audioMotorola.currentTime = 0;
            audioMotorola.play().catch(e => console.log("Audio motorola zablokowane"));

            const replyTimeStr = new Date().toLocaleTimeString();
            const respMsg = `<div class="chat-msg chat-kdr"><b>[${replyTimeStr}] ${currentRadioVehicle || 'KDR'} ➔ Wejherowo 998:</b><br>"${aiReply}"</div>`;
            
            ev.radioLogs.push(respMsg);
            document.getElementById('radio-chat').innerHTML = ev.radioLogs.join('');
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 1000);

    } catch (err) {
        console.error("Błąd krytyczny połączenia z OpenAI:", err);
        setTimeout(() => {
            audioMotorola.currentTime = 0;
            audioMotorola.play().catch(e => console.log("Audio motorola zablokowane"));

            const respMsg = `<div class="chat-msg chat-kdr" style="color: #ff6666;"><b>[${new Date().toLocaleTimeString()}] BŁĄD API:</b><br>"${err.message}"</div>`;
            ev.radioLogs.push(respMsg);
            document.getElementById('radio-chat').innerHTML = ev.radioLogs.join('');
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 1000);
    }
}

function quickReply(text) {
    document.getElementById('inp-radio-reply').value = text;
    sendRadioReply();
}

function closeRadio() {
    document.getElementById('radio-modal').style.display = 'none';
}

function minimizeRadio() {
    document.getElementById('radio-modal').style.display = 'none';

    const bar = document.getElementById('minimized-bar');
    const item = document.createElement('div');
    item.className = 'minimized-item';
    item.id = `min-radio-${selectedEvIdForRadio}`;
    item.innerHTML = `📻 Radio (ID: ${selectedEvIdForRadio})`;
    item.onclick = () => {
        openRadioForEvent(selectedEvIdForRadio);
        item.remove();
    };

    bar.appendChild(item);
}

function simulateIncomingCPR() {
    audioCpr.currentTime = 0;
    audioCpr.play().catch(e => console.log("Audio CPR zablokowane"));

    const randomTpl = eventTemplatesPool[Math.floor(Math.random() * eventTemplatesPool.length)];
    const chosenLoc = getRandomStreet(randomTpl.category);
    const randomCaller = callersList[Math.floor(Math.random() * callersList.length)];

    currentCPRData = {
        id: `WCPR-2026-${cprCounter++}`,
        city: chosenLoc.city,
        street: chosenLoc.street,
        type: randomTpl.type,
        subtype: randomTpl.subtype,
        desc: randomTpl.desc,
        caller: randomCaller
    };

    document.getElementById('cpr-id').innerText = currentCPRData.id;
    document.getElementById('cpr-city').innerText = currentCPRData.city;
    document.getElementById('cpr-street').innerText = currentCPRData.street;
    document.getElementById('cpr-type').innerText = `${currentCPRData.type} - ${currentCPRData.subtype}`;
    document.getElementById('cpr-caller').innerText = currentCPRData.caller;
    document.getElementById('cpr-desc').innerText = currentCPRData.desc;

    document.getElementById('cpr-modal').style.display = 'flex';
}

function closeCPR() {
    document.getElementById('cpr-modal').style.display = 'none';
}

function minimizeCPR() {
    if (!currentCPRData) return;
    document.getElementById('cpr-modal').style.display = 'none';

    const bar = document.getElementById('minimized-bar');
    const item = document.createElement('div');
    item.className = 'minimized-item';
    item.id = `min-cpr-${currentCPRData.id}`;
    item.innerHTML = `🚨 Zgłoszenie CPR (${currentCPRData.city} - ${currentCPRData.street})`;
    item.onclick = () => {
        document.getElementById('cpr-modal').style.display = 'flex';
        item.remove();
    };

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

    const radio = document.querySelector(`input[name="ev-type"][value="${currentCPRData.type}"]`);
    if (radio) radio.checked = true;
    updateSubtypes(currentCPRData.type);
    document.getElementById('inp-ev-subtype').value = currentCPRData.subtype;

    document.getElementById('inp-caller-name').value = currentCPRData.caller.split(' ')[0] || '';
    document.getElementById('inp-caller-surname').value = currentCPRData.caller.split(' ')[1] || '';

    closeCPR();
    const minItem = document.getElementById(`min-cpr-${currentCPRData.id}`);
    if (minItem) minItem.remove();
}

function calculateEstimatedSeconds(desc, subtype, type) {
    if (type === 'PZR') return -1;
    const text = (desc + " " + subtype).toLowerCase();
    if (text.includes("hala") || text.includes("magazyn") || text.includes("zakład") || text.includes("przemysł") || text.includes("balex")) {
        return 600;
    } else if (text.includes("wypadek") || text.includes("zakleszczony")) {
        return 240;
    } else if (text.includes("mieszkaniu") || text.includes("balkonie") || text.includes("dym")) {
        return 300;
    } else if (text.includes("śmietnik") || text.includes("szerszeni") || text.includes("plama")) {
        return 120;
    }
    return 180;
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
    if (servicesState[service]) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
}

function renderUnits() {
    document.getElementById('grid-psp').innerHTML = unitsPSP.map(u => createUnitHTML(u)).join('');
    document.getElementById('grid-osp').innerHTML = unitsOSP.map(u => createUnitHTML(u)).join('');
}

function createUnitHTML(unit) {
    let vehiclesHTML = '';
    if (unit.vehicles.length === 0) {
        vehiclesHTML = `<div style="padding: 4px; color: #888; font-style: italic;">Brak pojazdów</div>`;
    } else {
        vehiclesHTML = unit.vehicles.map(v => `
            <div class="vehicle-row">
                <span class="status-dot ${v.status}"></span>
                <span><b>${v.id}</b> - ${v.name}</span>
            </div>
        `).join('');
    }

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
        
        tr.ondblclick = () => {
            openEditEventModal(ev.id);
        };

        tr.onclick = () => selectEvent(ev.id);

        let timeDisplay = "";
        if (ev.status === 'FINISHED') {
            timeDisplay = "0:00 min (Zakończono)";
        } else if (!ev.firstArrived) {
            timeDisplay = `Oczekiwanie na dojazd... (${formatMMSS(ev.remainingSeconds)})`;
        } else {
            timeDisplay = formatMMSS(ev.remainingSeconds);
        }

        tr.innerHTML = `
            <td>${ev.id}/???/2026</td>
            <td>${ev.time}</td>
            <td>${ev.jrg}</td>
            <td>${ev.jrg}</td>
            <td>${ev.city}</td>
            <td>${ev.vehicles.length}</td>
            <td>${ev.type}</td>
            <td>${ev.desc}</td>
            <td><b style="color: ${ev.status === 'ACTIVE' && ev.firstArrived ? '#ffcc00' : '#ff8000'};">${timeDisplay}</b></td>
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
    document.getElementById('details-title').innerText = `Zdarzenie ID: ${ev.id} - ${ev.city}`;
    
    renderEvents();

    const sisBody = document.getElementById('details-sis-body');
    if (ev.vehicles.length === 0) {
        sisBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888;">Brak zadysponowanych SiS</td></tr>';
        return;
    }

    sisBody.innerHTML = ev.vehicles.map(v => {
        let statusText = "W bazie";
        if (v.travelTime > 0) statusText = `<span style="color: #f39c12; font-weight: bold;">Dojazd (${v.travelTime}s)</span>`;
        else if (ev.status === 'ACTIVE') statusText = `<span style="color: #ff3333; font-weight: bold;">Na miejscu</span>`;
        else statusText = `<span style="color: #00ff00;">Powrót/Wolny</span>`;

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

    document.getElementById('modal-event-title').innerText = `Edycja zdarzenia ID: ${ev.id} - ???-0000${ev.id}`;
    document.getElementById('inp-ev-time').value = ev.time;
    document.getElementById('inp-ev-city').value = ev.city;
    document.getElementById('inp-ev-region').value = ev.region;
    document.getElementById('inp-ev-street').value = ev.street;
    document.getElementById('inp-ev-desc').value = ev.desc;
    document.getElementById('lbl-selected-count').innerText = "Wybrano pojazdów: " + selectedVehicles.length;

    const radio = document.querySelector(`input[name="ev-type"][value="${ev.type}"]`);
    if (radio) radio.checked = true;
    updateSubtypes(ev.type);
    if (ev.type !== 'PZR') {
        document.getElementById('inp-ev-subtype').value = ev.subtype || "";
    }

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

    if (targetCity) {
        infoBar.innerHTML = `📍 Kolejność dysponowania wg odległości dla miejscowości: <span style="color:#b30000;">${targetCity}</span>`;
    } else {
        infoBar.innerHTML = `⚠️ Nie wpisano miejscowości – wyświetlono kolejność domyślną`;
    }

    const availableUnits = [...unitsPSP, ...unitsOSP]
        .filter(u => u.vehicles.length > 0)
        .map(u => {
            const prox = getUnitProximity(u.name, targetCity);
            return { ...u, travelSec: prox.sec, distanceKm: prox.km };
        })
        .sort((a, b) => a.travelSec - b.travelSec);

    availableUnits.forEach((u, index) => {
        const isClosest = index === 0 && targetCity !== "";
        const groupDiv = document.createElement('div');
        groupDiv.className = 'dispatch-unit-group';

        const headerHTML = `
            <div class="dispatch-unit-header ${isClosest ? 'closest' : ''}">
                <span>${index + 1}. ${u.name} ${isClosest ? '⭐ (Najbliższa)' : ''}</span>
                <span>${u.distanceKm} | Dojazd: ~${u.travelSec}s</span>
            </div>
        `;

        const vehiclesHTML = u.vehicles.map(v => {
            const isChecked = selectedVehicles.some(sv => sv.id === v.id);
            const statusLabel = v.status === 'green' 
                ? '<span style="color:#2ecc71; font-size:10px;">(Wolny)</span>' 
                : '<span style="color:#e74c3c; font-size:10px;">(W akcji)</span>';

            return `
                <label class="dispatch-vehicle-item" style="cursor:pointer;">
                    <input type="checkbox" value="${v.id}" ${isChecked ? 'checked' : ''}>
                    <span class="status-dot ${v.status}"></span>
                    <span><b>${v.id}</b> - ${v.name}</span>
                    <span style="margin-left:auto;">${statusLabel}</span>
                </label>
            `;
        }).join('');

        groupDiv.innerHTML = headerHTML + vehiclesHTML;
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
            if (v) {
                const travel = calculateTravelTimeSeconds(u.name, targetCity);
                selectedVehicles.push({ ...v, unitName: u.name, travelTime: travel });
            }
        });
    });

    document.getElementById('lbl-selected-count').innerText = "Wybrano pojazdów: " + selectedVehicles.length;
    closeModal('modal-dispatch');
}

function saveEvent() {
    const city = document.getElementById('inp-ev-city').value;
    if (!city) { alert('Proszę podać miejscowość!'); return; }

    const evTypeRadio = document.querySelector('input[name="ev-type"]:checked');
    const typeVal = evTypeRadio ? evTypeRadio.value : 'P';
    const subtypeVal = typeVal === 'PZR' ? 'Zabezpieczenie rejonu' : document.getElementById('inp-ev-subtype').value;
    const descVal = document.getElementById('inp-ev-desc').value;
    const estSec = calculateEstimatedSeconds(descVal, subtypeVal, typeVal);

    selectedVehicles.forEach(sv => {
        if (sv.travelTime === undefined || activeEditingId === null) {
            sv.travelTime = calculateTravelTimeSeconds(sv.unitName, city);
        }
    });

    let uniqueOspUnitsCount = 0;
    let countedOspNames = [];
    selectedVehicles.forEach(sv => {
        if (!sv.unitName.includes("JRG") && !sv.unitName.includes("KP PSP")) {
            if (!countedOspNames.includes(sv.unitName)) {
                countedOspNames.push(sv.unitName);
                uniqueOspUnitsCount++;
            }
        }
    });

    if (uniqueOspUnitsCount > 0) {
        const audioSelekt = new Audio('selekt.wav');
        let played = 0;
        function playNextSelekt() {
            if (played < uniqueOspUnitsCount) {
                audioSelekt.currentTime = 0;
                audioSelekt.play().then(() => {
                    played++;
                    if (played < uniqueOspUnitsCount) {
                        setTimeout(playNextSelekt, 3000);
                    }
                }).catch(e => console.log("Audio selekt zablokowane"));
            }
        }
        playNextSelekt();
    }

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
            remainingSeconds: estSec,
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
        ev.remainingSeconds = estSec;
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
