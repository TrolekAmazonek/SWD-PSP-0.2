// =========================================================================
// PLIK 4: script.js - KOMPLETNY RDZEŃ SYMULATORA SWD + SUPABASE ONLINE
// =========================================================================

// --- INICJALIZACJA SUPABASE (BAZA DLA CIEBIE I KOLEGI) ---
const SUPABASE_URL = "https://ckfkdvwmpidbfgjvraee.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZmtkdndtcGlkYmZnanZyYWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMzg2ODksImV4cCI6MjA1NjgxODY4OX0.DWZXf6VIGWyIKxyHexxNxA_GgT9mZ2mtkdnd"; 
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Synchronizacja w czasie rzeczywistym
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

if (typeof window.callUniversalAI !== 'function') {
    window._swdKeys = { g: "Z3NrX2dEQkRQMWhzenZtVjBQc010OWlXR2d5YjNGWUhzYW5FZ2twUEg2anNIWnY2WGFyY2o0QzM=" };
    window.callUniversalAI = async function(systemPrompt, userPrompt, jsonMode = false) {
        const res = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'openai', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature: 0.8, jsonMode: jsonMode })
        });
        const data = await res.json();
        return data.choices[0].message.content.trim();
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
    const profile = COUNTY_PROFILES[currentCountyId] || RAW_PROFILES.find(r => r.id === currentCountyId);
    const pName = profile ? profile.name : currentCountyId;
    firstSpan.innerHTML = (currentUserName && currentUserName.trim() !== "")
        ? `Zalogowano jako: <b>${currentUserRank} ${currentUserName.trim()}</b> <span style="color:#0a246a; font-weight:bold; margin-left:6px;">[${pName}]</span>`
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

    events = []; selectedEvIdForRadio = null; activeEditingId = null;
    loadSimulationState().then(() => {
        updateJrgSelectOptions();
        renderUnits(); renderEvents();
    });
}

// --- ZAPIS I ODCZYT Z SUPABASE ---
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
            const { data, error } = await supabaseClient
                .from('swd_state')
                .select('data')
                .eq('id', currentCountyId)
                .single();

            if (data && data.data) {
                const remoteData = data.data;
                if (remoteData.events) events = remoteData.events;
                if (Array.isArray(remoteData.unitsPSP) && remoteData.unitsPSP.length > 0) unitsPSP = remoteData.unitsPSP;
                if (Array.isArray(remoteData.unitsOSP) && remoteData.unitsOSP.length > 0) unitsOSP = remoteData.unitsOSP;
                return true;
            }
        }
    } catch (e) {}

    try {
        const raw = localStorage.getItem(getStorageKeyForCounty(currentCountyId));
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (data.events) events = data.events;
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

function updateSubtypes(type) {
    const select = document.getElementById('inp-ev-subtype');
    if(!select) return;
    select.innerHTML = '';
    (subtypesData[type] || ["Brak"]).forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub; opt.innerText = sub;
        select.appendChild(opt);
    });
}

