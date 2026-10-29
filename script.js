// --- STAŁA WERSJI APLIKACJI SWDST ---
const APP_VERSION = "SWDST 0.2";

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
    o: "c2stcHJvai1wRHZBV05wbDRnUzRzWlpFUkVSeWMtcGdqVGdXZEp1d3E5Y3pCMnhsc0JQZWd3Z3prbi16OEtidFVlQ2NxMHVlV2lnb0dhWDNpS1QzQmxia0ZKNk55MjJtWjMwTm41NnhjTlpZTYUzM3FUM3BtcUF6aGRfb3E4S2N1MTdCenRLVHQ="
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
                temperature: 0.65,
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
                temperature: 0.65,
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

// --- BAZA MIEJSCOWOŚCI I PODRODZAJÓW ---
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

const subtypesData = {
    "P": [
        "Zgłaszający widzi silne zadymienie nad lasem",
        "Pożar sadzy w przewodzie kominowym w budynku mieszkalnym",
        "Pali się trawa oraz nieużytki rolne, ogień zagraża budynkom",
        "Pożar śmietnika wolnostojącego blisko bloku",
        "Pożar samochodu osobowego na poboczu drogi",
        "Pożar poddasza w budynku mieszkalnym jednorodzinnym",
        "Pali się hala magazynowa, widoczne otwarte płomienie",
        "Pożar stogu słomy na polu rolnym",
        "Zadymienie w piwnicy budynku wielorodzinnego"
    ],
    "MZ": [
        "Kierowca samochodu osobowego uderzył w drzewo, osoba poszkodowana zakleszczona",
        "Zderzenie czołowe dwóch pojazdów na skrzyżowaniu, wyciek płynów eksploatacyjnych",
        "Silne porywy wiatru powaliły drzewo na jezdnię i linię energetyczną",
        "Podejrzenie wycieku gazu w budynku mieszkalnym, wyczuwalny silny zapach",
        "Pomoc policji w otwarciu mieszkania, brak kontaktu z starszą osobą",
        "Zgłoszenie o poszukiwaniu zaginionej osoby w kompleksie leśnym",
        "Zalana piwnica w budynku mieszkalnym po gwałtownych opadach deszczu",
        "Plama substancji ropopochodnej na jezdni na długości kilkudziesięciu metrów",
        "Usuwanie gniazda owadów błonkoskrzydłych w pobliżu szkoły"
    ],
    "AF": [
        "Fałszywy alarm z czujki dymu w obiekcie użyteczności publicznej",
        "Automatyczny alarm pożarowy z instalacji SAP w centrum handlowym",
        "Zgłoszenie alarmowe z instalacji w dobrej wierze – wyczute zadymienie"
    ],
    "CW": [
        "Wyciek nieznanej substancji chemicznej z nieszczelnej beczki na placu",
        "Zanieczyszczenie cieczy wodnej w rzece, plama na powierzchni wody"
    ],
    "WG": [
        "Wybuch gazu w budynku mieszkalnym, uszkodzona ściana działowa",
        "Rozszczelnienie butli z gazem propan-butan w pomieszczeniu"
    ],
    "BL": [
        "Nadwieszony element dachu grożący zawaleniem na chodnik",
        "Uszkodzona konstrukcja ściany szczytowej po silnym wietrze"
    ],
    "ZPR": ["Zagrożenie promieniotwórcze – zgłoszenie kontrolne aparatury"],
    "PZR": ["Zabezpieczenie rejonu operacyjnego"]
};

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

function generateDeparturePrepSeconds(unitName) {
    const isPSP = unitName.includes("JRG") || unitName.includes("KP PSP");
    return isPSP ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 10) + 1;
}

function calculateRouteTravelSeconds(unitName, city) {
    const prox = getUnitProximity(unitName, city);
    const secPerKm = 3.5 + (Math.random() * 1);
    return Math.max(5, Math.round(prox.kmNum * secPerKm));
}

