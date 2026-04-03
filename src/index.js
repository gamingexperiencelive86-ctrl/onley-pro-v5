import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
import { inviaPannelloCartellino } from "./panel.js";
import { startWeb } from "./web.js";
import { prisma } from "./db.js";

dotenv.config();

const client = new Client({ intents: [3276799] });

// Comandi Slash
const commands = [
    new SlashCommandBuilder().setName('pannello-cartellino').setDescription('Invia il terminale biometrico'),
    new SlashCommandBuilder().setName('attiva-licenza').setDescription('Attiva licenza (Solo proprietario)')
        .addStringOption(o => o.setName('server_id').setDescription('ID Server').setRequired(true))
        .addIntegerOption(o => o.setName('mesi').setDescription('Mesi').setRequired(true))
].map(c => c.toJSON());

client.once(Events.ClientReady, async () => {
    console.log("🚀 ONLEY PRO V5 ATTIVO");
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    startWeb(); 
});

client.on(Events.InteractionCreate, async (interaction) => {
    const licenza = await prisma.license.findUnique({ where: { guildId: interaction.guildId } });

    if (interaction.isChatInputCommand()) {
        // Blocco di sicurezza: se non c'è licenza e non stai attivando, ferma tutto
        if (interaction.commandName !== 'attiva-licenza') {
            if (!licenza || licenza.expiresAt < new Date()) {
                return interaction.reply({ content: "❌ **ERRORE LICENZA**: Server non autorizzato. Contatta Onley Security.", ephemeral: true });
            }
        }

        if (interaction.commandName === 'attiva-licenza') {
            // Sostituisci il numero qui sotto con il TUO ID Discord (es. "123456789")
            if (interaction.user.id !== "IL_TUO_ID_DISCORD") return interaction.reply("Accesso negato.");
            
            const gId = interaction.options.getString('server_id');
            const mesi = interaction.options.getInteger('mesi');
            const scadenza = new Date();
            scadenza.setMonth(scadenza.getMonth() + mesi);

            await prisma.license.upsert({
                where: { guildId: gId },
                update: { expiresAt: scadenza, active: true },
                create: { guildId: gId, expiresAt: scadenza }
            });
            return interaction.reply(`✅ Licenza attivata per ${gId} fino al ${scadenza.toLocaleDateString()}`);
        }

        if (interaction.commandName === 'pannello-cartellino') {
            await inviaPannelloCartellino(interaction);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