function openDispatchModal() {
    const container = document.getElementById('dispatch-list');
    const cityInput = document.getElementById('inp-ev-city');
    const modalDisp = document.getElementById('modal-dispatch');
    if(!container) return;
    const targetCity = cityInput ? cityInput.value.trim() : "";
    container.innerHTML = '';

    const allUnits = [...unitsPSP, ...unitsOSP]
        .filter(u => u.vehicles.length > 0)
        .map(u => ({ ...u, ...getUnitProximity(u.name, targetCity) }))
        .sort((a, b) => a.sec - b.sec);

    allUnits.forEach((u, index) => {
        const exactAddr = unitExactLocations[u.name]?.address || "";
        const groupDiv = document.createElement('div');
        groupDiv.className = 'dispatch-unit-group';

        groupDiv.innerHTML = `
            <div class="dispatch-unit-header">
                <span>${index + 1}. <b>${u.name}</b> <small>(${exactAddr})</small></span>
                <span>~${formatMMSS(u.sec)}</span>
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
    const targetCity = (cityInput && cityInput.value.trim()) ? cityInput.value.trim() : COUNTY_PROFILES[currentCountyId].defaultTown;
    const newSelection = [];

    checkboxes.forEach(cb => {
        const existing = selectedVehicles.find(sv => sv.id === cb.value);
        if (existing) {
            newSelection.push(existing);
        } else {
            [...unitsPSP, ...unitsOSP].forEach(u => {
                const v = u.vehicles.find(veh => veh.id === cb.value);
                if (v) {
                    const routeSec = calculateRouteTravelSeconds(u.name, targetCity);
                    newSelection.push({
                        ...v, unitName: u.name, phase: 'PREP', prepTime: 3,
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

function openNewEventModal() {
    activeEditingId = null;
    selectedVehicles = [];
    updateJrgSelectOptions();
    document.getElementById('modal-event-title').innerText = "Nowa Karta Zdarzenia";
    document.getElementById('inp-ev-city').value = '';
    document.getElementById('inp-ev-street').value = '';
    document.getElementById('inp-ev-desc').value = '';
    document.getElementById('lbl-selected-count').innerText = "Wybrano pojazdów: 0";
    document.getElementById('modal-event').style.display = 'flex';
}

function openEditEventModal(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    activeEditingId = id;
    selectedVehicles = [...ev.vehicles];

    document.getElementById('modal-event-title').innerText = `Edycja zdarzenia ID: ${ev.id}`;
    document.getElementById('inp-ev-city').value = ev.city;
    document.getElementById('inp-ev-street').value = ev.street || '';
    document.getElementById('inp-ev-desc').value = ev.desc || '';
    document.getElementById('lbl-selected-count').innerText = "Wybrano pojazdów: " + selectedVehicles.length;

    document.getElementById('modal-event').style.display = 'flex';
}

function saveEvent() {
    const city = document.getElementById('inp-ev-city').value.trim();
    if (!city) { alert('Podaj miejscowość!'); return; }
    
    const desc = document.getElementById('inp-ev-desc').value.trim();
    const typeVal = document.querySelector('input[name="ev-type"]:checked')?.value || 'P';
    const streetVal = document.getElementById('inp-ev-street').value.trim();

    selectedVehicles.forEach(sv => {
        if (!sv.phase) {
            sv.phase = 'PREP';
            sv.prepTime = 3;
            const routeSec = calculateRouteTravelSeconds(sv.unitName, city);
            sv.travelTime = routeSec; sv.baseRouteSeconds = routeSec; sv.returnTime = routeSec;
        }
    });

    if (activeEditingId === null) {
        const newEv = {
            id: events.length + 1,
            time: new Date().toLocaleTimeString(),
            city: city, street: streetVal, desc: desc, type: typeVal,
            remainingSeconds: 300, firstArrived: false,
            jrg: COUNTY_PROFILES[currentCountyId].jrgList[0],
            vehicles: [...selectedVehicles], status: 'ACTIVE'
        };
        events.push(newEv);
        selectEvent(newEv.id);
    } else {
        const ev = events.find(e => e.id === activeEditingId);
        if (ev) { ev.city = city; ev.street = streetVal; ev.desc = desc; ev.vehicles = [...selectedVehicles]; }
    }

    renderUnits(); renderEvents(); saveSimulationState(); closeModal('modal-event');
}

function renderUnits() {
    const pspGrid = document.getElementById('grid-psp');
    const ospGrid = document.getElementById('grid-osp');
    if(pspGrid) pspGrid.innerHTML = unitsPSP.map(u => createUnitHTML(u)).join('');
    if(ospGrid) ospGrid.innerHTML = unitsOSP.map(u => createUnitHTML(u)).join('');
}

function createUnitHTML(unit) {
    const exactAddr = unitExactLocations[unit.name]?.address || "";
    let vehiclesHTML = unit.vehicles.map(v => `
        <div class="vehicle-row">
            <span class="status-dot ${v.status}"></span>
            <span style="color:#000;"><b>${v.id}</b> - ${v.name}</span>
        </div>
    `).join('');

    return `
        <div class="unit-box">
            <div class="unit-header" style="font-weight:bold;" title="${exactAddr}">${unit.name}</div>
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
        tr.onclick = () => selectEvent(ev.id);
        tr.innerHTML = `
            <td>${ev.id}/2026</td>
            <td>${ev.time}</td>
            <td>${ev.jrg}</td>
            <td>${ev.jrg}</td>
            <td>${ev.city}${ev.street ? ', ' + ev.street : ''}</td>
            <td>${ev.vehicles.length}</td>
            <td>${ev.type}</td>
            <td>${ev.desc}</td>
            <td><b>${ev.status === 'ACTIVE' ? 'Działania w toku' : 'Zakończono'}</b></td>
            <td>-</td>
        `;
        tbody.appendChild(tr);
    });
}

function selectEvent(id) {
    selectedEvIdForRadio = id;
    const btnOpen = document.getElementById('btn-open-radio');
    if(btnOpen) btnOpen.style.display = 'block';
    renderSelectedEventDetails();
}

function renderSelectedEventDetails() {
    const ev = events.find(e => e.id === selectedEvIdForRadio);
    if (!ev) return;
    const sisBody = document.getElementById('details-sis-body');
    if (!sisBody) return;
    sisBody.innerHTML = ev.vehicles.map(v => `
        <tr><td><b>${v.id}</b> - ${v.name}</td><td>${v.obsada}</td><td>${v.unitName}</td><td>${v.phase}</td></tr>
    `).join('');
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function switchTab(tab) {
    document.getElementById('grid-psp').style.display = tab === 'PSP' ? 'grid' : 'none';
    document.getElementById('grid-osp').style.display = tab === 'OSP' ? 'grid' : 'none';
}

window.addEventListener('DOMContentLoaded', () => {
    initRealtimeSync();
    applyCountyProfile(currentCountyId);
    ensureLauncherModalExists();
    renderUnits();
});
