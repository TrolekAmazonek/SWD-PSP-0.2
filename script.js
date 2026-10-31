// =========================================================================
// PLIK 4: script.js - OBSŁUGA SGR W DYSPOZYCJI ORAZ CHECKBOXE PRM/POLICJA
// =========================================================================

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

function getStorageKeyForCounty(countyId) { return `SWDST_SAVED_SHIFT_STATE_${countyId}_V1`; }

function updateStatusBarUserDisplay() {
    const firstSpan = document.querySelector('.status-bar span');
    if (!firstSpan) return;
    const profile = COUNTY_PROFILES[currentCountyId] || RAW_PROFILES[0];
    firstSpan.innerHTML = `Zalogowano jako: <b>${currentUserRank} ${currentUserName || 'Dyspozytor'}</b> <span style="color:#0a246a; font-weight:bold; margin-left:6px;">[${profile.name}]</span>`;
}

function updateJrgSelectOptions() {
    const profile = COUNTY_PROFILES[currentCountyId];
    if (!profile) return;
    ['inp-ev-jrg', 'inp-ev-lead', 'inp-ev-area'].forEach(selId => {
        const el = document.getElementById(selId);
        if (el) el.innerHTML = profile.jrgList.map(j => `<option value="${j}">${j}</option>`).join('');
    });
}

function ensureLauncherModalExists() {
    if (document.getElementById('modal-launcher')) return;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modal-launcher';
    modal.style.cssText = 'display:flex; background:rgba(10, 36, 106, 0.45); z-index:12000;';

    const radiosHtml = RAW_PROFILES.map((rp, idx) => `
        <label style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; border: 1.5px solid #0a246a; background: ${idx === 0 ? '#f0f5ff' : '#ffffff'}; cursor: pointer;">
            <input type="radio" name="launcher-county" value="${rp.id}" ${idx === 0 ? 'checked' : ''}>
            <div>
                <div style="font-weight: bold; color: #0a246a; font-size: 12px;">${rp.name}</div>
                <div style="font-size: 10px; color: #444;">${rp.desc}</div>
            </div>
        </label>
    `).join('');

    modal.innerHTML = `
        <div class="modal-window" style="width: 500px; background: #ece9d8; border: 2px solid #0a246a;">
            <div class="modal-header" style="background: #0a246a; color: #fff; padding: 6px;">Wybór Rejonu Operacyjnego</div>
            <div class="modal-body" style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; flex-direction: column; gap: 5px; max-height: 280px; overflow-y: auto;">${radiosHtml}</div>
                <button class="btn-win" style="padding: 8px; font-weight: bold; background: #e2f0d9;" onclick="confirmLauncherLogin()">🚀 Rozpocznij Służbę</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function openLauncherModal() {
    ensureLauncherModalExists();
    document.getElementById('modal-launcher').style.display = 'flex';
}

function confirmLauncherLogin() {
    const chosen = document.querySelector('input[name="launcher-county"]:checked');
    const newCountyId = chosen ? chosen.value : "wejherowski";
    applyCountyProfile(newCountyId);
    document.getElementById('modal-launcher').style.display = 'none';
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
    loadSimulationState();
    updateJrgSelectOptions();
    renderUnits(); renderEvents();
}

function saveSimulationState() {
    try {
        localStorage.setItem(`SWDST_STATE_${currentCountyId}`, JSON.stringify({ events, unitsPSP, unitsOSP }));
    } catch (e) {}
}

function loadSimulationState() {
    try {
        const raw = localStorage.getItem(`SWDST_STATE_${currentCountyId}`);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.events) events = data.events;
        if (data.unitsPSP) unitsPSP = data.unitsPSP;
        if (data.unitsOSP) unitsOSP = data.unitsOSP;
    } catch (e) {}
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

function toggleService(service) {
    servicesState[service] = !servicesState[service];
    const btn = document.getElementById(service === 'prm' ? 'btn-service-prm' : 'btn-service-police');
    if (btn) {
        if (servicesState[service]) btn.classList.add('active');
        else btn.classList.remove('active');
    }
}

// --- DYSPOZYCJA ZASTĘPÓW I SGR ---
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

function openEditEventModal(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    activeEditingId = id;
    selectedVehicles = [...ev.vehicles];
    servicesState = { ...(ev.services || { prm: false, police: false }) };

    const btnPrm = document.getElementById('btn-service-prm');
    const btnPol = document.getElementById('btn-service-police');
    if (btnPrm) { if (servicesState.prm) btnPrm.classList.add('active'); else btnPrm.classList.remove('active'); }
    if (btnPol) { if (servicesState.police) btnPol.classList.add('active'); else btnPol.classList.remove('active'); }

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
            services: { ...servicesState },
            vehicles: [...selectedVehicles], status: 'ACTIVE'
        };
        events.push(newEv);
        selectEvent(newEv.id);
    } else {
        const ev = events.find(e => e.id === activeEditingId);
        if (ev) { ev.city = city; ev.street = streetVal; ev.desc = desc; ev.services = { ...servicesState }; ev.vehicles = [...selectedVehicles]; }
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
        
        let servicesText = [];
        if (ev.services?.prm) servicesText.push('PRM');
        if (ev.services?.police) servicesText.push('Policja');

        tr.innerHTML = `
            <td>${ev.id}/2026</td>
            <td>${ev.time}</td>
            <td>${ev.jrg}</td>
            <td>${ev.jrg}</td>
            <td>${ev.city}${ev.street ? ', ' + ev.street : ''}</td>
            <td>${ev.vehicles.length}</td>
            <td>${ev.type}</td>
            <td>${ev.desc} ${servicesText.length > 0 ? `<span style="color:#004080; font-size:10px;">[Służby: ${servicesText.join(', ')}]</span>` : ''}</td>
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
    applyCountyProfile(currentCountyId);
    ensureLauncherModalExists();
    renderUnits();
});
