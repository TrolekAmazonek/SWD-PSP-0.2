// --- MELDUNEK Z DOJAZDU I HIERARCHIA DOWODZENIA (OSP < OSP KSRG < PSP < KP PSP) ---
async function triggerArrivalRadioReport(ev, vehicle) {
    if (!ev.radioLogs) ev.radioLogs = [];
    createRadioWindow(ev.id);

    const isPSPNew = vehicle.unitName.includes("JRG") || vehicle.unitName.includes("KP PSP");
    const isKSRGNew = vehicle.unitName.includes("KSRG");
    
    let takeoverText = "";
    let isNewKDR = false;

    // Ocena hierarchii dowodzenia (OSP < OSP KSRG < PSP < KP PSP)
    if (!ev.kdrVehicleId) {
        // Pierwszy zastęp na miejscu automatycznie zostaje KDR
        ev.kdrVehicleId = vehicle.id;
        ev.kdrUnitName = vehicle.unitName;
        ev.kdrIsPSP = isPSPNew;
        ev.kdrIsKSRG = isKSRGNew;
        isNewKDR = true;
    } else {
        const prevIsPSP = ev.kdrIsPSP;
        const prevIsKSRG = ev.kdrIsKSRG;

        if (isPSPNew && !prevIsPSP) {
            // PSP / KP PSP przejmuje dowodzenie od OSP / OSP KSRG
            takeoverText = ` Dowodzenie na miejscu zdarzenia przejmuje przybyły zastęp Państwowej Straży Pożarnej ${vehicle.id}.`;
            ev.kdrVehicleId = vehicle.id;
            ev.kdrUnitName = vehicle.unitName;
            ev.kdrIsPSP = true;
            ev.kdrIsKSRG = true;
            isNewKDR = true;
        } else if (isKSRGNew && !prevIsPSP && !prevIsKSRG) {
            // OSP KSRG przejmuje dowodzenie od zwykłego OSP
            takeoverText = ` Dowodzenie na miejscu zdarzenia przejmuje zastęp OSP KSRG ${vehicle.id}.`;
            ev.kdrVehicleId = vehicle.id;
            ev.kdrUnitName = vehicle.unitName;
            ev.kdrIsPSP = false;
            ev.kdrIsKSRG = true;
            isNewKDR = true;
        }
    }

    const tactical = evaluateTacticalForces(ev);
    const vehiclesListStr = ev.vehicles.map(v => `${v.id} (${v.unitName})`).join(', ');

    const sysPrompt = `Jesteś dowódcą zastępu straży pożarnej (${vehicle.id} z jednostki ${vehicle.unitName}). Dojechałeś na miejsce w miejscowości ${ev.city}, adres: ${ev.street || ''}.
Zdarzenie: "${ev.desc}".
Zadysponowane siły: ${vehiclesListStr}.
KOMUNIKAT O PRZEJĘCIU DOWODZENIA (jeśli dotyczy): ${takeoverText || 'Brak zmiany KDR.'}
ZASADA HIERARCHII: OSP < OSP KSRG < PSP. 
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

    // Odświeżenie okna radia przypisanego do zdarzenia
    updateRadioChatDynamic(ev.id);
    
    // Jeśli nastąpiło przejęcie dowodzenia, wysyłamy też wpis do Radia Głównego SKKP
    if (takeoverText) {
        logToMainRadio(`${vehicle.id} ➔ SKKP`, `Przejęcie dowodzenia na zdarzeniu ID ${ev.id} (${ev.city}):${takeoverText}`, '#ffaa00', false);
    }
}
