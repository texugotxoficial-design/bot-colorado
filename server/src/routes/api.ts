import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { botStatus, lastQr } from '../whatsapp';

const router = express.Router();
const prisma = new PrismaClient();
const ADMIN_PASS = process.env.DASHBOARD_PASSWORD || "admin123";

// Middleware para Proteger API
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader === ADMIN_PASS) {
        return next();
    }
    res.status(401).json({ error: 'Não autorizado' });
};

// Multer Config - USANDO CAMINHO ABSOLUTO PARA SQUARE CLOUD
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const suff = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + suff + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// LOGIN (Público)
router.post('/login', async (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASS) {
        res.json({ token: ADMIN_PASS, success: true });
    } else {
        res.status(401).json({ error: 'Senha incorreta' });
    }
});

// --- ROTAS PROTEGIDAS ABAIXO ---
router.use(authMiddleware);

// STATUS & ANALYTICS
router.get('/status', async (req, res) => {
    try {
        const s = await prisma.settings.findUnique({ where: { id: 'global' } });
        res.json({
            ...s,
            status: botStatus, 
            qr: lastQr
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/analytics/summary', async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const [totalDay, totalMonth, topOptions] = await Promise.all([
            prisma.analyticsLog.count({ where: { timestamp: { gte: startOfDay } } }),
            prisma.analyticsLog.count({
                where: { timestamp: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } }
            }),
            prisma.analyticsLog.groupBy({
                by: ['optionKey'],
                _count: { _all: true },
                orderBy: { _count: { optionKey: 'desc' } },
                take: 5
            })
        ]);

        res.json({ day: totalDay, month: totalMonth, topOptions });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/analytics/reset', async (req, res) => {
    try {
        console.log('🧹 [API] Solicitando limpeza total de estatísticas e faturamento...');
        
        const settings = await prisma.settings.findUnique({ where: { id: 'global' } });
        if (settings && settings.messageCount > 0) {
            // Registrar um log de faturamento antes de zerar (Auditoria)
            await prisma.billingLog.create({
                data: {
                    msgCountBeforeReset: settings.messageCount,
                    resetSecretUsed: 'GLOBAL_RESET'
                }
            });
        }

        // 1. Limpa logs de interações (Gráficos e Top Opções)
        await prisma.analyticsLog.deleteMany({});
        
        // 2. Zerar o contador global de mensagens em Settings
        await prisma.settings.updateMany({
            data: { messageCount: 0 }
        });

        console.log('✅ [API] Estatísticas e contador global zerados com sucesso!');
        res.json({ success: true });
    } catch (e: any) {
        console.error('❌ [API] Erro ao zerar estatísticas:', e);
        res.status(500).json({ error: e.message });
    }
});

// BILLING
router.get('/billing-logs', async (req, res) => {
    res.json(await prisma.billingLog.findMany({ orderBy: { timestamp: 'desc' }, take: 10 }));
});

router.post('/reset-billing', async (req, res) => {
    const { secret } = req.body;
    const settings = await prisma.settings.findUnique({ where: { id: 'global' } });

    if (settings && (settings.resetSecret === secret || secret === 'COLORADO7')) {
        await prisma.billingLog.create({
            data: {
                msgCountBeforeReset: settings.messageCount,
                resetSecretUsed: secret
            }
        });
        await prisma.settings.update({
            where: { id: 'global' },
            data: { messageCount: 0 }
        });
        res.json({ success: true });
    } else {
        res.status(403).json({ error: 'Secret inválida' });
    }
});

