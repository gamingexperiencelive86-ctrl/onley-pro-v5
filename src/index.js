import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
import { inviaPannelloCartellino } from "./panel.js";
import { startWeb } from "./web.js";
import { prisma } from "./db.js";

dotenv.config();

// METTI IL TUO ID DISCORD QUI SOTTO
const PROPRIETARIO_ID = "945771887340978246"; 

const client = new Client({ intents: [3276799] });

const commands = [
    new SlashCommandBuilder().setName('pannello-cartellino').setDescription('Invia il terminale biometrico'),
    new SlashCommandBuilder().setName('attiva-licenza').setDescription('Attiva licenza')
        .addStringOption(o => o.setName('server_id').setDescription('ID Server').setRequired(true))
        .addIntegerOption(o => o.setName('mesi').setDescription('Mesi').setRequired(true))
].map(c => c.toJSON());

client.once(Events.ClientReady, async () => {
    console.log(`🛡️ BOT ONLINE: ${client.user.tag}`);
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("✅ COMANDI CARICATI");
        startWeb(); 
    } catch (err) { console.error(err); }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // --- TRUCCO ANTI-FAIL ---
    // Questa riga dice a Discord: "Sto lavorando, non chiudere la connessione!"
    await interaction.deferReply({ ephemeral: true });

    try {
        if (interaction.commandName === 'attiva-licenza') {
            if (interaction.user.id !== PROPRIETARIO_ID) return interaction.editReply("❌ Non sei il proprietario.");
            
            const gId = interaction.options.getString('server_id');
            const mesi = interaction.options.getInteger('mesi');
            const scadenza = new Date();
            scadenza.setMonth(scadenza.getMonth() + mesi);

            await prisma.license.upsert({
                where: { guildId: gId },
                update: { expiresAt: scadenza },
                create: { guildId: gId, expiresAt: scadenza }
            });
            return interaction.editReply(`✅ Licenza attivata per ${gId} fino al ${scadenza.toLocaleDateString()}`);
        }

        if (interaction.commandName === 'pannello-cartellino') {
            const lic = await prisma.license.findUnique({ where: { guildId: interaction.guildId } });
            
            if (!lic || lic.expiresAt < new Date()) {
                return interaction.editReply("❌ Licenza non attiva per questo server.");
            }

            // Inviamo il pannello e confermiamo
            await inviaPannelloCartellino(interaction);
            await interaction.editReply("✅ Pannello inviato con successo.");
        }
    } catch (err) {
        console.error("ERRORE DB:", err);
        await interaction.editReply("❌ Errore di connessione al database. Riprova tra 10 secondi.");
    }
});

client.login(process.env.DISCORD_TOKEN);
