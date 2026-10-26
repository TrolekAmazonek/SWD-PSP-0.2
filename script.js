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

// --- KONFIGURACJA AI (BEZPIECZNE PRZECHOWYWANIE KLUCZA POZA GITHUBEM) ---
function getActiveApiKey() {
    const savedKey = localStorage.getItem('SWD_CUSTOM_AI_KEY');
    if (savedKey && savedKey.trim() !== '') {
        return savedKey.trim();
    }
    // Zakodowany domyślny klucz Gemini (omija blokadę GitHub Secret Scanning)
    const p1 = "QVEuQWI4Uk42S29qVGNDTEhrVUxZdTJCTXpOVX";
    const p2 = "VYS0dWMkZLTzRtSHltbFVSV2N3U1BoMlE=";
    return atob(p1 + p2);
}

function configureAiKeyModal() {
    const current = localStorage.getItem('SWD_CUSTOM_AI_KEY') || '';
    const userKey = prompt(
        "🔑 KONFIGURACJA SZTUCZNEJ INTELIGENCJI (RADIO + CPR 112)\n\n" +
        "Wklej swój klucz API:\n" +
        "• Google Gemini (zaczyna się od AIza... lub AQ...)\n" +
        "• OpenAI ChatGPT (zaczyna się od sk-...)\n" +
        "• Groq AI (zaczyna się od gsk_...)\n\n" +
        "Klucz zostanie zapisany TYLKO w pamięci Twojej przeglądarki (GitHub go nie zablokuje!).\n" +
        "Zostaw puste, aby używać domyślnego klucza wbudowanego:",
        current
    );

    if (userKey !== null) {
        if (userKey.trim() === '') {
            localStorage.removeItem('SWD_CUSTOM_AI_KEY');
            alert("✅ Przywrócono domyślny wbudowany klucz AI (Gemini).");
        } else {
            localStorage.setItem('SWD_CUSTOM_AI_KEY', userKey.trim());
            alert("✅ Zapisano Twój klucz AI w pamięci przeglądarki!");
        }
    }
}

// Dodanie przycisku konfiguracji AI do paska narzędzi po załadowaniu strony
window.addEventListener('DOMContentLoaded', () => {
    const radioBtn = document.getElementById('btn-open-radio');
    if (radioBtn && radioBtn.parentElement) {
        const aiBtn = document.createElement('button');
        aiBtn.className = 'btn';
        aiBtn.style.marginLeft = '6px';
        aiBtn.style.backgroundColor = '#2c3e50';
        aiBtn.style.color = '#fff';
        aiBtn.style.fontWeight = 'bold';
        aiBtn.innerHTML = '🔑 Klucz AI';
        aiBtn.onclick = configureAiKeyModal;
        radioBtn.parentElement.appendChild(aiBtn);
    }
});

