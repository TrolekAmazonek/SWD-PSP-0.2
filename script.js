// =========================================================================
// PLIK 4: script.js - KOMPLETNY RDZEŃ SYMULATORA SWD + SUPABASE ONLINE
// =========================================================================

// --- INICJALIZACJA SUPABASE (BAZA ONLINE DLA CIEBIE I KOLEGI) ---
const SUPABASE_URL = "https://ckfkdvwmpidbfgjvraee.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZmtkdndtcGlkYmZnanZyYWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMzg2ODksImV4cCI6MjA1NjgxODY4OX0.DWZXf6VIGWyIKxyHexxNxA_GgT9mZ2mtkdnd"; 
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function initRealtimeSync() {
    if (!supabaseClient) return;
    supabaseClient
        .channel('public:swd_state')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'swd_state' }, payload => {
            if (payload.new && payload.new.data) {
                const remoteData = payload.new.data;
                if (remoteData.events) events = remoteData.events;
                if (remoteData.unitsPSP) unitsPSP = remoteData.unitsPSP;
                if (remoteData.unitsOSP) unitsOSP = remoteData.unitsOSP;
                renderUnits();
                renderEvents();
                if (typeof renderSelectedEventDetails === 'function') renderSelectedEventDetails();
            }
        })
        .subscribe();
}

// Upewnienie się, że czytanie głosowe (TTS) jest całkowicie wyłączone
if (typeof window !== 'undefined') {
    if ('speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak = function() {};
        } catch (e) {}
    }
    window.speakRadioText = function() {};
    window.speakText = function() {};
    window.playRadioTTS = function() {};
}

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

let weatherTimeoutId = null;

function getAllUnitsIncludingSgr() {
    return [...unitsPSP, ...unitsOSP, ...getCurrentRegionSgrGroups()];
}

function getStorageKeyForCounty(countyId) {
    return `SWDST_SAVED_SHIFT_STATE_${countyId}_V1`;
}

function getFormattedOperatorName() {
    return (currentUserName && currentUserName.trim() !== "")
        ? `${currentUserRank}${currentUserName.trim()}`
        : "Nazwa Użytkownika (Niezalogowany)";
}

function updateStatusBarUserDisplay() {
    const firstSpan = document.querySelector('.status-bar span');
    if (!firstSpan) return;
    const profile = COUNTY_PROFILES[currentCountyId] || RAW_PROFILES.find(r => r.id === currentCountyId);
    const pName = profile ? profile.name : currentCountyId;
    firstSpan.innerHTML = (currentUserName && currentUserName.trim() !== "")
        ? `Zalogowano jako: <b>${currentUserRank}${currentUserName.trim()}</b> <span style="color:#0a246a; font-weight:bold; margin-left:6px;">[${pName}]</span>`
        : `Zalogowano jako: <b style="color:#777; font-style:italic;">Nazwa Użytkownika</b> <span style="color:#0a246a; font-weight:bold; margin-left:6px;">[${pName}]</span>`;
}

function updateJrgSelectOptions() {
    const profile = COUNTY_PROFILES[currentCountyId];
    if (!profile) return;
    const jrgList = profile.jrgList;
    ['inp-ev-jrg', 'inp-ev-lead', 'inp-ev-area'].forEach(selId => {
        const el = document.getElementById(selId);
        if (el) el.innerHTML = jrgList.map(j => `<option value="${j}">${j}</option>`).join('');
    });
}

function ensureSgrButtonInEventModal() {
    if (document.getElementById('btn-open-sgr-modal')) return;
    const lblCount = document.getElementById('lbl-selected-count');
    const modalEv = document.getElementById('modal-event');
    if (!modalEv) return;

    const allBtns = modalEv.querySelectorAll('button');
    let dispBtn = null;
    allBtns.forEach(b => {
        if (b.innerText.trim().includes('Dyspozycja') || (b.getAttribute('onclick') || '').includes('openDispatchModal')) {
            dispBtn = b;
        }
    });

    const sgrBtn = document.createElement('button');
    sgrBtn.type = 'button';
    sgrBtn.id = 'btn-open-sgr-modal';
    sgrBtn.className = 'btn-win';
    sgrBtn.style.cssText = 'background: #fff3a1; border: 1.5px solid #b30000; color: #800000; font-weight: bold; margin-right: 6px; cursor: pointer;';
    sgrBtn.innerHTML = '🚨 Dysponuj SGR (KW PSP)';
    sgrBtn.onclick = () => openSgrModal();

    if (dispBtn && dispBtn.parentElement) {
        dispBtn.parentElement.insertBefore(sgrBtn, dispBtn);
    } else if (lblCount && lblCount.parentElement) {
        lblCount.parentElement.appendChild(sgrBtn);
    }
}

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

    getCurrentRegionSgrGroups().forEach(g => {
        g.vehicles.forEach(v => { v.status = "green"; });
    });

    events = []; selectedEvIdForRadio = null; activeEditingId = null;
    mainRadioLogs = []; cprCounter = 101;
    shiftStats = { cprTotalGenerated: 0, cprAccepted: 0, cprRefused: 0, refusalReasons: {} };
    if (typeof closeRadioWindow === 'function') {
        Object.keys(openRadioWindows).forEach(k => closeRadioWindow(k));
    }

    loadSimulationState().then(() => {
        updateJrgSelectOptions();
        renderUnits(); renderEvents(); renderSelectedEventDetails();
    });

    const mainHdr = document.querySelector('#main-radio-modal .main-radio-header span');
    if (mainHdr) mainHdr.innerText = `📻 Główne Radio SKKP (${currentCountyCallsign})`;
    if (typeof updateMainRadioChat === 'function') updateMainRadioChat();

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