function calculateActionDurationSeconds(desc, subtype, type) {
    if (type === 'PZR') return 600;
    const text = ((desc || "") + " " + (subtype || "")).toLowerCase();
    const isBigOrSearch =
        text.includes("poszukiwan") || text.includes("zaginion") || text.includes("hala") ||
        text.includes("magazyn") || text.includes("las") || text.includes("leśn") ||
        text.includes("mieszkan") || text.includes("dach") || text.includes("tartak");

    if (isBigOrSearch) return Math.floor(Math.random() * (900 - 300 + 1)) + 300;
    if (text.includes("wypadek") || text.includes("zderzenie")) return Math.floor(Math.random() * (420 - 240 + 1)) + 240;
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
        vehicles: [{ id: "559[G]63", name: "GBA 2,5/16 Volvo/Bocar", status: "green", obsada: 6 }]
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
        vehicles: [{ id: "559[G]87", name: "GBA Man TGM/Mototruck", status: "green", obsada: 6 }]
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
        item.onclick = () => openMainRadio();
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
        chat.innerHTML = mainRadioLogs.length > 0 ? mainRadioLogs.join('') : `<div style="color:#aaa; font-style:italic;">[System] Kanał główny SKKP Wejherowo 998 aktywny. Nasłuch statusów SiS...</div>`;
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

async function resolveExactCoordinates(streetAddress, townName) {
    const cleanTown = (townName || "Wejherowo").trim();
    let cleanedStreet = (streetAddress || "").replace(/^(Przystanek Autobusowy|Kamienica|Blok mieszkalny|Hala Magazynowa|Tartak)[,\s-]*/i, '').split('/')[0].trim();
    const fullQuery = cleanedStreet ? `${cleanedStreet}, ${cleanTown}, powiat wejherowski, pomorskie, Polska` : `${cleanTown}, powiat wejherowski, pomorskie, Polska`;

    try {
        const arcUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(fullQuery)}&countryCode=POL&searchExtent=17.65,54.38,18.50,54.85&maxLocations=1`;
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
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanedStreet + ' ' + cleanTown)}&lat=54.60&lon=18.23&limit=1`;
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
    const unitNames = Object.keys(unitExactLocations).filter(u => !unitExactLocations[u].locked);
    await Promise.all(unitNames.map(async (uName) => {
        const info = unitExactLocations[uName];
        const coords = await resolveExactCoordinates(info.address, info.town);
        if (coords) {
            info.lat = coords.lat;
            info.lng = coords.lng;
        }
    }));
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
        if (leafletMap && ev.lat && ev.lng) leafletMap.setView([ev.lat, ev.lng], 17);
    }, 250);
}

let leafletMap = null;
let mapMarkersLayer = null;

function ensureLeafletLoaded(callback) {
    if (window.L) { callback(); return; }
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
        const loc = unitExactLocations[u.name] || { town: "Wejherowo", address: "ul. Tartaczna 5", lat: 54.6075, lng: 18.2195 };
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
                html: `<div style="transform:translate(-50%, -50%); background:${bgBadge}; color:#000; border:2px solid ${borderColor}; border-radius:4px; padding:2px 6px; font-size:11px; font-weight:bold; white-space:nowrap; box-shadow:0 2px 5px rgba(0,0,0,0.45); cursor:pointer;">🚒 ${u.name}</div>`,
                iconSize: [0, 0], iconAnchor: [0, 0]
            })
        });
        marker.bindPopup(`<div style="min-width:220px; color:#000;"><div style="font-weight:bold; color:${borderColor}; font-size:12px;">${u.name}</div><div style="font-size:10px; color:#222; border-bottom:1px solid #ccc; margin-bottom:4px; padding-bottom:3px;">📍 ${loc.address}</div>${vehListHtml}</div>`);
        mapMarkersLayer.addLayer(marker);
    });

    events.forEach(ev => {
        if (ev.status !== 'ACTIVE') return;
        const fallback = gpsCoords[ev.city] || [54.6052, 18.2345];
        const marker = L.marker([ev.lat || fallback[0], ev.lng || fallback[1]], {
            icon: L.divIcon({
                className: '',
                html: `<div style="transform:translate(-50%, -50%); background:#ffcccc; color:#000; border:2.5px solid #b30000; border-radius:4px; padding:2px 7px; font-size:11px; font-weight:bold; white-space:nowrap; box-shadow:0 0 8px rgba(179,0,0,0.8); cursor:pointer;">🚨 [ID:${ev.id}] ${ev.city}, ${ev.street || ''}</div>`,
                iconSize: [0, 0], iconAnchor: [0, 0]
            })
        });
        marker.bindPopup(`<div style="min-width:230px; color:#000;"><b style="color:#b30000;">ZDARZENIE ID: ${ev.id}/2026 (${ev.type})</b><br><b>Adres:</b> ${ev.city}, ${ev.street || ''}<br><b>Podrodzaj:</b> ${ev.subtype || ev.desc}<br><div style="margin-top:6px; display:flex; gap:4px;"><button class="btn-win" onclick="openEditEventModal(${ev.id})">Edytuj</button><button class="btn-win" onclick="openRadioForEvent(${ev.id})">📻 Radio</button></div></div>`);
        mapMarkersLayer.addLayer(marker);
    });
}

