// =========================================================================
// PLIK 4: script.js - RDZEŃ SWD, INTERFEJS, LAUNCHER, ZAPIS I PĘTLA CZASU
// =========================================================================

// Bezpieczna inicjalizacja silnika AI (gdyby nie został załadowany we wcześniejszym pliku)
if (typeof window.callUniversalAI !== 'function') {
    window._swdKeys = {
        g: "Z3NrX2dEQkRQMWhzenZtVjBQc010OWlXR2d5YjNGWUhzYW5FZ2twUEg2anNIWnY2WGFyY2o0QzM="
    };
    window.callUniversalAI = async function(systemPrompt, userPrompt, jsonMode = false) {
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
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${atob(window._swdKeys.g)}` },
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
    };
}

function getStorageKeyForCounty(countyId) {
    return `SWDST_SAVED_SHIFT_STATE_${countyId}_V1`;
}

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

// --- LAUNCHER / EKRAN LOGOWANIA I WYBORU KOMENDY ---
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

function safeSetElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

// --- ZARZĄDZANIE SIŁAMI I ŚRODKAMI ---
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

// --- SYMULACJA ZGŁOSZEŃ Z CPR (112) ---
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
        const arr = chosenType === 'P' ? fallbackPhrasesP : fallbackPhrasesMZ;
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

startSimulationLoop();
scheduleNextAutoCPR();
renderUnits();
