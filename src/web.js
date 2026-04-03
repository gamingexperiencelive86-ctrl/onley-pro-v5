import express from "express";
import { prisma } from "./db.js";
import fetch from "node-fetch";
import dayjs from "dayjs";

const app = express();
const port = process.env.PORT || 8080;

app.get("/", async (req, res) => {
    try {
        // 1. Recupero Dati dal Database (Ore e Licenze)
        const logs = await prisma.timeLog.findMany({
            orderBy: { startTime: 'desc' },
            take: 20
        });

        // 2. Recupero Meteo in tempo reale (Roma)
        let meteo = { temp: "N/A", icon: "☁️" };
        try {
            const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=41.89&longitude=12.49&current_weather=true");
            const data = await response.json();
            meteo.temp = Math.round(data.current_weather.temperature) + "°C";
        } catch (e) { console.log("Errore meteo"); }

        // 3. Generazione Righe Tabella con calcolo ore
        const rows = logs.map(log => {
            const oreLavoro = (log.totalWorkMin / 60).toFixed(2);
            const statoColore = log.status === 'LAVORO' ? '#22c55e' : (log.status === 'PAUSA' ? '#eab308' : '#ef4444');
            
            return `
                <tr>
                    <td style="color: #00f2ff; font-weight: bold;">${log.username}</td>
                    <td><span style="background: ${statoColore}; color: black; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px;">${log.status}</span></td>
                    <td>${dayjs(log.startTime).format('DD/MM HH:mm')}</td>
                    <td style="color: #22c55e; font-weight: bold;">${oreLavoro}h</td>
                </tr>
            `;
        }).join("");

        // 4. Struttura HTML Professionale
        res.send(`
        <!DOCTYPE html>
        <html lang="it">
        <head>
            <meta charset="UTF-8">
            <title>ONLEY PRO | COMMAND CENTER</title>
            <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@500;700&display=swap" rel="stylesheet">
            <style>
                body { 
                    background: #050505 url('https://img.freepik.com/free-vector/abstract-neon-lights-background_23-2148907367.jpg') no-repeat center center fixed; 
                    background-size: cover; 
                    color: white; 
                    font-family: 'Rajdhani', sans-serif; 
                    margin: 0; padding: 20px; 
                }
                .overlay { background: rgba(0, 0, 0, 0.85); min-height: 100vh; width: 100%; position: fixed; top: 0; left: 0; z-index: -1; }
                
                .glass-container { 
                    max-width: 1100px; margin: auto; 
                    background: rgba(15, 15, 15, 0.9); 
                    border: 2px solid #00f2ff; 
                    border-radius: 20px; 
                    padding: 30px; 
                    box-shadow: 0 0 30px rgba(0, 242, 255, 0.3);
                }

                header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00f2ff; padding-bottom: 20px; margin-bottom: 30px; }
                h1 { font-family: 'Orbitron'; color: #00f2ff; margin: 0; text-shadow: 0 0 10px #00f2ff; }

                .meteo-box { background: #00f2ff; color: black; padding: 10px 20px; border-radius: 10px; font-weight: bold; font-family: 'Orbitron'; }

                .main-content { display: grid; grid-template-columns: 1fr 350px; gap: 30px; }

                table { width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; }
                th { background: #00f2ff; color: black; padding: 15px; text-align: left; font-family: 'Orbitron'; font-size: 13px; }
                td { padding: 15px; border-bottom: 1px solid #222; }

                .sidebar { display: flex; flex-direction: column; gap: 20px; }
                .widget { background: #111; border: 1px solid #333; padding: 15px; border-radius: 15px; }
                .widget h3 { color: #00f2ff; margin-top: 0; font-family: 'Orbitron'; font-size: 14px; }

                .yt-frame { border: 2px solid #333; border-radius: 10px; width: 100%; height: 200px; }
            </style>
        </head>
        <body>
            <div class="overlay"></div>
            <div class="glass-container">
                <header>
                    <h1>🛡️ ONLEY PRO COMMAND</h1>
                    <div class="meteo-box">ROMA: ${meteo.temp} ${meteo.icon}</div>
                </header>

                <div class="main-content">
                    <section class="table-section">
                        <table>
                            <thead>
                                <tr><th>OPERATORE</th><th>STATO</th><th>INIZIO</th><th>ORE TOTALI</th></tr>
                            </thead>
                            <tbody>
                                ${rows || '<tr><td colspan="4" style="text-align:center;">In attesa di scansioni biometriche...</td></tr>'}
                            </tbody>
                        </table>
                    </section>

                    <aside class="sidebar">
                        <div class="widget">
                            <h3>📻 ONLEY RADIO (LIVE)</h3>
                            <iframe class="yt-frame" src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1" allow="autoplay"></iframe>
                        </div>
                        <div class="widget">
                            <h3>📜 STATO LICENZA</h3>
                            <p style="color: #22c55e; font-weight: bold;">SISTEMA ATTIVO</p>
                            <small>Prossima scadenza: Database Sincronizzato</small>
                        </div>
                    </aside>
                </div>
            </div>
        </body>
        </html>
        `);
    } catch (error) {
        res.send("Inizializzazione sistema in corso... ricarica tra 5 secondi.");
    }
});

export function startWeb() {
    app.listen(port, () => console.log("🌐 Dashboard Onley Online su porta " + port));
}
