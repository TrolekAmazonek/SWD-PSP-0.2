// --- STAŁA WERSJI APLIKACJI SWDST ---
const APP_VERSION = "SWDST 0.27";

// --- MODUŁ AUDIO ---
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

// --- KLUCZE API ---
const _k = {
    g: "Z3NrX2dEQkRQMWhzenZtVjBQc010OWlXR2d5YjNGWUhzYW5FZ2twUEg2anNIWnY2WGFyY2o0QzM=",
    m: "QVEuQWI4Uk42SlNrZnU5ODBDQnBJUUZ0cnAtTEUxYkJYdU94ZzI0NmZmZUJXTmFSZUZkZ1E=",
    o: "c2stcHJvai1wRHZBV05wbDRnUzRzWlpFUkVSeWMtcGdqVGdXZEp1d3E5Y3pCMnhsc0JQZWd3Z3prbi16OEtidFVlQ2NxMHVlV2lnb0dhWDNpS1QzMmxia0ZKNk55MjJtWjMwTm41NnhjTlpZTYUzM3FUM3BtcUF6aGRfb3E4S2N1MTdCenRLVHQ="
};
function decodeKey(b64) { try { return atob(b64); } catch(e) { return ""; } }

// --- BEZPIECZNY SILNIK AI ---
async function callUniversalAI(systemPrompt, userPrompt, jsonMode = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'openai',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                temperature: 0.8,
                jsonMode: jsonMode
            })
        });
        clearTimeout(timeoutId);
        if (response.ok) {
            const data = await response.json();
            if (data.choices && data.choices[0]?.message?.content) return data.choices[0].message.content.trim();
        }
    } catch (err) {}

    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${decodeKey(_k.g)}` },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                temperature: 0.8,
                max_tokens: 180,
                ...(jsonMode ? { response_format: { type: "json_object" } } : {})
            })
        });
        const data = await res.json();
        if (data.choices && data.choices[0]?.message?.content) return data.choices[0].message.content.trim();
    } catch (e) {}

    throw new Error("AI Offline");
}

// --- ZOPTYMALIZOWANY DEKOMPRESOR PROFILI POWIATÓW / MIAST ---
// Format towns: [Nazwa, Gmina/Opis, Lat, Lng, [Ulice]]
// Format units: [NazwaJednostki, Miejscowosc, Adres, Lat, Lng, LockedBool, [[id, nazwa, obsada], ...]]
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
            [".OSP KSRG Bolszewo", "Bolszewo", "ul. Zamostna 4A, 84-239 Bolszewo", 54.6156, 18.1772, true, [["559[G]56", "GBA 2,5/16 Star 12.185/Stolarczyk", 6], ["559[G]57", "SLRr Toyota Hilux", 3], ["559[G]58", "GCBA 5/32 MB Atego/Mototruck", 4], ["559[G]59", "SLKw Ford Transit/Stolarczyk", 2], ["559[G]Q01", "Quad CF MOTO 500-2A", 1]]],
            [".OSP KSRG Gościcino", "Gościcino", "ul. Drzewiarza 22, 84-241 Gościcino", 54.5975, 18.1458, false, [["559[G]63", "GBA 2,5/16 Volvo/Bocar", 6]]],
            [".OSP KSRG Wejherowo", "Wejherowo", "ul. 3 Maja 2, 84-200 Wejherowo", 54.6014, 18.2333, true, [["559[G]66", "GBA Scania", 6], ["559[G]67", "SLRr Nissan Navara", 3], ["559[G]68", "GBA 2,5/24 Renault Midlum/WISS", 6], ["559[G]69", "SLKw Mitsubishi Canter/Szczęśniak", 3]]],
            [".OSP KSRG Reda", "Reda", "ul. Pucka 1, 84-240 Reda", 54.6053, 18.3478, false, [["559[G]41", "GBA 2,5/16 MB Atego/Mototruck", 6], ["559[G]42", "GBA 2,5/16 Star 12.185/Stolarczyk", 6], ["559[G]43", "GCBA Scania", 6]]],
            [".OSP KSRG Luzino", "Luzino", "ul. Ofiar Stutthofu 39, 84-242 Luzino", 54.5608, 18.1038, false, [["559[G]26", "GBA 3,5/25 Man TGM/Mototruck", 6], ["559[G]27", "GCBA 5/32 Man TGM/Mototruck", 6], ["559[G]28", "SLRt Ford Transit/Stolarczyk", 3], ["559[G]29", "SLOp Toyota Avensis", 2]]],
            [".OSP KSRG Zelewo", "Zelewo", "ul. Długa 31, 84-252 Zelewo", 54.6146, 18.0825, false, [["559[G]87", "GBA Man TGM/Mototruck", 6]]],
            [".OSP KSRG Szemud", "Szemud", "ul. Samorządowa 3, 84-217 Szemud", 54.4862, 18.2278, false, [["559[G]51", "GBA 2,5/25 Man 13.290/Stolarczyk", 6], ["559[G]52", "GBA 2,5/16 Man TGL/Stolarczyk", 6], ["559[G]53", "GCBA 5/32 Scania P400/WISS", 6]]],
            [".OSP KSRG Kielno", "Kielno", "ul. Oliwska 85, 84-208 Kielno", 54.4552, 18.3475, false, [["559[G]46", "GCBA 5/42 MB Axor/Mototruck", 6], ["559[G]47", "GCBA 8,3/60 MAN KAT.1 Buffalo", 3], ["559[G]48", "GBA 3/24 Man TGM/Mototruck", 6]]],
            [".OSP KSRG Bojano", "Bojano", "ul. Józefa Wybickiego 16, 84-207 Bojano", 54.4776, 18.3842, false, [["559[G]76", "GCBA 5/32 Man TGM/Stolarczyk", 6], ["559[G]77", "GBA Man TGM/Stolarczyk", 6], ["559[G]78", "SLRr Nissan Navara", 3]]],
            [".OSP KSRG Choczewo", "Choczewo", "ul. Świerkowa 8, 84-210 Choczewo", 54.7422, 17.8915, false, [["559[G]01", "GCBA 5/32 Man TGM/Mototruck", 6], ["559[G]02", "GBA 2,5/16 Star 244/JZS", 6], ["559[G]03", "SLRt Ford Transit/Bocar", 3]]],
            [".OSP KSRG Słajszewo", "Słajszewo", "ul. Bursztynowa 67, 84-210 Słajszewo", 54.7695, 17.8048, false, [["559[G]81", "GBA 4,5/30 Man TGM/Moto-Truck", 6]]],
            [".OSP KSRG Sasino", "Sasino", "ul. Brukowa 3, 84-210 Sasino", 54.7628, 17.7562, false, [["559[G]91", "GBA Volvo FL280/Bocar", 6], ["559[G]92", "SLRr Ford Ranger", 3]]],
            [".OSP KSRG Gniewino", "Gniewino", "ul. Strażacka 2, 84-250 Gniewino", 54.7161, 18.0156, false, [["559[G]06", "GBA 2,5/25 Man TGM/Stolarczyk", 6], ["559[G]07", "SLKw Ford Transit/Stolarczyk", 3]]],
            [".OSP KSRG Nadole", "Nadole", "ul. Strażacka 20, 84-250 Nadole", 54.7495, 18.0365, false, [["559[G]11", "GCBA 5/32 Volvo FMX/Bocar", 6], ["559[G]12", "SLRt Renault Master", 3]]],
            [".OSP KSRG Kostkowo", "Kostkowo", "ul. Wejherowska 24A, 84-251 Kostkowo", 54.6755, 18.0385, false, [["559[G]71", "GBA 2/24 Renault Midlum/WISS", 6], ["559[G]72", "GCBA 7/42 Scania P450/Szczęśniak", 6]]],
            [".OSP KSRG Linia", "Linia", "ul. Turystyczna 3, 84-223 Linia", 54.4503, 17.9355, false, [["559[G]16", "GBA 2,5/16 Volvo FL280/Bocar", 6], ["559[G]17", "GCBA 5/35 Man TGM/Stolarczyk", 6], ["559[G]18", "SLRt Lublin III", 3]]],
            [".OSP KSRG Strzepcz", "Strzepcz", "ul. Ks. Józefa Rotty 15, 84-223 Strzepcz", 54.4590, 18.0398, false, [["559[G]21", "GBA 2,5/16 MB Atego/Mototruck", 6], ["559[G]22", "SLRt Ford Transit", 3]]],
            [".OSP KSRG Bożepole Wielkie", "Bożepole Wielkie", "ul. Chmieleniecka 40, 84-214 Bożepole Wielkie", 54.5745, 17.9682, false, [["559[G]31", "GBA 2,5/16 MB Atego/Mototruck", 6], ["559[G]32", "SLRt Iveco Daily", 3]]],
            [".OSP KSRG Łęczyce", "Łęczyce", "ul. Sportowa 5, 84-218 Łęczyce", 54.5992, 17.8685, false, [["559[G]36", "GCBA 5/32 Man TGM/Mototruck", 6], ["559[G]37", "GBA Man TGM", 6]]],
            [".OSP KSRG Rozłazino", "Rozłazino", "ul. Długa 26, 84-218 Rozłazino", 54.5445, 17.8615, false, [["559[G]96", "GBA Volvo FL280/Bocar", 6]]],
            ["OSP Gowino", "Gowino", "ul. Wejherowska 58, 84-215 Gowino", 54.5682, 18.2025, false, [["557[G]66", "GBA 4,5/32 Scania P370/Szczęśniak", 6], ["557[G]67", "GLBA Iveco Daily/Bocar", 6]]],
            ["OSP Orle", "Orle", "ul. Strażacka 2, 84-252 Orle", 54.6295, 18.1765, false, [["557[G]76", "GCBA 5/37 MB Atego/Szczęśniak", 6], ["557[G]77", "SLRr Mitsubishi L200", 3]]],
            ["OSP Kniewo", "Kniewo", "al. Lipowa 14, 84-252 Kniewo", 54.6548, 18.1408, false, [["557[G]71", "GBA Mercedes Benz 1124/Ziegler", 6]]],
            ["OSP Zbychowo", "Zbychowo", "ul. Kamienna 2, 84-206 Zbychowo", 54.5528, 18.3275, false, [["557[G]81", "GBA 2,5/16 MB Atego/Mototruck", 6]]],
            ["OSP Gniewowo", "Gniewowo", "ul. Jakuba Wejhera 16, 84-240 Gniewowo", 54.5655, 18.2995, false, [["557[G]86", "GBA 2/20 Renault Midliner", 6], ["557[G]87", "GBM 2,5/8 Star 244", 6]]],
            ["OSP Góra", "Góra", "ul. Wiejska 14, 84-252 Góra", 54.6368, 18.1492, false, [["557[G]91", "GBA Iveco Eurocargo/Sides", 6]]],
            ["OSP Nowy Dwór Wejherowski", "Nowy Dwór Wejherowski", "ul. Kwiatowa 16, 84-206 Nowy Dwór Wejherowski", 54.5365, 18.2575, false, [["558[G]01", "GLM 8 Volkswagen T4", 6], ["558[G]02", "GLBA Iveco Daily", 6]]],
            ["OSP Rybno", "Rybno", "ul. Dębowa 7, 84-251 Rybno", 54.6775, 18.1055, false, [["557[G]11", "GBA 2,5/16 Mercedes Atego", 6]]],
            ["OSP Opalino", "Opalino", "Opalino 4, 84-250 Gniewino", 54.7185, 18.0615, false, [["557[G]96", "GCBA 5/24 Jelcz 422", 4]]],
            ["OSP Kopalino", "Kopalino", "ul. Bursztynowa 24, 84-210 Kopalino", 54.7895, 17.8485, false, [["557[G]01", "GLM 8 Ford Transit", 6]]],
            ["OSP Lewino", "Lewino", "ul. Długa 28, 84-223 Lewino", 54.4815, 17.9945, false, [["557[G]21", "GBA 2,5/16 Mercedes 1619", 6]]],
            ["OSP Milwino", "Milwino", "ul. Strażacka 5, 84-242 Milwino", 54.5185, 18.1345, false, [["557[G]26", "GBA 2,5/16 Renault Midlum", 6]]],
            ["OSP Kaczkowo", "Kaczkowo", "Kaczkowo 18B, 84-218 Kaczkowo", 54.6215, 17.8925, false, [["557[G]36", "GBA Renault Range D", 6]]],
            ["OSP Częstkowo", "Częstkowo", "ul. Strażacka 1, 84-217 Częstkowo", 54.5045, 18.1745, false, [["557[G]51", "GCBA Scania", 6]]],
            ["OSP Łebno", "Łebno", "ul. Kartuska 10, 84-217 Łebno", 54.4555, 18.1365, false, [["557[G]56", "GBA 2,5/16 Mercedes Atego", 6]]],
            ["OSP Przetoczyno", "Przetoczyno", "ul. Pomorska 21, 84-217 Przetoczyno", 54.5345, 18.2045, false, [["557[G]61", "GBA 2,5/16 Magirus", 6]]]
        ]
    },

    {
        id: "pucki", name: "KP PSP Puck (Powiat Pucki)", radioCallsign: "Puck 998",
        desc: "Woj. pomorskie • JRG Puck + 16 jednostek OSP (Władysławowo, Jastarnia, Hel, Krokowa, Kosakowo)",
        voivodeship: "pomorskie", countyName: "pow. pucki", mapCenter: [54.7180, 18.4080], bbox: "18.00,54.55,18.85,54.85",
        jrgList: ["JRG Puck"], defaultTown: "Puck",
        towns: [
            ["Puck", "m. Puck", 54.7178, 18.4083, ["ul. Żarnowiecka", "ul. 1 Maja", "ul. Wejherowska", "ul. Kopernika", "ul. Morska", "ul. Przebendowskiego", "ul. Lipowa"]],
            ["Władysławowo", "gm. Władysławowo", 54.7909, 18.4036, ["ul. Gdańska", "ul. Starowiejska", "ul. Hallera", "ul. Morska", "ul. Rybacka", "ul. Niepodległości", "ul. Portowa"]],
            ["Jastarnia", "gm. Jastarnia", 54.6983, 18.6766, ["ul. Ks. P. Stefańskiego", "ul. Adama Mickiewicza", "ul. Bałtycka", "ul. Rybacka", "ul. Ogrodowa"]],
            ["Hel", "m. Hel", 54.6081, 18.8013, ["ul. Kuracyjna", "ul. Wiejska", "ul. Adm. Steyera", "ul. Leśna", "ul. Morska", "ul. Portowa"]],
            ["Kosakowo", "gm. Kosakowo", 54.6186, 18.4682, ["ul. Chrzanowskiego", "ul. Żeromskiego", "ul. Derdowskiego", "ul. Fiołkowa"]],
            ["Krokowa", "gm. Krokowa", 54.7738, 18.1619, ["ul. Żarnowiecka", "ul. Wejherowska", "ul. Zamkowa", "ul. Kolejowa"]],
            ["Żelistrzewo", "gm. Puck", 54.6761, 18.4239, ["ul. Lipowa", "ul. Pucka", "ul. Rzemieślnicza", "ul. Długa"]],
            ["Chłapowo", "gm. Władysławowo", 54.8031, 18.3742, ["ul. Władysławowska", "ul. Żeromskiego", "ul. Gościnna"]],
            ["Karwia", "gm. Władysławowo", 54.8286, 18.2119, ["ul. Wojska Polskiego", "ul. Kopernika", "ul. Kolorowa"]],
            ["Jastrzębia Góra", "gm. Władysławowo", 54.8305, 18.3095, ["ul. Rozewska", "ul. Królewska", "ul. Pucka", "ul. Droga Rybacka"]],
            ["Leśniewo", "gm. Puck", 54.6789, 18.2683, ["ul. Krótka", "ul. Wejherowska", "ul. Leśna"]],
            ["Starzyno", "gm. Puck", 54.7561, 18.3164, ["ul. Długa", "ul. Szkolna", "ul. Kościelna"]],
            ["Strzelno", "gm. Puck", 54.7825, 18.3711, ["ul. Świerkowa", "ul. Pucka"]],
            ["Wierzchucino", "gm. Krokowa", 54.7919, 18.0189, ["ul. Abrahama", "ul. Szkolna", "ul. Brzozowa"]],
            ["Gnieżdżewo", "gm. Puck", 54.7564, 18.3992, ["ul. Klonowa", "ul. Gdańska"]],
            ["Smolno", "gm. Puck", 54.6881, 18.3842, ["ul. Główna", "ul. Szkolna"]]
        ],
        psp: [
            ["JRG Puck", "Puck", "ul. Żarnowiecka 7, 84-100 Puck", 54.7185, 18.3976, true, [
                ["501[G]21", "GBA 2,5/24 MAN TGM 13.290/Stolarczyk", 6], ["501[G]25", "GCBA 5/32 Scania P410/Szczęśniak", 4],
                ["501[G]43", "SRt Scania P370/Szczęśniak", 3], ["501[G]53", "SHD-23 MAN TGL 12.250/Bumar", 2],
                ["501[G]90", "SLRr Ford Ranger", 2]
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
        desc: "Woj. pomorskie • JRG Lębork + 12 jednostek OSP (Łeba, Nowa Wieś Lęborska, Cewice, Wicko)",
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
            ["Tawęcino", "gm. Nowa Wieś Lęborska", 54.6281, 17.8114, ["Tawęcino"]],
            ["Brzeźno Lęborskie", "gm. Łęczyce", 54.6311, 17.8419, ["Brzeźno Lęborskie"]]
        ],
        psp: [
            ["JRG Lębork", "Lębork", "ul. Ogniowa 2, 84-300 Lębork", 54.5446, 17.7532, true, [
                ["451[G]21", "GBAPr 2,5/25 MAN TGM 13.290/Stolarczyk", 6], ["451[G]25", "GCBA 5/32 MAN TGM 18.340/Moto-Truck", 4],
                ["451[G]43", "SRt Scania P370/Szczęśniak", 3], ["451[G]53", "SHD-25 MAN TGL 12.250/Bumar", 2],
                ["451[G]90", "SLRr Ford Ranger", 2]
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
        desc: "Woj. pomorskie • JRG 1 Śródmieście, JRG 2 Chylonia, JRG 3 Oksywie, JRG 4 Wielki Kack + OSP Wiczlino, Karwiny",
        voivodeship: "pomorskie", countyName: "m. Gdynia", mapCenter: [54.5189, 18.5305], bbox: "18.35,54.43,18.60,54.58",
        jrgList: ["JRG 1 Gdynia Śródmieście", "JRG 2 Gdynia Chylonia", "JRG 3 Gdynia Oksywie", "JRG 4 Gdynia Wielki Kack"], defaultTown: "Gdynia Śródmieście",
        towns: [
            ["Gdynia Śródmieście", "m. Gdynia", 54.5189, 18.5305, ["ul. Władysława IV", "ul. Świętojańska", "ul. 10 Lutego", "ul. Starowiejska", "ul. Śląska", "al. Jana Pawła II", "ul. Portowa"]],
            ["Gdynia Chylonia", "m. Gdynia", 54.5442, 18.4589, ["ul. Hutnicza", "ul. Morska", "ul. Chylońska", "ul. Kartuska", "ul. Pucka", "ul. Rozewska"]],
            ["Gdynia Oksywie", "m. Gdynia", 54.5481, 18.5392, ["ul. Bosmańska", "ul. Benisławskiego", "ul. Zielona", "ul. Dickmana", "ul. Śmidowicza"]],
            ["Gdynia Obłuże", "m. Gdynia", 54.5556, 18.5089, ["ul. Unrug", "ul. Kwiatkowskiego", "ul. Płk. Dąbka", "ul. Boisko"]],
            ["Gdynia Pogórze", "m. Gdynia", 54.5681, 18.4981, ["ul. Płk. Dąbka", "ul. Porębskiego", "ul. Paderewskiego"]],
            ["Gdynia Cisowa", "m. Gdynia", 54.5528, 18.4319, ["ul.Morska", "ul. Chylońska", "ul. Owsiana", "ul. Kcyńska"]],
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
                ["343[G]21", "GBA 2,5/24 Renault D16/WISS", 6], ["343[G]25", "GCBA 5/32 Scania P410/Szczęśniak", 4],
                ["343[G]90", "SLRr Isuzu D-Max", 2]
            ]],
            ["JRG 4 Gdynia Wielki Kack", "Gdynia Wielki Kack", "ul. Wielkopolska 250, 81-531 Gdynia", 54.4698, 18.4945, true, [
                ["344[G]21", "GBA 2,5/25 MAN TGM/Bocar", 6], ["344[G]25", "GCBA 5/32 Scania P370/Szczęśniak", 4],
                ["344[G]90", "SLRr Toyota Hilux", 2]
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
        desc: "Woj. pomorskie • JRG 1 Wrzeszcz, JRG 2 Śródmieście, JRG 3 Orunia, JRG 4 Przymorze, JRG 5 Kokoszki, JRG 6 Przeróbka + OSP",
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

// --- ZMIENNE AKTYWNEGO POWIATU I ZALOGOWANEGO UŻYTKOWNIKA ---
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

function getStorageKeyForCounty(countyId) { return `SWDST_SAVED_SHIFT_STATE_${countyId}_V1`; }

function getFormattedOperatorName() {
    return (currentUserName && currentUserName.trim() !== "")
        ? `${currentUserRank} ${currentUserName.trim()}`
        : "Nazwa Użytkownika (Niezalogowany)";
}

function updateStatusBarUserDisplay() {
    const firstSpan = document.querySelector('.status-bar span');
    if (!firstSpan) return;
    const pName = COUNTY_PROFILES[currentCountyId].name;
    firstSpan.innerHTML = (currentUserName && currentUserName.trim() !== "")
        ? `Zalogowano jako: <b>${currentUserRank} ${currentUserName.trim()}</b> <span style="color:#0a246a; font-weight:bold; margin-left:6px;">[${pName}]</span>`
        : `Zalogowano jako: <b style="color:#777; font-style:italic;">Nazwa Użytkownika</b> <span style="color:#0a246a; font-weight:bold; margin-left:6px;">[${pName}]</span>`;
}

function updateJrgSelectOptions() {
    const jrgList = COUNTY_PROFILES[currentCountyId].jrgList;
    ['inp-ev-jrg', 'inp-ev-lead', 'inp-ev-area'].forEach(selId => {
        const el = document.getElementById(selId);
        if (el) el.innerHTML = jrgList.map(j => `<option value="${j}">${j}</option>`).join('');
    });
}

// --- LAUNCHER / EKRAN LOGOWANIA I WYBORU KOMENDY (6 REJONÓW) ---
function ensureLauncherModalExists() {
    if (document.getElementById('modal-launcher')) return;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modal-launcher';
    modal.style.cssText = 'display:flex; background:rgba(10, 36, 106, 0.45); z-index:12000;';

    const radiosHtml = RAW_PROFILES.map((rp, idx) => `
        <label style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; border: 1.5px solid #0a246a; background: ${idx === 0 ? '#f0f5ff' : '#ffffff'}; cursor: pointer; border-radius: 3px;">
            <input type="radio" name="launcher-county" value="${rp.id}" ${idx === 0 ? 'checked' : ''}>
            <div>
                <div style="font-weight: bold; color: #0a246a; font-size: 12px;">${rp.name}</div>
                <div style="font-size: 10px; color: #444;">${rp.desc} • Kryptonim: <b>${rp.radioCallsign}</b></div>
            </div>
        </label>
    `).join('');

    modal.innerHTML = `
        <div class="modal-window" style="width: 520px; background: #ece9d8; border: 2px solid #0a246a; box-shadow: 0 6px 25px rgba(0,0,0,0.6);">
            <div class="modal-header" style="background: linear-gradient(90deg, #0a246a, #1d4f91); color: #fff; padding: 6px 10px; font-size: 13px;">
                <span>🚒 ${APP_VERSION} — Logowanie Dyspozytora i Wybór Komendy</span>
            </div>
            <div class="modal-body" style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
                <div class="form-box" style="padding: 8px;">
                    <div class="form-title" style="font-size: 12px; margin-bottom: 6px;">1. Dane Dyspozytora Stanowiska Kierowania</div>
                    <div style="display: flex; gap: 8px;">
                        <div class="form-group" style="width: 135px;">
                            <label>Stopień służbowy:</label>
                            <select id="launcher-rank" style="padding: 4px;">
                                <option value="str.">strażak</option><option value="st. str.">st. strażak</option>
                                <option value="sekc.">sekcyjny</option><option value="st. sekc.">st. sekcyjny</option>
                                <option value="mł. ogn.">mł. ogniomistrz</option><option value="ogn.">ogniomistrz</option>
                                <option value="st. ogn.">st. ogniomistrz</option><option value="mł. asp.">mł. aspirant</option>
                                <option value="asp." selected>aspirant</option><option value="st. asp.">st. aspirant</option>
                                <option value="asp. szt.">asp. sztabowy</option><option value="mł. kpt.">mł. kapitan</option>
                                <option value="kpt.">kapitan</option><option value="st. kpt.">st. kapitan</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Identyfikator / Nazwa operatora:</label>
                            <input type="text" id="launcher-username" placeholder="Nazwa Użytkownika" style="padding: 4px 8px; font-size: 12px; font-weight: bold;" onkeypress="if(event.key==='Enter') confirmLauncherLogin()">
                        </div>
                    </div>
                </div>
                <div class="form-box" style="padding: 8px;">
                    <div class="form-title" style="font-size: 12px; margin-bottom: 6px;">2. Wybór Rejonu Operacyjnego (Komendy PSP / KM PSP)</div>
                    <div style="display: flex; flex-direction: column; gap: 5px; max-height: 270px; overflow-y: auto; padding-right: 4px;">
                        ${radiosHtml}
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button class="btn-win" style="padding: 6px 18px; font-weight: bold; font-size: 12px; background: #e2f0d9; border: 1.5px solid #155724; color: #155724;" onclick="confirmLauncherLogin()">🚀 Rozpocznij służbę w SWD ➔</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function openLauncherModal() {
    ensureLauncherModalExists();
    const inpUser = document.getElementById('launcher-username');
    const selRank = document.getElementById('launcher-rank');
    if (inpUser) inpUser.value = currentUserName;
    if (selRank) selRank.value = currentUserRank;
    const rad = document.querySelector(`input[name="launcher-county"][value="${currentCountyId}"]`);
    if (rad) rad.checked = true;
    document.getElementById('modal-launcher').style.display = 'flex';
}

