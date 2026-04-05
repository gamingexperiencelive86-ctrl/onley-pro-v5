import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
import { inviaPannelloCartellino } from "./panel.js";
import { startWeb } from "./web.js";
import { prisma } from "./db.js";
import { timbra, pausa, rientra, stimbra } from "./commands/clock.js";

dotenv.config();

const PROPRIETARIO_ID = "945771887340978246"; 

const client = new Client({ intents: [3276799] });

const commands = [
    new SlashCommandBuilder().setName('pannello-cartellino').setDescription('Invia il terminale biometrico'),
    new SlashCommandBuilder().setName('stato-licenza').setDescription('Controlla la scadenza del server'),
    new SlashCommandBuilder().setName('attiva-licenza').setDescription('Attiva licenza Onley')
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
    } catch (err) { console.error(err); }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        await interaction.deferReply({ flags: [64] });

        try {
            // COMANDO STATO LICENZA
            if (interaction.commandName === 'stato-licenza') {
                const lic = await prisma.license.findUnique({ where: { guildId: interaction.guildId } });
                if (!lic) return interaction.editReply("❌ Nessuna licenza trovata per questo server.");
                
                const scadenza = new Date(lic.expiresAt).toLocaleDateString('it-IT');
                const giorniRimanenti = Math.ceil((new Date(lic.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
                
                return interaction.editReply(`📊 **STATO LICENZA ONLEY**\n• Scadenza: \`${scadenza}\`\n• Giorni rimanenti: \`${giorniRimanenti}\`\n• Stato: ${giorniRimanenti > 0 ? "🟢 ATTIVA" : "🔴 SCADUTA"}`);
            }

            // COMANDO ATTIVAZIONE
            if (interaction.commandName === 'attiva-licenza') {
                if (interaction.user.id !== PROPRIETARIO_ID) return interaction.editReply("❌ Solo il proprietario può farlo.");
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

            // COMANDO PANNELLO
            if (interaction.commandName === 'pannello-cartellino') {
                const lic = await prisma.license.findUnique({ where: { guildId: interaction.guildId } });
                if (!lic || lic.expiresAt < new Date()) return interaction.editReply("❌ Licenza mancante o scaduta.");
                
                await inviaPannelloCartellino(interaction);
                await interaction.editReply("✅ Terminale caricato.");
            }
        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Errore critico database.");
        }
    }

    if (interaction.isButton()) {
        await interaction.deferReply({ flags: [64] });
        try {
            switch (interaction.customId) {
                case "btn_timbra": await timbra(interaction); break;
                case "btn_pausa": await pausa(interaction); break;
                case "btn_rientra": await rientra(interaction); break;
                case "btn_stimbra": await stimbra(interaction); break;
                case "btn_aperti": await interaction.editReply("📊 Dashboard disponibile via Web."); break;
            }
        } catch (e) { await interaction.editReply("❌ Errore scansione."); }
    }
});

client.login(process.env.DISCORD_TOKEN);
