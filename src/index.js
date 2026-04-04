import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
import { inviaPannelloCartellino } from "./panel.js";
import { startWeb } from "./web.js";
import { prisma } from "./db.js";

dotenv.config();

// Sostituisci con il tuo ID numerico (es. "123456789012345678")
const PROPRIETARIO_ID = "945771887340978246"; 

const client = new Client({ 
    intents: [3276799] 
});

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
        console.log("✅ COMANDI REGISTRATI");
        startWeb(); 
    } catch (err) {
        console.error("❌ ERRORE AVVIO:", err);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // RISPOSTA IMMEDIATA PER EVITARE IL TIMEOUT
    await interaction.deferReply({ ephemeral: true });

    try {
        if (interaction.commandName === 'attiva-licenza') {
            if (interaction.user.id !== PROPRIETARIO_ID) {
                return interaction.editReply("❌ Accesso negato.");
            }
            
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
                return interaction.editReply("❌ Licenza mancante o scaduta.");
            }
            // Usiamo followUp o editReply per mandare il pannello
            await inviaPannelloCartellino(interaction);
            await interaction.editReply("✅ Terminale caricato.");
        }
    } catch (err) {
        console.error(err);
        await interaction.editReply("❌ Errore interno nel database.");
    }
});

client.login(process.env.DISCORD_TOKEN);