function confirmLauncherLogin() {
    const inpUser = document.getElementById('launcher-username');
    const selRank = document.getElementById('launcher-rank');
    const chosenCountyRadio = document.querySelector('input[name="launcher-county"]:checked');

    currentUserRank = selRank ? selRank.value : "asp.";
    currentUserName = inpUser ? inpUser.value.trim() : "";
    const newCountyId = chosenCountyRadio ? chosenCountyRadio.value : "wejherowski";

    localStorage.setItem('SWDST_USER_SESSION', JSON.stringify({
        rank: currentUserRank, username: currentUserName, countyId: newCountyId
    }));

    applyCountyProfile(newCountyId);
    updateStatusBarUserDisplay();

    const modal = document.getElementById('modal-launcher');
    if (modal) modal.style.display = 'none';
}

function applyCountyProfile(countyId) {
    const profile = COUNTY_PROFILES[countyId] || COUNTY_PROFILES.wejherowski;
    currentCountyId = profile.id;
    currentCountyCallsign = profile.radioCallsign;

    locationsDatabase = { ...profile.locationsDatabase };
    townsList = Object.keys(locationsDatabase);
    realStreetsByTown = { ...profile.realStreetsByTown };
    gpsCoords = { ...profile.gpsCoords };
    unitExactLocations = JSON.parse(JSON.stringify(profile.unitExactLocations));
    unitsPSP = JSON.parse(JSON.stringify(profile.unitsPSP));
    unitsOSP = JSON.parse(JSON.stringify(profile.unitsOSP));

    unitsOSP.forEach(u => {
        u.vehicles.forEach(v => { v.obsada = Math.floor(Math.random() * 4) + 3; });
    });

    events = []; selectedEvIdForRadio = null; activeEditingId = null;
    mainRadioLogs = []; cprCounter = 101;
    shiftStats = { cprTotalGenerated: 0, cprAccepted: 0, cprRefused: 0, refusalReasons: {} };
    Object.keys(openRadioWindows).forEach(k => closeRadioWindow(k));

    loadSimulationState();
    updateJrgSelectOptions();
    renderUnits(); renderEvents(); renderSelectedEventDetails();

    const mainHdr = document.querySelector('#main-radio-modal .main-radio-header span');
    if (mainHdr) mainHdr.innerText = `📻 Główne Radio SKKP (${currentCountyCallsign})`;
    updateMainRadioChat();

    stationsGeocoded = false;
    geocodeAllFireStationsExact();
    if (leafletMap) {
        leafletMap.setView(profile.mapCenter, 11);
        updateMapMarkers();
    }
}

function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getUnitProximity(unitName, city) {
    const firstUnitKey = Object.keys(unitExactLocations)[0];
    const unitLoc = unitExactLocations[unitName] || unitExactLocations[firstUnitKey];
    const defaultTown = COUNTY_PROFILES[currentCountyId].defaultTown;
    const targetTown = Object.keys(gpsCoords).find(c => c.toLowerCase() === (city || "").trim().toLowerCase()) || defaultTown;

    let kmRounded = 1.5;
    if (unitLoc && unitLoc.town.toLowerCase() === targetTown.toLowerCase()) {
        kmRounded = unitName.includes("JRG") ? 1.5 : 1.8;
    } else if (unitLoc) {
        const tCoords = gpsCoords[targetTown] || COUNTY_PROFILES[currentCountyId].mapCenter;
        const roadDist = haversineKm(unitLoc.lat, unitLoc.lng, tCoords[0], tCoords[1]) * 1.25;
        kmRounded = Math.max(1.5, Math.round(roadDist * 10) / 10);
    }
    return { sec: Math.max(5, Math.round(kmRounded * 4)), kmNum: kmRounded, km: `${kmRounded.toFixed(1)} km` };
}

function generateDeparturePrepSeconds(unitName) {
    const isPSP = unitName.includes("JRG") || unitName.includes("KP PSP") || unitName.includes("KM PSP");
    return isPSP ? (Math.floor(Math.random() * 5) + 1) : (Math.floor(Math.random() * 10) + 1);
}

function calculateRouteTravelSeconds(unitName, city) {
    const prox = getUnitProximity(unitName, city);
    return Math.max(5, Math.round(prox.kmNum * (3.5 + Math.random())));
}

function calculateActionDurationSeconds(desc, subtype, type) {
    if (type === 'PZR') return -1;
    const text = ((desc || "") + " " + (subtype || "")).toLowerCase();
    const isBig = /poszukiwan|zaginion|hala|hali|magazyn|zakład|produkcyjn|las|leśn|mieszkan|kamienic|budynk|dach|poddasz|gospodarcz|stodoł|tartak|szkoł|składowisk/.test(text);
    if (isBig) return Math.floor(Math.random() * 601) + 300;
    if (/wypadek|zderzenie|chemiczn/.test(text)) return Math.floor(Math.random() * 181) + 240;
    return Math.floor(Math.random() * 121) + 150;
}

function autoSelectJRGByCity(city) {
    const jrgList = COUNTY_PROFILES[currentCountyId].jrgList;
    let bestJrg = jrgList[0];
    if (jrgList.length > 1) {
        let bestSec = 999999;
        jrgList.forEach(jName => {
            const p = getUnitProximity(jName, city);
            if (p.sec < bestSec) { bestSec = p.sec; bestJrg = jName; }
        });
    }
    ['inp-ev-jrg', 'inp-ev-lead', 'inp-ev-area'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = bestJrg;
    });
}

// --- PODRODZAJE ZDARZEŃ ---
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

function updateSubtypes(type) {
    const select = document.getElementById('inp-ev-subtype');
    const group = document.getElementById('subtype-group');
    if(!select) return;
    select.innerHTML = '';
    if (group) {
        if (type === 'PZR') { group.style.display = 'none'; return; }
        else { group.style.display = 'flex'; }
    }
    (subtypesData[type] || ["Brak"]).forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub; opt.innerText = sub;
        select.appendChild(opt);
    });
}

