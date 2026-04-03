import { prisma } from "../db.js";
import dayjs from "dayjs";

export async function timbra(interaction) {
    const userId = interaction.user.id;
    const username = interaction.user.username;

    // Controlla se c'è già un cartellino aperto
    const aperto = await prisma.timeLog.findFirst({
        where: { userId, status: { in: ['LAVORO', 'PAUSA'] } }
    });

    if (aperto) return interaction.editReply("⚠️ Hai già un cartellino attivo!");

    await prisma.timeLog.create({
        data: { userId, username, guildId: interaction.guildId, status: 'LAVORO' }
    });

    await interaction.editReply("🧬 **SCANSIONE COMPLETATA**: Servizio iniziato. Buon lavoro!");
}

export async function pausa(interaction) {
    const userId = interaction.user.id;
    const log = await prisma.timeLog.findFirst({ where: { userId, status: 'LAVORO' } });

    if (!log) return interaction.editReply("⚠️ Devi essere in servizio per andare in pausa!");

    await prisma.timeLog.update({
        where: { id: log.id },
        data: { status: 'PAUSA', pauseStart: new Date() }
    });

    await interaction.editReply("👣 **PAUSA REGISTRATA**: Il sensore ha rilevato l'allontanamento.");
}

export async function rientra(interaction) {
    const userId = interaction.user.id;
    const log = await prisma.timeLog.findFirst({ where: { userId, status: 'PAUSA' } });

    if (!log) return interaction.editReply("⚠️ Non risulti essere in pausa!");

    const minutiPausa = dayjs().diff(dayjs(log.pauseStart), 'minute');

    await prisma.timeLog.update({
        where: { id: log.id },
        data: { 
            status: 'LAVORO', 
            totalPauseMin: { increment: minutiPausa },
            pauseStart: null 
        }
    });

    await interaction.editReply(`🧬 **RIENTRO COMPLETATO**: Pausa durata ${minutiPausa} min.`);
}

export async function stimbra(interaction) {
    const userId = interaction.user.id;
    const log = await prisma.timeLog.findFirst({ where: { userId, status: { in: ['LAVORO', 'PAUSA'] } } });

    if (!log) return interaction.editReply("⚠️ Non hai cartellini aperti da chiudere!");

    const minutiTotali = dayjs().diff(dayjs(log.startTime), 'minute') - log.totalPauseMin;

    await prisma.timeLog.update({
        where: { id: log.id },
        data: { 
            status: 'CHIUSO', 
            endTime: new Date(),
            totalWorkMin: minutiTotali
        }
    });

    await interaction.editReply(`🔴 **FINE SERVIZIO**: Totale lavorato oggi: ${(minutiTotali/60).toFixed(2)} ore.`);
}