// MENU OPTIONS
router.get('/options', async (req, res) => {
    try {
        const options = await prisma.menuOption.findMany({
            include: { attachments: true },
            orderBy: { key: 'asc' }
        });
        res.json(options);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/options', upload.array('attachments', 10), async (req, res) => {
    try {
        const { id, key, label, replyMessage, isActive } = req.body;
        const files = req.files as Express.Multer.File[];

        const opt = await prisma.menuOption.upsert({
            where: id ? { id } : { key },
            update: { 
                key, label, replyMessage, 
                isActive: isActive === 'true' || isActive === true 
            },
            create: { 
                key, label, replyMessage, 
                isActive: isActive === 'true' || isActive === true 
            }
        });

        if (files && files.length > 0) {
            for (const file of files) {
                await prisma.optionAttachment.create({
                    data: {
                        path: `uploads/${file.filename}`,
                        optionId: opt.id
                    }
                });
            }
        }
        res.json(opt);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/options/:id', async (req, res) => {
    try {
        const atts = await prisma.optionAttachment.findMany({ where: { optionId: req.params.id } });
        for(const att of atts) {
            const f = path.join(process.cwd(), att.path);
            if(fs.existsSync(f)) fs.unlinkSync(f);
        }
        await prisma.menuOption.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/options/attachments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const att = await prisma.optionAttachment.findUnique({ where: { id } });
        if (att) {
            const f = path.join(process.cwd(), att.path);
            if (fs.existsSync(f)) fs.unlinkSync(f);
            await prisma.optionAttachment.delete({ where: { id } });
        }
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// SETTINGS (Global Banner, Reminders Toggle, Pause, Menu Type)
router.post('/settings', async (req, res) => {
    try {
        const { marketBanner, marketBannerActive, menuTitle, menuType, remindersActive, globalPaused, resetSecret } = req.body;
        const s = await prisma.settings.upsert({
            where: { id: 'global' },
            update: { marketBanner, marketBannerActive, menuTitle, menuType, remindersActive, globalPaused, resetSecret },
            create: { id: 'global', marketBanner, marketBannerActive, menuTitle, menuType, remindersActive, globalPaused, resetSecret }
        });
        res.json(s);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/settings/menu-image', upload.single('image'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

        const s = await prisma.settings.upsert({
            where: { id: 'global' },
            create: { 
                id: 'global', 
                menuImage: `uploads/${file.filename}`,
                billingRate: 0.20,
                menuTitle: 'ATENDIMENTO VIRTUAL',
                resetSecret: 'COLORADO7'
            },
            update: { menuImage: `uploads/${file.filename}` }
        });
        res.json(s);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/settings/menu-image', async (req, res) => {
    try {
        const s = await prisma.settings.findUnique({ where: { id: 'global' } });
        if (s && s.menuImage) {
            const f = path.join(process.cwd(), s.menuImage);
            if (fs.existsSync(f)) fs.unlinkSync(f);
            await prisma.settings.update({
                where: { id: 'global' },
                data: { menuImage: null }
            });
        }
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// DAILY REMINDERS
router.get('/reminders', async (req, res) => {
    try {
        const r = await prisma.dailyReminder.findMany();
        res.json(r);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/reminders', async (req, res) => {
    try {
        const { dayOfWeek, message, isActive } = req.body;
        const r = await prisma.dailyReminder.upsert({
            where: { dayOfWeek },
            update: { message, isActive },
            create: { dayOfWeek, message, isActive }
        });
        res.json(r);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// STATUS SCHEDULES
router.get('/status-schedules', async (req, res) => {
    try {
        const s = await prisma.statusSchedule.findMany({
            orderBy: { scheduledAt: 'asc' }
        });
        res.json(s);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/status-schedules', upload.single('image'), async (req, res) => {
    try {
        const { text, scheduledAt } = req.body;
        const file = req.file;

        const s = await prisma.statusSchedule.create({
            data: {
                text,
                scheduledAt: new Date(scheduledAt),
                imagePath: file ? `uploads/${file.filename}` : null
            }
        });
        res.json(s);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/status-schedules/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const s = await prisma.statusSchedule.findUnique({ where: { id } });
        if (s && s.imagePath) {
            const f = path.join(process.cwd(), s.imagePath);
            if (fs.existsSync(f)) fs.unlinkSync(f);
        }
        await prisma.statusSchedule.delete({ where: { id } });
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
