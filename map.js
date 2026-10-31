// =========================================================================
// PLIK 2: map.js - MAPA, GEOKODER ORAZ WZYWANIE CAŁYCH ZESPOŁÓW SGR
// =========================================================================

let leafletMap = null;
let mapMarkersLayer = null;
let stationsGeocoded = false;

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

function calculateActionDurationSeconds(desc, subtype, type, vehicles = []) {
    if (type === 'PZR') return -1;
    const text = ((desc || "") + " " + (subtype || "")).toLowerCase();
    
    const hasQuad = vehicles.some(v => v.name.toLowerCase().includes("quad") || v.id.includes("Q01"));
    const hasBoat = vehicles.some(v => v.name.toLowerCase().includes("łodzi") || v.name.toLowerCase().includes("ponton") || v.id.includes("Ł01") || v.id.includes("Ł02"));
    const hasSgrChem = vehicles.some(v => v.name.toLowerCase().includes("srchem") || v.name.toLowerCase().includes("chem"));
    const hasSgrt = vehicles.some(v => v.name.toLowerCase().includes("scrt") || v.name.toLowerCase().includes("scdz") || v.name.toLowerCase().includes("srt"));

    let baseDuration = Math.floor(Math.random() * 121) + 150;

    const isBig = /poszukiwan|zaginion|hala|hali|magazyn|zakład|produkcyjn|składowisk|tartak/.test(text);
    const isChem = /chemiczn|wyciek|substancj|kwas|rozszczelnien/.test(text);
    const isWater = /topienie|woda|jezioro|rzeka|ponton|lodzie/.test(text);
    const isAccident = /wypadek|zderzenie|zakleszcz/.test(text);

    if (isBig) baseDuration = Math.floor(Math.random() * 301) + 300;
    if (isChem) {
        if (!hasSgrChem) baseDuration *= 1.8;
        else baseDuration *= 0.7;
    }
    if (isWater && hasBoat) baseDuration *= 0.75;
    if (isAccident && hasSgrt) baseDuration *= 0.8;
    if (/poszukiwan/.test(text) && hasQuad) baseDuration *= 0.6;

    if (currentWeatherData.condition === 'DROUGHT' && /las|traw|stog|pole/.test(text)) baseDuration *= 1.3;
    if (currentWeatherData.condition === 'STORM' || currentWeatherData.condition === 'WIND') baseDuration *= 1.25;

    return Math.round(baseDuration);
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

// --- OKIENKO WYBORU CAŁYCH ZESPOŁÓW SGR ---
function openSgrModal(evId) {
    let modal = document.getElementById('modal-sgr-select');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-sgr-select';
        modal.className = 'modal-overlay';
        modal.style.cssText = 'display:flex; background:rgba(0,0,0,0.5); z-index:11000;';
        document.body.appendChild(modal);
    }

    const regionKey = (currentCountyId === 'raciborski') ? 'slaskie' : 'pomorskie';
    const groups = EXTERNAL_SPECIAL_GROUPS[regionKey];

    const chemOptions = groups.sgrchem.map((g, idx) => `<option value="chem_${idx}">${g.groupName} (${g.vehicles.map(v => v.id).join(', ')})</option>`).join('');
    const sgrtOptions = groups.sgrt.map((g, idx) => `<option value="t_${idx}">${g.groupName} (${g.vehicles.map(v => v.id).join(', ')})</option>`).join('');
    const sgrwysOptions = groups.sgrwys.map((g, idx) => `<option value="wys_${idx}">${g.groupName} (${g.vehicles.map(v => v.id).join(', ')})</option>`).join('');
    const sgrwnOptions = groups.sgrwn.map((g, idx) => `<option value="wn_${idx}">${g.groupName} (${g.vehicles.map(v => v.id).join(', ')})</option>`).join('');

    modal.innerHTML = `
        <div class="modal-window" style="width: 480px; background: #ece9d8; border: 2px solid #0a246a;">
            <div class="modal-header" style="background: #0a246a; color: #fff; padding: 4px 8px;">
                <span>🚨 Wezwanie Specjalistycznej Grupy Ratowniczej (KW / SGR)</span>
                <div class="modal-close" onclick="closeModal('modal-sgr-select')">×</div>
            </div>
            <div class="modal-body" style="padding: 12px; display:flex; flex-direction:column; gap:10px;">
                <div class="form-box" style="padding: 8px;">
                    <div class="form-title" style="margin-bottom: 4px;">Wybierz profil grupy specjalistycznej:</div>
                    <select id="sgr-type-select" style="width:100%; padding:5px;" onchange="toggleSgrDropdowns()">
                        <option value="chem">SGRChem (Ratownictwo Chemiczne)</option>
                        <option value="t">SGRT Tczew (Ratownictwo Techniczne / Dźwig Liebherr)</option>
                        <option value="wys">SGRWys Rumia (Ratownictwo Wysokościowe)</option>
                        <option value="wn">SGRWN Gdańsk / Kościerzyna (Wodno-Nurkowe)</option>
                    </select>
                </div>
                <div class="form-box" style="padding: 8px;" id="sgr-chem-box">
                    <div class="form-title" style="margin-bottom: 4px;">Dostępne zespoły SGRChem:</div>
                    <select id="sgr-chem-choice" style="width:100%; padding:5px;">${chemOptions}</select>
                </div>
                <div class="form-box" style="padding: 8px; display:none;" id="sgr-t-box">
                    <div class="form-title" style="margin-bottom: 4px;">Dostępne zespoły SGRT:</div>
                    <select id="sgr-t-choice" style="width:100%; padding:5px;">${sgrtOptions}</select>
                </div>
                <div class="form-box" style="padding: 8px; display:none;" id="sgr-wys-box">
                    <div class="form-title" style="margin-bottom: 4px;">Dostępne zespoły SGRWys:</div>
                    <select id="sgr-wys-choice" style="width:100%; padding:5px;">${sgrwysOptions}</select>
                </div>
                <div class="form-box" style="padding: 8px; display:none;" id="sgr-wn-box">
                    <div class="form-title" style="margin-bottom: 4px;">Dostępne zespoły SGRWN (Nurkowe):</div>
                    <select id="sgr-wn-choice" style="width:100%; padding:5px;">${sgrwnOptions}</select>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 4px;">
                    <button class="btn-win" style="padding: 5px 14px; font-weight: bold; background: #e2f0d9;" onclick="confirmDispatchSgr(${evId})">✔ Zadysponuj zespół</button>
                    <button class="btn-win" style="padding: 5px 10px;" onclick="closeModal('modal-sgr-select')">Anuluj</button>
                </div>
            </div>
        </div>
    `;
}