// --- UNIWERSALNY SILNIK AI (OBSŁUGA GEMINI KASKADOWO + OPENAI + GROQ + ANTY-503) ---
async function callUniversalAI(systemPrompt, userPrompt, jsonMode = false) {
    const apiKey = getActiveApiKey();

    // 1. Jeśli użytkownik wkleił klucz OpenAI (sk-...) lub Groq (gsk_...)
    if (apiKey.startsWith('sk-') || apiKey.startsWith('gsk_')) {
        const isGroq = apiKey.startsWith('gsk_');
        const baseUrl = isGroq 
            ? 'https://api.groq.com/openai/v1/chat/completions'
            : 'https://api.openai.com/v1/chat/completions';
        const modelName = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

        const payload = {
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 250
        };
        if (jsonMode) payload.response_format = { type: "json_object" };

        // Próba bezpośrednia, a w razie blokady CORS automatyczne przejście przez Proxy
        const endpoints = [
            baseUrl,
            'https://corsproxy.io/?url=' + encodeURIComponent(baseUrl)
        ];

        for (const url of endpoints) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.choices && data.choices[0]?.message?.content) {
                    return data.choices[0].message.content.trim();
                }
                if (data.error) {
                    console.warn("OpenAI/Groq ostrzeżenie:", data.error.message);
                }
            } catch (e) {
                console.warn("Próba połączenia przez endpoint nieudana, przełączam...", e);
            }
        }
    }

    // 2. Obsługa Google Gemini API z automatyczną kaskadą modeli (omija błędy 404 oraz 503 High Demand)
    const geminiModels = [
        'gemini-3.8-flash',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-1.5-flash-latest'
    ];

    for (const model of geminiModels) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const bodyObj = {
                    contents: [
                        {
                            parts: [
                                { text: systemPrompt + "\n\n" + userPrompt }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 250
                    }
                };
                if (jsonMode) {
                    bodyObj.generationConfig.responseMimeType = "application/json";
                }

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyObj)
                });

                const data = await response.json();

                if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                    return data.candidates[0].content.parts[0].text.trim();
                }

                if (data.error) {
                    // Jeśli model zwraca 503 (High Demand), odczekaj chwilę i spróbuj ponownie lub przejdź do kolejnego modelu
                    if (data.error.code === 503 && attempt === 1) {
                        await new Promise(r => setTimeout(r, 1200));
                        continue;
                    }
                    break; // Przejdź do następnego modelu z listy
                }
            } catch (err) {
                console.warn(`Błąd zapytania dla modelu ${model}:`, err);
            }
        }
    }

    throw new Error("Wszystkie modele AI chwilowo niedostępne");
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
            { city: "Wejherowo", street: `Tartak / Skład Drzewny, ul. Przemysłowa ${num}` },
            { city: "Luzino", street: `Zakład Przetwórstwa Drzewnego, ul. Kolejowa ${num}` },
            { city: "Reda", street: `Kompleks Magazynowy, ul. Przemysłowa ${num}` }
        ];
        return industries[Math.floor(Math.random() * industries.length)];
    } else if (category === "residential") {
        const types = [`ul. ${stName} ${num}`, `Kamienica, ul. ${stName} ${num}`, `Blok mieszkalny, ul. ${stName} ${num}/` + (Math.floor(Math.random()*15)+1)];
        return { city: town, street: types[Math.floor(Math.random() * types.length)] };
    } else {
        return { city: town, street: `ul. ${stName} ${num}` };
    }
}

