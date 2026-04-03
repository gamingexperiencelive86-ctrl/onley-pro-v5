import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export async function inviaPannelloCartellino(interaction) {
    const embed = new EmbedBuilder()
        .setTitle("🔒 TERMINALE BIOMETRICO - ONLEY SECURITY")
        .setDescription("```\nIDENTIFICAZIONE OPERATORE RICHIESTA\n```\nBenvenuto. Poggia l'impronta digitale sul sensore per registrare la tua presenza.")
        .setColor("#00f2ff")
        .setImage("https://img.freepik.com/free-vector/abstract-neon-lights-background_23-2148907367.jpg")
        .setThumbnail("https://cdn-icons-png.flaticon.com/512/2609/2609266.png")
        .setFooter({ text: "SISTEMA PROTETTO DA LICENZA ONLEY" });

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("btn_timbra").setLabel("ENTRATA").setEmoji("🧬").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("btn_stimbra").setLabel("USCITA").setEmoji("🧬").setStyle(ButtonStyle.Danger)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("btn_pausa").setLabel("PAUSA").setEmoji("👣").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("btn_rientra").setLabel("RIENTRO").setEmoji("👣").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("btn_aperti").setLabel("STATO LIVE").setEmoji("📊").setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row1, row2] });
}
