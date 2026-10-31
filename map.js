// =========================================================================
// PLIK 2: map.js - MAPA, GEOKODER ORAZ OKIENKO WYBORU SGR
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

    closeModal('modal-sgr-select');
    alert(`✅ Pomyślnie zadysponowano zespół ${groupObj.groupName} (${addedCount} pojazdy)!`);
}

async function resolveExactCoordinates(streetAddress, townName) {
    const profile = COUNTY_PROFILES[currentCountyId];
    const cleanTown = (townName || profile.defaultTown).trim();
    let cleanedStreet = (streetAddress || "").split('/')[0].trim();
    const fullQuery = cleanedStreet ? `${cleanedStreet}, ${cleanTown}, Polska` : `${cleanTown}, Polska`;

    try {
        const arcUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(fullQuery)}&maxLocations=1`;
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

function initLeafletMap() {
    if (window.L) {
        const mapEl = document.getElementById('leaflet-map');
        if (!mapEl) return;
        const center = COUNTY_PROFILES[currentCountyId].mapCenter;
        if (!leafletMap) {
            leafletMap = L.map('leaflet-map').setView(center, 11);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(leafletMap);
            mapMarkersLayer = L.layerGroup().addTo(leafletMap);
        }
        leafletMap.invalidateSize();
    }
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
