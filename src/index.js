import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
import { inviaPannelloCartellino } from "./panel.js";
import { startWeb } from "./web.js";
import { prisma } from "./db.js";

dotenv.config();

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
    console.log(`🛡️ LOGGED IN AS: ${client.user.tag}`); // Questo deve apparire nei log di Railway
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        // Registrazione globale dei comandi
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("✅ COMANDI SLASH SINCROIZZATI CON DISCORD");
        startWeb(); 
    } catch (err) {
        console.error("❌ ERRORE CRITICO TOKEN/COMANDI:", err);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'pannello-cartellino') {
            await inviaPannelloCartellino(interaction);
        }
    }
    // Logica tasti biometrici qui sotto...
});

client.login(process.env.DISCORD_TOKEN);