function switchMainView(viewType) {
    let mapContainer = document.getElementById('view-map-container');
    const pspGrid = document.getElementById('grid-psp');
    const ospGrid = document.getElementById('grid-osp');
    const btnMap = document.getElementById('btn-tab-map');

    if (viewType === 'map') {
        if (pspGrid) pspGrid.style.display = 'none';
        if (ospGrid) ospGrid.style.display = 'none';
        if (mapContainer) mapContainer.style.display = 'block';
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
        if (e.target.closest('.modal-close, button')) return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        const rect = elmnt.getBoundingClientRect();
        elmnt.style.position = 'fixed';
        elmnt.style.left = rect.left + 'px';
        elmnt.style.top = rect.top + 'px';
        elmnt.style.margin = '0';
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

function injectSubtypeFieldIntoEventModal() {
    const modalWindow = document.querySelector('#modal-event .modal-window');
    if (!modalWindow || document.getElementById('inp-ev-subtype')) return;

    const formBoxes = modalWindow.querySelectorAll('.form-box');
    let targetBox = null;
    formBoxes.forEach(box => {
        const title = box.querySelector('.form-title');
        if (title && title.innerText.includes('Zdarzenie')) {
            targetBox = box;
        }
    });

    if (targetBox) {
        const subRow = document.createElement('div');
        subRow.style.cssText = 'margin-top: 6px; display: flex; flex-direction: column; gap: 2px;';
        subRow.innerHTML = `
            <label style="font-weight: bold; font-size: 11px; color: #000;">Podrodzaj:</label>
            <select id="inp-ev-subtype" style="width: 100%; padding: 3px; font-size: 11px; border: 1px solid #7f9db9; background: #fff; color: #000;"></select>
        `;
        targetBox.appendChild(subRow);
    }
}

// --- WSTRZYKIWANIE WERSJI SWDST DO PASKA STATUSU ---
function ensureVersionBadgeInStatusBar() {
    let badge = document.getElementById('swdst-version-badge');
    if (!badge) {
        const clockBox = document.getElementById('clock-box');
        if (clockBox && clockBox.parentElement) {
            badge = document.createElement('div');
            badge.id = 'swdst-version-badge';
            badge.style.cssText = 'display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: bold; color: #000; background: #ece9d8; border: 1px solid #7f9db9; margin-left: 4px; vertical-align: middle; cursor: default;';
            badge.innerText = APP_VERSION;
            clockBox.parentElement.insertBefore(badge, clockBox);
        }
    } else {
        badge.innerText = APP_VERSION;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    geocodeAllFireStationsExact();
    ensureMainRadioWindow();
    injectSubtypeFieldIntoEventModal();
    ensureVersionBadgeInStatusBar();

    document.querySelectorAll('.top-menu .menu-item').forEach(item => {
        const txt = item.innerText.trim().toLowerCase();
        if (txt.includes('siły i środki')) item.onclick = () => openSiSModal();
        else if (txt.includes('mapy')) item.onclick = () => switchMainView('map');
        else if (txt.includes('podział bojowy')) item.onclick = () => switchMainView('table');
        else if (txt.includes('zestawienia') || txt.includes('raporty')) item.onclick = () => openReportsModal();
        else if (txt.includes('komunikator') || txt.includes('urządzenia')) item.onclick = () => openMainRadio();
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

    document.querySelectorAll('input[name="ev-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateSubtypes(e.target.value);
        });
    });

    ensureSiSModalExists();
    ensureReportsModalExists();

    const eventModal = document.querySelector('#modal-event .modal-window');
    if (eventModal) makeDraggable(eventModal, document.querySelector('#modal-event .modal-header'));

    const cprModal = document.getElementById('cpr-modal');
    if (cprModal) makeDraggable(cprModal, cprModal.querySelector('.cpr-header'));
});

function updateSubtypes(type) {
    const select = document.getElementById('inp-ev-subtype');
    if (!select) return;
    select.innerHTML = '';
    const list = subtypesData[type] || ["Zgłoszenie operacyjne"];
    list.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.innerText = sub;
        select.appendChild(opt);
    });
}

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
                <div class="form-box" style="flex:1; overflow-y:auto;">
                    <div class="form-title">Wykaz jednostek i statusów pojazdów:</div>
                    <div id="sis-manager-list" style="max-height:350px; overflow-y:auto;"></div>
                </div>
            </div>
            <div style="padding: 6px; background: #e1e1e1; display: flex; justify-content: flex-end;">
                <button class="btn-win" onclick="closeModal('modal-sis')">Zamknij</button>
            </div>
        </div>
    `;
    makeDraggable(sisModal.querySelector('.modal-window'), sisModal.querySelector('.modal-header'));
}

function renderSiSManagerList() {
    const container = document.getElementById('sis-manager-list');
    if (!container) return;
    let html = `<table class="sis-table"><thead><tr><th>Jednostka</th><th>Adres</th><th>Kryptonim</th><th>Pojazd</th><th>Status</th></tr></thead><tbody>`;
    [...unitsPSP, ...unitsOSP].forEach(u => {
        const addr = unitExactLocations[u.name]?.address || "Wejherowo";
        u.vehicles.forEach(v => {
            const stText = v.status === 'green' ? 'W bazie' : (v.status === 'orange' ? 'W drodze' : 'W akcji');
            const stColor = v.status === 'green' ? '#155724' : (v.status === 'orange' ? '#b36b00' : '#b30000');
            html += `<tr><td><b>${u.name}</b></td><td style="font-size:10px;">${addr}</td><td><b>${v.id}</b></td><td>${v.name}</td><td style="color:${stColor}; font-weight:bold;">${stText}</td></tr>`;
        });
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function ensureReportsModalExists() {
    if (document.getElementById('modal-reports')) return;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modal-reports';
    modal.innerHTML = `
        <div class="modal-window" style="width: 800px; height: 550px; background: #d4d0c8; border: 2px solid #0a246a;">
            <div class="modal-header" style="background: #0a246a; color: #fff; padding: 4px 8px;">
                <span>Raporty — Statystyka</span>
                <div class="modal-close" onclick="closeModal('modal-reports')">×</div>
            </div>
            <div class="modal-body" style="padding: 8px; display: flex; flex-direction: column; gap: 8px;">
                <div><b>Zgłoszenia ogółem:</b> <span id="rep-total">0</span></div>
                <div><b>Aktywne:</b> <span id="rep-active">0</span></div>
                <div><b>Zakończone:</b> <span id="rep-finished">0</span></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    makeDraggable(modal.querySelector('.modal-window'), modal.querySelector('.modal-header'));
}

