import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
import { inviaPannelloCartellino } from "./panel.js";
import { startWeb } from "./web.js";
import { prisma } from "./db.js";
import { timbra, pausa, rientra, stimbra } from "./commands/clock.js"; // Importiamo la logica ore

dotenv.config();

const PROPRIETARIO_ID = "945771887340978246"; // <--- METTI IL TUO ID QUI

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
    new SlashCommandBuilder().setName('attiva-licenza').setDescription('Attiva licenza (Solo proprietario)')
        .addStringOption(o => o.setName('server_id').setDescription('ID Server').setRequired(true))
        .addIntegerOption(o => o.setName('mesi').setDescription('Mesi').setRequired(true))
].map(c => c.toJSON());

client.once(Events.ClientReady, async () => {
    console.log(`🛡️ SISTEMA ONLEY PRO V5 - ONLINE: ${client.user.tag}`);
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log("✅ COMANDI SLASH SINCRONIZZATI");
        startWeb(); 
    } catch (err) {
        console.error("❌ ERRORE REST:", err);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    // 1. GESTIONE COMANDI SLASH
    if (interaction.isChatInputCommand()) {
        
        // Comando Attivazione Licenza (Solo per te)
        if (interaction.commandName === 'attiva-licenza') {
            if (interaction.user.id !== PROPRIETARIO_ID) {
                return interaction.reply({ content: "❌ Non hai l'autorizzazione Onley Security.", ephemeral: true });
            }
            
            const gId = interaction.options.getString('server_id');
            const mesi = interaction.options.getInteger('mesi');
            const scadenza = new Date();
            scadenza.setMonth(scadenza.getMonth() + mesi);

            await prisma.license.upsert({
                where: { guildId: gId },
                update: { expiresAt: scadenza, active: true },
                create: { guildId: gId, expiresAt: scadenza }
            });
            return interaction.reply({ content: `✅ Licenza attivata per il server \`${gId}\` fino al ${scadenza.toLocaleDateString()}`, ephemeral: true });
        }

        // Controllo Licenza per gli altri comandi
        const licenza = await prisma.license.findUnique({ where: { guildId: interaction.guildId } });
        if (!licenza || licenza.expiresAt < new Date()) {
            return interaction.reply({ content: "❌ **LICENZA NON TROVATA O SCADUTA**. Contatta il fornitore.", ephemeral: true });
        }

        if (interaction.commandName === 'pannello-cartellino') {
            await inviaPannelloCartellino(interaction);
        }
    }

    // 2. GESTIONE TASTI BIOMETRICI
    if (interaction.isButton()) {
        const licenza = await prisma.license.findUnique({ where: { guildId: interaction.guildId } });
        if (!licenza || licenza.expiresAt < new Date()) {
            return interaction.reply({ content: "❌ Licenza scaduta.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            switch (interaction.customId) {
                case "btn_timbra": await timbra(interaction); break;
                case "btn_pausa": await pausa(interaction); break;
                case "btn_rientra": await rientra(interaction); break;
                case "btn_stimbra": await stimbra(interaction); break;
                case "btn_aperti": 
                    interaction.editReply("📊 Controlla la Dashboard Web per vedere i dati in tempo reale!");
                    break;
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply("❌ Errore durante la scansione biometrica.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