let events = [], activeEditingId = null, selectedEvIdForRadio = null, selectedVehicles = [];
let servicesState = { prm: false, police: false }, currentCPRData = null, cprCounter = 101;
let openRadioWindows = {}, mainRadioLogs = [], mainRadioModalEl = null;
let simSpeed = 1, simIntervalId = null, autoCprTimeoutId = null;
let shiftStats = { cprTotalGenerated: 0, cprAccepted: 0, cprRefused: 0, refusalReasons: {} };

// --- MODUŁ ZAPISYWANIA I WCZYTYWANIA STANU SŁUŻBY ---
function saveSimulationState() {
    try {
        const stateObj = {
            version: APP_VERSION, countyId: currentCountyId, savedAt: new Date().toISOString(),
            events, unitsPSP, unitsOSP, unitExactLocations, shiftStats, cprCounter,
            mainRadioLogs: mainRadioLogs.slice(-100)
        };
        localStorage.setItem(getStorageKeyForCounty(currentCountyId), JSON.stringify(stateObj));
    } catch (e) {}
}

function loadSimulationState() {
    try {
        const raw = localStorage.getItem(getStorageKeyForCounty(currentCountyId));
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.events)) return false;

        events = data.events;
        if (Array.isArray(data.unitsPSP) && data.unitsPSP.length > 0) unitsPSP = data.unitsPSP;
        if (Array.isArray(data.unitsOSP) && data.unitsOSP.length > 0) unitsOSP = data.unitsOSP;
        if (data.unitExactLocations) {
            Object.keys(data.unitExactLocations).forEach(k => {
                if (!unitExactLocations[k]) unitExactLocations[k] = data.unitExactLocations[k];
            });
        }
        if (data.shiftStats) shiftStats = data.shiftStats;
        if (typeof data.cprCounter === 'number') cprCounter = data.cprCounter;
        if (Array.isArray(data.mainRadioLogs)) mainRadioLogs = data.mainRadioLogs;

        if (events.length > 0) {
            selectedEvIdForRadio = events[events.length - 1].id;
            const btnOpen = document.getElementById('btn-open-radio');
            if (btnOpen) btnOpen.style.display = 'block';
        }
        return true;
    } catch (e) { return false; }
}

function exportShiftStateToFile() {
    saveSimulationState();
    const raw = localStorage.getItem(getStorageKeyForCounty(currentCountyId)) || "{}";
    const blob = new Blob([raw], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SWDST_${currentCountyId}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importShiftStateFromFile() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const parsed = JSON.parse(ev.target.result);
                if (!parsed || !Array.isArray(parsed.events)) { alert("Nieprawidłowy plik zapisu służby!"); return; }
                if (parsed.countyId && COUNTY_PROFILES[parsed.countyId]) currentCountyId = parsed.countyId;
                localStorage.setItem(getStorageKeyForCounty(currentCountyId), JSON.stringify(parsed));
                applyCountyProfile(currentCountyId);
                alert("✅ Pomyślnie wczytano zapis służby z pliku!");
            } catch (err) { alert("Błąd podczas odczytu pliku zapisu!"); }
        };
        reader.readAsText(file);
    };
    inp.click();
}

function resetShiftState() {
    if (!confirm("Czy na pewno chcesz zresetować obecną służbę w wybranym rejonie?")) return;
    localStorage.removeItem(getStorageKeyForCounty(currentCountyId));
    applyCountyProfile(currentCountyId);
    const sisBody = document.getElementById('details-sis-body');
    if (sisBody) sisBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888;">Brak wybranego zdarzenia</td></tr>';
}

function setSimulationSpeed(speed) {
    simSpeed = speed;
    [1, 2, 5].forEach(s => {
        const btn = document.getElementById(`btn-speed-${s}x`);
        if (btn) {
            btn.style.background = s === speed ? '#0a246a' : '#e1e1e1';
            btn.style.color = s === speed ? '#ffffff' : '#000000';
        }
    });
    startSimulationLoop();
    scheduleNextAutoCPR();
}

function injectSpeedAndSaveControls() {
    if (document.getElementById('swd-speed-controls')) return;
    const btnOpenRadio = document.getElementById('btn-open-radio');
    if (btnOpenRadio && btnOpenRadio.parentElement) {
        const bar = btnOpenRadio.parentElement;
        bar.style.flexWrap = 'wrap';
        const speedBox = document.createElement('div');
        speedBox.id = 'swd-speed-controls';
        speedBox.style.cssText = 'display: inline-flex; align-items: center; gap: 3px; background: #d4d0c8; border: 1px solid #808080; padding: 2px 6px; border-radius: 2px; margin-left: auto;';
        speedBox.innerHTML = `
            <span style="font-weight:bold; color:#000; margin-right:2px;">⏩ Tempo:</span>
            <button id="btn-speed-1x" class="btn-win" style="padding: 1px 7px; font-weight: bold; background: #0a246a; color: #fff;" onclick="setSimulationSpeed(1)">1x</button>
            <button id="btn-speed-2x" class="btn-win" style="padding: 1px 7px; font-weight: bold;" onclick="setSimulationSpeed(2)">2x</button>
            <button id="btn-speed-5x" class="btn-win" style="padding: 1px 7px; font-weight: bold;" onclick="setSimulationSpeed(5)">5x</button>
            <span style="margin: 0 3px; color:#777;">|</span>
            <button class="btn-win" style="padding: 1px 6px; font-weight: bold; background:#eef4ff; color:#0a246a;" onclick="openLauncherModal()">👤 Komenda / Login</button>
            <button class="btn-win" style="padding: 1px 6px; font-weight: bold;" onclick="exportShiftStateToFile()">💾 Eksportuj</button>
            <button class="btn-win" style="padding: 1px 6px;" onclick="importShiftStateFromFile()">📂 Wczytaj</button>
            <button class="btn-win" style="padding: 1px 6px; background:#ffe6e6; color:#800000;" onclick="resetShiftState()">🗑️ Reset</button>
        `;
        bar.appendChild(speedBox);
    }
}

function injectPzrStyles() {
    if (document.getElementById('swd-pzr-styles')) return;
    const style = document.createElement('style');
    style.id = 'swd-pzr-styles';
    style.innerHTML = `
        .status-dot.yellow { background-color: #f1c40f !important; box-shadow: 0 0 4px #d4ac0d; }
        .vehicle-row.pzr-active { background-color: #fff8c4 !important; border-left: 3px solid #f1c40f !important; }
        .unit-box.unit-on-pzr { border: 1.5px solid #d4ac0d !important; background-color: #fffdf0 !important; }
        .unit-header.header-on-pzr { background-color: #ffe875 !important; color: #000000 !important; }
    `;
    document.head.appendChild(style);
}

function getActivePzrForVehicle(vehId) {
    let foundPzrEv = null;
    events.forEach(ev => {
        if (ev.status === 'ACTIVE' && ev.type === 'PZR') {
            if (ev.vehicles && ev.vehicles.some(v => v.id === vehId)) foundPzrEv = ev;
        }
    });
    return foundPzrEv;
}

function isVehicleInCombatAction(vehId) {
    return events.some(ev => {
        if (ev.type === 'PZR') return false;
        if (ev.status === 'ACTIVE') return ev.vehicles.some(v => v.id === vehId && v.phase !== 'DONE');
        if (ev.status === 'FINISHED') return ev.vehicles.some(v => v.id === vehId && v.phase === 'RETURN' && v.returnTime > 0);
        return false;
    });
}

// --- GŁÓWNE RADIO OGÓLNOPOWIATOWE SKKP ---
function ensureMainRadioWindow() {
    if (mainRadioModalEl) return mainRadioModalEl;
    const modal = document.createElement('div');
    modal.id = 'main-radio-modal';
    modal.style.cssText = 'position:fixed; z-index:1045; width:460px; right:20px; bottom:35px;';
    modal.innerHTML = `
        <div style="background: #c0c0c0; border: 2px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; box-shadow: 2px 2px 6px rgba(0,0,0,0.5); font-family: 'Segoe UI', Tahoma, sans-serif;">
            <div class="main-radio-header" style="background: linear-gradient(90deg, #800000, #b30000); color: #ffffff; padding: 4px 6px; font-weight: bold; font-size: 13px; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none;">
                <span>📻 Główne Radio SKKP (${currentCountyCallsign})</span>
                <div style="display: flex; gap: 2px;">
                    <button style="background: #c0c0c0; border: 1px solid #fff; width: 18px; height: 16px; font-size: 10px; font-weight: bold; cursor: pointer; padding: 0;" onclick="minimizeMainRadio()">_</button>
                    <button style="background: #c0c0c0; border: 1px solid #fff; width: 18px; height: 16px; font-size: 10px; font-weight: bold; cursor: pointer; padding: 0;" onclick="closeMainRadio()">✕</button>
                </div>
            </div>
            <div style="padding: 6px; background: #c0c0c0;">
                <div style="font-size:10px; color:#222; margin-bottom:3px; font-weight:bold;">Meldunki wyjazdów, dojazdów, zakończenia działań i powrotów do bazy:</div>
                <div id="main-radio-chat" style="background: #111111; color: #ffffff; font-family: 'Consolas', 'Courier New', monospace; font-weight: bold; font-size: 12px; height: 210px; padding: 6px; overflow-y: auto; border: 2px solid #808080; box-sizing: border-box; line-height: 1.35;"></div>
                <div style="display: flex; gap: 4px; margin-top: 6px; align-items: center;">
                    <button style="padding: 4px 8px; font-size: 11px; background: #e1e1e1; border: 2px solid #fff; border-right-color: #404040; border-bottom-color: #404040; cursor: pointer; font-weight: bold; color:#000;" onclick="sendMainRadioDispatchMsg(currentCountyCallsign + ', przyjąłem.')">✔ Przyjąłem</button>
                    <input type="text" id="inp-main-radio" placeholder="Nadaj komunikat ogólny..." style="flex: 1; padding: 4px 6px; font-size: 12px; background: #ffffff; color:#000; border: 2px solid #808080; outline: none;" onkeypress="if(event.key==='Enter') sendMainRadioCustom()">
                    <button style="padding: 4px 10px; font-size: 11px; background: #e1e1e1; border: 2px solid #fff; border-right-color: #404040; border-bottom-color: #404040; cursor: pointer; font-weight: bold; color:#000;" onclick="sendMainRadioCustom()">Nadaj</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    makeDraggable(modal, modal.querySelector('.main-radio-header'));
    mainRadioModalEl = modal;
    updateMainRadioChat();
    return modal;
}

function openMainRadio() {
    const modal = ensureMainRadioWindow();
    modal.style.display = 'block';
    const minItem = document.getElementById('min-main-radio');
    if (minItem) minItem.remove();
    updateMainRadioChat();
}

function closeMainRadio() { if (mainRadioModalEl) mainRadioModalEl.style.display = 'none'; }

function minimizeMainRadio() {
    if (mainRadioModalEl) mainRadioModalEl.style.display = 'none';
    const bar = document.getElementById('minimized-bar');
    if (bar && !document.getElementById('min-main-radio')) {
        const item = document.createElement('div');
        item.className = 'minimized-item'; item.id = 'min-main-radio';
        item.innerHTML = `📻 Główne Radio SKKP`;
        item.onclick = () => openMainRadio();
        bar.appendChild(item);
    }
}

function logToMainRadio(callsign, messageText, color = '#7CFC00', playBeep = true) {
    ensureMainRadioWindow();
    if (playBeep) { audioMotorola.currentTime = 0; audioMotorola.play().catch(() => {}); }
    const timeStr = new Date().toLocaleTimeString();
    mainRadioLogs.push(`<div style="margin-bottom: 6px; color: ${color}; border-bottom: 1px dashed #333; padding-bottom: 3px;"><span style="color:#cccccc;">[${timeStr}]</span> <b>${callsign}:</b><br>"${messageText}"</div>`);
    updateMainRadioChat();
    saveSimulationState();
}

function updateMainRadioChat() {
    const chat = document.getElementById('main-radio-chat');
    if (chat) {
        chat.innerHTML = mainRadioLogs.length > 0
            ? mainRadioLogs.join('')
            : `<div style="color:#aaa; font-style:italic;">[System] Kanał główny SKKP (${currentCountyCallsign}) aktywny. Nasłuch statusów SiS...</div>`;
        chat.scrollTop = chat.scrollHeight;
    }
}

function sendMainRadioDispatchMsg(text) {
    if (!text) return;
    logToMainRadio(`${currentCountyCallsign} ➔ WSZYSCY`, text, '#00ffff', true);
}

function sendMainRadioCustom() {
    const inp = document.getElementById('inp-main-radio');
    if (!inp || !inp.value.trim()) return;
    sendMainRadioDispatchMsg(inp.value.trim());
    inp.value = '';
}

// --- GEOKODER ADRESÓW ---
async function resolveExactCoordinates(streetAddress, townName) {
    const profile = COUNTY_PROFILES[currentCountyId];
    const cleanTown = (townName || profile.defaultTown).trim().replace(/^Gdynia\s+|^Gdańsk\s+/i, (m) => m.split(' ')[0] + ' ');
    let cleanedStreet = (streetAddress || "")
        .replace(/^(Przystanek Autobusowy|Kamienica|Blok mieszkalny|Hala Magazynowa|Tartak \/ Skład Drzewny)[,\s-]*/i, '')
        .split('/')[0].trim();

    const fullQuery = cleanedStreet
        ? `${cleanedStreet}, ${cleanTown}, ${profile.voivodeship}, Polska`
        : `${cleanTown}, ${profile.voivodeship}, Polska`;

    try {
        const arcUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(fullQuery)}&countryCode=POL&searchExtent=${profile.bbox}&maxLocations=1`;
        const res = await fetch(arcUrl);
        if (res.ok) {
            const data = await res.json();
            if (data.candidates && data.candidates.length > 0) {
                const loc = data.candidates[0].location;
                if (loc && loc.y && loc.x) return { lat: parseFloat(loc.y), lng: parseFloat(loc.x) };
            }
        }
    } catch (e) {}

    try {
        const streetNoPrefix = cleanedStreet.replace(/\b(ul\.|ulica|al\.|aleja|pl\.|plac)\s*/gi, '').trim();
        const center = profile.mapCenter;
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(streetNoPrefix + ' ' + cleanTown)}&lat=${center[0]}&lon=${center[1]}&limit=1`;
        const res = await fetch(photonUrl);
        if (res.ok) {
            const data = await res.json();
            if (data.features && data.features.length > 0) {
                const coords = data.features[0].geometry?.coordinates;
                if (coords && coords.length === 2) return { lat: parseFloat(coords[1]), lng: parseFloat(coords[0]) };
            }
        }
    } catch (e) {}

    return null;
}

let stationsGeocoded = false;
async function geocodeAllFireStationsExact() {
    if (stationsGeocoded) return;
    stationsGeocoded = true;

    const cacheKey = `SWD_EXACT_STATIONS_${currentCountyId}_V8`;
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            Object.keys(parsed).forEach(uName => {
                if (unitExactLocations[uName] && !unitExactLocations[uName].locked && parsed[uName].lat && parsed[uName].lng) {
                    unitExactLocations[uName].lat = parsed[uName].lat;
                    unitExactLocations[uName].lng = parsed[uName].lng;
                }
            });
            updateMapMarkers();
            return;
        }
    } catch (e) {}

    const unitNames = Object.keys(unitExactLocations).filter(u => !unitExactLocations[u].locked);
    const cacheToSave = {};

    await Promise.all(unitNames.map(async (uName) => {
        const info = unitExactLocations[uName];
        const coords = await resolveExactCoordinates(info.address, info.town);
        if (coords) {
            info.lat = coords.lat; info.lng = coords.lng;
            cacheToSave[uName] = { lat: info.lat, lng: info.lng };
        }
    }));

    try {
        if (Object.keys(cacheToSave).length > 2) localStorage.setItem(cacheKey, JSON.stringify(cacheToSave));
    } catch (e) {}

    updateMapMarkers();
}

async function geocodeEventAddress(ev) {
    const rawStreet = (ev.street || "").trim();
    const coords = await resolveExactCoordinates(rawStreet, ev.city);
    if (coords) { ev.lat = coords.lat; ev.lng = coords.lng; }
    else if (!ev.lat || !ev.lng) {
        const fallback = gpsCoords[ev.city] || COUNTY_PROFILES[currentCountyId].mapCenter;
        ev.lat = fallback[0]; ev.lng = fallback[1];
    }
    updateMapMarkers();
    saveSimulationState();
}

function focusEventOnMap(evId) {
    const ev = events.find(e => e.id === evId);
    if (!ev) return;
    switchMainView('map');
    setTimeout(async () => {
        if (!ev.geocodedOnce) { ev.geocodedOnce = true; await geocodeEventAddress(ev); }
        if (leafletMap && ev.lat && ev.lng) leafletMap.setView([ev.lat, ev.lng], 17);
    }, 250);
}

// --- MAPA OPERACYJNA LEAFLET ---
let leafletMap = null, mapMarkersLayer = null;

function ensureLeafletLoaded(callback) {
    if (window.L) { callback(); return; }
    if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
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
        const center = COUNTY_PROFILES[currentCountyId].mapCenter;
        if (!leafletMap) {
            leafletMap = L.map('leaflet-map').setView(center, 11);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(leafletMap);
            mapMarkersLayer = L.layerGroup().addTo(leafletMap);
            geocodeAllFireStationsExact();
        }
        leafletMap.invalidateSize();
        updateMapMarkers();
    });
}

function updateMapMarkers() {
    if (!leafletMap || !mapMarkersLayer || !window.L) return;
    mapMarkersLayer.clearLayers();

    [...unitsPSP, ...unitsOSP].forEach(u => {
        const firstKey = Object.keys(unitExactLocations)[0];
        const loc = unitExactLocations[u.name] || unitExactLocations[firstKey];
        if (!loc) return;

        const isPSP = u.name.includes("JRG") || u.name.includes("KP PSP") || u.name.includes("KM PSP");
        const hasPzrVeh = u.vehicles.some(v => v.status === 'yellow');
        const borderColor = hasPzrVeh ? "#d4ac0d" : (isPSP ? "#b30000" : "#0a246a");
        const bgBadge = hasPzrVeh ? "#ffe875" : (isPSP ? "#ffe6e6" : "#ffffff");
        const vehListHtml = u.vehicles.map(v => {
            const color = v.status === 'green' ? '#1e8449' : (v.status === 'yellow' ? '#d4ac0d' : (v.status === 'orange' ? '#d68910' : '#c0392b'));
            const pzrTag = v.status === 'yellow' ? ' <b style="color:#b38600;">[PZR]</b>' : '';
            return `<div style="font-size:11px; color:#000;"><span style="color:${color}; font-weight:bold;">●</span> <b>${v.id}</b> - ${v.name}${pzrTag}</div>`;
        }).join('');

        const marker = L.marker([loc.lat, loc.lng], {
            icon: L.divIcon({
                className: '',
                html: `<div style="transform:translate(-50%, -50%); background:${bgBadge}; color:#000000; border:2px solid ${borderColor}; border-radius:4px; padding:2px 6px; font-size:11px; font-weight:bold; white-space:nowrap; box-shadow:0 2px 5px rgba(0,0,0,0.45); cursor:pointer;">🚒 ${u.name}</div>`,
                iconSize: [0, 0], iconAnchor: [0, 0]
            })
        });
        marker.bindPopup(`<div style="min-width:220px; color:#000;"><div style="font-weight:bold; color:${borderColor}; font-size:12px;">${u.name}</div><div style="font-size:10px; color:#222; border-bottom:1px solid #ccc; margin-bottom:4px; padding-bottom:3px;">📍 <b>Adres:</b> ${loc.address}</div>${vehListHtml}</div>`);
        mapMarkersLayer.addLayer(marker);
    });

    events.forEach(ev => {
        if (ev.status !== 'ACTIVE') return;
        const fallback = gpsCoords[ev.city] || COUNTY_PROFILES[currentCountyId].mapCenter;
        const evLat = ev.lat || fallback[0], evLng = ev.lng || fallback[1];

        const isPZR = ev.type === 'PZR';
        const bgEv = isPZR ? '#fff3a1' : '#ffcccc';
        const borderEv = isPZR ? '#d4ac0d' : '#b30000';
        const iconEv = isPZR ? '🛡️ [PZR]' : `🚨 [ID:${ev.id}]`;

        const marker = L.marker([evLat, evLng], {
            icon: L.divIcon({
                className: '',
                html: `<div style="transform:translate(-50%, -50%); background:${bgEv}; color:#000000; border:2.5px solid ${borderEv}; border-radius:4px; padding:2px 7px; font-size:11px; font-weight:bold; white-space:nowrap; box-shadow:0 0 8px rgba(0,0,0,0.5); cursor:pointer;">${iconEv} ${ev.city}${ev.street ? ', ' + ev.street : ''}</div>`,
                iconSize: [0, 0], iconAnchor: [0, 0]
            })
        });

        const sisList = ev.vehicles.map(v => {
            if (v.phase === 'PREP') return `${v.id} (Wyjazd z bazy za: ${v.prepTime}s)`;
            if (v.phase === 'TRAVEL') return `${v.id} (Dojazd: ${formatMMSS(v.travelTime)})`;
            if (v.phase === 'ONSITE') return `${v.id} (${isPZR ? 'Zabezpieczenie rejonu' : 'Na miejscu akcji'})`;
            if (v.phase === 'RETURN') return `${v.id} (Powrót: ${formatMMSS(v.returnTime)})`;
            return `${v.id}`;
        }).join('<br>');

        marker.bindPopup(`
            <div style="min-width:230px; color:#000;">
                <b style="color:${borderEv};">ZDARZENIE ID: ${ev.id}/2026 (${ev.type})</b><br>
                <b>Dokładny adres:</b> ${ev.city}, ${ev.street || 'Rejon operacyjny'}<br>
                <b>Opis:</b> ${ev.desc || 'Zabezpieczenie operacyjne rejonu'}<br>
                <b>Zadysponowane SiS (${ev.vehicles.length}):</b><br>${sisList || 'Brak'}<br>
                <div style="margin-top:6px; display:flex; gap:4px;">
                    <button class="btn-win" onclick="openEditEventModal(${ev.id})">Edytuj kartę</button>
                    <button class="btn-win" onclick="openRadioForEvent(${ev.id})">📻 Radio zdarzenia</button>
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