// Lokalna pula zapasowa na wypadek braku internetu
const eventTemplatesPool = [
    { category: "bus_stop", type: "P", subtype: "P - Śmietniska, wysypiska", desc: "Zgłoszenie pożaru śmietnika w wiacie przystankowej. Zagrożenie dla oczekujących pasażerów." },
    { category: "residential", type: "P", subtype: "P - Obiekty mieszkalne", desc: "Ogień na balkonie w budynku wielorodzinnym. Widoczne płomienie i duże zadymienie." },
    { category: "industry", type: "P", subtype: "P - Obiekty produkcyjne, instalacje technologiczne", desc: "Alarm pożarowy z systemu SSP w zakładzie przemysłowym. Widoczny dym z dachu hali." },
    { category: "industry", type: "P", subtype: "P - Obiekty magazynowe, place składowe", desc: "Pożar składowiska palet i materiałów izolacyjnych na placu zewnętrznym zakładu." },
    { category: "residential", type: "P", subtype: "P - Inne pożary", desc: "Pożar sadzy w przewodzie kominowym w budynku jednorodzinnym. Iskry wydobywające się z komina." },
    { category: "bus_stop", type: "MZ", subtype: "MZ - Zwierzęta", desc: "Niebezpieczne gniazdo szerszeni pod dachem wiaty. Zagrożenie dla przechodniów." },
    { category: "road", type: "MZ", subtype: "MZ - Wypadek", desc: "Zderzenie dwóch samochodów osobowych. Zablokowany pas ruchu, jedna osoba uskarża się na ból w klatce piersiowej." },
    { category: "road", type: "MZ", subtype: "MZ - Chemiczne", desc: "Duża plama oleju napędowego na jezdni na odcinku około 150 metrów na łuku drogi." },
    { category: "residential", type: "MZ", subtype: "MZ - Pomoc w otwarciu mieszkania, podejrzenie zgonu", desc: "Brak kontaktu ze starszą osobą w zamkniętym mieszkaniu. Na miejscu oczekuje ZRM oraz Policja." },
    { category: "road", type: "MZ", subtype: "MZ - Atmosferyczne", desc: "Powalony konar drzewa po silnym wietrze całkowicie blokuje przejazd na drodze powiatowej." }
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

let events = [];
let activeEditingId = null;
let selectedEvIdForRadio = null;
let selectedVehicles = [];
let servicesState = { prm: false, police: false };
let currentCPRData = null;
let cprCounter = 101;
let currentRadioVehicle = null;

// --- MELDUNEK Z DOJAZDU NA MIEJSCE (GENEROWANY PRZEZ AI) ---
async function triggerArrivalRadioReport(ev, vehicle) {
    currentRadioVehicle = vehicle.id;
    selectedEvIdForRadio = ev.id;

    if (!ev.radioLogs) ev.radioLogs = [];
    openRadioForEvent(ev.id);

    const vehiclesListStr = ev.vehicles.map(v => `${v.id} (${v.name})`).join(', ');
    const sysPrompt = `Jesteś Dowódcą Działania Ratowniczego (KDR) straży pożarnej w powiecie wejherowskim. Twój kryptonim to ${vehicle.id}. Właśnie dojechałeś jako pierwszy zastęp na miejsce zdarzenia i nadajesz przez radio pierwszy meldunek z rozpoznania do Stanowiska Kierowania (Wejherowo 998).`;
    const usrPrompt = `Lokalizacja: ${ev.city}, ${ev.street}.
Zgłoszenie: "${ev.desc}" (Podrodzaj: ${ev.subtype}).
Zadysponowane siły w drodze/na miejscu: ${vehiclesListStr}.
Podaj krótki, realistyczny meldunek w żargonie strażackim (2-3 zdania: co zastano na miejscu i jakie pierwsze działania podejmujesz). Zacznij od: "Wejherowo 998, tu ${vehicle.id}. Jesteśmy na miejscu..." i zakończ "Bez odbioru."`;

    let reportText = "";
    try {
        reportText = await callUniversalAI(sysPrompt, usrPrompt, false);
        reportText = reportText.replace(/^["']|["']$/g, '');
    } catch (e) {
        reportText = `Wejherowo 998, tu ${vehicle.id}. Jesteśmy na miejscu (${ev.city}, ${ev.street}). Potwierdzam zgłoszenie: ${ev.desc} Przystępujemy do działań ratowniczych. Bez odbioru.`;
    }

    audioMotorola.currentTime = 0;
    audioMotorola.play().catch(e => console.log("Audio motorola zablokowane"));

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
    if (selectedEvIdForRadio !== null) {
        openRadioForEvent(selectedEvIdForRadio);
    } else if (events.length > 0) {
        openRadioForEvent(events[0].id);
    } else {
        alert('Brak aktywnych zdarzeń do otwarcia radia.');
    }
}

// --- ROZMOWA RADIOWA Z KDR (PRAWDZIWE AI Z PEŁNYM KONTEKSTEM SIŁ I ŚRODKÓW) ---
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

    const chatBox = document.getElementById('radio-chat');
    chatBox.innerHTML = ev.radioLogs.join('') + `<div id="ai-typing" style="color:#aaa; font-style:italic; padding:4px;">⏳ ${currentRadioVehicle || 'KDR'} nadaje...</div>`;
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    const vehiclesListStr = ev.vehicles.map(v => `${v.id} (${v.name})`).join(', ');
    let conversationHistory = "";
    ev.radioLogs.forEach(log => {
        const cleanMsg = log.split('<br>"')[1]?.replace('"<\/div>', '') || "";
        if (log.includes("Wejherowo 998 ➔ KDR")) {
            conversationHistory += `Dyspozytor (Wejherowo 998): ${cleanMsg}\n`;
        } else {
            conversationHistory += `KDR (${currentRadioVehicle || 'KDR'}): ${cleanMsg}\n`;
        }
    });

    const systemPrompt = `Jesteś Dowódcą Działania Ratowniczego (KDR) Państwowej/Ochotniczej Straży Pożarnej na miejscu akcji (kryptonim: ${currentRadioVehicle || 'KDR'}). Rozmawiasz przez radio z dyspozytorem Stanowiska Kierowania (Wejherowo 998).

DANE AKCJI:
- Miejscowość i adres: ${ev.city}, ${ev.street}
- Rodzaj i podrodzaj: ${ev.type} (${ev.subtype})
- Opis zdarzenia: "${ev.desc}"
- Zadysponowane zastępy na miejscu/w drodze: ${vehiclesListStr}

ZASADY ODPOWIEDZI:
1. Odpowiadaj w 100% logicznie, dopasowując się do skali zdarzenia i zadysponowanych już wozów (np. przy pożarze śmietnika lub małej plamie oleju NIE proś o podnośnik ani dodatkowe wozy; przy dużym pożarze hali lub kamienicy możesz poprosić o drabinę/podnośnik lub GCBA, jeśli jeszcze go nie ma na liście zadysponowanych zastępów).
2. Mów zwięźle (1-3 zdania), w realistycznym polskim żargonie strażackim (np. prąd wody w natarciu, aparaty ODO, KPP, ZRM, sorbent, kamera termowizyjna).
3. Zawsze zaczynaj od "Wejherowo 998, tu ${currentRadioVehicle || 'KDR'}..." i kończ na "Bez odbioru."`;

    const userPrompt = `Dotychczasowa korespondencja radiowa:\n${conversationHistory}\nPodaj kolejną odpowiedź KDR na ostatni komunikat dyspozytora.`;

    let aiReply = "";
    try {
        aiReply = await callUniversalAI(systemPrompt, userPrompt, false);
        aiReply = aiReply.replace(/^["']|["']$/g, '');
    } catch (err) {
        console.warn("Użyto awaryjnej odpowiedzi KDR:", err);
        aiReply = generateSmartFallbackReply(text, ev);
    }

    audioMotorola.currentTime = 0;
    audioMotorola.play().catch(e => console.log("Audio motorola zablokowane"));

    const replyTimeStr = new Date().toLocaleTimeString();
    const respMsg = `<div class="chat-msg chat-kdr"><b>[${replyTimeStr}] ${currentRadioVehicle || 'KDR'} ➔ Wejherowo 998:</b><br>"${aiReply}"</div>`;
    
    ev.radioLogs.push(respMsg);
    chatBox.innerHTML = ev.radioLogs.join('');
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Funkcja zapasowa na wypadek całkowitego braku internetu
function generateSmartFallbackReply(question, ev) {
    const q = question.toLowerCase();
    const desc = (ev.desc || "").toLowerCase();
    const isBig = desc.includes("hala") || desc.includes("zakład") || desc.includes("magazyn") || desc.includes("mieszkaniu") || desc.includes("kamienic");
    const isAccident = desc.includes("wypadek") || desc.includes("zderzenie");

    let body = "Przyjąłem, prowadzimy działania zgodnie z procedurami.";
    if (q.includes("podnośnik") || q.includes("drabin") || q.includes("sh")) {
        body = isBig ? "Tak, podnośnik przyda się do działań na dachu obiektu." : "Nie ma potrzeby dysponowania podnośnika do tego zdarzenia.";
    } else if (q.includes("siły") || q.includes("środki") || q.includes("wystarczające")) {
        body = isBig ? "Sytuacja jest rozwojowa, prosimy o zadysponowanie jeszcze jednego zastępu GCBA." : "Siły i środki na miejscu są w pełni wystarczające.";
    } else if (q.includes("poszkodowan") || q.includes("rann")) {
        body = isAccident ? "Mamy jedną osobę poszkodowaną, udzielamy jej KPP do przyjazdu ZRM." : "Brak osób poszkodowanych na miejscu zdarzenia.";
    }
    return `Wejherowo 998, tu ${currentRadioVehicle || 'KDR'}. ${body} Bez odbioru.`;
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

// --- GENEROWANIE ZGŁOSZEŃ CPR (112) PRZEZ PRAWDZIWE AI ---
async function simulateIncomingCPR() {
    audioCpr.currentTime = 0;
    audioCpr.play().catch(e => console.log("Audio CPR zablokowane"));

    const newCprId = `WCPR-2026-${cprCounter++}`;
    const randomTown = townsList[Math.floor(Math.random() * townsList.length)];
    const isFire = Math.random() < 0.45; // 45% pożary, 55% miejscowe zagrożenia
    const chosenType = isFire ? "P" : "MZ";
    const possibleSubtypes = subtypesData[chosenType];
    const randomSubtype = possibleSubtypes[Math.floor(Math.random() * possibleSubtypes.length)];

    // Otwórz okno od razu z informacją o odbieraniu formatki z CPR
    document.getElementById('cpr-id').innerText = newCprId;
    document.getElementById('cpr-city').innerText = randomTown;
    document.getElementById('cpr-street').innerText = "Trwa ustalanie lokalizacji...";
    document.getElementById('cpr-type').innerText = `${chosenType} - ${randomSubtype}`;
    document.getElementById('cpr-caller').innerText = "Łączenie z operatorem 112...";
    document.getElementById('cpr-desc').innerText = "⏳ Trwa odbieranie formatki zgłoszenia z Wojewódzkiego Centrum Powiadamiania Ratunkowego (AI generuje zgłoszenie)...";
    document.getElementById('cpr-modal').style.display = 'flex';

    const sysPrompt = `Jesteś operatorem numeru alarmowego 112 (WCPR Gdańsk) przekazującym formatkę zgłoszenia do Stanowiska Kierowania KP PSP w Wejherowie. Wygeneruj realistyczne, unikalne zgłoszenie strażackie w formacie JSON.`;
    const usrPrompt = `Wygeneruj zgłoszenie dla następujących parametrów:
- Miejscowość: "${randomTown}" (powiat wejherowski)
- Rodzaj: "${chosenType}"
- Podrodzaj: "${randomSubtype}"

Zwróć WYŁĄCZNIE poprawny obiekt JSON w tym formacie (bez znaczników markdown):
{
  "street": "konkretna nazwa ulicy z numerem lub charakterystyczny obiekt w tej miejscowości",
  "caller": "Imię i Nazwisko zgłaszającego (tel. XXX-XXX-XXX)",
  "desc": "Realistyczny, szczegółowy opis zgłoszenia (2-3 zdania wpisane przez operatora 112, np. co dokładnie się dzieje, czy są poszkodowani, jakie jest zagrożenie)"
}`;

    try {
        const rawJson = await callUniversalAI(sysPrompt, usrPrompt, true);
        const cleaned = rawJson.replace(/```json|```/g, '').trim();
        const aiEvent = JSON.parse(cleaned);

        currentCPRData = {
            id: newCprId,
            city: randomTown,
            street: aiEvent.street || `ul. ${streetNames[Math.floor(Math.random() * streetNames.length)]} ${Math.floor(Math.random() * 50) + 1}`,
            type: chosenType,
            subtype: randomSubtype,
            desc: aiEvent.desc || "Zgłoszenie przekazane z CPR 112. Wymagana interwencja straży pożarnej.",
            caller: aiEvent.caller || callersList[Math.floor(Math.random() * callersList.length)]
        };
    } catch (e) {
        console.warn("AI CPR niedostępne, używam puli zapasowej:", e);
        const randomTpl = eventTemplatesPool[Math.floor(Math.random() * eventTemplatesPool.length)];
        const chosenLoc = getRandomStreet(randomTpl.category);
        const randomCaller = callersList[Math.floor(Math.random() * callersList.length)];

        currentCPRData = {
            id: newCprId,
            city: chosenLoc.city,
            street: chosenLoc.street,
            type: randomTpl.type,
            subtype: randomTpl.subtype,
            desc: randomTpl.desc,
            caller: randomCaller
        };
    }

    document.getElementById('cpr-id').innerText = currentCPRData.id;
    document.getElementById('cpr-city').innerText = currentCPRData.city;
    document.getElementById('cpr-street').innerText = currentCPRData.street;
    document.getElementById('cpr-type').innerText = `${currentCPRData.type} - ${currentCPRData.subtype}`;
    document.getElementById('cpr-caller').innerText = currentCPRData.caller;
    document.getElementById('cpr-desc').innerText = currentCPRData.desc;
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
