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
    o: "c2stcHJvai1wRHZBV05wbDRnUzRzWlpFUkVSeWMtcGdqVGdXZEp1d3E5Y3pCMnhsc0JQZWd3Z3prbi16OEtidFVlQ2NxMHVlV2lnb0dhWDNpS1QzQmxia0ZKNk55MjJtWjMwTm41NnhjTlpZTYUzM3FUM3BtcUF6aGRfb3E4S2N1MTdCenRLVHQ8b1FkUUM5SFhuQlZsOWxxM2pxalBmbUE="
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
                temperature: 0.45,
                max_tokens: 180,
                ...(jsonMode ? { response_format: { type: "json_object" } } : {})
            })
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data.choices && data.choices[0]?.message?.content) {
            return data.choices[0].message.content.trim();
        }
    } catch (e) {}
    
    try {
        const response = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'openai',
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                temperature: 0.45,
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

// --- BAZA MIEJSCOWOŚCI ---
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

const realStreetsByTown = {
    "Wejherowo": ["ul. Jana III Sobieskiego", "ul. 12 Marca", "ul. Gdańska", "ul. Tartaczna", "ul. 3 Maja", "ul. Przemysłowa", "ul. Kalwaryjska", "ul. Sikorskiego", "ul. I Brygady Pancernej WP", "ul. Chopina"],
    "Bolszewo": ["ul. Zamostna", "ul. Strażacka", "ul. Główna", "ul. Wejherowska", "ul. Szkolna", "ul. Długa", "ul. Leśna", "ul. Polna", "ul. Krótka"],
    "Rumia": ["ul. Grunwaldzka", "ul. Dąbrowskiego", "ul. Starowiejska", "ul. Świętego Floriana", "ul. Kosynierów", "ul. Pomorska", "ul. Sabata", "ul. Gdańska", "ul. Żwirki i Wigury"],
    "Reda": ["ul. Wejherowska", "ul. Gdańska", "ul. Pucka", "ul. Gniewowska", "ul. Obwodowa", "ul. Łąkowa", "ul. Cechowa", "ul. Leśna"],
    "Gościcino": ["ul. Drzewiarza", "ul. Wejherowska", "ul. Lęborska", "ul. Słoneczna", "ul. Fabryczna", "ul. Polna"],
    "Gniewowo": ["ul. Jakuba Wejhera", "ul. Słoneczna", "ul. Leśna", "ul. Długa"],
    "Gowino": ["ul. Wejherowska", "ul. Szkolna", "ul. Długa", "ul. Kwiatowa"],
    "Góra": ["ul. Wiejska", "ul. Długa", "ul. Szkolna", "ul. Polna"],
    "Kniewo": ["al. Lipowa", "ul. Strażacka", "ul. Długa", "ul. Polna"],
    "Nowy Dwór Wejherowski": ["ul. Wejherowska", "ul. Kwiatowa", "ul. Leśna", "ul. Szkolna"],
    "Orle": ["ul. Strażacka", "ul. Zamostna", "ul. Główna", "ul. Nadrzeczna"],
    "Zbychowo": ["ul. Kamienna", "ul. Białogórska", "ul. Jeziorna", "ul. Leśna"],
    "Luzino": ["ul. Ofiar Stutthofu", "ul. Kościelna", "ul. Młyńska", "ul. Wilczka", "ul. Szkolna", "ul. Chłopska"],
    "Zelewo": ["ul. Długa", "ul. Słoneczna", "ul. Leśna"],
    "Milwino": ["ul. Strażacka", "ul. Długa", "ul. Leśna"],
    "Szemud": ["ul. Wejherowska", "ul. Samorządowa", "ul. Kartuska", "ul. Szkolna", "ul. Leśna"],
    "Kielno": ["ul. Oliwska", "ul. Szkolna", "ul. Jeziorna", "ul. Tredera"],
    "Bojano": ["ul. Józefa Wybickiego", "ul. Majora H. Sucharskiego", "ul. Kartuska", "ul. Szkolna"],
    "Częstkowo": ["ul. Strażacka", "ul. Długa", "ul. Leśna"],
    "Łebno": ["ul. Kartuska", "ul. Szkolna", "ul. Jeziorna"],
    "Przetoczyno": ["ul. Pomorska", "ul. Strażacka", "ul. Szkolna"],
    "Gniewino": ["ul. Strażacka", "ul. Szkolna", "ul. Pomorska", "ul. Sportowa"],
    "Nadole": ["ul. Strażacka", "ul. Bałtycka", "ul. Jeziorna"],
    "Kostkowo": ["ul. Wejherowska", "ul. Ks. Stanisława Galasa", "ul. Szkolna"],
    "Rybno": ["ul. Dębowa", "ul. Długa", "ul. Szkolna"],
    "Opalino": ["Opalino", "ul. Długa"],
    "Choczewo": ["ul. Pierwszych Osadników", "ul. Świerkowa", "ul. Pucka", "ul. Szkolna"],
    "Słajszewo": ["ul. Bursztynowa", "ul. Morska", "ul. Leśna"],
    "Sasino": ["ul. Brukowa", "ul. Strażacka", "ul. Morska"],
    "Kopalino": ["ul. Bursztynowa", "ul. Strażacka", "ul. Nadmorska"],
    "Linia": ["ul. Turystyczna", "ul. Długa", "ul. Szkolna", "ul. Kaszubska"],
    "Strzepcz": ["ul. Ks. Józefa Rotty", "ul. Ks. Rtm. Kukowskiego", "ul. Długa", "ul. Lipowa"],
    "Lewino": ["ul. Długa", "ul. Leśna", "ul. Szkolna"],
    "Łęczyce": ["ul. Długa", "ul. Sportowa", "ul. Kościelna", "ul. Szkolna"],
    "Bożepole Wielkie": ["ul. Chmieleniecka", "ul. Strażacka", "ul. Szkolna"],
    "Rozłazino": ["ul. Długa", "ul. Kościelna", "ul. Leśna"],
    "Kaczkowo": ["Kaczkowo"]
};

const gpsCoords = {
    "Wejherowo": [54.6052, 18.2345],
    "Bolszewo": [54.6155, 18.1772],
    "Rumia": [54.5798, 18.3973],
    "Reda": [54.6053, 18.3478],
    "Gościcino": [54.5975, 18.1458],
    "Gniewowo": [54.5655, 18.2995],
    "Gowino": [54.5682, 18.2025],
    "Góra": [54.6368, 18.1492],
    "Kniewo": [54.6548, 18.1408],
    "Nowy Dwór Wejherowski": [54.5365, 18.2575],
    "Orle": [54.6295, 18.1765],
    "Zbychowo": [54.5528, 18.3275],
    "Luzino": [54.5608, 18.1038],
    "Zelewo": [54.6146, 18.0825],
    "Milwino": [54.5185, 18.1345],
    "Szemud": [54.4862, 18.2278],
    "Kielno": [54.4552, 18.3475],
    "Bojano": [54.4776, 18.3842],
    "Częstkowo": [54.5045, 18.1745],
    "Łebno": [54.4555, 18.1365],
    "Przetoczyno": [54.5345, 18.2045],
    "Gniewino": [54.7161, 18.0156],
    "Nadole": [54.7495, 18.0365],
    "Kostkowo": [54.6755, 18.0385],
    "Rybno": [54.6775, 18.1055],
    "Opalino": [54.7185, 18.0615],
    "Choczewo": [54.7422, 17.8915],
    "Słajszewo": [54.7695, 17.8048],
    "Sasino": [54.7628, 17.7562],
    "Kopalino": [54.7895, 17.8485],
    "Linia": [54.4503, 17.9355],
    "Strzepcz": [54.4590, 18.0398],
    "Lewino": [54.4815, 17.9945],
    "Łęczyce": [54.5992, 17.8685],
    "Bożepole Wielkie": [54.5745, 17.9682],
    "Rozłazino": [54.5445, 17.8615],
    "Kaczkowo": [54.6215, 17.8925]
};

// --- OFICJALNE ADRESY I ZABLOKOWANE DOKŁADNE WSPÓŁRZĘDNE BUDYNKÓW STRAŻNIC ---
const unitExactLocations = {
    "JRG 1 Wejherowo": { town: "Wejherowo", address: "ul. Tartaczna 5, 84-200 Wejherowo", lat: 54.6075, lng: 18.2195, locked: true },
    "KP PSP Wejherowo": { town: "Wejherowo", address: "ul. Tartaczna 5, 84-200 Wejherowo", lat: 54.6077, lng: 18.2199, locked: true },
    "JRG 2 Rumia": { town: "Rumia", address: "ul. Świętego Floriana 1, 84-230 Rumia", lat: 54.5798, lng: 18.3973, locked: true },
    ".OSP KSRG Bolszewo": { town: "Bolszewo", address: "ul. Zamostna 4A, 84-239 Bolszewo", lat: 54.6156, lng: 18.1772, locked: true },
    ".OSP KSRG Gościcino": { town: "Gościcino", address: "ul. Drzewiarza 22, 84-241 Gościcino", lat: 54.5975, lng: 18.1458 },
    ".OSP KSRG Wejherowo": { town: "Wejherowo", address: "ul. 3 Maja 2, 84-200 Wejherowo", lat: 54.6014, lng: 18.2333, locked: true },
    ".OSP KSRG Reda": { town: "Reda", address: "ul. Pucka 1, 84-240 Reda", lat: 54.6053, lng: 18.3478 },
    ".OSP KSRG Luzino": { town: "Luzino", address: "ul. Ofiar Stutthofu 39, 84-242 Luzino", lat: 54.5608, lng: 18.1038 },
    ".OSP KSRG Zelewo": { town: "Zelewo", address: "ul. Długa 31, 84-252 Zelewo", lat: 54.6146, lng: 18.0825 },
    ".OSP KSRG Szemud": { town: "Szemud", address: "ul. Samorządowa 3, 84-217 Szemud", lat: 54.4862, lng: 18.2278 },
    ".OSP KSRG Kielno": { town: "Kielno", address: "ul. Oliwska 85, 84-208 Kielno", lat: 54.4552, lng: 18.3475 },
    ".OSP KSRG Bojano": { town: "Bojano", address: "ul. Józefa Wybickiego 16, 84-207 Bojano", lat: 54.4776, lng: 18.3842 },
    ".OSP KSRG Choczewo": { town: "Choczewo", address: "ul. Świerkowa 8, 84-210 Choczewo", lat: 54.7422, lng: 17.8915 },
    ".OSP KSRG Słajszewo": { town: "Słajszewo", address: "ul. Bursztynowa 67, 84-210 Słajszewo", lat: 54.7695, lng: 17.8048 },
    ".OSP KSRG Sasino": { town: "Sasino", address: "ul. Brukowa 3, 84-210 Sasino", lat: 54.7628, lng: 17.7562 },
    ".OSP KSRG Gniewino": { town: "Gniewino", address: "ul. Strażacka 2, 84-250 Gniewino", lat: 54.7161, lng: 18.0156 },
    ".OSP KSRG Nadole": { town: "Nadole", address: "ul. Strażacka 20, 84-250 Nadole", lat: 54.7495, lng: 18.0365 },
    ".OSP KSRG Kostkowo": { town: "Kostkowo", address: "ul. Wejherowska 24A, 84-251 Kostkowo", lat: 54.6755, lng: 18.0385 },
    ".OSP KSRG Linia": { town: "Linia", address: "ul. Turystyczna 3, 84-223 Linia", lat: 54.4503, lng: 17.9355 },
    ".OSP KSRG Strzepcz": { town: "Strzepcz", address: "ul. Ks. Józefa Rotty 15, 84-223 Strzepcz", lat: 54.4590, lng: 18.0398 },
    ".OSP KSRG Bożepole Wielkie": { town: "Bożepole Wielkie", address: "ul. Chmieleniecka 40, 84-214 Bożepole Wielkie", lat: 54.5745, lng: 17.9682 },
    ".OSP KSRG Łęczyce": { town: "Łęczyce", address: "ul. Sportowa 5, 84-218 Łęczyce", lat: 54.5992, lng: 17.8685 },
    ".OSP KSRG Rozłazino": { town: "Rozłazino", address: "ul. Długa 26, 84-218 Rozłazino", lat: 54.5445, lng: 17.8615 },
    "OSP Gowino": { town: "Gowino", address: "ul. Wejherowska 58, 84-215 Gowino", lat: 54.5682, lng: 18.2025 },
    "OSP Orle": { town: "Orle", address: "ul. Strażacka 2, 84-252 Orle", lat: 54.6295, lng: 18.1765 },
    "OSP Kniewo": { town: "Kniewo", address: "al. Lipowa 14, 84-252 Kniewo", lat: 54.6548, lng: 18.1408 },
    "OSP Zbychowo": { town: "Zbychowo", address: "ul. Kamienna 2, 84-206 Zbychowo", lat: 54.5528, lng: 18.3275 },
    "OSP Gniewowo": { town: "Gniewowo", address: "ul. Jakuba Wejhera 16, 84-240 Gniewowo", lat: 54.5655, lng: 18.2995 },
    "OSP Góra": { town: "Góra", address: "ul. Wiejska 14, 84-252 Góra", lat: 54.6368, lng: 18.1492 },
    "OSP Nowy Dwór Wejherowski": { town: "Nowy Dwór Wejherowski", address: "ul. Kwiatowa 16, 84-206 Nowy Dwór Wejherowski", lat: 54.5365, lng: 18.2575 },
    "OSP Rybno": { town: "Rybno", address: "ul. Dębowa 7, 84-251 Rybno", lat: 54.6775, lng: 18.1055 },
    "OSP Opalino": { town: "Opalino", address: "Opalino 4, 84-250 Gniewino", lat: 54.7185, lng: 18.0615 },
    "OSP Kopalino": { town: "Kopalino", address: "ul. Bursztynowa 24, 84-210 Kopalino", lat: 54.7895, lng: 17.8485 },
    "OSP Lewino": { town: "Lewino", address: "ul. Długa 28, 84-223 Lewino", lat: 54.4815, lng: 17.9945 },
    "OSP Milwino": { town: "Milwino", address: "ul. Strażacka 5, 84-242 Milwino", lat: 54.5185, lng: 18.1345 },
    "OSP Kaczkowo": { town: "Kaczkowo", address: "Kaczkowo 18B, 84-218 Kaczkowo", lat: 54.6215, lng: 17.8925 },
    "OSP Częstkowo": { town: "Częstkowo", address: "ul. Strażacka 1, 84-217 Częstkowo", lat: 54.5045, lng: 18.1745 },
    "OSP Łebno": { town: "Łebno", address: "ul. Kartuska 10, 84-217 Łebno", lat: 54.4555, lng: 18.1365 },
    "OSP Przetoczyno": { town: "Przetoczyno", address: "ul. Pomorska 21, 84-217 Przetoczyno", lat: 54.5345, lng: 18.2045 }
};

function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- OBLICZANIE ODLEGŁOŚCI I CZASU DOJAZDU ---
function getUnitProximity(unitName, city) {
    const unitLoc = unitExactLocations[unitName] || unitExactLocations["JRG 1 Wejherowo"];
    const targetTown = Object.keys(gpsCoords).find(
        c => c.toLowerCase() === (city || "").trim().toLowerCase()
    ) || "Wejherowo";

    let kmRounded = 1.5;
    if (unitLoc.town.toLowerCase() === targetTown.toLowerCase()) {
        const isJRG = unitName.includes("JRG");
        kmRounded = isJRG ? 1.5 : 1.8;
    } else {
        const tCoords = gpsCoords[targetTown] || [54.6052, 18.2345];
        const roadDist = haversineKm(unitLoc.lat, unitLoc.lng, tCoords[0], tCoords[1]) * 1.25;
        kmRounded = Math.max(1.5, Math.round(roadDist * 10) / 10);
    }

    const secCalc = Math.max(5, Math.round(kmRounded * 4));
    return { sec: secCalc, kmNum: kmRounded, km: `${kmRounded.toFixed(1)} km` };
}

// --- PODMIENIONE FUNKCJE CZASU WYJAZDU I DOJAZDU ---
function generateDeparturePrepSeconds(unitName) {
    const isPSP = unitName.includes("JRG") || unitName.includes("KP PSP");
    if (isPSP) {
        return Math.floor(Math.random() * 5) + 1; // PSP: losowo od 1 do 5 sekund
    } else {
        return Math.floor(Math.random() * 10) + 1; // OSP: losowo od 1 do 10 sekund (do 10s)
    }
}

function calculateRouteTravelSeconds(unitName, city) {
    const prox = getUnitProximity(unitName, city);
    const secPerKm = 3.5 + (Math.random() * 1); // Średnio ok. 4 sekundy na 1 km (zakres 3.5 - 4.5s)
    return Math.max(5, Math.round(prox.kmNum * secPerKm));
}

function calculateActionDurationSeconds(desc, subtype, type) {
    if (type === 'PZR') return 600;
    const text = ((desc || "") + " " + (subtype || "")).toLowerCase();
    const isBigOrSearch =
        text.includes("poszukiwan") ||
        text.includes("zaginion") ||
        text.includes("hala") ||
        text.includes("hali") ||
        text.includes("magazyn") ||
        text.includes("zakład") ||
        text.includes("produkcyjn") ||
        text.includes("las") ||
        text.includes("leśn") ||
        text.includes("mieszkan") ||
        text.includes("kamienic") ||
        text.includes("budynk") ||
        text.includes("dach") ||
        text.includes("poddasz") ||
        text.includes("gospodarcz") ||
        text.includes("stodoł") ||
        text.includes("tartak") ||
        text.includes("szkoł") ||
        text.includes("składowisk");

    if (isBigOrSearch) {
        return Math.floor(Math.random() * (900 - 300 + 1)) + 300;
    }
    if (text.includes("wypadek") || text.includes("zderzenie") || text.includes("chemiczn")) {
        return Math.floor(Math.random() * (420 - 240 + 1)) + 240;
    }
    return Math.floor(Math.random() * (270 - 150 + 1)) + 150;
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
let mainRadioLogs = [];
let mainRadioModalEl = null;

let shiftStats = {
    cprTotalGenerated: 0,
    cprAccepted: 0,
    cprRefused: 0,
    refusalReasons: {}
};

// --- GŁÓWNE RADIO OGÓLNOPOWIATOWE SKKP WEJHEROWO 998 ---
function ensureMainRadioWindow() {
    if (mainRadioModalEl) return mainRadioModalEl;

    const modal = document.createElement('div');
    modal.id = 'main-radio-modal';
    modal.style.position = 'fixed';
    modal.style.zIndex = '1045';
    modal.style.width = '460px';
    modal.style.right = '20px';
    modal.style.bottom = '35px';

    modal.innerHTML = `
        <div style="background: #c0c0c0; border: 2px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; box-shadow: 2px 2px 6px rgba(0,0,0,0.5); font-family: 'Segoe UI', Tahoma, sans-serif;">
            <div class="main-radio-header" style="background: linear-gradient(90deg, #800000, #b30000); color: #ffffff; padding: 4px 6px; font-weight: bold; font-size: 13px; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none;">
                <span>📻 Główne Radio SKKP Wejherowo (Kanał Ogólny B029)</span>
                <div style="display: flex; gap: 2px;">
                    <button style="background: #c0c0c0; border: 1px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; width: 18px; height: 16px; font-size: 10px; font-weight: bold; cursor: pointer; padding: 0;" onclick="minimizeMainRadio()">_</button>
                    <button style="background: #c0c0c0; border: 1px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; width: 18px; height: 16px; font-size: 10px; font-weight: bold; cursor: pointer; padding: 0;" onclick="closeMainRadio()">✕</button>
                </div>
            </div>
            <div style="padding: 6px; background: #c0c0c0;">
                <div style="font-size:10px; color:#222; margin-bottom:3px; font-weight:bold;">Meldunki wyjazdów, dojazdów, zakończenia działań i powrotów do bazy:</div>
                <div id="main-radio-chat" style="background: #111111; color: #ffffff; font-family: 'Consolas', 'Courier New', monospace; font-weight: bold; font-size: 12px; height: 210px; padding: 6px; overflow-y: auto; border: 2px solid #808080; border-right-color: #ffffff; border-bottom-color: #ffffff; box-sizing: border-box; line-height: 1.35;">
                    <div style="color:#aaa; font-style:italic;">[System] Kanał główny SKKP Wejherowo 998 aktywny. Nasłuch statusów SiS...</div>
                </div>
                <div style="display: flex; gap: 4px; margin-top: 6px; align-items: center;">
                    <button style="padding: 4px 8px; font-size: 11px; background: #e1e1e1; border: 2px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; cursor: pointer; font-weight: bold; color:#000;" onclick="sendMainRadioDispatchMsg('Wejherowo 998, przyjąłem.')">✔ Przyjąłem</button>
                    <input type="text" id="inp-main-radio" placeholder="Nadaj komunikat ogólny (Wejherowo 998)..." style="flex: 1; padding: 4px 6px; font-size: 12px; background: #ffffff; color:#000; border: 2px solid #808080; outline: none;" onkeypress="if(event.key==='Enter') sendMainRadioCustom()">
                    <button style="padding: 4px 10px; font-size: 11px; background: #e1e1e1; border: 2px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; cursor: pointer; font-weight: bold; color:#000;" onclick="sendMainRadioCustom()">Nadaj</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    makeDraggable(modal, modal.querySelector('.main-radio-header'));
    mainRadioModalEl = modal;
    return modal;
}

function openMainRadio() {
    const modal = ensureMainRadioWindow();
    modal.style.display = 'block';
    const minItem = document.getElementById('min-main-radio');
    if (minItem) minItem.remove();
    updateMainRadioChat();
}

function closeMainRadio() {
    if (mainRadioModalEl) mainRadioModalEl.style.display = 'none';
}

function minimizeMainRadio() {
    if (mainRadioModalEl) mainRadioModalEl.style.display = 'none';
    const bar = document.getElementById('minimized-bar');
    if (bar && !document.getElementById('min-main-radio')) {
        const item = document.createElement('div');
        item.className = 'minimized-item';
        item.id = 'min-main-radio';
        item.innerHTML = `📻 Główne Radio SKKP`;
        item.onclick = () => {
            openMainRadio();
        };
        bar.appendChild(item);
    }
}

function logToMainRadio(callsign, messageText, color = '#7CFC00', playBeep = true) {
    ensureMainRadioWindow();
    if (playBeep) {
        audioMotorola.currentTime = 0;
        audioMotorola.play().catch(e => {});
    }
    const timeStr = new Date().toLocaleTimeString();
    const entry = `<div style="margin-bottom: 6px; color: ${color}; border-bottom: 1px dashed #333; padding-bottom: 3px;"><span style="color:#cccccc;">[${timeStr}]</span> <b>${callsign}:</b><br>"${messageText}"</div>`;
    mainRadioLogs.push(entry);
    updateMainRadioChat();
}

function updateMainRadioChat() {
    const chat = document.getElementById('main-radio-chat');
    if (chat) {
        chat.innerHTML = mainRadioLogs.length > 0
            ? mainRadioLogs.join('')
            : `<div style="color:#aaa; font-style:italic;">[System] Kanał główny SKKP Wejherowo 998 aktywny. Nasłuch statusów SiS...</div>`;
        chat.scrollTop = chat.scrollHeight;
    }
}

function sendMainRadioDispatchMsg(text) {
    if (!text) return;
    logToMainRadio('Wejherowo 998 ➔ WSZYSCY', text, '#00ffff', true);
}

function sendMainRadioCustom() {
    const inp = document.getElementById('inp-main-radio');
    if (!inp || !inp.value.trim()) return;
    sendMainRadioDispatchMsg(inp.value.trim());
    inp.value = '';
}

// --- UNIWERSALNY GEOKODER DOKŁADNYCH ADRESÓW ---
async function resolveExactCoordinates(streetAddress, townName) {
    const cleanTown = (townName || "Wejherowo").trim();
    let cleanedStreet = (streetAddress || "")
        .replace(/^(Przystanek Autobusowy|Kamienica|Blok mieszkalny|Hala Magazynowa|Tartak \/ Skład Drzewny|Balex-Metal|Markisol Polska|Zakład Przetwórstwa Drzewnego|Kompleks Magazynowy)[,\s-]*/i, '')
        .split('/')[0]
        .trim();

    const fullQuery = cleanedStreet ? `${cleanedStreet}, ${cleanTown}, powiat wejherowski, pomorskie, Polska` : `${cleanTown}, powiat wejherowski, pomorskie, Polska`;

    try {
        const arcUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(fullQuery)}&countryCode=POL&searchExtent=17.65,54.38,18.50,54.85&maxLocations=1`;
        const res = await fetch(arcUrl);
        if (res.ok) {
            const data = await res.json();
            if (data.candidates && data.candidates.length > 0) {
                const loc = data.candidates[0].location;
                if (loc && loc.y && loc.x) {
                    return { lat: parseFloat(loc.y), lng: parseFloat(loc.x) };
                }
            }
        }
    } catch (e) {}

    try {
        const streetNoPrefix = cleanedStreet.replace(/\b(ul\.|ulica|al\.|aleja|pl\.|plac)\s*/gi, '').trim();
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(streetNoPrefix + ' ' + cleanTown)}&lat=54.60&lon=18.23&limit=1`;
        const res = await fetch(photonUrl);
        if (res.ok) {
            const data = await res.json();
            if (data.features && data.features.length > 0) {
                const coords = data.features[0].geometry?.coordinates;
                if (coords && coords.length === 2) {
                    return { lat: parseFloat(coords[1]), lng: parseFloat(coords[0]) };
                }
            }
        }
    } catch (e) {}

    return null;
}

let stationsGeocoded = false;
async function geocodeAllFireStationsExact() {
    if (stationsGeocoded) return;
    stationsGeocoded = true;

    const cacheKey = 'SWD_EXACT_STATIONS_V7';
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
            info.lat = coords.lat;
            info.lng = coords.lng;
            cacheToSave[uName] = { lat: info.lat, lng: info.lng };
        }
    }));

    try {
        if (Object.keys(cacheToSave).length > 5) {
            localStorage.setItem(cacheKey, JSON.stringify(cacheToSave));
        }
    } catch (e) {}

    updateMapMarkers();
}

async function geocodeEventAddress(ev) {
    const rawStreet = (ev.street || "").trim();
    const coords = await resolveExactCoordinates(rawStreet, ev.city);
    if (coords) {
        ev.lat = coords.lat;
        ev.lng = coords.lng;
    } else if (!ev.lat || !ev.lng) {
        const fallback = gpsCoords[ev.city] || [54.6052, 18.2345];
        ev.lat = fallback[0];
        ev.lng = fallback[1];
    }
    updateMapMarkers();
}

function focusEventOnMap(evId) {
    const ev = events.find(e => e.id === evId);
    if (!ev) return;
    switchMainView('map');
    setTimeout(async () => {
        if (!ev.geocodedOnce) {
            ev.geocodedOnce = true;
            await geocodeEventAddress(ev);
        }
        if (leafletMap && ev.lat && ev.lng) {
            leafletMap.setView([ev.lat, ev.lng], 17);
        }
    }, 250);
}

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
            leafletMap = L.map('leaflet-map').setView([54.6052, 18.2345], 11);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap'
            }).addTo(leafletMap);
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
        const loc = unitExactLocations[u.name] || {
            town: "Wejherowo",
            address: "ul. Tartaczna 5, 84-200 Wejherowo",
            lat: 54.6075,
            lng: 18.2195
        };

        const isPSP = u.name.includes("JRG") || u.name.includes("KP PSP");
        const borderColor = isPSP ? "#b30000" : "#0a246a";
        const bgBadge = isPSP ? "#ffe6e6" : "#ffffff";
        const vehListHtml = u.vehicles.map(v => {
            const color = v.status === 'green' ? '#1e8449' : (v.status === 'orange' ? '#d68910' : '#c0392b');
            return `<div style="font-size:11px; color:#000;"><span style="color:${color}; font-weight:bold;">●</span> <b>${v.id}</b> - ${v.name}</div>`;
        }).join('');

        const marker = L.marker([loc.lat, loc.lng], {
            icon: L.divIcon({
                className: '',
                html: `<div style="transform:translate(-50%, -50%); background:${bgBadge}; color:#000000; border:2px solid ${borderColor}; border-radius:4px; padding:2px 6px; font-size:11px; font-weight:bold; white-space:nowrap; box-shadow:0 2px 5px rgba(0,0,0,0.45); cursor:pointer;">🚒 ${u.name}</div>`,
                iconSize: [0, 0],
                iconAnchor: [0, 0]
            })
        });
        marker.bindPopup(`
            <div style="min-width:220px; color:#000;">
                <div style="font-weight:bold; color:${borderColor}; font-size:12px;">${u.name}</div>
                <div style="font-size:10px; color:#222; border-bottom:1px solid #ccc; margin-bottom:4px; padding-bottom:3px;">📍 <b>Adres:</b> ${loc.address}</div>
                ${vehListHtml}
            </div>
        `);
        mapMarkersLayer.addLayer(marker);
    });

    events.forEach(ev => {
        if (ev.status !== 'ACTIVE') return;
        const fallback = gpsCoords[ev.city] || [54.6052, 18.2345];
        const evLat = ev.lat || fallback[0];
        const evLng = ev.lng || fallback[1];

        const marker = L.marker([evLat, evLng], {
            icon: L.divIcon({
                className: '',
                html: `<div style="transform:translate(-50%, -50%); background:#ffcccc; color:#000000; border:2.5px solid #b30000; border-radius:4px; padding:2px 7px; font-size:11px; font-weight:bold; white-space:nowrap; box-shadow:0 0 8px rgba(179,0,0,0.8); cursor:pointer;">🚨 [ID:${ev.id}] ${ev.city}, ${ev.street || ''}</div>`,
                iconSize: [0, 0],
                iconAnchor: [0, 0]
            })
        });

        const sisList = ev.vehicles.map(v => {
            if (v.phase === 'PREP') return `${v.id} (Wyjazd z bazy za: ${v.prepTime}s)`;
            if (v.phase === 'TRAVEL') return `${v.id} (Dojazd: ${formatMMSS(v.travelTime)})`;
            if (v.phase === 'ONSITE') return `${v.id} (Na miejscu akcji)`;
            if (v.phase === 'RETURN') return `${v.id} (Powrót: ${formatMMSS(v.returnTime)})`;
            return `${v.id}`;
        }).join('<br>');

        marker.bindPopup(`
            <div style="min-width:230px; color:#000;">
                <b style="color:#b30000;">ZDARZENIE ID: ${ev.id}/2026 (${ev.type})</b><br>
                <b>Dokładny adres:</b> ${ev.city}, ${ev.street || 'Brak ulicy'}<br>
                <b>Opis:</b> ${ev.desc}<br>
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

// --- AUTOMATYCZNA INICJALIZACJA INTERFEJSU ---
window.addEventListener('DOMContentLoaded', () => {
    geocodeAllFireStationsExact();
    ensureMainRadioWindow();

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
        } else if (txt.includes('komunikator') || txt.includes('urządzenia')) {
            item.onclick = () => openMainRadio();
        }
    });

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

    const btnOpenRadio = document.getElementById('btn-open-radio');
    if (btnOpenRadio && btnOpenRadio.parentElement && !document.getElementById('btn-open-main-radio')) {
        const mainRadBtn = document.createElement('button');
        mainRadBtn.className = 'btn-win';
        mainRadBtn.id = 'btn-open-main-radio';
        mainRadBtn.style.cssText = 'background: #fff0f0; border-color: #800000; font-weight: bold; color: #800000;';
        mainRadBtn.innerHTML = '📻 Główne Radio SKKP';
        mainRadBtn.onclick = () => openMainRadio();
        btnOpenRadio.parentElement.appendChild(mainRadBtn);
    }

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
        sisModal.className = 'modal-overlay';
        sisModal.id = 'modal-sis';
        document.body.appendChild(sisModal);
    }
    sisModal.innerHTML = `
        <div class="modal-window" style="width: 780px; height: 500px;">
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
        const addr = unitExactLocations[u.name]?.address || "Wejherowo";
        u.vehicles.forEach(v => {
            const stText = v.status === 'green' ? 'W bazie' : (v.status === 'orange' ? 'W drodze / Powrót' : 'W akcji na miejscu');
            const stColor = v.status === 'green' ? '#155724' : (v.status === 'orange' ? '#b36b00' : '#b30000');
            html += `
                <tr>
                    <td><b>${u.name}</b></td>
                    <td style="font-size:10px; color:#333;">${addr}</td>
                    <td><b>${v.id}</b></td>
                    <td>${v.name}</td>
                    <td style="color:${stColor}; font-weight:bold;">${stText}</td>
                    <td>
                        <button class="btn-win" style="font-size:10px; padding:1px 5px;" onclick="setVehicleStatusManual('${v.id}', 'green')">Wolny</button>
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
    renderUnits();
    renderSiSManagerList();
    updateMapMarkers();
}