function makeDraggable(elmnt, header) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (header) header.onmousedown = dragMouseDown;
    function dragMouseDown(e) {
        if (e.target.closest('.modal-close, .modal-min, button')) return;
        e.preventDefault();
        pos3 = e.clientX; pos4 = e.clientY;
        const rect = elmnt.getBoundingClientRect();
        elmnt.style.position = 'fixed';
        elmnt.style.left = rect.left + 'px'; elmnt.style.top = rect.top + 'px';
        elmnt.style.margin = '0'; elmnt.style.right = 'auto'; elmnt.style.bottom = 'auto';
        document.onmouseup = closeDragElement; document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
        pos3 = e.clientX; pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + 'px';
        elmnt.style.left = (elmnt.offsetLeft - pos1) + 'px';
    }
    function closeDragElement() { document.onmouseup = null; document.onmousemove = null; }
}

function ensureVersionBadgeInStatusBar() {
    let badge = document.getElementById('swdst-version-badge');
    if (!badge) {
        const clockBox = document.getElementById('clock-box');
        if (clockBox && clockBox.parentElement) {
            badge = document.createElement('div');
            badge.id = 'swdst-version-badge';
            badge.style.cssText = 'display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: bold; color: #000; background: #ece9d8; border: 1px solid #7f9db9; margin-left: 4px; vertical-align: middle; cursor: pointer;';
            badge.title = "Kliknij, aby zmienić komendę / przelogować operatora";
            badge.onclick = () => openLauncherModal();
            badge.innerText = `${APP_VERSION} (${simSpeed}x)`;
            clockBox.parentElement.insertBefore(badge, clockBox);
        }
    } else {
        badge.innerText = `${APP_VERSION} (${simSpeed}x)`;
    }
}

function ensureSubtypeDOMIntegration() {
    const radios = document.querySelectorAll('input[name="ev-type"]');
    radios.forEach(r => { r.onclick = () => updateSubtypes(r.value); });
    if (!document.getElementById('inp-ev-subtype') && radios.length > 0) {
        const radioRow = radios[0].closest('.form-row');
        if (radioRow && radioRow.parentElement) {
            const subGroup = document.createElement('div');
            subGroup.className = 'form-group'; subGroup.id = 'subtype-group'; subGroup.style.marginTop = '4px';
            subGroup.innerHTML = `<label>Podrodzaj:</label><select id="inp-ev-subtype"></select>`;
            radioRow.insertAdjacentElement('afterend', subGroup);
        }
    }
    updateSubtypes('P');
}

window.addEventListener('DOMContentLoaded', () => {
    injectPzrStyles();

    try {
        const savedSession = localStorage.getItem('SWDST_USER_SESSION');
        if (savedSession) {
            const parsed = JSON.parse(savedSession);
            if (parsed.rank) currentUserRank = parsed.rank;
            if (typeof parsed.username === 'string') currentUserName = parsed.username;
            if (parsed.countyId && COUNTY_PROFILES[parsed.countyId]) currentCountyId = parsed.countyId;
        }
    } catch (e) {}

    applyCountyProfile(currentCountyId);
    updateStatusBarUserDisplay();
    ensureMainRadioWindow();
    ensureVersionBadgeInStatusBar();
    ensureSubtypeDOMIntegration();
    ensureLauncherModalExists();

    document.querySelectorAll('.top-menu .menu-item').forEach(item => {
        const txt = item.innerText.trim().toLowerCase();
        if (txt.includes('system')) item.onclick = () => openLauncherModal();
        else if (txt.includes('siły i środki')) item.onclick = () => openSiSModal();
        else if (txt.includes('mapy')) item.onclick = () => switchMainView('map');
        else if (txt.includes('podział bojowy') || txt.includes('widok')) item.onclick = () => switchMainView('table');
        else if (txt.includes('zestawienia') || txt.includes('raporty') || txt.includes('rejestr')) item.onclick = () => openReportsModal();
        else if (txt.includes('komunikator') || txt.includes('urządzenia')) item.onclick = () => openMainRadio();
    });

    const tabsBar = document.querySelector('.workspace .tabs-bar');
    if (tabsBar && !document.getElementById('btn-tab-map')) {
        const mapTabBtn = document.createElement('button');
        mapTabBtn.className = 'tab-btn'; mapTabBtn.id = 'btn-tab-map';
        mapTabBtn.innerHTML = '🗺️ Mapa Operacyjna';
        mapTabBtn.onclick = () => switchMainView('map');
        tabsBar.appendChild(mapTabBtn);

        const repTabBtn = document.createElement('button');
        repTabBtn.className = 'tab-btn';
        repTabBtn.innerHTML = '📊 Zestawienia i Raporty';
        repTabBtn.onclick = () => openReportsModal();
        tabsBar.appendChild(repTabBtn);
    }

    const btnOpenRadio = document.getElementById('btn-open-radio');
    if (btnOpenRadio && btnOpenRadio.parentElement && !document.getElementById('btn-open-main-radio')) {
        const mainRadBtn = document.createElement('button');
        mainRadBtn.className = 'btn-win'; mainRadBtn.id = 'btn-open-main-radio';
        mainRadBtn.style.cssText = 'background: #fff0f0; border-color: #800000; font-weight: bold; color: #800000;';
        mainRadBtn.innerHTML = '📻 Główne Radio SKKP';
        mainRadBtn.onclick = () => openMainRadio();
        btnOpenRadio.parentElement.appendChild(mainRadBtn);
    }

    injectSpeedAndSaveControls();

    const pspGrid = document.getElementById('grid-psp');
    if (pspGrid && !document.getElementById('view-map-container')) {
        const mapWrap = document.createElement('div');
        mapWrap.id = 'view-map-container';
        mapWrap.style.cssText = 'flex: 1; display: none; width: 100%; min-height: 260px; border: 1px solid #7f9db9; position: relative;';
        mapWrap.innerHTML = '<div id="leaflet-map" style="width: 100%; height: 100%;"></div>';
        pspGrid.parentNode.insertBefore(mapWrap, pspGrid);
    }

    ensureSiSModalExists();
    ensureReportsModalExists();

    const eventModal = document.querySelector('#modal-event .modal-window');
    if (eventModal) makeDraggable(eventModal, document.querySelector('#modal-event .modal-header'));

    const cprModal = document.getElementById('cpr-modal');
    if (cprModal) makeDraggable(cprModal, cprModal.querySelector('.cpr-header'));
});

function ensureSiSModalExists() {
    let sisModal = document.getElementById('modal-sis');
    if (!sisModal) {
        sisModal = document.createElement('div');
        sisModal.className = 'modal-overlay'; sisModal.id = 'modal-sis';
        document.body.appendChild(sisModal);
    }
    sisModal.innerHTML = `
        <div class="modal-window" style="width: 780px; height: 500px;">
            <div class="modal-header">
                <span>🚒 Zarządzanie Siłami i Środkami (Podział Bojowy)</span>
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
                    <div class="form-title">Wykaz jednostek, oficjalnych adresów strażnic oraz statusów pojazdów:</div>
                    <div id="sis-manager-list" style="max-height:300px; overflow-y:auto;"></div>
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
    let html = `<table class="sis-table"><thead><tr><th>Jednostka</th><th>Oficjalny adres strażnicy</th><th>Kryptonim</th><th>Pojazd</th><th>Status</th><th>Akcja</th></tr></thead><tbody>`;
    [...unitsPSP, ...unitsOSP].forEach(u => {
        const addr = unitExactLocations[u.name]?.address || "";
        u.vehicles.forEach(v => {
            const stText = v.status === 'green' ? 'W bazie' : (v.status === 'yellow' ? 'Zabezpieczenie rejonu (PZR)' : (v.status === 'orange' ? 'W drodze / Powrót' : 'W akcji na miejscu'));
            const stColor = v.status === 'green' ? '#155724' : (v.status === 'yellow' ? '#b38600' : (v.status === 'orange' ? '#b36b00' : '#b30000'));
            html += `
                <tr style="${v.status === 'yellow' ? 'background:#fff8c4;' : ''}">
                    <td><b>${u.name}</b></td>
                    <td style="font-size:10px; color:#333;">${addr}</td>
                    <td><b>${v.id}</b></td>
                    <td>${v.name}</td>
                    <td style="color:${stColor}; font-weight:bold;">${stText}</td>
                    <td>
                        <button class="btn-win" style="font-size:10px; padding:1px 5px;" onclick="setVehicleStatusManual('${v.id}', 'green')">Wolny</button>
                        <button class="btn-win" style="font-size:10px; padding:1px 5px; background:#fff3a1;" onclick="setVehicleStatusManual('${v.id}', 'yellow')">PZR</button>
                        <button class="btn-win" style="font-size:10px; padding:1px 5px;" onclick="setVehicleStatusManual('${v.id}', 'red')">W akcji</button>
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
    renderUnits(); renderSiSManagerList(); updateMapMarkers(); saveSimulationState();
}

async function addCustomUnit(type) {
    const defTown = COUNTY_PROFILES[currentCountyId].defaultTown;
    const name = prompt(`Podaj nazwę nowej jednostki ${type}:`);
    if (!name || !name.trim()) return;
    const town = prompt(`Podaj miejscowość stacjonowania jednostki:`, defTown) || defTown;
    const address = prompt(`Podaj dokładną ulicę i numer strażnicy:`, `ul. Strażacka 1, ${town}`) || town;
    const tCoords = gpsCoords[town.trim()] || COUNTY_PROFILES[currentCountyId].mapCenter;
    unitExactLocations[name.trim()] = { town: town.trim(), address: address.trim(), lat: tCoords[0], lng: tCoords[1] };

    if (type === 'PSP') unitsPSP.push({ name: name.trim(), vehicles: [] });
    else unitsOSP.push({ name: name.trim(), vehicles: [] });

    const exact = await resolveExactCoordinates(address, town);
    if (exact) { unitExactLocations[name.trim()].lat = exact.lat; unitExactLocations[name.trim()].lng = exact.lng; }
    renderUnits(); renderSiSManagerList(); updateMapMarkers(); saveSimulationState();
}

