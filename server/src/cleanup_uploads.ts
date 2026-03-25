import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const uploadsDir = path.join(__dirname, '../uploads');

async function cleanup() {
    console.log('🧹 Iniciando limpeza de arquivos órfãos...');
    
    if (!fs.existsSync(uploadsDir)) {
        console.log('❌ Pasta uploads não encontrada.');
        return;
    }

    const filesOnDisk = fs.readdirSync(uploadsDir);
    const attachments = await prisma.optionAttachment.findMany();
    const statusSchedules = await prisma.statusSchedule.findMany();

    // Map attachments and schedules to their file names (without the 'uploads/' prefix)
    const usedPaths = new Set([
        ...attachments.map(a => a.path.replace('uploads/', '')),
        ...statusSchedules.map(s => s.imagePath ? s.imagePath.replace('uploads/', '') : '').filter(Boolean)
    ]);

    let deletedCount = 0;
    for (const file of filesOnDisk) {
        // Only delete files (don't delete subfolders if they accidentally appear)
        const fullPath = path.join(uploadsDir, file);
        if (fs.lstatSync(fullPath).isDirectory()) continue;

        if (!usedPaths.has(file)) {
            console.log(`🗑️ Deletando arquivo órfão: ${file}`);
            fs.unlinkSync(fullPath);
            deletedCount++;
        }
    }

    console.log(`✅ Limpeza concluída! ${deletedCount} arquivos removidos.`);
}

cleanup().finally(() => prisma.$disconnect());