function openReportsModal() {
    ensureReportsModalExists();
    safeSetElementText('rep-total', events.length);
    safeSetElementText('rep-active', events.filter(e => e.status === 'ACTIVE').length);
    safeSetElementText('rep-finished', events.filter(e => e.status === 'FINISHED').length);
    document.getElementById('modal-reports').style.display = 'flex';
}

function evaluateTacticalForces(ev) {
    return { sufficient: true, reason: "Siły i środki zadysponowane na miejsce są wystarczające." };
}

function generateSmartKdrResponse(kdrCallsign, userQuestion, ev) {
    return `Wejherowo 998, tu ${kdrCallsign}. Sytuacja na miejscu pod kontrolą, prowadzimy działania. Bez odbioru.`;
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
        <div style="background: #c0c0c0; border: 2px solid #fff; border-right-color: #404040; border-bottom-color: #404040; box-shadow: 2px 2px 5px rgba(0,0,0,0.5); font-family: 'Segoe UI', Tahoma, sans-serif;">
            <div class="radio-win-header" style="background: linear-gradient(90deg, #004080, #1060b0); color: #fff; padding: 3px 6px; font-weight: bold; font-size: 13px; display: flex; justify-content: space-between; align-items: center; cursor: move;">
                <span>🖵 Korespondencja Radiowa - ID: ${ev.id} (${ev.city})</span>
                <button style="background: #c0c0c0; border: 1px solid #fff; cursor: pointer;" onclick="closeRadioWindow(${ev.id})">✕</button>
            </div>
            <div style="padding: 6px; background: #c0c0c0;">
                <div id="radio-chat-${evId}" style="background: #000; color: #ffcc00; font-family: 'Courier New', monospace; font-weight: bold; font-size: 12px; height: 195px; padding: 6px; overflow-y: auto; border: 2px solid #808080;"></div>
                <div style="display: flex; gap: 4px; margin-top: 6px;">
                    <input type="text" id="inp-radio-reply-${ev.id}" placeholder="Wpisz treść wiadomości..." style="flex: 1; padding: 5px; font-size: 12px;" onkeypress="if(event.key==='Enter') sendCustomInputRadio(${ev.id})">
                    <button style="padding: 5px 12px; font-size: 11px; font-weight: bold;" onclick="sendCustomInputRadio(${ev.id})">Nadaj</button>
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
}