function addCustomVehicle(type) {
    const targetArray = type === 'PSP' ? unitsPSP : unitsOSP;
    const unitName = prompt(`Podaj dokładną nazwę jednostki ${type}:`, targetArray[0]?.name || "");
    if (!unitName) return;
    const unit = targetArray.find(u => u.name.toLowerCase() === unitName.trim().toLowerCase());
    if (!unit) { alert("Nie znaleziono takiej jednostki na liście!"); return; }
    const id = prompt("Podaj numer operacyjny pojazdu:", currentCountyId === "raciborski" ? "569[S]99" : "559[G]99");
    const vName = prompt("Podaj typ i markę pojazdu:", "GBA 2,5/16 MAN");
    if (id && vName) {
        unit.vehicles.push({ id: id.trim(), name: vName.trim(), status: "green", obsada: 6 });
        renderUnits(); renderSiSManagerList(); updateMapMarkers(); saveSimulationState();
    }
}

// --- OKNO RAPORTÓW I STATYSTYK ---
function ensureReportsModalExists() {
    if (document.getElementById('modal-reports')) return;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay'; modal.id = 'modal-reports';
    modal.innerHTML = `
        <div class="modal-window" style="width: 920px; height: 660px; background: #d4d0c8; border: 2px solid #0a246a;">
            <div class="modal-header" style="background: #0a246a; color: #fff; padding: 4px 8px;">
                <span>Raporty — Statystyka</span>
                <div class="modal-close" onclick="closeModal('modal-reports')">×</div>
            </div>
            <div class="modal-body" style="padding: 8px; background: #d4d0c8; display: flex; flex-direction: column; gap: 8px; overflow-y: auto;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <b>Zakres:</b>
                        <button class="btn-win" style="background: #eef4ff; font-weight: bold;">Dzień</button>
                        <button class="btn-win">Miesiąc</button>
                        <button class="btn-win">Rok</button>
                        <button class="btn-win">Wszystkie</button>
                        <span id="rep-date-sub" style="color: #444; margin-left: 6px;">Statystyka z bieżącej służby</span>
                    </div>
                    <div style="display:flex; gap:4px;">
                        <button class="btn-win" style="padding: 4px 10px; font-weight: bold;" onclick="exportShiftStateToFile()">💾 Eksportuj JSON</button>
                        <button class="btn-win" style="padding: 4px 10px;" onclick="importShiftStateFromFile()">📂 Wczytaj JSON</button>
                        <button class="btn-win" style="padding: 4px 14px; font-weight: bold;" onclick="window.print()">Drukuj</button>
                    </div>
                </div>
                <div style="background: #ece9d8; border: 1px solid #999; padding: 6px 8px;">
                    <b>Tryb statystyk:</b> Zapis automatyczny w przeglądarce (localStorage) + obsługa plików .json.
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;"><div style="font-weight: bold; color: #222;">Zgłoszenia ogółem</div><div id="rep-total" style="font-size: 20px; font-weight: bold; margin-top: 4px; color:#000;">0</div></div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;"><div style="font-weight: bold; color: #222;">Aktywne</div><div id="rep-active" style="font-size: 20px; font-weight: bold; margin-top: 4px; color:#000;">0</div></div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;"><div style="font-weight: bold; color: #222;">Zakończone</div><div id="rep-finished" style="font-size: 20px; font-weight: bold; margin-top: 4px; color:#000;">0</div></div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;"><div style="font-weight: bold; color: #222;">Średni czas obsługi</div><div id="rep-avg-time" style="font-size: 16px; font-weight: bold; margin-top: 6px; color:#000;">00:08:30</div></div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;"><div style="font-weight: bold; color: #222;">Odmowy / Anulowane CPR</div><div id="rep-refused" style="font-size: 20px; font-weight: bold; margin-top: 4px; color:#000;">0</div></div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;"><div style="font-weight: bold; color: #222;">Zdarzenia powiązane (CPR)</div><div id="rep-cpr-linked" style="font-size: 20px; font-weight: bold; margin-top: 4px; color:#000;">0</div></div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;"><div style="font-weight: bold; color: #222;">Nowe powyżej 2 min</div><div id="rep-over-2m" style="font-size: 20px; font-weight: bold; margin-top: 4px; color:#000;">0</div></div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px 8px;"><div style="font-weight: bold; color: #222;">Komenda</div><div id="rep-range-box" style="font-size: 12px; font-weight: bold; margin-top: 6px; color:#000;">KP PSP</div></div>
                </div>
                <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px;">
                    <div style="background: #cccccc; padding: 4px 6px; font-weight: bold; border: 1px solid #aaa; margin-bottom: 6px;">SŁUŻBY — PRM / PSP / POLICJA</div>
                    <table class="sis-table" style="background: #fff;">
                        <thead><tr><th>Służba</th><th style="text-align:right;">Zadysponowano</th><th style="text-align:right;">Oczekuje (Dojazd)</th><th style="text-align:right;">Obsługa (Na miejscu)</th><th style="text-align:right;">Zakończono</th><th style="text-align:right;">Śr. reakcja</th><th style="text-align:right;">Śr. obsługa</th></tr></thead>
                        <tbody>
                            <tr><td>PRM / ZRM</td><td id="rep-prm-disp" style="text-align:right;">0</td><td id="rep-prm-wait" style="text-align:right;">0</td><td id="rep-prm-act" style="text-align:right;">0</td><td id="rep-prm-fin" style="text-align:right;">0</td><td style="text-align:right;">00:01:20</td><td style="text-align:right;">00:08:00</td></tr>
                            <tr><td>PSP / OSP</td><td id="rep-psp-disp" style="text-align:right;">0</td><td id="rep-psp-wait" style="text-align:right;">0</td><td id="rep-psp-act" style="text-align:right;">0</td><td id="rep-psp-fin" style="text-align:right;">0</td><td style="text-align:right;">00:01:15</td><td style="text-align:right;">00:08:30</td></tr>
                            <tr><td>Policja</td><td id="rep-pol-disp" style="text-align:right;">0</td><td id="rep-pol-wait" style="text-align:right;">0</td><td id="rep-pol-act" style="text-align:right;">0</td><td id="rep-pol-fin" style="text-align:right;">0</td><td style="text-align:right;">00:01:45</td><td style="text-align:right;">00:08:00</td></tr>
                        </tbody>
                    </table>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px;"><div style="background: #cccccc; padding: 4px 6px; font-weight: bold; border: 1px solid #aaa; margin-bottom: 4px;">STATUSY CPR</div><table class="sis-table" style="background: #fff;"><thead><tr><th>Nazwa</th><th style="width:70px; text-align:right;">Liczba</th></tr></thead><tbody id="rep-cpr-statuses"></tbody></table></div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px;"><div style="background: #cccccc; padding: 4px 6px; font-weight: bold; border: 1px solid #aaa; margin-bottom: 4px;">OPERATORZY</div><table class="sis-table" style="background: #fff;"><thead><tr><th>Nazwa</th><th style="width:70px; text-align:right;">Liczba</th></tr></thead><tbody id="rep-operators"></tbody></table></div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px;"><div style="background: #cccccc; padding: 4px 6px; font-weight: bold; border: 1px solid #aaa; margin-bottom: 4px;">TOP KATEGORIE</div><table class="sis-table" style="background: #fff;"><thead><tr><th>Nazwa</th><th style="width:70px; text-align:right;">Liczba</th></tr></thead><tbody id="rep-top-cats"></tbody></table></div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px;"><div style="background: #cccccc; padding: 4px 6px; font-weight: bold; border: 1px solid #aaa; margin-bottom: 4px;">TOP PODKATEGORIE</div><table class="sis-table" style="background: #fff;"><thead><tr><th>Nazwa</th><th style="width:70px; text-align:right;">Liczba</th></tr></thead><tbody id="rep-top-subcats"></tbody></table></div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px;"><div style="background: #cccccc; padding: 4px 6px; font-weight: bold; border: 1px solid #aaa; margin-bottom: 4px;">POWODY ODMÓW / ANULOWAŃ</div><table class="sis-table" style="background: #fff;"><thead><tr><th>Nazwa</th><th style="width:70px; text-align:right;">Liczba</th></tr></thead><tbody id="rep-refusals-body"></tbody></table></div>
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px;"><div style="background: #cccccc; padding: 4px 6px; font-weight: bold; border: 1px solid #aaa; margin-bottom: 4px;">MIEJSCOWOŚCI / ADRESY</div><table class="sis-table" style="background: #fff;"><thead><tr><th>Nazwa</th><th style="width:70px; text-align:right;">Liczba</th></tr></thead><tbody id="rep-locations-body"></tbody></table></div>
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
    safeSetElementText('rep-range-box', COUNTY_PROFILES[currentCountyId].name);

    let prmDisp = 0, prmWait = 0, prmAct = 0, prmFin = 0;
    let pspDisp = 0, pspWait = 0, pspAct = 0, pspFin = 0;
    let polDisp = 0, polWait = 0, polAct = 0, polFin = 0;
    const catMap = {}, subcatMap = {}, locMap = {};

    events.forEach(ev => {
        const isWaiting = ev.status === 'ACTIVE' && !ev.firstArrived;
        const isOnSite = ev.status === 'ACTIVE' && ev.firstArrived;
        const isDone = ev.status === 'FINISHED';

        if (ev.services && ev.services.prm) { prmDisp++; if (isWaiting) prmWait++; else if (isOnSite) prmAct++; else if (isDone) prmFin++; }
        if (ev.services && ev.services.police) { polDisp++; if (isWaiting) polWait++; else if (isOnSite) polAct++; else if (isDone) polFin++; }
        if (ev.vehicles && ev.vehicles.length > 0) {
            pspDisp += ev.vehicles.length;
            ev.vehicles.forEach(v => {
                if (ev.status === 'FINISHED' && v.phase === 'DONE') pspFin++;
                else if (v.phase === 'PREP' || v.phase === 'TRAVEL') pspWait++;
                else pspAct++;
            });
        }
        const catKey = ev.type || 'P'; catMap[catKey] = (catMap[catKey] || 0) + 1;
        const subKey = ev.subtype || 'Brak podkategorii'; subcatMap[subKey] = (subcatMap[subKey] || 0) + 1;
        const locKey = `${ev.city}${ev.street ? ', ' + ev.street : ''}`; locMap[locKey] = (locMap[locKey] || 0) + 1;
    });

    safeSetElementText('rep-prm-disp', prmDisp); safeSetElementText('rep-prm-wait', prmWait); safeSetElementText('rep-prm-act', prmAct); safeSetElementText('rep-prm-fin', prmFin);
    safeSetElementText('rep-psp-disp', pspDisp); safeSetElementText('rep-psp-wait', pspWait); safeSetElementText('rep-psp-act', pspAct); safeSetElementText('rep-psp-fin', pspFin);
    safeSetElementText('rep-pol-disp', polDisp); safeSetElementText('rep-pol-wait', polWait); safeSetElementText('rep-pol-act', polAct); safeSetElementText('rep-pol-fin', polFin);

    const cprStatBody = document.getElementById('rep-cpr-statuses');
    if (cprStatBody) {
        cprStatBody.innerHTML = (shiftStats.cprTotalGenerated === 0 && total === 0)
            ? `<tr><td colspan="2" style="color:#666;">Brak statusów</td></tr>`
            : `<tr><td>Wygenerowane zgłoszenia 112</td><td style="text-align:right;">${shiftStats.cprTotalGenerated}</td></tr>
               <tr><td>Przyjęte do obsługi (Karty SWD)</td><td style="text-align:right;">${shiftStats.cprAccepted}</td></tr>
               <tr><td>Odrzucone / Zamknięte formatki</td><td style="text-align:right;">${shiftStats.cprRefused}</td></tr>`;
    }

    const opBody = document.getElementById('rep-operators');
    if (opBody) {
        opBody.innerHTML = total === 0
            ? `<tr><td colspan="2" style="color:#666;">Brak danych operatorów</td></tr>`
            : `<tr><td>${getFormattedOperatorName()} (Dyspozytor SKKP)</td><td style="text-align:right;">${total}</td></tr>`;
    }

    const fillTable = (tbodyId, dataObj, emptyLabel) => {
        const el = document.getElementById(tbodyId);
        if (!el) return;
        const entries = Object.entries(dataObj).sort((a, b) => b[1] - a[1]);
        el.innerHTML = entries.length === 0
            ? `<tr><td colspan="2" style="color:#666;">${emptyLabel}</td></tr>`
            : entries.map(([k, v]) => `<tr><td>${k}</td><td style="text-align:right;">${v}</td></tr>`).join('');
    };

    fillTable('rep-top-cats', catMap, 'Brak kategorii');
    fillTable('rep-top-subcats', subcatMap, 'Brak podkategorii');
    fillTable('rep-refusals-body', shiftStats.refusalReasons, 'Brak odmów w wybranym zakresie');
    fillTable('rep-locations-body', locMap, 'Brak danych adresowych');

    const modal = document.getElementById('modal-reports');
    if (modal) modal.style.display = 'flex';
}

function evaluateTacticalForces(ev) {
    const text = ((ev.desc || "") + " " + (ev.subtype || "")).toLowerCase();
    const vehicles = ev.vehicles || [];
    const totalCount = vehicles.length;
    const hasJRG = vehicles.some(v => v.unitName && v.unitName.includes("JRG"));
    const onlyOSP = totalCount > 0 && !hasJRG;
    const hasLadder = vehicles.some(v => /SH-|SD-|SHD-|53|51/.test(v.name + " " + v.id));
    const gcbaCount = vehicles.filter(v => v.name.includes("GCBA")).length;

    if (/hala|hali|magazyn|zakład|produkcyjn|składowisk|tartak/.test(text)) {
        let missing = [];
        if (!hasJRG) missing.push("zastępy gaśnicze z JRG PSP");
        if (gcbaCount < 2) missing.push("co najmniej dwa ciężkie zastępy GCBA");
        if (!hasLadder) missing.push("drabina mechaniczna lub podnośnik (SH/SD)");
        if (totalCount < 4) missing.push(`dodatkowe zastępy gaśnicze (obecnie tylko ${totalCount}, potrzeba min. 4-5)`);
        if (missing.length > 0) return { sufficient: false, reason: `Siły i środki są ZDECYDOWANIE NIEWYSTARCZAJĄCE jak na pożar hali/zakładu! Pilnie potrzebne: ${missing.join(", ")}.` };
    }
    if (/mieszkan|kamienic|balkon|klatce|dach|poddasz|szkoł|urząd|budynk|komin|sadz/.test(text)) {
        let missing = [];
        if (onlyOSP) missing.push("wsparcie z JRG PSP (samo OSP na pożarze budynku mieszkalnego to za mało)");
        if (!hasLadder) missing.push("podnośnik lub drabina mechaniczna (SH/SD)");
        if (totalCount < 3) missing.push(`minimum jeszcze ${3 - totalCount} zastęp(y) GBA/GCBA do pracy w aparatach ODO`);
        if (missing.length > 0) return { sufficient: false, reason: `Siły i środki są NIEWYSTARCZAJĄCE! Na pożar w obiekcie mieszkalnym/budynku konieczne: ${missing.join(", ")}.` };
    }
    if (/las|leśn|traw|stog|stodoł|gospodarcz|rolnicz/.test(text)) {
        let missing = [];
        if (onlyOSP && totalCount < 3) missing.push("wsparcie z JRG PSP oraz sąsiednich OSP");
        if (gcbaCount < 1) missing.push("ciężki samochód gaśniczy GCBA do dowożenia wody");
        if (totalCount < 3) missing.push(`dodatkowe zastępy gaśnicze (obecnie tylko ${totalCount})`);
        if (missing.length > 0) return { sufficient: false, reason: `Siły i środki są NIEWYSTARCZAJĄCE! Prosimy o zadysponowanie: ${missing.join(", ")}.` };
    }
    if (/wypadek|zderzenie|czołow|zakleszcz/.test(text) && (totalCount < 2 || onlyOSP)) {
        return { sufficient: false, reason: `Siły i środki są niewystarczające na wypadek komunikacyjny – potrzebujemy wsparcia zastępu ratownictwa technicznego z JRG PSP oraz ZRM i Policji.` };
    }
    if (/poszukiwan|zaginion/.test(text) && totalCount < 3) {
        return { sufficient: false, reason: `Siły i środki są niewystarczające do przeszukania terenu – prosimy o zadysponowanie dodatkowych zastępów OSP/PSP.` };
    }
    if (totalCount <= 1 && (ev.type === 'P' || onlyOSP) && !/śmietnik|os|szerszeni|konar/.test(text)) {
        return { sufficient: false, reason: `Jeden zastęp na miejscu to za mało ze względów bezpieczeństwa taktycznego – prosimy o zadysponowanie jeszcze jednego zastępu GBA/GCBA.` };
    }
    return { sufficient: true, reason: `Siły i środki zadysponowane na miejsce (${totalCount} zast.) są w tej chwili wystarczające do opanowania sytuacji.` };
}

function generateSmartKdrResponse(kdrCallsign, userQuestion, ev) {
    const q = userQuestion.toLowerCase();
    const desc = (ev.desc || "").toLowerCase();
    const tactical = evaluateTacticalForces(ev);
    const isSmall = /śmietnik|os|szerszeni|konar/.test(desc);
    const hasPrm = /pogotow|zrm|karetk|medyczn/.test(q);
    const hasPol = /policj|patrol/.test(q);
    const hasSis = /dodatkow|siły|środki|srodki|zastęp|podnośnik|drabin|wystarcz/.test(q);

    if (hasSis) return `${currentCountyCallsign}, tu ${kdrCallsign}. ${tactical.reason} Bez odbioru.`;
    if (hasPrm && hasPol) return `${currentCountyCallsign}, tu ${kdrCallsign}. Przyda się u nas zarówno ZRM, jak i patrol Policji do zabezpieczenia miejsca. Bez odbioru.`;
    if (hasPrm) return isSmall ? `${currentCountyCallsign}, tu ${kdrCallsign}. Nie ma osób poszkodowanych, ZRM nie jest potrzebny. Bez odbioru.` : `${currentCountyCallsign}, tu ${kdrCallsign}. Tak, mamy osobę wymagającą przebadania, poproszę ZRM na miejsce. Bez odbioru.`;
    if (hasPol) return `${currentCountyCallsign}, tu ${kdrCallsign}. Tak, przyda się patrol Policji na miejscu. Bez odbioru.`;
    if (/przyjąłem|zrozumiałem/.test(q)) return `${currentCountyCallsign}, tu ${kdrCallsign}. Zrozumiałem, działamy dalej na miejscu. Bez odbioru.`;
    if (!tactical.sufficient) return `${currentCountyCallsign}, tu ${kdrCallsign}. Prowadzimy działania pod adresem ${ev.street || ev.city}, ale ${tactical.reason.charAt(0).toLowerCase() + tactical.reason.slice(1)} Bez odbioru.`;
    return `${currentCountyCallsign}, tu ${kdrCallsign}. Sytuacja na miejscu pod kontrolą, prowadzimy działania pod adresem ${ev.street || ev.city}. Bez odbioru.`;
}

// --- OKNO RADIA ZDARZENIA ---
function createRadioWindow(evId) {
    if (openRadioWindows[evId]) {
        openRadioWindows[evId].style.display = 'block';
        return openRadioWindows[evId];
    }
    const ev = events.find(e => e.id === evId);
    if (!ev) return null;

    const modal = document.createElement('div');
    modal.id = `radio-modal-${evId}`;
    const offset = (Object.keys(openRadioWindows).length * 25) % 150;
    modal.style.cssText = `position:fixed; z-index:1050; width:440px; left:calc(50% - 220px + ${offset}px); top:calc(50% - 210px + ${offset}px);`;

    modal.innerHTML = `
        <div style="background: #c0c0c0; border: 2px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; box-shadow: 2px 2px 5px rgba(0,0,0,0.5); font-family: 'Segoe UI', Tahoma, sans-serif;">
            <div class="radio-win-header" style="background: linear-gradient(90deg, #004080, #1060b0); color: #ffffff; padding: 3px 6px; font-weight: bold; font-size: 13px; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none;">
                <span id="radio-title-${evId}">🖵 Korespondencja Radiowa - ID: ${ev.id} (${ev.city}, ${ev.street || ''})</span>
                <div style="display: flex; gap: 2px;">
                    <button style="background: #c0c0c0; border: 1px solid #fff; width: 18px; height: 16px; font-size: 10px; font-weight: bold; cursor: pointer; padding: 0;" onclick="minimizeRadioWindow(${ev.id})">_</button>
                    <button style="background: #c0c0c0; border: 1px solid #fff; width: 18px; height: 16px; font-size: 10px; font-weight: bold; cursor: pointer; padding: 0;" onclick="closeRadioWindow(${ev.id})">✕</button>
                </div>
            </div>
            <div style="padding: 6px; background: #c0c0c0;">
                <div id="radio-chat-${evId}" style="background: #000000; color: #ffcc00; font-family: 'Courier New', monospace; font-weight: bold; font-size: 12px; height: 195px; padding: 6px; overflow-y: auto; border: 2px solid #808080; box-sizing: border-box; line-height: 1.3;"></div>
                <div style="display: flex; gap: 4px; margin-top: 6px; justify-content: space-between;">
                    <button style="flex: 1; padding: 4px 2px; font-size: 11px; background: #e1e1e1; border: 2px solid #fff; border-right-color: #404040; border-bottom-color: #404040; cursor: pointer; font-weight: bold; color: #000;" onclick="sendRadioReplyDynamic(${ev.id}, 'Przyjąłem.')"><span style="color: green;">✔</span> Przyjąłem</button>
                    <button style="flex: 1; padding: 4px 2px; font-size: 11px; background: #e1e1e1; border: 2px solid #fff; border-right-color: #404040; border-bottom-color: #404040; cursor: pointer; font-weight: bold; color: #000;" onclick="sendRadioReplyDynamic(${ev.id}, currentCountyCallsign + ', czy na miejscu wymagany jest zespół ZRM?')"><span style="color: red;">🚑</span> Wymagany ZRM?</button>
                    <button style="flex: 1; padding: 4px 2px; font-size: 11px; background: #e1e1e1; border: 2px solid #fff; border-right-color: #404040; border-bottom-color: #404040; cursor: pointer; font-weight: bold; color: #000;" onclick="sendRadioReplyDynamic(${ev.id}, currentCountyCallsign + ', czy potrzebny jest patrol Policji?')"><span style="color: blue;">🚔</span> Potrzebna Policja?</button>
                    <button style="flex: 1; padding: 4px 2px; font-size: 11px; background: #e1e1e1; border: 2px solid #fff; border-right-color: #404040; border-bottom-color: #404040; cursor: pointer; font-weight: bold; color: #000;" onclick="sendRadioReplyDynamic(${ev.id}, currentCountyCallsign + ', czy potrzebne są dodatkowe siły i środki?')"><span style="color: darkred;">🚒</span> Dodatkowe SiS?</button>
                </div>
                <div style="display: flex; gap: 4px; margin-top: 6px; align-items: center;">
                    <input type="text" id="inp-radio-reply-${ev.id}" placeholder="Wpisz treść wiadomości radiowej..." style="flex: 1; padding: 5px 8px; font-size: 12px; background: #ffffff; border: 2px solid #808080; outline: none;" onkeypress="if(event.key==='Enter') sendCustomInputRadio(${ev.id})">
                    <button style="padding: 5px 12px; font-size: 11px; background: #e1e1e1; border: 2px solid #fff; border-right-color: #404040; border-bottom-color: #404040; cursor: pointer; font-weight: bold;" onclick="sendCustomInputRadio(${ev.id})">Nadaj</button>
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
    if (chat) { chat.innerHTML = (ev.radioLogs || []).join(''); chat.scrollTop = chat.scrollHeight; }
}

