import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
import { inviaPannelloCartellino } from "./panel.js";
import { startWeb } from "./web.js";
import { prisma } from "./db.js";
import { timbra, pausa, rientra, stimbra } from "./commands/clock.js";

dotenv.config();

// INSERISCI QUI IL TUO ID UTENTE DISCORD
const PROPRIETARIO_ID = "945771887340978246"; 

const client = new Client({ intents: [3276799] });

const commands = [
    new SlashCommandBuilder().setName('pannello-cartellino').setDescription('Invia il terminale biometrico'),
    new SlashCommandBuilder().setName('stato-licenza').setDescription('Controlla la licenza del server'),
    new SlashCommandBuilder().setName('attiva-licenza').setDescription('Attiva licenza (Solo Proprietario)')
        .addStringOption(o => o.setName('server_id').setDescription('ID Server').setRequired(true))
        .addIntegerOption(o => o.setName('mesi').setDescription('Mesi').setRequired(true))
].map(c => c.toJSON());

client.once(Events.ClientReady, async () => {
    console.log(`🛡️ BOT ONLINE: ${client.user.tag}`);
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("✅ COMANDI SINCRONIZZATI");
        startWeb(); 
    } catch (err) { console.error("Errore comandi:", err); }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    await interaction.deferReply({ flags: [64] });

    try {
        if (interaction.commandName === 'attiva-licenza') {
            if (interaction.user.id !== PROPRIETARIO_ID) return interaction.editReply("❌ Non autorizzato.");
            const gId = interaction.options.getString('server_id');
            const mesi = interaction.options.getInteger('mesi');
            const scadenza = new Date();
            scadenza.setMonth(scadenza.getMonth() + mesi);

            await prisma.license.upsert({
                where: { guildId: gId },
                update: { expiresAt: scadenza, active: true },
                create: { guildId: gId, expiresAt: scadenza }
            });
            return interaction.editReply(`✅ Licenza attivata per ${gId} fino al ${scadenza.toLocaleDateString('it-IT')}`);
        }

        if (interaction.commandName === 'stato-licenza') {
            const lic = await prisma.license.findUnique({ where: { guildId: interaction.guildId } });
            if (!lic) return interaction.editReply("❌ Nessuna licenza per questo server.");
            const scad = new Date(lic.expiresAt);
            return interaction.editReply(`📊 Licenza valida fino al: \`${scad.toLocaleDateString('it-IT')}\``);
        }

        if (interaction.commandName === 'pannello-cartellino') {
            const lic = await prisma.license.findUnique({ where: { guildId: interaction.guildId } });
            if (!lic || new Date(lic.expiresAt) < new Date()) return interaction.editReply("❌ Licenza assente o scaduta.");
            await inviaPannelloCartellino(interaction);
            await interaction.editReply("✅ Pannello inviato.");
        }
    } catch (err) {
        console.error("ERRORE:", err);
        await interaction.editReply("❌ Errore critico database.");
    }
});

client.login(process.env.DISCORD_TOKEN);