function toggleSgrDropdowns() {
    const val = document.getElementById('sgr-type-select').value;
    document.getElementById('sgr-chem-box').style.display = val === 'chem' ? 'block' : 'none';
    document.getElementById('sgr-t-box').style.display = val === 't' ? 'block' : 'none';
    document.getElementById('sgr-wys-box').style.display = val === 'wys' ? 'block' : 'none';
    document.getElementById('sgr-wn-box').style.display = val === 'wn' ? 'block' : 'none';
}

function confirmDispatchSgr(evId) {
    const ev = events.find(e => e.id === evId);
    if (!ev) return;

    const typeVal = document.getElementById('sgr-type-select').value;
    const selectId = typeVal === 'chem' ? 'sgr-chem-choice' : (typeVal === 't' ? 'sgr-t-choice' : (typeVal === 'wys' ? 'sgr-wys-choice' : 'sgr-wn-choice'));
    const selEl = document.getElementById(selectId);
    if (!selEl) return;
    
    const optVal = selEl.value;
    const idx = parseInt(optVal.split('_')[1]);

    const regionKey = (currentCountyId === 'raciborski') ? 'slaskie' : 'pomorskie';
    const groupKey = typeVal === 'chem' ? 'sgrchem' : (typeVal === 't' ? 'sgrt' : (typeVal === 'wys' ? 'sgrwys' : 'sgrwn'));
    const groupObj = EXTERNAL_SPECIAL_GROUPS[regionKey][groupKey][idx];

    if (!groupObj || !groupObj.vehicles) return;

    let addedCount = 0;
    groupObj.vehicles.forEach(vehData => {
        const already = ev.vehicles.some(v => v.id === vehData.id);
        if (!already) {
            const routeSec = calculateRouteTravelSeconds(vehData.unitName, ev.city);
            ev.vehicles.push({
                id: vehData.id,
                name: vehData.name,
                unitName: vehData.unitName,
                obsada: vehData.obsada,
                phase: 'PREP',
                prepTime: generateDeparturePrepSeconds(vehData.unitName),
                travelTime: routeSec,
                baseRouteSeconds: routeSec,
                returnTime: routeSec,
                status: 'orange'
            });
            addedCount++;
        }
    });

    if (typeof renderSelectedEventDetails === 'function') renderSelectedEventDetails();
    if (typeof renderEvents === 'function') renderEvents();
    if (typeof saveSimulationState === 'function') saveSimulationState();

    if (typeof logToMainRadio === 'function') {
        logToMainRadio(`${currentCountyCallsign} ➔ KW PSP`, `Zadysponowano specjalistyczny zespół ${groupObj.groupName} (${groupObj.vehicles.map(v => v.id).join(', ')}) do zdarzenia ID ${ev.id} (${ev.city}).`, '#00ffff', true);
    }

    closeModal('modal-sgr-select');
    alert(`✅ Pomyślnie zadysponowano zespół ${groupObj.groupName} (${addedCount} pojazdy)!`);
}

