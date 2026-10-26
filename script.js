// --- INTEGRACJA Z GEMINI API (POPRAWIONY KONTEKST I HISTORIA) ---
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
    document.getElementById('radio-chat').innerHTML = ev.radioLogs.join('');
    input.value = '';

    const chatBox = document.getElementById('radio-chat');
    chatBox.scrollTop = chatBox.scrollHeight;

    const GEMINI_API_KEY = "AQ.Ab8RN6KojTcCLHkULYu2BmzNUuXKGV2FKO4mHymlURwCwSPh2Q";

    try {
        // Tworzymy pełną historię rozmowy dla tego zdarzenia, żeby AI wiedziało o co pytasz
        let conversationHistory = ev.radioLogs.map(log => {
            // Zamieniamy HTML na czytelny tekst dla AI
            return log.includes("Wejherowo 998") ? "Dyspozytor (Wejherowo 998): " + log.split('<br>"')[1]?.slice(0, -1) : "KDR: " + log.split('<br>"')[1]?.slice(0, -1);
        }).join("\n");

        const systemPrompt = `Jesteś Dowódcą Działania Ratowniczego (KDR) straży pożarnej na miejscu akcji w powiecie wejherowskim. 
Rozmawiasz przez radiostację ze Stanowiskiem Kierowania (Wejherowo 998).
SZCZEGÓŁY ZDARZENIA: ${ev.desc}
MIEJSCOWOŚĆ: ${ev.city}, Adres: ${ev.street}
Zadysponowane siły i środki: ${ev.vehicles.map(v => v.id + " (" + v.name + ")").join(', ')}.

ZASADY:
1. Bezwzględnie opieraj swoje odpowiedzi na opisie zdarzenia (np. jeśli palą się palety, mów o paletach i gaszeniu składowiska; jeśli jest wypadek, mów o poszkodowanych).
2. Używaj radiowego żargonu strażackiego (np. "Wejherowo 998, tu [kryptonim pierwszego wozu]...", "Przyjąłem", "Bez odbioru").
3. Odpowiadaj krótko i logicznie na to, o co pyta dyspozytor. Nigdy nie zmyślaj, że masz słabe pasmo, chyba że dyspozytor o to pyta.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: systemPrompt + "\n\nOto dotychczasowa wymiana zdań:\n" + conversationHistory + "\n\nOdpowiedz jako KDR na ostatnie pytanie dyspozytora." }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();
        let aiReply = "Wejherowo 998, tu KDR. Przyjąłem.";

        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
            aiReply = data.candidates[0].content.parts[0].text.trim();
        } else if (data.error) {
            console.error("API Error:", data.error);
            aiReply = `Wejherowo 998, tu KDR. Słyszę cię, na miejscu palą się materiały objęte zgłoszeniem (${ev.desc}). Działamy!`;
        }

        setTimeout(() => {
            audioMotorola.currentTime = 0;
            audioMotorola.play().catch(e => console.log("Audio motorola zablokowane"));

            const replyTimeStr = new Date().toLocaleTimeString();
            const respMsg = `<div class="chat-msg chat-kdr"><b>[${replyTimeStr}] ${currentRadioVehicle || 'KDR'} ➔ Wejherowo 998:</b><br>"${aiReply}"</div>`;
            
            ev.radioLogs.push(respMsg);
            document.getElementById('radio-chat').innerHTML = ev.radioLogs.join('');
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 1000);

    } catch (err) {
        console.error("Błąd sieciowy / API Gemini:", err);
        setTimeout(() => {
            audioMotorola.currentTime = 0;
            audioMotorola.play().catch(e => console.log("Audio motorola zablokowane"));

            const respMsg = `<div class="chat-msg chat-kdr"><b>[${new Date().toLocaleTimeString()}] ${currentRadioVehicle || 'KDR'} ➔ Wejherowo 998:</b><br>"Wejherowo 998, tu KDR. W związku z zdarzeniem (${ev.desc}) prowadzimy intensywne działania na miejscu."</div>`;
            ev.radioLogs.push(respMsg);
            document.getElementById('radio-chat').innerHTML = ev.radioLogs.join('');
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 1000);
    }
}
