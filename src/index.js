import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
import { inviaPannelloCartellino } from "./panel.js";
import { startWeb } from "./web.js";
import { prisma } from "./db.js";

dotenv.config();

// Intents completi per non avere errori di permessi
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ] 
});

const commands = [
    new SlashCommandBuilder().setName('pannello-cartellino').setDescription('Invia il terminale biometrico'),
    new SlashCommandBuilder().setName('attiva-licenza').setDescription('Attiva licenza')
        .addStringOption(o => o.setName('server_id').setDescription('ID Server').setRequired(true))
        .addIntegerOption(o => o.setName('mesi').setDescription('Mesi').setRequired(true))
].map(c => c.toJSON());

client.once(Events.ClientReady, async () => {
    console.log(`🛡️ SISTEMA ONLEY PRO V5 - Accesso come: ${client.user.tag}`);
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("✅ Comandi Slash registrati correttamente.");
        startWeb(); 
    } catch (err) {
        console.error("❌ Errore inizializzazione:", err);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    // Gestione Comandi Slash
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'pannello-cartellino') {
            await inviaPannelloCartellino(interaction);
        }
    }

    // Gestione Tasti (Biometrici)
    if (interaction.isButton()) {
        console.log(`Tasto premuto: ${interaction.customId} da ${interaction.user.username}`);
        await interaction.reply({ content: "🧬 Scansione biometrica in corso...", ephemeral: true });
        // Qui collegheremo clock.js nel prossimo passaggio
    }
});

client.login(process.env.DISCORD_TOKEN);