// --- GEOKODER ---
async function resolveExactCoordinates(streetAddress, townName) {
    const profile = COUNTY_PROFILES[currentCountyId];
    const cleanTown = (townName || profile.defaultTown).trim().replace(/^Gdynia\s+|^Gdańsk\s+/i, (m) => m.split(' ')[0] + ' ');
    let cleanedStreet = (streetAddress || "").replace(/^(Przystanek Autobusowy|Kamienica|Blok mieszkalny|Hala Magazynowa|Tartak \/ Skład Drzewny)[,\s-]*/i, '').split('/')[0].trim();

    const fullQuery = cleanedStreet ? `${cleanedStreet}, ${cleanTown}, ${profile.voivodeship}, Polska` : `${cleanTown}, ${profile.voivodeship}, Polska`;

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
    return null;
}

async function geocodeAllFireStationsExact() {
    if (stationsGeocoded) return;
    stationsGeocoded = true;
    const cacheKey = `SWD_EXACT_STATIONS_${currentCountyId}_V9`;
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            Object.keys(parsed).forEach(uName => {
                if (unitExactLocations[uName] && !unitExactLocations[uName].locked && parsed[uName].lat && parsed[uName].lng) {
                    unitExactLocations[uName].lat = parsed[uName].lat; unitExactLocations[uName].lng = parsed[uName].lng;
                }
            });
            updateMapMarkers(); return;
        }
    } catch (e) {}

    const unitNames = Object.keys(unitExactLocations).filter(u => !unitExactLocations[u].locked);
    const cacheToSave = {};
    await Promise.all(unitNames.map(async (uName) => {
        const info = unitExactLocations[uName];
        const coords = await resolveExactCoordinates(info.address, info.town);
        if (coords) { info.lat = coords.lat; info.lng = coords.lng; cacheToSave[uName] = { lat: info.lat, lng: info.lng }; }
    }));
    try { if (Object.keys(cacheToSave).length > 2) localStorage.setItem(cacheKey, JSON.stringify(cacheToSave)); } catch (e) {}
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
    if (typeof saveSimulationState === 'function') saveSimulationState();
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

// --- MAPA LEAFLET ---
function ensureLeafletLoaded(callback) {
    if (window.L) { callback(); return; }
    if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
    }
    const script = document.createElement('script'); script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = callback; document.head.appendChild(script);
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
        if (typeof switchTab === 'function') switchTab('PSP');
    }
}
