import express from "express";
import { prisma } from "./db.js";

const app = express();

app.get("/", async (req, res) => {
    // Forza il refresh ogni 30 secondi lato browser
    res.write(`
    <html>
        <head>
            <meta http-equiv="refresh" content="30">
            <title>ONLEY PRO DASHBOARD</title>
            <style>
                body { 
                    background: #0a0a0a; color: #00f2ff; font-family: 'Courier New', monospace; 
                    display: flex; flex-direction: column; align-items: center; padding: 50px;
                }
                .panel { 
                    border: 5px solid #00f2ff; width: 800px; padding: 20px; 
                    background: rgba(0, 242, 255, 0.05); box-shadow: 0 0 20px #00f2ff;
                }
                h1 { border-bottom: 2px solid #00f2ff; padding-bottom: 10px; text-transform: uppercase; }
                .status-online { color: #00ff00; font-weight: bold; }
                iframe { margin-top: 20px; border: 1px solid #333; }
            </style>
        </head>
        <body>
            <div class="panel">
                <h1>🛡️ ONLEY SECURITY - GESTIONALE WEB</h1>
                <p>STATO SISTEMA: <span class="status-online">OPERATIVO</span></p>
                <hr>
                <h3>REGISTRO CARTELLINI ATTIVI</h3>
                <p>In attesa di dati dal database...</p>
                
                <iframe width="100%" height="300" src="https://www.youtube.com/embed/jfKfPfyJRdk" frameborder="0" allowfullscreen></iframe>
            </div>
        </body>
    </html>
    `);
    res.end();
});

export function startWeb() {
    app.listen(process.env.PORT || 8080, "0.0.0.0", () => {
        console.log("🌐 Dashboard Online con Auto-Refresh");
    });
}