function sendCustomInputRadio(evId) {
    const input = document.getElementById(`inp-radio-reply-${evId}`);
    if (!input || !input.value.trim()) return;
    const val = input.value.trim();
    input.value = '';

    const ev = events.find(e => e.id === evId);
    if (!ev) return;

    if (!ev.radioLogs) ev.radioLogs = [];
    ev.radioLogs.push(`<div style="margin-bottom: 6px; color: #00ff00;">[${new Date().toLocaleTimeString()}] Wejherowo 998 ➔ Zastęp:<br>"${val}"</div>`);
    ev.radioLogs.push(`<div style="margin-bottom: 6px; color: #ffcc00;">[${new Date().toLocaleTimeString()}] Zastęp ➔ Wejherowo 998:<br>"Przyjąłem, działamy na miejscu. Bez odbioru."</div>`);
    updateRadioChatDynamic(evId);
}

async function triggerArrivalRadioReport(ev, vehicle) {
    if (!ev.radioLogs) ev.radioLogs = [];
    createRadioWindow(ev.id);
    const timeStr = new Date().toLocaleTimeString();
    ev.radioLogs.push(`<div style="margin-bottom: 6px; color: #ffcc00;">[${timeStr}] ${vehicle.id} ➔ Wejherowo 998:<br>"Dotarliśmy na miejsce zdarzenia w miejscowości ${ev.city}. Prowadzimy działania. Bez odbioru."</div>`);
    updateRadioChatDynamic(ev.id);
}

function safeSetElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