function closeRadioWindow(evId) {
    if (openRadioWindows[evId]) { openRadioWindows[evId].remove(); delete openRadioWindows[evId]; }
}

function minimizeRadioWindow(evId) {
    if (openRadioWindows[evId]) {
        openRadioWindows[evId].style.display = 'none';
        const bar = document.getElementById('minimized-bar');
        if (bar) {
            const item = document.createElement('div');
            item.className = 'minimized-item'; item.id = `min-radio-${evId}`;
            item.innerHTML = `📻 Radio (ID: ${evId})`;
            item.onclick = () => { if (openRadioWindows[evId]) openRadioWindows[evId].style.display = 'block'; item.remove(); };
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
    if (!input || !input.value.trim()) return;
    const val = input.value.trim();
    input.value = '';
    sendRadioReplyDynamic(evId, val);
}

function getCommandRank(vehicle) {
    const uName = (vehicle.unitName || "").toUpperCase();
    const vId = (vehicle.id || "").toUpperCase();
    if (uName.includes("KP PSP") || uName.includes("KM PSP")) return 4.0;
    if (uName.includes("JRG")) {
        if (vId.includes("90")) return 3.3;
        if (vId.includes("21")) return 3.2;
        if (vId.includes("25")) return 3.1;
        return 3.0;
    }
    if (uName.includes("KSRG")) return 2.0;
    return 1.0;
}

async function triggerArrivalRadioReport(ev, vehicle) {
    if (!ev.radioLogs) ev.radioLogs = [];
    if (ev.type === 'PZR') return;

    createRadioWindow(ev.id);
    const newRank = getCommandRank(vehicle);
    const prevRank = ev.kdrRank || 0;
    let takeoverText = "";

    if (!ev.kdrVehicleId) {
        ev.kdrVehicleId = vehicle.id; ev.kdrUnitName = vehicle.unitName; ev.kdrRank = newRank;
    } else if (newRank > prevRank) {
        takeoverText = ` Dowodzenie na miejscu zdarzenia przejmuje przybyły zastęp ${vehicle.id} (${vehicle.unitName}).`;
        ev.kdrVehicleId = vehicle.id; ev.kdrUnitName = vehicle.unitName; ev.kdrRank = newRank;
    }

    const vehiclesListStr = ev.vehicles.map(v => `${v.id} (${v.unitName})`).join(', ');
    const sysPrompt = `Jesteś dowódcą zastępu straży pożarnej (${vehicle.id} z jednostki ${vehicle.unitName}). Dojechałeś na miejsce w miejscowości ${ev.city}, adres: ${ev.street || ''}.
Zdarzenie: "${ev.desc}". Zadysponowane siły: ${vehiclesListStr}.
KOMUNIKAT O PRZEJĘCIU DOWODZENIA: ${takeoverText || 'Brak zmiany KDR.'}
Rozpocznij od: "${currentCountyCallsign}, tu ${vehicle.id}." Zakończ: "Bez odbioru."`;

    let reportText = "";
    try {
        reportText = await callUniversalAI(sysPrompt, "Podaj meldunek z dojazdu i informację o dowodzeniu.", false);
        reportText = reportText.replace(/^["']|["']$/g, '');
    } catch (e) {}

    if (!reportText) {
        reportText = takeoverText
            ? `${currentCountyCallsign}, tu ${vehicle.id}. Dotarliśmy na miejsce (${ev.city}).${takeoverText} Prowadzimy działania. Bez odbioru.`
            : `${currentCountyCallsign}, tu ${vehicle.id}. Jesteśmy na miejscu (${ev.city}, ${ev.street || ''}) – potwierdzam dojazd, prowadzimy działania. Bez odbioru.`;
    }

    audioMotorola.currentTime = 0; audioMotorola.play().catch(() => {});
    const timeStr = new Date().toLocaleTimeString();
    ev.radioLogs.push(`<div style="margin-bottom: 6px; color: #ffcc00;">[${timeStr}] ${vehicle.id} ➔ ${currentCountyCallsign}:<br>"${reportText}"</div>`);
    updateRadioChatDynamic(ev.id);
    saveSimulationState();

    if (takeoverText) {
        logToMainRadio(`${vehicle.id} ➔ SKKP`, `Przejęcie dowodzenia na zdarzeniu ID ${ev.id} (${ev.city}):${takeoverText}`, '#ffaa00', false);
    }
}

async function sendRadioReplyDynamic(evId, text) {
    if (!text) return;
    const ev = events.find(e => e.id === evId);
    if (!ev) return;

    audioMotorola.currentTime = 0; audioMotorola.play().catch(() => {});
    const kdrName = ev.kdrVehicleId || (ev.vehicles[0] ? ev.vehicles[0].id : 'KDR');
    const timeStr = new Date().toLocaleTimeString();
    if (!ev.radioLogs) ev.radioLogs = [];
    ev.radioLogs.push(`<div style="margin-bottom: 6px; color: #00ff00;">[${timeStr}] ${currentCountyCallsign} ➔ ${kdrName}:<br>"${text}"</div>`);

    const chatBox = document.getElementById(`radio-chat-${evId}`);
    if (chatBox) {
        chatBox.innerHTML = ev.radioLogs.join('') + `<div id="ai-typing-${evId}" style="color:#aaa; font-style:italic; padding:2px;">⏳ ${kdrName} nadaje...</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    const qLower = text.toLowerCase();
    const tactical = evaluateTacticalForces(ev);
    const asksForSis = /siły|środki|srodki|dodatkow|zastęp|potrzeb|wystarcz/.test(qLower);

    let aiReply = "";
    if (asksForSis && !tactical.sufficient) {
        aiReply = `${currentCountyCallsign}, tu ${kdrName}. ${tactical.reason} Bez odbioru.`;
    } else {
        const vehiclesListStr = ev.vehicles.map(v => `${v.id} (${v.unitName} - ${v.name})`).join(', ');
        const systemPrompt = `Jesteś dowódcą akcji straży pożarnej (${kdrName}) na miejscu w miejscowości ${ev.city}, adres: ${ev.street || ''}.
Opis zdarzenia: "${ev.desc}". Zadysponowane wozy: ${vehiclesListStr}.
OCENA TAKTYCZNA SIŁ I ŚRODKÓW: ${tactical.reason}
Dyspozytor (${currentCountyCallsign}) mówi do Ciebie przez radio: "${text}".
Format: "${currentCountyCallsign}, tu ${kdrName}. [Krótka, konkretna odpowiedź]. Bez odbioru."`;
        try {
            aiReply = await callUniversalAI(systemPrompt, text, false);
            aiReply = aiReply.replace(/^["']|["']$/g, '');
        } catch (err) {}
        if (!aiReply) aiReply = generateSmartKdrResponse(kdrName, text, ev);
    }

    audioMotorola.currentTime = 0; audioMotorola.play().catch(() => {});
    ev.radioLogs.push(`<div style="margin-bottom: 6px; color: #ffcc00;">[${new Date().toLocaleTimeString()}] ${kdrName} ➔ ${currentCountyCallsign}:<br>"${aiReply}"</div>`);
    updateRadioChatDynamic(evId);
    saveSimulationState();
}

function safeSetElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

// --- BAZA IMION I NAZWISK ZGŁASZAJĄCYCH ---
const callersMaleFirst = ["Jan", "Piotr", "Tomasz", "Michał", "Krzysztof", "Andrzej", "Paweł", "Marek", "Adam", "Łukasz", "Marcin", "Jakub", "Mateusz", "Wojciech", "Henryk", "Dawid", "Szymon", "Kamil", "Robert", "Rafał", "Jacek", "Grzegorz", "Dariusz", "Mariusz", "Zbigniew", "Sławomir", "Jarosław", "Mirosław", "Ryszard", "Tadeusz", "Artur", "Sebastian", "Patryk", "Damian", "Przemysław", "Maciej", "Bartosz", "Dominik", "Karol", "Filip", "Hubert", "Kacper", "Mikołaj", "Błażej", "Cezary", "Leszek", "Waldemar", "Roman", "Kazimierz", "Wiesław"];
const callersMaleLast = ["Kowalski", "Nowak", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński", "Szymański", "Woźniak", "Dąbrowski", "Kozłowski", "Jankowski", "Mazur", "Kwiatkowski", "Wojciechowski", "Krawczyk", "Kaczmarek", "Piotrowski", "Grabowski", "Zając", "Pawłowski", "Michalski", "Król", "Wieczorek", "Jabłoński", "Wróbel", "Nowakowski", "Majewski", "Olszewski", "Stępień", "Malinowski", "Jaworski", "Adamczyk", "Dudek", "Nowicki", "Pawlak", "Górski", "Witkowski", "Walczak", "Sikora", "Baran", "Rutkowski", "Michalak", "Szewczyk", "Ostrowski", "Tomaszewski", "Pietrzak", "Zalewski", "Wróblewski", "Kreft", "Formela", "Kwidziński", "Labuda", "Hirsz", "Damps", "Treder", "Gaffke", "Kunkel", "Rohde", "Bistram", "Bojke", "Ceynowa", "Dettlaff", "Gruba", "Kohnke", "Liedtke", "Miotk", "Płotka", "Richert"];
const callersFemaleFirst = ["Anna", "Katarzyna", "Magdalena", "Agnieszka", "Małgorzata", "Krystyna", "Barbara", "Ewa", "Elżbieta", "Zofia", "Teresa", "Joanna", "Monika", "Danuta", "Natalia", "Karolina", "Marta", "Beata", "Dorota", "Halina", "Jadwiga", "Aleksandra", "Irena", "Alicja", "Paulina", "Justyna", "Renata", "Bożena", "Urszula", "Weronika", "Sylwia", "Agata", "Patrycja", "Izabela", "Aneta", "Emilia", "Ewelina", "Kinga", "Martyna", "Klaudia", "Dominika", "Julia", "Zuzanna", "Maja", "Hanna", "Oliwia", "Wiktoria", "Kamila", "Edyta", "Marzena"];
const callersFemaleLast = ["Kowalska", "Nowak", "Wiśniewska", "Wójcik", "Kowalczyk", "Kamińska", "Lewandowska", "Zielińska", "Szymańska", "Woźniak", "Dąbrowska", "Kozłowska", "Jankowska", "Mazur", "Kwiatkowska", "Wojciechowska", "Krawczyk", "Kaczmarek", "Piotrowska", "Grabowska", "Zając", "Pawłowska", "Michalska", "Król", "Wieczorek", "Jabłońska", "Wróbel", "Nowakowska", "Majewska", "Olszewska", "Stępień", "Malinowska", "Jaworska", "Adamczyk", "Dudek", "Nowicka", "Pawlak", "Górska", "Witkowska", "Walczak", "Sikora", "Baran", "Rutkowska", "Michalak", "Szewczyk", "Ostrowska", "Tomaszewska", "Pietrzak", "Zalewska", "Wróblewska", "Kreft", "Formela", "Kwidzińska", "Labuda", "Hirsz", "Damps", "Treder", "Gaffke", "Kunkel", "Rohde", "Bistram", "Bojke", "Ceynowa", "Dettlaff", "Gruba", "Kohnke", "Liedtke", "Miotk", "Płotka", "Richert"];

function generateRandomPolishCaller() {
    const isFemale = Math.random() < 0.48;
    const first = isFemale ? callersFemaleFirst[Math.floor(Math.random() * callersFemaleFirst.length)] : callersMaleFirst[Math.floor(Math.random() * callersMaleFirst.length)];
    const last = isFemale ? callersFemaleLast[Math.floor(Math.random() * callersFemaleLast.length)] : callersMaleLast[Math.floor(Math.random() * callersMaleLast.length)];
    const prefixes = ["50", "51", "53", "57", "60", "66", "69", "72", "78", "79", "88"];
    const numStr = `${prefixes[Math.floor(Math.random() * prefixes.length)]}${Math.floor(Math.random() * 9000000 + 1000000)}`;
    return `${first} ${last} (tel. ${numStr.slice(0, 3)}-${numStr.slice(3, 6)}-${numStr.slice(6, 9)})`;
}

// --- DYNAMICZNE GENEROWANIE ZGŁOSZEŃ Z CPR PRZEZ AI ---
async function simulateIncomingCPR() {
    audioCpr.currentTime = 0; audioCpr.play().catch(() => {});
    shiftStats.cprTotalGenerated++;
    saveSimulationState();

    const newCprId = `WCPR-2026-${cprCounter++}`;
    const randomTown = townsList[Math.floor(Math.random() * townsList.length)];
    const chosenType = Math.random() < 0.5 ? "P" : "MZ";

    const townStreets = realStreetsByTown[randomTown] || ["ul. Długa", "ul. Szkolna"];
    const baseStreet = townStreets[Math.floor(Math.random() * townStreets.length)];
    const houseNum = Math.floor(Math.random() * 25) + 1;
    const verifiedStreetAddress = `${baseStreet} ${houseNum}`;

    safeSetElementText('cpr-id', newCprId);
    safeSetElementText('cpr-city', randomTown);
    safeSetElementText('cpr-street', verifiedStreetAddress);
    safeSetElementText('cpr-caller', "Łączenie z operatorem 112...");
    safeSetElementText('cpr-desc', "🤖 AI generuje unikalną treść formatki ze zgłoszenia...");
    
    const cprModal = document.getElementById('cpr-modal');
    if (cprModal) cprModal.style.display = 'flex';

    let generatedDesc = "";
    try {
        const aiPrompt = `Wygeneruj krótką, w 100% realistyczną i unikalną treść zgłoszenia od świadka dla operatora numeru 112 w Polsce.
Typ zdarzenia: ${chosenType === 'P' ? 'Pożar' : 'Zagrożenie miejscowe / Wypadek / Awaria'}, miejscowość: ${randomTown}, adres: ${verifiedStreetAddress}.
Zwróć TYLKO treść powiadomienia po polsku, bez cudzysłowów, maksymalnie 12 słów.`;
        generatedDesc = await callUniversalAI("Jesteś operatorem CPR (112), zapisujesz zgłoszenia od obywateli w systemie.", aiPrompt, false);
        generatedDesc = generatedDesc.replace(/^["']|["']$/g, '').trim();
    } catch (e) {}

    if (!generatedDesc) {
        const phrasesP = [
            "Pali się sadza w kominie, z komina lecą iskry na dach", "Mieszkaniec zgłasza gęsty czarny dym z budynku gospodarczego",
            "Widzę płomienie wydostające się przez dach pustostanu", "Właściciel zgłasza pożar trawy i suchego ścierniska blisko lasu",
            "Pożar samochodu osobowego na poboczu drogi, ogień pod maską", "Pali się altana śmietnikowa przy budynku mieszkalnym",
            "Gęsty dym wydostający się spod dachu warsztatu stolarskiego", "Pożar komory silnika w autobusie komunikacji miejskiej",
            "Widoczne płomienie w oknie na poddaszu budynku mieszkalnego", "Pali się sterta opon na terenie prywatnej posesji",
            "Zgłoszenie pożaru skrzynki elektrycznej na elewacji budynku", "Pożar sadzy w przewodzie kominowym starej kamienicy",
            "Pali się składowisko palet przy magazynie handlowym", "Ogień i silne zadymienie na balkonie na trzecim piętrze bloku",
            "Pali się traktor podczas prac polowych na ściernisku", "Pożar kotłowni w budynku jednorodzinnym, dym na klatce",
            "Pali się poszycie leśne na powierzchni około 10 arów", "Płonie śmietnik kontenerowy w bliskim sąsiedztwie parkingu",
            "Pożar instalacji fotowoltaicznej na dachu domu jednorodzinnego", "Zgłoszenie zadymienia na klatce schodowej w bloku 4-piętrowym"
        ];
        const phrasesMZ = [
            "Samochód uderzył w przydrożne drzewo, kierowca zakleszczony", "Silny wiatr zerwał połowę dachu z budynku mieszkalnego",
            "Podejrzenie silnego wycieku gazu z instalacji w piwnicy", "Duże drzewo całkowicie zablokowało pas ruchu na drodze",
            "Zderzenie czołowe dwóch aut, wyciek płynów na jezdnię", "Konar drzewa zerwał linie energetyczne nad drogą",
            "Kierowca uderzył w słup oświetleniowy, auto zablokowało przejazd", "Plama oleju napędowego na skrzyżowaniu na długości 200 metrów",
            "Zalana piwnica w budynku jednorodzinnym na wysokość 50 cm", "Osoba uwięziona w uszkodzonej windzie między piętrami",
            "Podejrzenie tlenku węgla w łazience, lokator z zawrotami głowy", "Usuwanie gniazda szerszeni przy wejściu do przedszkola",
            "Zderzenie auta osobowego z motocyklem, wyciek paliwa", "Zerwana blacha z dachu zwisa niebezpiecznie nad chodnikiem",
            "Samochód wpadł do głębokiego rowu melioracyjnego", "Zablokowane drzwi do mieszkania, w środku starsza osoba nie odpowiada",
            "Zderzenie trzech samochodów osobowych na skrzyżowaniu", "Pomoc ZRM w zniesieniu ciężkiego pacjenta z 4. piętra",
            "Zabezpieczenie miejsca lądowania dla śmigłowca LPR", "Uszkodzona skrzynka gazowa przy posesji po kolizji auta"
        ];
        const arr = chosenType === 'P' ? phrasesP : phrasesMZ;
        generatedDesc = arr[Math.floor(Math.random() * arr.length)];
    }

    const finalCaller = generateRandomPolishCaller();
    currentCPRData = { id: newCprId, city: randomTown, street: verifiedStreetAddress, type: chosenType, subtype: generatedDesc, desc: generatedDesc, caller: finalCaller };

    resolveExactCoordinates(verifiedStreetAddress, randomTown).then(coords => {
        if (coords && currentCPRData && currentCPRData.id === newCprId) { currentCPRData.lat = coords.lat; currentCPRData.lng = coords.lng; }
    });

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
        saveSimulationState();
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
        item.innerHTML = `🚨 Zgłoszenie CPR (${currentCPRData.city}, ${currentCPRData.street})`;
        item.onclick = () => { const m = document.getElementById('cpr-modal'); if(m) m.style.display = 'flex'; item.remove(); };
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

    const radioP = document.querySelector('input[name="ev-type"][value="P"]');
    if (radioP) radioP.checked = true;
    updateSubtypes('P');

    const rawCaller = currentCPRData.caller || "";
    const namePart = rawCaller.split(' (tel.')[0] || "";
    const phoneMatch = rawCaller.match(/tel\.\s*([0-9\-]+)/);
    const callerParts = namePart.trim().split(' ');
    const lastNameVal = callerParts.length > 1 ? callerParts.pop() : '';
    const firstNameVal = callerParts.join(' ');

    const nameInp = document.getElementById('inp-caller-name');
    const surInp = document.getElementById('inp-caller-surname');
    const phoneInp = document.getElementById('inp-caller-phone');
    if(nameInp) nameInp.value = firstNameVal;
    if(surInp) surInp.value = lastNameVal;
    if(phoneInp && phoneMatch) phoneInp.value = phoneMatch[1];

    closeCPR(true);
    currentCPRData = null;
    saveSimulationState();
}

function formatMMSS(sec) {
    if (sec < 0) return "Zabezpieczenie rejonu (PZR)";
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s} min`;
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
    const exactAddr = unitExactLocations[unit.name]?.address || "";
    const unitHasPzr = unit.vehicles.some(v => v.status === 'yellow' || getActivePzrForVehicle(v.id) !== null);

    let vehiclesHTML = unit.vehicles.length === 0 ? `<div style="padding: 4px; color: #888; font-style: italic;">Brak pojazdów</div>` :
        unit.vehicles.map(v => {
            const pzrEv = getActivePzrForVehicle(v.id);
            const isYellowRow = v.status === 'yellow' || pzrEv !== null;
            const pzrBadge = pzrEv ? ` <span style="background:#f1c40f; color:#000; padding:0 4px; border-radius:2px; font-weight:bold; font-size:9px;">PZR (${pzrEv.city})</span>` : '';
            return `
                <div class="vehicle-row ${isYellowRow ? 'pzr-active' : ''}">
                    <span class="status-dot ${v.status}"></span>
                    <span style="color:#000000;"><b>${v.id}</b> - ${v.name}${pzrBadge}</span>
                </div>
            `;
        }).join('');

    return `
        <div class="unit-box ${unitHasPzr ? 'unit-on-pzr' : ''}">
            <div class="unit-header ${unitHasPzr ? 'header-on-pzr' : ''}" style="color:#000000; font-weight:bold;" title="Adres: ${exactAddr}">
                ${unit.name} ${unitHasPzr ? '🛡️ [PZR]' : ''}
            </div>
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
        if (ev.status === 'ACTIVE' && ev.type === 'PZR' && selectedEvIdForRadio !== ev.id) tr.style.color = '#ffff00';
        tr.ondblclick = () => openEditEventModal(ev.id);
        tr.onclick = () => selectEvent(ev.id);

        let timeDisplay = "";
        if (ev.status === 'FINISHED') {
            const anyReturning = ev.vehicles.some(v => v.phase === 'RETURN' && v.returnTime > 0);
            timeDisplay = anyReturning ? "Powrót SiS..." : "0:00 min (Zakończono)";
        } else if (ev.type === 'PZR') {
            timeDisplay = !ev.firstArrived ? "Dojazd na PZR..." : "Zabezpieczenie rejonu (Aktywne)";
        } else if (!ev.firstArrived) {
            timeDisplay = `W drodze na miejsce... (Czas akcji: ${formatMMSS(ev.remainingSeconds)})`;
        } else {
            timeDisplay = `Działania: ${formatMMSS(ev.remainingSeconds)}`;
        }

        const fullPlace = ev.street ? `${ev.city}, ${ev.street}` : ev.city;
        const rowColorStyle = (ev.status === 'ACTIVE' && ev.type === 'PZR' && selectedEvIdForRadio !== ev.id) ? 'style="color:#ffd700;"' : '';

        tr.innerHTML = `
            <td ${rowColorStyle}>${ev.id}/???/2026</td>
            <td ${rowColorStyle}>${ev.time}</td>
            <td ${rowColorStyle}>${ev.jrg}</td>
            <td ${rowColorStyle}>${ev.jrg}</td>
            <td ${rowColorStyle} title="Kliknij pinezkę, aby przybliżyć adres na mapie">${fullPlace} <span style="cursor:pointer;" onclick="event.stopPropagation(); focusEventOnMap(${ev.id});" title="Pokaż dokładny adres na mapie">📍</span></td>
            <td ${rowColorStyle}>${ev.vehicles.length}</td>
            <td ${rowColorStyle}>${ev.type}</td>
            <td ${rowColorStyle}>${ev.desc || (ev.type === 'PZR' ? 'Przekazanie na zabezpieczenie rejonu' : '')}</td>
            <td ${rowColorStyle}><b>${timeDisplay}</b></td>
            <td ${rowColorStyle}>???-0000${ev.id}</td>
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
        let statusText = "";
        if (v.phase === 'PREP') statusText = `<span style="color: #d35400; font-weight: bold;">Alarmowanie / Wyjazd za ${v.prepTime}s</span>`;
        else if (v.phase === 'TRAVEL') statusText = `<span style="color: #b36b00; font-weight: bold;">W drodze (${formatMMSS(v.travelTime)})</span>`;
        else if (v.phase === 'ONSITE') {
            statusText = ev.type === 'PZR'
                ? `<span style="color: #b38600; background:#fff8c4; padding:1px 4px; font-weight: bold;">Na zabezpieczeniu rejonu (PZR)</span>`
                : `<span style="color: #b30000; font-weight: bold;">Na miejscu działań</span>`;
        } else if (v.phase === 'RETURN') {
            const pzrEv = getActivePzrForVehicle(v.id);
            const destLabel = (pzrEv && ev.type !== 'PZR') ? `Powrót na PZR ${pzrEv.city}` : `Powrót do bazy`;
            statusText = `<span style="color: #004080; font-weight: bold;">${destLabel} (${formatMMSS(v.returnTime)})</span>`;
        } else {
            const pzrEv = getActivePzrForVehicle(v.id);
            statusText = pzrEv
                ? `<span style="color: #b38600; background:#fff8c4; padding:1px 4px; font-weight: bold;">Na PZR (${pzrEv.city})</span>`
                : `<span style="color: #155724; font-weight: bold;">W bazie (Wolny)</span>`;
        }
        return `
            <tr style="color:#000000; ${ev.type === 'PZR' ? 'background:#fffdf0;' : ''}">
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
    if(detailsTitle) detailsTitle.innerText = `ID: ${ev.id} - ${ev.city}${ev.street ? ', ' + ev.street : ''}`;
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

    const matches = Object.keys(locationsDatabase).filter(c => c.toLowerCase().includes(val));
    if (matches.length > 0) {
        matches.forEach(c => {
            const div = document.createElement('div');
            div.className = 'suggestion-item'; div.innerText = c;
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
    updateJrgSelectOptions();
    
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
    if(cityEl) { cityEl.value = ''; cityEl.placeholder = `Wpisz np. ${COUNTY_PROFILES[currentCountyId].defaultTown}...`; }
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
    updateJrgSelectOptions();

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
    if (btnPrm) { if (servicesState.prm) btnPrm.classList.add('active'); else btnPrm.classList.remove('active'); }
    if (btnPol) { if (servicesState.police) btnPol.classList.add('active'); else btnPol.classList.remove('active'); }

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
        const exactAddr = unitExactLocations[u.name]?.address || "";
        const isPSP = u.name.includes("JRG") || u.name.includes("KP PSP") || u.name.includes("KM PSP");
        const prepRange = isPSP ? "Wyjazd: 1-5s" : "Wyjazd: 1-10s";
        const groupDiv = document.createElement('div');
        groupDiv.className = 'dispatch-unit-group';

        groupDiv.innerHTML = `
            <div class="dispatch-unit-header ${isClosest ? 'closest' : ''}" title="${exactAddr}">
                <span>${index + 1}. ${u.name} <small style="font-weight:normal; color:#333;">(${exactAddr})</small> ${isClosest ? '⭐' : ''}</span>
                <span>${u.km} | Jazda: ~${formatMMSS(u.sec)} (${prepRange})</span>
            </div>
            ${u.vehicles.map(v => {
                const pzrEv = getActivePzrForVehicle(v.id);
                const pzrLabel = pzrEv ? `<span style="margin-left:auto; background:#f1c40f; color:#000; padding:1px 5px; border-radius:2px; font-weight:bold; font-size:10px;">🛡️ PZR (${pzrEv.city})</span>` : '';
                return `
                    <label class="dispatch-vehicle-item" style="cursor:pointer; color:#000000; ${pzrEv ? 'background:#fff8c4;' : ''}">
                        <input type="checkbox" value="${v.id}" ${selectedVehicles.some(sv => sv.id === v.id) ? 'checked' : ''}>
                        <span class="status-dot ${v.status}"></span>
                        <span><b>${v.id}</b> - ${v.name}</span>
                        ${pzrLabel}
                    </label>
                `;
            }).join('')}
        `;
        container.appendChild(groupDiv);
    });

    if(modalDisp) modalDisp.style.display = 'flex';
}

function confirmDispatch() {
    const checkboxes = document.querySelectorAll('#dispatch-list input:checked');
    const cityInput = document.getElementById('inp-ev-city');
    const defTown = COUNTY_PROFILES[currentCountyId].defaultTown;
    const targetCity = (cityInput && cityInput.value.trim()) ? cityInput.value.trim() : defTown;
    const newSelection = [];

    checkboxes.forEach(cb => {
        const existing = selectedVehicles.find(sv => sv.id === cb.value);
        if (existing) {
            newSelection.push(existing);
        } else {
            [...unitsPSP, ...unitsOSP].forEach(u => {
                const v = u.vehicles.find(veh => veh.id === cb.value);
                if (v) {
                    const pzrEv = getActivePzrForVehicle(v.id);
                    const prepSec = pzrEv ? (Math.floor(Math.random() * 5) + 1) : generateDeparturePrepSeconds(u.name);
                    const routeSec = calculateRouteTravelSeconds(u.name, targetCity);
                    newSelection.push({
                        ...v, unitName: u.name, phase: 'PREP', prepTime: prepSec,
                        travelTime: routeSec, baseRouteSeconds: routeSec, returnTime: routeSec
                    });
                }
            });
        }
    });

    selectedVehicles = newSelection;
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
    const subtypeVal = typeVal === 'PZR' ? 'Zabezpieczenie rejonu' : (subSel && subSel.value ? subSel.value : 'Zgłoszenie operacyjne');
    
    const descInput = document.getElementById('inp-ev-desc');
    let descVal = descInput ? descInput.value : '';
    descVal = descVal.replace(/^(P|MZ|AF|CW|WG|BL|ZPR)\s*-\s*/i, "").trim();
    if (typeVal === 'PZR' && !descVal) descVal = `Przekazanie na zabezpieczenie rejonu operacyjnego (${city})`;

    const streetInput = document.getElementById('inp-ev-street');
    const streetVal = streetInput ? streetInput.value.trim() : '';

    selectedVehicles.forEach(sv => {
        if (!sv.phase) {
            sv.phase = 'PREP';
            sv.prepTime = generateDeparturePrepSeconds(sv.unitName);
            const routeSec = calculateRouteTravelSeconds(sv.unitName, city);
            sv.travelTime = routeSec; sv.baseRouteSeconds = routeSec; sv.returnTime = routeSec;
        }
    });

    let targetEventObj = null;

    if (activeEditingId === null) {
        let countedOspNames = [];
        selectedVehicles.forEach(sv => {
            if (!sv.unitName.includes("JRG") && !sv.unitName.includes("KP PSP") && !sv.unitName.includes("KM PSP") && !countedOspNames.includes(sv.unitName)) {
                countedOspNames.push(sv.unitName);
            }
        });
        playOspAlarmRepeated(countedOspNames.length);

        const timeInput = document.getElementById('inp-ev-time');
        const regInput = document.getElementById('inp-ev-region');
        const jrgInput = document.getElementById('inp-ev-jrg');
        const fallback = gpsCoords[city] || COUNTY_PROFILES[currentCountyId].mapCenter;
        const calcDuration = calculateActionDurationSeconds(descVal, subtypeVal, typeVal);

        const newEv = {
            id: events.length + 1,
            time: timeInput && timeInput.value ? timeInput.value : new Date().toLocaleTimeString(),
            city: city,
            region: regInput ? regInput.value : (locationsDatabase[city] || ''),
            street: streetVal,
            lat: fallback[0], lng: fallback[1],
            desc: descVal, type: typeVal, subtype: subtypeVal,
            remainingSeconds: calcDuration, firstArrived: false, radioReported: false, radioLogs: [],
            jrg: jrgInput ? jrgInput.value : COUNTY_PROFILES[currentCountyId].jrgList[0],
            services: { ...servicesState },
            vehicles: [...selectedVehicles],
            status: 'ACTIVE'
        };
        events.push(newEv);
        targetEventObj = newEv;
        selectEvent(newEv.id);
    } else {
        const ev = events.find(e => e.id === activeEditingId);
        if (ev) {
            ev.city = city; ev.street = streetVal; ev.desc = descVal; ev.type = typeVal;
            ev.subtype = subtypeVal; ev.services = { ...servicesState }; ev.vehicles = [...selectedVehicles];
            targetEventObj = ev;
        }
    }

    selectedVehicles.forEach(sv => {
        [...unitsPSP, ...unitsOSP].forEach(u => {
            const v = u.vehicles.find(veh => veh.id === sv.id);
            if (v) {
                if (typeVal === 'PZR') v.status = 'yellow';
                else if (v.status === 'green' || v.status === 'yellow') v.status = 'orange';
            }
        });
    });

    if (targetEventObj) geocodeEventAddress(targetEventObj);
    renderUnits(); renderEvents(); saveSimulationState(); closeModal('modal-event');
}

function triggerEventFinishAndReturn(ev) {
    if (!ev || ev.status === 'FINISHED') return;
    ev.status = 'FINISHED';
    ev.remainingSeconds = 0;

    ev.vehicles.forEach(sv => {
        const activePzr = (ev.type !== 'PZR') ? getActivePzrForVehicle(sv.id) : null;

        if (sv.phase === 'ONSITE' || sv.phase === 'TRAVEL') {
            sv.phase = 'RETURN';
            sv.returnTime = sv.baseRouteSeconds || calculateRouteTravelSeconds(sv.unitName, ev.city);
            const approxMin = Math.max(1, Math.round(sv.returnTime / 60));

            [...unitsPSP, ...unitsOSP].forEach(u => {
                const veh = u.vehicles.find(vObj => vObj.id === sv.id);
                if (veh) veh.status = 'orange';
            });

            if (activePzr) {
                logToMainRadio(
                    `${sv.id} ➔ ${currentCountyCallsign}`,
                    `${currentCountyCallsign}, tu ${sv.id}. Zakończyliśmy działania w miejscowości ${ev.city}${ev.street ? ' (' + ev.street + ')' : ''}, wracamy z powrotem na zabezpieczenie rejonu (${activePzr.city}). Bez odbioru.`,
                    '#ffd700', true
                );
            } else {
                logToMainRadio(
                    `${sv.id} ➔ ${currentCountyCallsign}`,
                    `${currentCountyCallsign}, tu ${sv.id}. Zakończyliśmy działania w miejscowości ${ev.city}${ev.street ? ' (' + ev.street + ')' : ''}, wracamy do koszar (czas powrotu ok. ${approxMin} min). Bez odbioru.`,
                    '#ffcc00', true
                );
            }
        } else if (sv.phase === 'PREP') {
            sv.phase = 'DONE';
            sv.returnTime = 0;
            [...unitsPSP, ...unitsOSP].forEach(u => {
                const veh = u.vehicles.find(vObj => vObj.id === sv.id);
                if (veh) veh.status = activePzr ? 'yellow' : 'green';
            });
            logToMainRadio(
                `${currentCountyCallsign} ➔ ${sv.id}`,
                `${sv.id}, odwołuję alarm dla waszego zastępu, ${activePzr ? 'pozostańcie na zabezpieczeniu rejonu' : 'pozostańcie w koszarach'}.`,
                '#00ffff', false
            );
        }
    });
    saveSimulationState();
}

function finishCurrentEvent() {
    const targetId = activeEditingId !== null ? activeEditingId : selectedEvIdForRadio;
    if (targetId === null) return;
    const ev = events.find(e => e.id === targetId);
    if (ev) triggerEventFinishAndReturn(ev);
    renderUnits(); renderEvents(); closeModal('modal-event');
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
    ensureSiSModalExists(); renderSiSManagerList();
    const modal = document.getElementById('modal-sis');
    if(modal) modal.style.display = 'flex'; 
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'none'; 
}

// --- GENERATOR KOMUNIKATU WYJAZDU NA GŁÓWNYM RADIU (10% SZANS NA ADRES + 4 PROSTE WARIANTY) ---
function buildDepartureRadioMessage(vehicle, ev) {
    if (ev.type === 'PZR') return `${vehicle.id} zgłaszam wyjazd na zabezpieczenie rejonu (${ev.city}), odbiór.`;
    if (Math.random() < 0.10) {
        const fullAddr = ev.street ? `${ev.city}, ${ev.street}` : ev.city;
        return `${vehicle.id} zgłaszam wyjazd do zdarzenia na adres: ${fullAddr}, odbiór.`;
    }
    const simpleVariants = [
        `${vehicle.id} zgłaszam wyjazd do zdarzenia, odbiór.`,
        `${vehicle.id} wyjazd, odbiór.`,
        `${currentCountyCallsign}, tu ${vehicle.id}, wyjeżdżamy do zdarzenia, odbiór.`,
        `${vehicle.id} w drodze do zdarzenia, odbiór.`
    ];
    return simpleVariants[Math.floor(Math.random() * simpleVariants.length)];
}

// --- GŁÓWNA PĘTLA CZASU SYMULATORA ---
function runSimulationTick() {
    let needsRender = false;

    events.forEach(ev => {
        if (ev.status === 'ACTIVE') {
            ev.vehicles.forEach(v => {
                if (v.phase === 'PREP') {
                    if (v.prepTime > 0) { v.prepTime--; needsRender = true; }
                    else {
                        v.phase = 'TRAVEL';
                        logToMainRadio(`${v.id} ➔ ${currentCountyCallsign}`, buildDepartureRadioMessage(v, ev), '#7CFC00', true);
                        needsRender = true;
                    }
                }
                else if (v.phase === 'TRAVEL') {
                    if (v.travelTime > 0) { v.travelTime--; needsRender = true; }
                    else {
                        v.phase = 'ONSITE';
                        [...unitsPSP, ...unitsOSP].forEach(u => {
                            const veh = u.vehicles.find(vObj => vObj.id === v.id);
                            if (veh) {
                                if (ev.type === 'PZR') {
                                    if (!isVehicleInCombatAction(v.id)) veh.status = 'yellow';
                                } else {
                                    veh.status = 'red';
                                }
                            }
                        });

                        if (ev.type === 'PZR') {
                            logToMainRadio(`${v.id} ➔ ${currentCountyCallsign}`, `${currentCountyCallsign}, tu ${v.id}. Jesteśmy na miejscu zabezpieczenia rejonu w ${ev.city}, pozostajemy w gotowości bojowej, odbiór.`, '#ffd700', true);
                        } else {
                            logToMainRadio(`${v.id} ➔ ${currentCountyCallsign}`, `${currentCountyCallsign}, tu ${v.id}. Jesteśmy na miejscu zdarzenia w ${ev.city}${ev.street ? ' (' + ev.street + ')' : ''}, odbiór.`, '#ffa500', true);
                        }

                        if (!ev.firstArrived) ev.firstArrived = true;
                        triggerArrivalRadioReport(ev, v);
                        needsRender = true;
                    }
                }
            });

            if (ev.type !== 'PZR' && ev.firstArrived && ev.remainingSeconds > 0) {
                ev.remainingSeconds--; needsRender = true;
            } else if (ev.type !== 'PZR' && ev.firstArrived && ev.remainingSeconds === 0) {
                triggerEventFinishAndReturn(ev); needsRender = true;
            }
        }
        else if (ev.status === 'FINISHED') {
            ev.vehicles.forEach(v => {
                if (v.phase === 'RETURN') {
                    if (v.returnTime > 0) { v.returnTime--; needsRender = true; }
                    else {
                        v.phase = 'DONE';
                        const activePzr = (ev.type !== 'PZR') ? getActivePzrForVehicle(v.id) : null;

                        [...unitsPSP, ...unitsOSP].forEach(u => {
                            const veh = u.vehicles.find(vObj => vObj.id === v.id);
                            if (veh) veh.status = activePzr ? 'yellow' : 'green';
                        });

                        if (activePzr) {
                            const pzrVehObj = activePzr.vehicles.find(pv => pv.id === v.id);
                            if (pzrVehObj) pzrVehObj.phase = 'ONSITE';
                            logToMainRadio(`${v.id} ➔ ${currentCountyCallsign}`, `${currentCountyCallsign}, tu ${v.id} (${v.unitName}). Powróciliśmy na zabezpieczenie rejonu (${activePzr.city}), w gotowości bojowej, odbiór.`, '#ffd700', true);
                        } else {
                            logToMainRadio(`${v.id} ➔ ${currentCountyCallsign}`, `${currentCountyCallsign}, tu ${v.id} (${v.unitName}). Zastęp w bazie, gotowy do działań, odbiór.`, '#00ff7f', true);
                        }
                        needsRender = true;
                    }
                }
            });
        }
    });

    if (needsRender) { renderUnits(); renderEvents(); saveSimulationState(); }
    renderSelectedEventDetails();
    ensureVersionBadgeInStatusBar();

    const clockEl = document.getElementById('clock-box');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toISOString().slice(0, 10) + ' ' + now.toLocaleTimeString();
    }
}

function startSimulationLoop() {
    if (simIntervalId) clearInterval(simIntervalId);
    const intervalMs = Math.max(200, Math.round(1000 / simSpeed));
    simIntervalId = setInterval(runSimulationTick, intervalMs);
}

function scheduleNextAutoCPR() {
    if (autoCprTimeoutId) clearTimeout(autoCprTimeoutId);
    const baseRandomTime = Math.floor(Math.random() * (90000 - 45000 + 1)) + 45000;
    const scaledTime = Math.max(8000, Math.round(baseRandomTime / simSpeed));

    autoCprTimeoutId = setTimeout(() => {
        const cprModal = document.getElementById('cpr-modal');
        const launcherModal = document.getElementById('modal-launcher');
        const isLauncherOpen = launcherModal && launcherModal.style.display === 'flex';
        if (!isLauncherOpen && (!cprModal || cprModal.style.display !== 'flex')) {
            simulateIncomingCPR();
        }
        scheduleNextAutoCPR();
    }, scaledTime);
}

startSimulationLoop();
scheduleNextAutoCPR();
renderUnits();