// --- ZAPIS I ODCZYT ZE WSPÓLNEJ BAZI SUPABASE ---
async function saveSimulationState() {
    try {
        const stateObj = {
            version: APP_VERSION, countyId: currentCountyId, savedAt: new Date().toISOString(),
            events, unitsPSP, unitsOSP, unitExactLocations, shiftStats, cprCounter,
            mainRadioLogs: mainRadioLogs.slice(-100)
        };
        localStorage.setItem(getStorageKeyForCounty(currentCountyId), JSON.stringify(stateObj));

        if (supabaseClient) {
            await supabaseClient
                .from('swd_state')
                .upsert({ id: currentCountyId, data: stateObj });
        }
    } catch (e) {}
}

async function loadSimulationState() {
    try {
        if (supabaseClient) {
            const { data } = await supabaseClient
                .from('swd_state')
                .select('data')
                .eq('id', currentCountyId)
                .single();

            if (data && data.data) {
                const remoteData = data.data;
                if (remoteData.events) events = remoteData.events;
                if (Array.isArray(remoteData.unitsPSP) && remoteData.unitsPSP.length >= 2) unitsPSP = remoteData.unitsPSP;
                if (Array.isArray(remoteData.unitsOSP) && remoteData.unitsOSP.length >= 2) unitsOSP = remoteData.unitsOSP;
                if (remoteData.unitExactLocations) {
                    Object.keys(remoteData.unitExactLocations).forEach(k => {
                        if (!unitExactLocations[k]) unitExactLocations[k] = remoteData.unitExactLocations[k];
                    });
                }
                if (remoteData.shiftStats) shiftStats = remoteData.shiftStats;
                if (typeof remoteData.cprCounter === 'number') cprCounter = remoteData.cprCounter;
                if (Array.isArray(remoteData.mainRadioLogs)) mainRadioLogs = remoteData.mainRadioLogs;

                if (events.length > 0) {
                    selectedEvIdForRadio = events[events.length - 1].id;
                    const btnOpen = document.getElementById('btn-open-radio');
                    if (btnOpen) btnOpen.style.display = 'block';
                }
                return;
            }
        }
    } catch (e) {}

    try {
        const raw = localStorage.getItem(getStorageKeyForCounty(currentCountyId));
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.events)) return;

        events = data.events;
        if (Array.isArray(data.unitsPSP) && data.unitsPSP.length >= 2) unitsPSP = data.unitsPSP;
        if (Array.isArray(data.unitsOSP) && data.unitsOSP.length >= 2) unitsOSP = data.unitsOSP;
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
    } catch (e) {}
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
    if (!confirm("Czy na pewno chcesz zresetować obecną służbę i przywrócić pełny podział bojowy w wybranym rejonie?")) return;
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
    const clockBox = document.getElementById('clock-box');
    if (!clockBox || !clockBox.parentElement) return;

    let weatherBadge = document.getElementById('weather-status-badge');
    if (!weatherBadge) {
        weatherBadge = document.createElement('div');
        weatherBadge.id = 'weather-status-badge';
        weatherBadge.style.cssText = 'display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: bold; color: #004080; background: #eef4ff; border: 1px solid #7f9db9; margin-left: 4px; vertical-align: middle; cursor: pointer;';
        weatherBadge.title = "Aktualna pogoda w powiecie (kliknij, aby wylosować zmianę pogody)";
        weatherBadge.onclick = () => triggerWeatherChange();
        weatherBadge.innerText = currentWeatherData.label;
        clockBox.parentElement.insertBefore(weatherBadge, clockBox);
    }

    let badge = document.getElementById('swdst-version-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'swdst-version-badge';
        badge.style.cssText = 'display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: bold; color: #000; background: #ece9d8; border: 1px solid #7f9db9; margin-left: 4px; vertical-align: middle; cursor: pointer;';
        badge.title = "Kliknij, aby zmienić komendę / przelogować operatora";
        badge.onclick = () => openLauncherModal();
        badge.innerText = `${APP_VERSION} (${simSpeed}x)`;
        clockBox.parentElement.insertBefore(badge, clockBox);
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
    getAllUnitsIncludingSgr().forEach(u => {
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
                    <div style="background: #e6e6e6; border: 1px solid #999; padding: 6px;"><div style