async function simulateIncomingCPR() {
    audioCpr.currentTime = 0;
    audioCpr.play().catch(e => {});

    shiftStats.cprTotalGenerated++;
    const newCprId = `WCPR-2026-${cprCounter++}`;
    const randomTown = townsList[Math.floor(Math.random() * townsList.length)];
    const chosenType = Math.random() < 0.5 ? "P" : "MZ";

    const townStreets = realStreetsByTown[randomTown] || ["ul. Długa"];
    const verifiedStreetAddress = `${townStreets[Math.floor(Math.random() * townStreets.length)]} ${Math.floor(Math.random() * 25) + 1}`;

    safeSetElementText('cpr-id', newCprId);
    safeSetElementText('cpr-city', randomTown);
    safeSetElementText('cpr-street', verifiedStreetAddress);
    safeSetElementText('cpr-caller', "Łączenie z 112...");
    safeSetElementText('cpr-desc', "Generowanie treści formatki przez AI...");
    
    const cprModal = document.getElementById('cpr-modal');
    if (cprModal) cprModal.style.display = 'flex';

    let generatedDesc = "";
    try {
        const aiPrompt = `Wygeneruj realistyczną treść powiadomienia dla straży pożarnej z CPR (112). Typ: ${chosenType === 'P' ? 'Pożar' : 'Zagrożenie miejscowe'}, miejscowość: ${randomTown}. Styl jak notatka operatora, np. "zgłaszający widzi silne zadymienie nad lasem" lub "kierowca uderzył w drzewo, osoba zakleszczona". Tylko treść po polsku, maks 12 słów.`;
        generatedDesc = await callUniversalAI("Jesteś systemem WCPR.", aiPrompt, false);
        generatedDesc = generatedDesc.replace(/^["']|["']$/g, '').trim();
    } catch (e) {}

    if (!generatedDesc) {
        generatedDesc = chosenType === 'P' ? "Zgłaszający widzi silne zadymienie nad lasem" : "Kierowca samochodu osobowego uderzył w drzewo, osoba zakleszczona";
    }

    currentCPRData = {
        id: newCprId,
        city: randomTown,
        street: verifiedStreetAddress,
        type: chosenType,
        subtype: generatedDesc,
        desc: generatedDesc,
        caller: "Jan Kowalski (tel. 601-234-567)"
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
        shiftStats.refusalReasons["Zamknięto formatkę CPR"] = (shiftStats.refusalReasons["Zamknięto formatkę CPR"] || 0) + 1;
        currentCPRData = null;
    }
    const modal = document.getElementById('cpr-modal');
    if(modal) modal.style.display = 'none'; 
}

function minimizeCPR() {
    if (!currentCPRData) return;
    document.getElementById('cpr-modal').style.display = 'none';
    const bar = document.getElementById('minimized-bar');
    if(bar) {
        const item = document.createElement('div');
        item.className = 'minimized-item';
        item.innerHTML = `🚨 Zgłoszenie CPR (${currentCPRData.city})`;
        item.onclick = () => { document.getElementById('cpr-modal').style.display = 'flex'; item.remove(); };
        bar.appendChild(item);
    }
}

function acceptCPRToEvent() {
    if (!currentCPRData) return;
    shiftStats.cprAccepted++;
    openNewEventModal();

    const inpCity = document.getElementById('inp-ev-city');
    const inpReg = document.getElementById('inp-ev-region');
    const inpStreet = document.getElementById('inp-ev-street');
    const inpDesc = document.getElementById('inp-ev-desc');
    const subSel = document.getElementById('inp-ev-subtype');

    if(inpCity) inpCity.value = currentCPRData.city;
    if(inpReg) inpReg.value = locationsDatabase[currentCPRData.city] || '';
    if(inpStreet) inpStreet.value = currentCPRData.street;
    if(inpDesc) inpDesc.value = currentCPRData.desc;

    const radio = document.querySelector(`input[name="ev-type"][value="${currentCPRData.type}"]`);
    if (radio) {
        radio.checked = true;
        updateSubtypes(currentCPRData.type);
    }

    if (subSel) {
        let option = Array.from(subSel.options).find(opt => opt.value === currentCPRData.desc);
        if (!option) {
            option = document.createElement('option');
            option.value = currentCPRData.desc;
            option.innerText = currentCPRData.desc;
            subSel.appendChild(option);
        }
        subSel.value = currentCPRData.desc;
    }

    autoSelectJRGByCity(currentCPRData.city);
    closeCPR(true);
    currentCPRData = null;
}

function formatMMSS(sec) {
    if (sec < 0) return "Zabezpieczenie rejonu";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s} min`;
}

function renderUnits() {
    const pspGrid = document.getElementById('grid-psp');
    const ospGrid = document.getElementById('grid-osp');
    if(pspGrid) pspGrid.innerHTML = unitsPSP.map(u => createUnitHTML(u)).join('');
    if(ospGrid) ospGrid.innerHTML = unitsOSP.map(u => createUnitHTML(u)).join('');
}

function createUnitHTML(unit) {
    let vehiclesHTML = unit.vehicles.map(v => `
        <div class="vehicle-row">
            <span class="status-dot ${v.status}"></span>
            <span style="color:#000;"><b>${v.id}</b> - ${v.name}</span>
        </div>
    `).join('');
    return `<div class="unit-box"><div class="unit-header" style="color:#000; font-weight:bold;">${unit.name}</div><div>${vehiclesHTML}</div></div>`;
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

        let timeDisplay = ev.status === 'FINISHED' ? "Zakończono" : (!ev.firstArrived ? `Dojazd (${formatMMSS(ev.remainingSeconds)})` : `Działania: ${formatMMSS(ev.remainingSeconds)}`);
        tr.innerHTML = `<td>${ev.id}/2026</td><td>${ev.time}</td><td>${ev.jrg}</td><td>${ev.jrg}</td><td>${ev.city}, ${ev.street || ''} <span style="cursor:pointer;" onclick="event.stopPropagation(); focusEventOnMap(${ev.id});">📍</span></td><td>${ev.vehicles.length}</td><td>${ev.type}</td><td>${ev.subtype || ev.desc}</td><td><b>${timeDisplay}</b></td><td>-</td>`;
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

    sisBody.innerHTML = ev.vehicles.map(v => `
        <tr style="color:#000;">
            <td><b>${v.id}</b> - ${v.name}</td>
            <td>${v.obsada}</td>
            <td>${v.unitName}</td>
            <td><b>${v.phase}</b></td>
        </tr>
    `).join('');
}

function selectEvent(id) {
    selectedEvIdForRadio = id;
    const btnOpen = document.getElementById('btn-open-radio');
    if(btnOpen) btnOpen.style.display = 'block';
    renderEvents();
    renderSelectedEventDetails();
}

function switchTab(tab) {
    const pspGrid = document.getElementById('grid-psp');
    const ospGrid = document.getElementById('grid-osp');
    if(pspGrid) pspGrid.style.display = tab === 'PSP' ? 'grid' : 'none';
    if(ospGrid) ospGrid.style.display = tab === 'OSP' ? 'grid' : 'none';
}

function openNewEventModal() {
    activeEditingId = null;
    selectedVehicles = [];
    const radioP = document.querySelector('input[name="ev-type"][value="P"]');
    if (radioP) {
        radioP.checked = true;
        updateSubtypes('P');
    }
    document.getElementById('modal-event').style.display = 'flex';
}

function openEditEventModal(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    activeEditingId = id;
    selectedVehicles = [...ev.vehicles];
    
    document.getElementById('inp-ev-city').value = ev.city;
    document.getElementById('inp-ev-street').value = ev.street;
    document.getElementById('inp-ev-desc').value = ev.desc;
    
    const radio = document.querySelector(`input[name="ev-type"][value="${ev.type}"]`);
    if (radio) {
        radio.checked = true;
        updateSubtypes(ev.type);
    }
    const subSel = document.getElementById('inp-ev-subtype');
    if (subSel && ev.subtype) subSel.value = ev.subtype;

    document.getElementById('modal-event').style.display = 'flex';
}

function openDispatchModal() {
    const container = document.getElementById('dispatch-list');
    const cityInput = document.getElementById('inp-ev-city');
    const targetCity = cityInput ? cityInput.value.trim() : "";
    container.innerHTML = '';

    const availableUnits = [...unitsPSP, ...unitsOSP].map(u => ({ ...u, ...getUnitProximity(u.name, targetCity) })).sort((a, b) => a.sec - b.sec);

    availableUnits.forEach((u) => {
        container.innerHTML += `
            <div class="dispatch-unit-group">
                <div class="dispatch-unit-header"><span>${u.name}</span><span>${u.km}</span></div>
                ${u.vehicles.map(v => `<label class="dispatch-vehicle-item" style="color:#000;"><input type="checkbox" value="${v.id}" ${selectedVehicles.some(sv => sv.id === v.id) ? 'checked' : ''}> <b>${v.id}</b> - ${v.name}</label>`).join('')}
            </div>
        `;
    });
    document.getElementById('modal-dispatch').style.display = 'flex';
}

function confirmDispatch() {
    const checkboxes = document.querySelectorAll('#dispatch-list input:checked');
    const cityInput = document.getElementById('inp-ev-city');
    const targetCity = (cityInput && cityInput.value.trim()) ? cityInput.value.trim() : "Bolszewo";
    const newSelection = [];

    checkboxes.forEach(cb => {
        [...unitsPSP, ...unitsOSP].forEach(u => {
            const v = u.vehicles.find(veh => veh.id === cb.value);
            if (v) {
                newSelection.push({
                    ...v, unitName: u.name, phase: 'PREP',
                    prepTime: generateDeparturePrepSeconds(u.name),
                    travelTime: calculateRouteTravelSeconds(u.name, targetCity),
                    baseRouteSeconds: calculateRouteTravelSeconds(u.name, targetCity)
                });
            }
        });
    });

    selectedVehicles = newSelection;
    closeModal('modal-dispatch');
}

function saveEvent() {
    const city = document.getElementById('inp-ev-city').value.trim();
    if (!city) { alert('Podaj miejscowość!'); return; }

    const typeVal = document.querySelector('input[name="ev-type"]:checked').value;
    const subSel = document.getElementById('inp-ev-subtype');
    const subtypeVal = subSel ? subSel.value : 'Zgłoszenie operacyjne';
    const descVal = document.getElementById('inp-ev-desc').value.trim();
    const streetVal = document.getElementById('inp-ev-street').value.trim();

    selectedVehicles.forEach(sv => {
        if (!sv.phase) {
            sv.phase = 'PREP';
            sv.prepTime = generateDeparturePrepSeconds(sv.unitName);
            sv.travelTime = calculateRouteTravelSeconds(sv.unitName, city);
            sv.baseRouteSeconds = sv.travelTime;
        }
    });

    let targetEventObj = null;
    if (activeEditingId === null) {
        const newEv = {
            id: events.length + 1,
            time: new Date().toLocaleTimeString(),
            city: city,
            street: streetVal,
            desc: descVal,
            type: typeVal,
            subtype: subtypeVal,
            remainingSeconds: calculateActionDurationSeconds(descVal, subtypeVal, typeVal),
            firstArrived: false,
            radioLogs: [],
            jrg: 'JRG 1 Wejherowo',
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
            ev.vehicles = [...selectedVehicles];
            targetEventObj = ev;
        }
    }

    selectedVehicles.forEach(sv => {
        [...unitsPSP, ...unitsOSP].forEach(u => {
            const v = u.vehicles.find(veh => veh.id === sv.id);
            if (v) v.status = 'orange';
        });
    });

    if (targetEventObj) geocodeEventAddress(targetEventObj);

    renderUnits();
    renderEvents();
    closeModal('modal-event');
}

function finishCurrentEvent() {
    const targetId = activeEditingId !== null ? activeEditingId : selectedEvIdForRadio;
    if (targetId === null) return;
    const ev = events.find(e => e.id === targetId);
    if (ev) ev.status = 'FINISHED';
    renderUnits();
    renderEvents();
    closeModal('modal-event');
}

function openSiSModal() {
    renderSiSManagerList();
    document.getElementById('modal-sis').style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

setInterval(() => {
    let needsRender = false;
    events.forEach(ev => {
        if (ev.status === 'ACTIVE') {
            ev.vehicles.forEach(v => {
                if (v.phase === 'PREP') {
                    if (v.prepTime > 0) { v.prepTime--; needsRender = true; }
                    else { v.phase = 'TRAVEL'; needsRender = true; }
                } else if (v.phase === 'TRAVEL') {
                    if (v.travelTime > 0) { v.travelTime--; needsRender = true; }
                    else {
                        v.phase = 'ONSITE';
                        [...unitsPSP, ...unitsOSP].forEach(u => {
                            const veh = u.vehicles.find(vObj => vObj.id === v.id);
                            if (veh) veh.status = 'red';
                        });
                        if (!ev.firstArrived) {
                            ev.firstArrived = true;
                            triggerArrivalRadioReport(ev, v);
                        }
                        needsRender = true;
                    }
                }
            });
            if (ev.firstArrived && ev.remainingSeconds > 0) { ev.remainingSeconds--; needsRender = true; }
        }
    });

    if (needsRender) { renderUnits(); renderEvents(); }
    renderSelectedEventDetails();
    ensureVersionBadgeInStatusBar();

    const clockEl = document.getElementById('clock-box');
    if (clockEl) clockEl.innerText = new Date().toISOString().slice(0, 10) + ' ' + new Date().toLocaleTimeString();
}, 1000);

function scheduleNextAutoCPR() {
    setTimeout(() => {
        if (!document.getElementById('cpr-modal') || document.getElementById('cpr-modal').style.display !== 'flex') {
            simulateIncomingCPR();
        }
        scheduleNextAutoCPR();
    }, Math.floor(Math.random() * (90000 - 45000 + 1)) + 45000);
}

scheduleNextAutoCPR();
renderUnits();