async function addCustomUnit(type) {
    const name = prompt(`Podaj nazwę nowej jednostki ${type} (np. OSP KSRG Bolszewo II):`);
    if (!name || !name.trim()) return;
    const town = prompt(`Podaj miejscowość stacjonowania jednostki:`, "Wejherowo") || "Wejherowo";
    const address = prompt(`Podaj dokładną ulicę i numer strażnicy:`, `ul. Strażacka 1, ${town}`) || town;
    const tCoords = gpsCoords[town.trim()] || [54.6052, 18.2345];
    unitExactLocations[name.trim()] = { town: town.trim(), address: address.trim(), lat: tCoords[0], lng: tCoords[1] };

    if (type === 'PSP') unitsPSP.push({ name: name.trim(), vehicles: [] });
    else unitsOSP.push({ name: name.trim(), vehicles: [] });

    const exact = await resolveExactCoordinates(address, town);
    if (exact) {
        unitExactLocations[name.trim()].lat = exact.lat;
        unitExactLocations[name.trim()].lng = exact.lng;
    }

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

// --- OKNO RAPORTÓW I STATYSTYK ---
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
                        <div id="rep-avg-time" style="font-size: 16px; font-weight: bold; margin-top: 6px; color:#000;">00:08:30</div>
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
                                <td style="text-align:right;">00:08:00</td>
                            </tr>
                            <tr>
                                <td>PSP / OSP</td>
                                <td id="rep-psp-disp" style="text-align:right;">0</td>
                                <td id="rep-psp-wait" style="text-align:right;">0</td>
                                <td id="rep-psp-act" style="text-align:right;">0</td>
                                <td id="rep-psp-fin" style="text-align:right;">0</td>
                                <td style="text-align:right;">00:01:15</td>
                                <td style="text-align:right;">00:08:30</td>
                            </tr>
                            <tr>
                                <td>Policja</td>
                                <td id="rep-pol-disp" style="text-align:right;">0</td>
                                <td id="rep-pol-wait" style="text-align:right;">0</td>
                                <td id="rep-pol-act" style="text-align:right;">0</td>
                                <td id="rep-pol-fin" style="text-align:right;">0</td>
                                <td style="text-align:right;">00:01:45</td>
                                <td style="text-align:right;">00:08:00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

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
                if (ev.status === 'FINISHED' && v.phase === 'DONE') pspFin++;
                else if (v.phase === 'PREP' || v.phase === 'TRAVEL') pspWait++;
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

// --- TAKTYCZNA OCENA SIŁ I ŚRODKÓW ---
function evaluateTacticalForces(ev) {
    const text = ((ev.desc || "") + " " + (ev.subtype || "")).toLowerCase();
    const vehicles = ev.vehicles || [];
    const totalCount = vehicles.length;
    const hasJRG = vehicles.some(v => v.unitName && v.unitName.includes("JRG"));
    const onlyOSP = totalCount > 0 && !hasJRG;
    const hasLadder = vehicles.some(v => v.name.includes("SH-") || v.name.includes("SD-") || v.id.includes("53") || v.id.includes("51"));
    const gcbaCount = vehicles.filter(v => v.name.includes("GCBA")).length;

    const isHallOrIndustry = text.includes("hala") || text.includes("hali") || text.includes("magazyn") || text.includes("zakład") || text.includes("produkcyjn") || text.includes("składowisk") || text.includes("tartak");
    const isApartmentOrBuilding = text.includes("mieszkan") || text.includes("kamienic") || text.includes("balkon") || text.includes("klatce") || text.includes("dach") || text.includes("poddasz") || text.includes("szkoł") || text.includes("urząd") || text.includes("budynk") || text.includes("komin") || text.includes("sadz");
    const isForestOrFarm = text.includes("las") || text.includes("leśn") || text.includes("traw") || text.includes("stog") || text.includes("stodoł") || text.includes("gospodarcz") || text.includes("rolnicz");
    const isAccident = text.includes("wypadek") || text.includes("zderzenie") || text.includes("czołow") || text.includes("zakleszcz");
    const isSearch = text.includes("poszukiwan") || text.includes("zaginion");

    if (isHallOrIndustry) {
        let missing = [];
        if (!hasJRG) missing.push("zastępy gaśnicze z JRG PSP");
        if (gcbaCount < 2) missing.push("co najmniej dwa ciężkie zastępy GCBA (duże zapotrzebowanie na wodę)");
        if (!hasLadder) missing.push("drabina mechaniczna lub podnośnik (SH-40 / SD-32)");
        if (totalCount < 4) missing.push(`dodatkowe zastępy gaśnicze (obecnie zadysponowano tylko ${totalCount}, a na pożar obiektu przemysłowego potrzeba min. 4-5 zastępów)`);

        if (missing.length > 0) {
            return {
                sufficient: false,
                reason: `Siły i środki są ZDECYDOWANIE NIEWYSTARCZAJĄCE jak na pożar hali/zakładu! Pilnie potrzebne na miejsce: ${missing.join(", ")}.`
            };
        }
    }

    if (isApartmentOrBuilding) {
        let missing = [];
        if (onlyOSP) missing.push("wsparcie z JRG PSP (samo OSP na pożarze budynku mieszkalnego to za mało)");
        if (!hasLadder) missing.push("podnośnik lub drabina mechaniczna (SH-40 / SD-32)");
        if (totalCount < 3) missing.push(`minimum jeszcze ${3 - totalCount} zastęp(y) GBA/GCBA do pracy w aparatach ODO i zabezpieczenia wodnego`);

        if (missing.length > 0) {
            return {
                sufficient: false,
                reason: `Siły i środki są NIEWYSTARCZAJĄCE! Na pożar w obiekcie mieszkalnym/budynku konieczne jest zadysponowanie: ${missing.join(", ")}.`
            };
        }
    }

    if (isForestOrFarm) {
        let missing = [];
        if (onlyOSP && totalCount < 3) missing.push("wsparcie z JRG PSP oraz sąsiednich OSP");
        if (gcbaCount < 1) missing.push("ciężki samochód gaśniczy GCBA do dowożenia wody");
        if (totalCount < 3) missing.push(`dodatkowe zastępy gaśnicze (obecnie tylko ${totalCount}, ogień szybko się rozprzestrzenia)`);

        if (missing.length > 0) {
            return {
                sufficient: false,
                reason: `Siły i środki są NIEWYSTARCZAJĄCE! Brakuje zasilania wodnego i ludzi, prosimy o zadysponowanie: ${missing.join(", ")}.`
            };
        }
    }

    if (isAccident) {
        if (totalCount < 2 || onlyOSP) {
            return {
                sufficient: false,
                reason: `Siły i środki są niewystarczające na wypadek komunikacyjny – potrzebujemy wsparcia zastępu ratownictwa technicznego z JRG PSP oraz zabezpieczenia przez ZRM i Policję.`
            };
        }
    }

    if (isSearch) {
        if (totalCount < 3) {
            return {
                sufficient: false,
                reason: `Siły i środki są niewystarczające do przeszukania tak dużego terenu – prosimy o zadysponowanie dodatkowych zastępów OSP/PSP oraz quada do tyraliery.`
            };
        }
    }

    if (totalCount <= 1 && (ev.type === 'P' || onlyOSP)) {
        const isTrivial = text.includes("śmietnik") || text.includes("os") || text.includes("szerszeni") || text.includes("konar");
        if (!isTrivial) {
            return {
                sufficient: false,
                reason: `Jeden zastęp na miejscu to za mało ze względów bezpieczeństwa taktycznego – prosimy o zadysponowanie jeszcze jednego zastępu GBA/GCBA do wsparcia działań.`
            };
        }
    }

    return {
        sufficient: true,
        reason: `Siły i środki zadysponowane na miejsce (${totalCount} zast.) są w tej chwili wystarczające do opanowania sytuacji.`
    };
}

function generateSmartKdrResponse(kdrCallsign, userQuestion, ev) {
    const q = userQuestion.toLowerCase();
    const desc = (ev.desc || "").toLowerCase();
    const tactical = evaluateTacticalForces(ev);
    const isSmall = desc.includes("śmietnik") || desc.includes("os") || desc.includes("szerszeni") || desc.includes("konar");
    const hasPrm = q.includes("pogotow") || q.includes("zrm") || q.includes("karetk") || q.includes("medyczn");
    const hasPol = q.includes("policj") || q.includes("patrol");
    const hasSis = q.includes("dodatkow") || q.includes("siły") || q.includes("środki") || q.includes("srodki") || q.includes("zastęp") || q.includes("podnośnik") || q.includes("drabin") || q.includes("wystarcz");

    if (hasSis) {
        return `Wejherowo 998, tu ${kdrCallsign}. ${tactical.reason} Bez odbioru.`;
    }
    if (hasPrm && hasPol) {
        return `Wejherowo 998, tu ${kdrCallsign}. Przyda się u nas zarówno ZRM, jak i patrol Policji do zabezpieczenia miejsca. Bez odbioru.`;
    } else if (hasPrm) {
        return isSmall 
            ? `Wejherowo 998, tu ${kdrCallsign}. Nie ma osób poszkodowanych, ZRM nie jest potrzebny. Bez odbioru.`
            : `Wejherowo 998, tu ${kdrCallsign}. Tak, mamy osobę wymagającą przebadania, poproszę ZRM na miejsce. Bez odbioru.`;
    } else if (hasPol) {
        return `Wejherowo 998, tu ${kdrCallsign}. Tak, przyda się patrol Policji na miejscu. Bez odbioru.`;
    }

    if (q.includes("przyjąłem") || q.includes("zrozumiałem")) {
        return `Wejherowo 998, tu ${kdrCallsign}. Zrozumiałem, działamy dalej na miejscu. Bez odbioru.`;
    }

    if (!tactical.sufficient) {
        return `Wejherowo 998, tu ${kdrCallsign}. Prowadzimy działania pod adresem ${ev.street || ev.city}, ale ${tactical.reason.charAt(0).toLowerCase() + tactical.reason.slice(1)} Bez odbioru.`;
    }

    return `Wejherowo 998, tu ${kdrCallsign}. Sytuacja na miejscu pod kontrolą, prowadzimy działania pod adresem ${ev.street || ev.city}. Bez odbioru.`;
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
                <span id="radio-title-${evId}">🖵 Korespondencja Radiowa - ID: ${ev.id} (${ev.city}, ${ev.street || ''})</span>
                <div style="display: flex; gap: 2px;">
                    <button style="background: #c0c0c0; border: 1px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; width: 18px; height: 16px; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;" onclick="minimizeRadioWindow(${ev.id})">_</button>
                    <button style="background: #c0c0c0; border: 1px solid #ffffff; border-right-color: #404040; border-bottom-color: #404040; width: 18px; height: 16px; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;" onclick="closeRadioWindow(${ev.id})">✕</button>
                </div>
            </div>
            <div style="padding: 6px; background: #c0c0c0;">
                <div id="radio-chat-${evId}" style="background: #000000; color: #ffcc00; font-family: 'Courier New', monospace; font-weight: bold; font-size: 12px; height: 195px; padding: 6px; overflow-y: auto; border: 2px solid #808080; border-right-color: #ffffff; border-bottom-color: #ffffff; box-sizing: border-box; line-height: 1.3;"></div>
                
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

// --- PUNKTACJA DOWODZENIA (HIERARCHIA: OSP < OSP KSRG < JRG reszta < JRG 25 < JRG 21 < JRG 90 < KP PSP) ---
function getCommandRank(vehicle) {
    const uName = (vehicle.unitName || "").toUpperCase();
    const vId = (vehicle.id || "").toUpperCase();

    // KP PSP - najwyższa ranga dowodzenia
    if (uName.includes("KP PSP")) return 4.0;

    // JRG PSP
    if (uName.includes("JRG")) {
        if (vId.includes("90")) return 3.3; // Dowódca / SLRr (np. 551[G]90)
        if (vId.includes("21")) return 3.2; // Pierwszy wyjazd GBA (np. 551[G]21)
        if (vId.includes("25")) return 3.1; // Ciężki gaśniczy GCBA (np. 551[G]25)
        return 3.0; // Pozostałe zastępy JRG
    }

    // OSP w Krajowym Systemie
    if (uName.includes("KSRG")) return 2.0;

    // Zwykłe OSP
    return 1.0;
}

// --- MELDUNEK Z DOJAZDU I HIERARCHIA DOWODZENIA ---
async function triggerArrivalRadioReport(ev, vehicle) {
    if (!ev.radioLogs) ev.radioLogs = [];
    createRadioWindow(ev.id);

    const newRank = getCommandRank(vehicle);
    const prevRank = ev.kdrRank || 0;

    let takeoverText = "";

    if (!ev.kdrVehicleId) {
        // Pierwsza jednostka na miejscu automatycznie zostaje KDR
        ev.kdrVehicleId = vehicle.id;
        ev.kdrUnitName = vehicle.unitName;
        ev.kdrRank = newRank;
    } else if (newRank > prevRank) {
        // Przejęcie dowodzenia przez jednostkę o wyższym priorytecie
        takeoverText = ` Dowodzenie na miejscu zdarzenia przejmuje przybyły zastęp ${vehicle.id} (${vehicle.unitName}).`;
        ev.kdrVehicleId = vehicle.id;
        ev.kdrUnitName = vehicle.unitName;
        ev.kdrRank = newRank;
    }

    const tactical = evaluateTacticalForces(ev);
    const vehiclesListStr = ev.vehicles.map(v => `${v.id} (${v.unitName})`).join(', ');

    const sysPrompt = `Jesteś dowódcą zastępu straży pożarnej (${vehicle.id} z jednostki ${vehicle.unitName}). Dojechałeś na miejsce w miejscowości ${ev.city}, adres: ${ev.street || ''}.
Zdarzenie: "${ev.desc}".
Zadysponowane siły: ${vehiclesListStr}.
KOMUNIKAT O PRZEJĘCIU DOWODZENIA (jeśli dotyczy): ${takeoverText || 'Brak zmiany KDR.'}
ZASADA HIERARCHII: OSP < OSP KSRG < JRG PSP (25 < 21 < 90) < KP PSP. 
Rozpocznij od: "Wejherowo 998, tu ${vehicle.id}." Wpleć informację o przejęciu dowodzenia na miejscu zdarzenia, jeśli powyższy komunikat na to wskazuje. Zakończ: "Bez odbioru."`;

    let reportText = "";
    try {
        reportText = await callUniversalAI(sysPrompt, "Podaj meldunek z dojazdu i informację o dowodzeniu.", false);
        reportText = reportText.replace(/^["']|["']$/g, '');
    } catch (e) {}

    if (!reportText) {
        if (takeoverText) {
            reportText = `Wejherowo 998, tu ${vehicle.id}. Dotarliśmy na miejsce (${ev.city}).${takeoverText} Prowadzimy działania. Bez odbioru.`;
        } else {
            reportText = `Wejherowo 998, tu ${vehicle.id}. Jesteśmy na miejscu (${ev.city}, ${ev.street || ''}) – potwierdzam dojazd, prowadzimy działania. Bez odbioru.`;
        }
    }

    audioMotorola.currentTime = 0;
    audioMotorola.play().catch(e => {});

    const timeStr = new Date().toLocaleTimeString();
    const initialMsg = `<div style="margin-bottom: 6px; color: #ffcc00;">[${timeStr}] ${vehicle.id} ➔ Wejherowo 998:<br>"${reportText}"</div>`;
    ev.radioLogs.push(initialMsg);

    updateRadioChatDynamic(ev.id);
    
    if (takeoverText) {
        logToMainRadio(`${vehicle.id} ➔ SKKP`, `Przejęcie dowodzenia na zdarzeniu ID ${ev.id} (${ev.city}):${takeoverText}`, '#ffaa00', false);
    }
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

    const qLower = text.toLowerCase();
    const tactical = evaluateTacticalForces(ev);
    const asksForSis = qLower.includes("siły") || qLower.includes("środki") || qLower.includes("srodki") || qLower.includes("dodatkow") || qLower.includes("zastęp") || qLower.includes("potrzeb") || qLower.includes("wystarcz");

    let aiReply = "";

    if (asksForSis && !tactical.sufficient) {
        aiReply = `Wejherowo 998, tu ${kdrName}. ${tactical.reason} Bez odbioru.`;
    } else {
        const vehiclesListStr = ev.vehicles.map(v => `${v.id} (${v.unitName} - ${v.name})`).join(', ');
        const systemPrompt = `Jesteś dowódcą akcji straży pożarnej (${kdrName}) na miejscu w miejscowości ${ev.city}, adres: ${ev.street || ''}.
Opis zdarzenia: "${ev.desc}". Zadysponowane wozy: ${vehiclesListStr}.
OCENA TAKTYCZNA SIŁ I ŚRODKÓW: ${tactical.reason}
Dyspozytor (Wejherowo 998) mówi do Ciebie przez radio: "${text}".
BEZWZGLĘDNA ZASADA: Jeśli ocena taktyczna wskazuje, że siły są NIEWYSTARCZAJĄCE, NIE WOLNO Ci powiedzieć, że są wystarczające – zażądaj dodatkowych zastępów! Lepiej mieć jeden zastęp więcej niż jeden za mało.
Format: "Wejherowo 998, tu ${kdrName}. [Krótka, konkretna odpowiedź]. Bez odbioru."`;

        try {
            aiReply = await callUniversalAI(systemPrompt, text, false);
            aiReply = aiReply.replace(/^["']|["']$/g, '');
        } catch (err) {}

        if (!aiReply) {
            aiReply = generateSmartKdrResponse(kdrName, text, ev);
        }
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

    const townStreets = realStreetsByTown[randomTown] || ["ul. Długa", "ul. Szkolna"];
    const baseStreet = townStreets[Math.floor(Math.random() * townStreets.length)];
    const houseNum = Math.floor(Math.random() * 25) + 1;
    const verifiedStreetAddress = `${baseStreet} ${houseNum}`;

    safeSetElementText('cpr-id', newCprId);
    safeSetElementText('cpr-city', randomTown);
    safeSetElementText('cpr-street', verifiedStreetAddress);
    safeSetElementText('cpr-caller', "Łączenie z 112...");
    safeSetElementText('cpr-desc', "🤖 Generowanie opisu zdarzenia...");
    
    const cprModal = document.getElementById('cpr-modal');
    if (cprModal) cprModal.style.display = 'flex';

    const sysPrompt = `Jesteś operatorem CPR 112. Wygeneruj zgłoszenie w formacie JSON (bez znaczników markdown):
{
  "caller": "Imię Nazwisko (tel. 6xx-xxx-xxx)",
  "desc": "Naturalny, potoczny opis co się dzieje (1-2 zdania). Nie pisz kodów P ani MZ."
}`;
    const usrPrompt = `Miejscowość: ${randomTown}, Adres: ${verifiedStreetAddress}, Temat: ${randomSubtype}`;

    let finalDesc = generateFallbackDescription(randomSubtype);
    let finalCaller = "Jan Kowalski (tel. 601-234-567)";

    try {
        const rawJson = await callUniversalAI(sysPrompt, usrPrompt, true);
        const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
        const cleaned = jsonMatch ? jsonMatch[0] : rawJson.replace(/```json|```/g, '').trim();
        const aiEvent = JSON.parse(cleaned);

        if (aiEvent.desc) {
            finalDesc = aiEvent.desc.replace(/^(P|MZ|AF|CW|WG|BL|ZPR)\s*-\s*/i, "").trim();
        }
        if (aiEvent.caller) {
            finalCaller = aiEvent.caller;
        }
    } catch (e) {}

    currentCPRData = {
        id: newCprId,
        city: randomTown,
        street: verifiedStreetAddress,
        type: chosenType,
        subtype: randomSubtype,
        desc: finalDesc,
        caller: finalCaller
    };

    resolveExactCoordinates(verifiedStreetAddress, randomTown).then(coords => {
        if (coords && currentCPRData && currentCPRData.id === newCprId) {
            currentCPRData.lat = coords.lat;
            currentCPRData.lng = coords.lng;
        }
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
    const exactAddr = unitExactLocations[unit.name]?.address || "";
    let vehiclesHTML = unit.vehicles.length === 0 ? `<div style="padding: 4px; color: #888; font-style: italic;">Brak pojazdów</div>` :
        unit.vehicles.map(v => `
            <div class="vehicle-row">
                <span class="status-dot ${v.status}"></span>
                <span style="color:#000000;"><b>${v.id}</b> - ${v.name}</span>
            </div>
        `).join('');

    return `
        <div class="unit-box">
            <div class="unit-header" style="color:#000000; font-weight:bold;" title="Adres: ${exactAddr}">${unit.name}</div>
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

        let timeDisplay = "";
        if (ev.status === 'FINISHED') {
            const anyReturning = ev.vehicles.some(v => v.phase === 'RETURN' && v.returnTime > 0);
            timeDisplay = anyReturning ? "Powrót SiS do bazy..." : "0:00 min (Zakończono)";
        } else if (!ev.firstArrived) {
            timeDisplay = `W drodze na miejsce... (Czas akcji: ${formatMMSS(ev.remainingSeconds)})`;
        } else {
            timeDisplay = `Działania: ${formatMMSS(ev.remainingSeconds)}`;
        }

        const fullPlace = ev.street ? `${ev.city}, ${ev.street}` : ev.city;

        tr.innerHTML = `
            <td>${ev.id}/???/2026</td>
            <td>${ev.time}</td>
            <td>${ev.jrg}</td>
            <td>${ev.jrg}</td>
            <td title="Kliknij ikonę pinezki, aby przybliżyć ulicę na mapie">${fullPlace} <span style="cursor:pointer;" onclick="event.stopPropagation(); focusEventOnMap(${ev.id});" title="Pokaż dokładną ulicę na mapie">📍</span></td>
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
        let statusText = "";
        if (v.phase === 'PREP') {
            statusText = `<span style="color: #d35400; font-weight: bold;">Alarmowanie / Wyjazd za ${v.prepTime}s</span>`;
        } else if (v.phase === 'TRAVEL') {
            statusText = `<span style="color: #b36b00; font-weight: bold;">W drodze (${formatMMSS(v.travelTime)})</span>`;
        } else if (v.phase === 'ONSITE') {
            statusText = `<span style="color: #b30000; font-weight: bold;">Na miejscu działań</span>`;
        } else if (v.phase === 'RETURN') {
            statusText = `<span style="color: #004080; font-weight: bold;">Powrót do bazy (${formatMMSS(v.returnTime)})</span>`;
        } else {
            statusText = `<span style="color: #155724; font-weight: bold;">W bazie (Wolny)</span>`;
        }
                
        return `
            <tr style="color:#000000;">
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
        infoBar.innerHTML = targetCity ? `📍 Kolejność wg odległości dla: <span style="color:#b30000;">${targetCity}</span> (1 km ≈ 30s jazdy)` : `⚠️ Brak miejscowości`;
    }

    const availableUnits = [...unitsPSP, ...unitsOSP]
        .filter(u => u.vehicles.length > 0)
        .map(u => ({ ...u, ...getUnitProximity(u.name, targetCity) }))
        .sort((a, b) => a.sec - b.sec);

    availableUnits.forEach((u, index) => {
        const isClosest = index === 0 && targetCity !== "";
        const exactAddr = unitExactLocations[u.name]?.address || "";
        const isPSP = u.name.includes("JRG") || u.name.includes("KP PSP");
        const prepRange = isPSP ? "Wyjazd: 1-5s" : "Wyjazd: 1-10s";
        const groupDiv = document.createElement('div');
        groupDiv.className = 'dispatch-unit-group';

        groupDiv.innerHTML = `
            <div class="dispatch-unit-header ${isClosest ? 'closest' : ''}" title="${exactAddr}">
                <span>${index + 1}. ${u.name} <small style="font-weight:normal; color:#333;">(${exactAddr})</small> ${isClosest ? '⭐' : ''}</span>
                <span>${u.km} | Jazda: ~${formatMMSS(u.sec)} (${prepRange})</span>
            </div>
            ${u.vehicles.map(v => `
                <label class="dispatch-vehicle-item" style="cursor:pointer; color:#000000;">
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
    const newSelection = [];

    checkboxes.forEach(cb => {
        const existing = selectedVehicles.find(sv => sv.id === cb.value);
        if (existing) {
            newSelection.push(existing);
        } else {
            [...unitsPSP, ...unitsOSP].forEach(u => {
                const v = u.vehicles.find(veh => veh.id === cb.value);
                if (v) {
                    const prepSec = generateDeparturePrepSeconds(u.name);
                    const routeSec = calculateRouteTravelSeconds(u.name, targetCity);
                    newSelection.push({
                        ...v,
                        unitName: u.name,
                        phase: 'PREP',
                        prepTime: prepSec,
                        travelTime: routeSec,
                        baseRouteSeconds: routeSec,
                        returnTime: routeSec
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
    const subtypeVal = typeVal === 'PZR' ? 'Zabezpieczenie rejonu' : (subSel ? subSel.value : '');
    
    const descInput = document.getElementById('inp-ev-desc');
    let descVal = descInput ? descInput.value : '';
    descVal = descVal.replace(/^(P|MZ|AF|CW|WG|BL|ZPR)\s*-\s*/i, "").trim();

    const streetInput = document.getElementById('inp-ev-street');
    const streetVal = streetInput ? streetInput.value.trim() : '';

    selectedVehicles.forEach(sv => {
        if (!sv.phase) {
            sv.phase = 'PREP';
            sv.prepTime = generateDeparturePrepSeconds(sv.unitName);
            const routeSec = calculateRouteTravelSeconds(sv.unitName, city);
            sv.travelTime = routeSec;
            sv.baseRouteSeconds = routeSec;
            sv.returnTime = routeSec;
        }
    });

    let targetEventObj = null;

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
        const jrgInput = document.getElementById('inp-ev-jrg');
        const fallback = gpsCoords[city] || [54.6052, 18.2345];
        const calcDuration = calculateActionDurationSeconds(descVal, subtypeVal, typeVal);

        const newEv = {
            id: events.length + 1,
            time: timeInput && timeInput.value ? timeInput.value : new Date().toLocaleTimeString(),
            city: city,
            region: regInput ? regInput.value : (locationsDatabase[city] || ''),
            street: streetVal,
            lat: fallback[0],
            lng: fallback[1],
            desc: descVal,
            type: typeVal,
            subtype: subtypeVal,
            remainingSeconds: calcDuration,
            firstArrived: false,
            radioReported: false,
            radioLogs: [],
            jrg: jrgInput ? jrgInput.value : 'JRG 1 Wejherowo',
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
            ev.city = city;
            ev.street = streetVal;
            ev.desc = descVal;
            ev.type = typeVal;
            ev.subtype = subtypeVal;
            ev.services = { ...servicesState };
            ev.vehicles = [...selectedVehicles];
            targetEventObj = ev;
        }
    }

    selectedVehicles.forEach(sv => {
        [...unitsPSP, ...unitsOSP].forEach(u => {
            const v = u.vehicles.find(veh => veh.id === sv.id);
            if (v && v.status === 'green') v.status = 'orange';
        });
    });

    if (targetEventObj) {
        geocodeEventAddress(targetEventObj);
    }

    renderUnits();
    renderEvents();
    closeModal('modal-event');
}

function triggerEventFinishAndReturn(ev) {
    if (!ev || ev.status === 'FINISHED') return;
    ev.status = 'FINISHED';
    ev.remainingSeconds = 0;

    ev.vehicles.forEach(sv => {
        if (sv.phase === 'ONSITE' || sv.phase === 'TRAVEL') {
            sv.phase = 'RETURN';
            sv.returnTime = sv.baseRouteSeconds || calculateRouteTravelSeconds(sv.unitName, ev.city);
            const approxMin = Math.max(1, Math.round(sv.returnTime / 60));

            [...unitsPSP, ...unitsOSP].forEach(u => {
                const veh = u.vehicles.find(vObj => vObj.id === sv.id);
                if (veh) veh.status = 'orange';
            });

            logToMainRadio(
                `${sv.id} ➔ Wejherowo 998`,
                `Wejherowo 998, tu ${sv.id}. Zakończyliśmy działania w miejscowości ${ev.city}${ev.street ? ' (' + ev.street + ')' : ''}, wracamy do koszar (czas powrotu ok. ${approxMin} min). Bez odbioru.`,
                '#ffcc00',
                true
            );
        } else if (sv.phase === 'PREP') {
            sv.phase = 'DONE';
            sv.returnTime = 0;
            [...unitsPSP, ...unitsOSP].forEach(u => {
                const veh = u.vehicles.find(vObj => vObj.id === sv.id);
                if (veh) veh.status = 'green';
            });
            logToMainRadio(
                `Wejherowo 998 ➔ ${sv.id}`,
                `${sv.id}, odwołuję alarm dla waszego zastępu, pozostańcie w koszarach.`,
                '#00ffff',
                false
            );
        }
    });
}

function finishCurrentEvent() {
    const targetId = activeEditingId !== null ? activeEditingId : selectedEvIdForRadio;
    if (targetId === null) return;
    const ev = events.find(e => e.id === targetId);
    if (ev) {
        triggerEventFinishAndReturn(ev);
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

// --- GŁÓWNA PĘTLA CZASU SYMULATORA ---
setInterval(() => {
    let needsRender = false;

    events.forEach(ev => {
        if (ev.status === 'ACTIVE') {
            ev.vehicles.forEach(v => {
                if (v.phase === 'PREP') {
                    if (v.prepTime > 0) {
                        v.prepTime--;
                        needsRender = true;
                    } else {
                        v.phase = 'TRAVEL';
                        const travelMin = Math.max(1, Math.round(v.travelTime / 60));
                        logToMainRadio(
                            `${v.id} ➔ Wejherowo 998`,
                            `Wejherowo 998, tu ${v.id} (${v.unitName}). Wyjeżdżamy do zdarzenia: ${ev.city}${ev.street ? ', ' + ev.street : ''} (szacowany dojazd ok. ${travelMin} min). Bez odbioru.`,
                            '#7CFC00',
                            true
                        );
                        needsRender = true;
                    }
                }
                else if (v.phase === 'TRAVEL') {
                    if (v.travelTime > 0) {
                        v.travelTime--;
                        needsRender = true;
                    } else {
                        v.phase = 'ONSITE';
                        [...unitsPSP, ...unitsOSP].forEach(u => {
                            const veh = u.vehicles.find(vObj => vObj.id === v.id);
                            if (veh) veh.status = 'red';
                        });

                        logToMainRadio(
                            `${v.id} ➔ Wejherowo 998`,
                            `Wejherowo 998, tu ${v.id}. Jesteśmy na miejscu zdarzenia w ${ev.city}${ev.street ? ' (' + ev.street + ')' : ''}. Bez odbioru.`,
                            '#ffa500',
                            true
                        );

                        if (!ev.firstArrived) {
                            ev.firstArrived = true;
                        }

                        // Każdy zastęp zgłasza dojazd i ewentualnie przejmuje dowodzenie
                        triggerArrivalRadioReport(ev, v);
                        needsRender = true;
                    }
                }
            });

            if (ev.firstArrived && ev.remainingSeconds > 0) {
                ev.remainingSeconds--;
                needsRender = true;
            } else if (ev.firstArrived && ev.remainingSeconds === 0) {
                triggerEventFinishAndReturn(ev);
                needsRender = true;
            }
        }
        else if (ev.status === 'FINISHED') {
            ev.vehicles.forEach(v => {
                if (v.phase === 'RETURN') {
                    if (v.returnTime > 0) {
                        v.returnTime--;
                        needsRender = true;
                    } else {
                        v.phase = 'DONE';
                        [...unitsPSP, ...unitsOSP].forEach(u => {
                            const veh = u.vehicles.find(vObj => vObj.id === v.id);
                            if (veh) veh.status = 'green';
                        });

                        logToMainRadio(
                            `${v.id} ➔ Wejherowo 998`,
                            `Wejherowo 998, tu ${v.id} (${v.unitName}). Zastęp w bazie, gotowy do działań. Bez odbioru.`,
                            '#00ff7f',
                            true
                        );
                        needsRender = true;
                    }
                }
            });
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
