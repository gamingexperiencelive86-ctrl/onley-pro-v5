import express from "express";
import { prisma } from "./db.js";

const app = express();

app.get("/", async (req, res) => {
    const logs = await prisma.timeLog.findMany({ take: 10, orderBy: { startTime: 'desc' } });

    res.send(`
    <html>
        <head>
            <meta http-equiv="refresh" content="10"> <title>ONLEY PRO DASHBOARD</title>
            <style>
                body { 
                    background: #050505 url('https://img.freepik.com/free-vector/abstract-neon-lights-background_23-2148907367.jpg') no-repeat center center fixed; 
                    background-size: cover; color: #00f2ff; font-family: 'Orbitron', sans-serif; padding: 40px;
                }
                .main-box { 
                    background: rgba(0,0,0,0.9); border: 3px solid #00f2ff; padding: 25px; 
                    border-radius: 0px; box-shadow: 0 0 25px #00f2ff; width: 900px; margin: auto;
                }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #00f2ff; color: #000; padding: 12px; text-align: left; }
                td { border-bottom: 1px solid #00f2ff; padding: 12px; }
                .yt-player { margin-top: 30px; border: 2px solid #00f2ff; }
            </style>
        </head>
        <body>
            <div class="main-box">
                <h1>🛡️ TERMINALE DI CONTROLLO ONLEY</h1>
                <p>SISTEMA: <span style="color: #00ff00;">ONLINE</span> | METEO ROMA: Sincronizzazione...</p>
                <hr style="border-color: #00f2ff;">
                
                <table>
                    <tr><th>OPERATORE</th><th>STATO</th><th>INIZIO</th><th>ORE TOTALI</th></tr>
                    ${logs.length > 0 ? logs.map(l => `<tr><td>${l.username}</td><td>${l.status}</td><td>${l.startTime}</td><td>${l.totalWorkMin}m</td></tr>`).join('') : '<tr><td colspan="4">In attesa di scansioni...</td></tr>'}
                </table>

                <div class="yt-player">
                    <iframe width="100%" height="315" src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1" frameborder="0" allowfullscreen></iframe>
                </div>
            </div>
        </body>
    </html>
    `);
});

export function startWeb() {
    app.listen(process.env.PORT || 8080, "0.0.0.0", () => {
        console.log("🌐 Dashboard Web Online e Reattiva");
    });
}
