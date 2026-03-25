import { Client, LocalAuth, Message, MessageMedia, List } from 'whatsapp-web.js';
import { PrismaClient } from '@prisma/client';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export let botStatus = 'OFFLINE';
export let lastQr = '';

// SEGURANÇA: Só responder mensagens chegadas APÓS o bot ligar (Evita responder historico)
const botStartTime = Math.floor(Date.now() / 1000);

// MEMÓRIA DE CURTO PRAZO (Anti-Eco / Throttling)
const lastMessageTimes = new Map<string, number>();

export const whatsapp = new Client({
    authStrategy: new LocalAuth({
        clientId: 'bot-texugo',
        dataPath: path.join(process.cwd(), '.wwebjs_auth')
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }
});

whatsapp.on('qr', async (qr) => {
    lastQr = await qrcode.toDataURL(qr);
    botStatus = 'QR_CODE_READY';
    await prisma.settings.upsert({
        where: { id: 'global' },
        update: { botStatus: 'QR_CODE_READY' },
        create: { id: 'global', botStatus: 'QR_CODE_READY' }
    });
    console.log('QR Code generated');
});

whatsapp.on('ready', async () => {
    botStatus = 'ONLINE';
    lastQr = ''; // Limpa o QR Code ao conectar
    await prisma.settings.upsert({
        where: { id: 'global' },
        update: { botStatus: 'ONLINE' },
        create: { id: 'global', botStatus: 'ONLINE' }
    });
    console.log('Bot is ready!');
});

whatsapp.on('disconnected', async () => {
    botStatus = 'OFFLINE';
    lastQr = '';
    await prisma.settings.upsert({
        where: { id: 'global' },
        update: { botStatus: 'OFFLINE' },
        create: { id: 'global', botStatus: 'OFFLINE' }
    });
    console.log('Bot disconnected. Tentando reinicializar para gerar novo QR...');
    
    // Pequeno delay para evitar loops infinitos caso o erro seja persistente
    setTimeout(() => {
        whatsapp.initialize().catch(e => console.error('Erro ao reiniciar após desconexão:', e));
    }, 5000);
});

// ---------------------------------------------------------
// Helper: Send State Typing & Delay
// ---------------------------------------------------------
const replyWithTyping = async (msg: Message, content: any, options?: any) => {
    try {
        const chat = await msg.getChat();
        await chat.sendStateTyping();
        // Delay fixo de 2.5 segundos para parecer humano
        await new Promise(resolve => setTimeout(resolve, 2500));
        return await whatsapp.sendMessage(msg.from, content, options);
    } catch (e) {
        return await whatsapp.sendMessage(msg.from, content, options);
    }
};

whatsapp.on('message_create', async (msg) => {
    try {
        // SEGURANÇA MÁXIMA ANTI-HISTÓRICO: Ignorar mensagens do passado
        if (msg.timestamp < botStartTime) {
            return;
        }

        const isSelfChat = msg.from === msg.to; // Conversar consigo mesmo (Teste)
        const hasMenuSignature = msg.body.includes('━━━━━━━━━━━━━━━━━━━━━━');

        // SEGURANÇA MÁXIMA ANTI-LOOP
        // 1. Se for mensagem pra fora (cliente), ignorar se for fromMe (resposta do bot)
        if (msg.fromMe && !isSelfChat) {
            // 📈 CONTABILIZAR FATURAMENTO (Memsagem enviada pelo BOT para CLIENTE)
            await prisma.settings.update({
                where: { id: 'global' },
                data: { messageCount: { increment: 1 } }
            });
            console.log('📈 [FATURAMENTO] +1 Resposta do Bot Contabilizada');
            return;
        }

        // 2. Se for o Menu (com assinatura), ignorar para evitar loop (tanto do cliente quanto de si mesmo)
        if (hasMenuSignature) return;

        // 3. Ignorar Grupos
        if (msg.from.includes('@g.us')) return;

        // 🛡️ TRAVA DE "UM DE CADA VEZ" (3 Segundos de Cooldown por Usuário)
        const lastTime = lastMessageTimes.get(msg.from) || 0;
        const now = Date.now();
        if (now - lastTime < 3000) {
            console.log(`⏳ [THROTTLE] Mensagem de ${msg.from} ignorada (Muitas mensagens rapidas)`);
            return;
        }
        lastMessageTimes.set(msg.from, now);

        // 4. Se for "Message Yourself" e NÃO for o menu, deixamos o fluxo seguir para responder o teste
        // SEM contabilizar faturamento aqui, pois é o usuário digitando para si mesmo.
        if (msg.fromMe && !isSelfChat) return;

        const settings = await prisma.settings.findUnique({ where: { id: 'global' } });
        if (settings?.globalPaused) return;

        // NORMALIZAÇÃO DO INPUT
        const selectionId = (msg as any).selectedRowId;
        const bodyInput = msg.body.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        const input = selectionId ? selectionId.toLowerCase() : bodyInput;

        console.log(`📩 Mensagem de ${msg.from}: input='${input}'`);

        // STATE MANAGEMENT
        let state = await prisma.conversationState.findUnique({ where: { remoteId: msg.from } });
        if (!state) {
            state = await prisma.conversationState.create({
                data: { remoteId: msg.from, lastAction: new Date(), inactivityNotified: false, hasSeenMenu: false }
            });
        }

        // UPDATE LAST ACTION
        await prisma.conversationState.update({
            where: { id: state.id },
            data: { lastAction: new Date(), inactivityNotified: false }
        });

        const options = await prisma.menuOption.findMany({
            where: { isActive: true },
            include: { attachments: true },
            orderBy: { key: 'asc' }
        });

        const isMenuCommand = ['menu', 'oi', 'ola', 'olá', 'inicio', 'ajuda', 'opcoes', 'voltar', 'start'].includes(input);
        const match = options.find(o => o.key.toLowerCase().trim() === input);
        const isExit = ['0', 'sair', 'finalizar', 'encerrar', 'tchau', 'obrigado', 'obrigada'].includes(input);

        // LOGIC: EXIT
        if (isExit) {
            const goodbye = "🤝 *Atendimento Finalizado!*\n━━━━━━━━━━━━━━━━━━━━━━\n\nFoi um prazer atender você. Se precisar de algo novo, basta enviar *Menu* a qualquer momento.\n\n_Tenha um ótimo dia!_ 👋";
            await replyWithTyping(msg, goodbye);
            await prisma.conversationState.update({ where: { id: state.id }, data: { hasSeenMenu: false } });
            return;
        }

        // LOGIC: IF SEEN MENU -> PROCESS VALID INPUT ONLY
        if (state.hasSeenMenu) {
            if (match) {
                // LOG ANALYTICS
                await prisma.analyticsLog.create({ data: { remoteId: msg.from, optionKey: match.key } });

                let finalMsg = `💎 *ATENDIMENTO: ${match.label}*\n━━━━━━━━━━━━━━━━━━━━━━\n\n${match.replyMessage}\n\n━━━━━━━━━━━━━━━━━━━━━━\n_Mande "Menu" para voltar_`;
                await replyWithTyping(msg, finalMsg);
                
                if (match.attachments && match.attachments.length > 0) {
                    for (const att of match.attachments) {
                        const fullPath = path.join(process.cwd(), att.path);
                        if (fs.existsSync(fullPath)) {
                            const media = MessageMedia.fromFilePath(fullPath);
                            await whatsapp.sendMessage(msg.from, media);
                        } else {
                            console.warn(`⚠️ Anexo de Opção não encontrado: ${fullPath}`);
                        }
                    }
                }
                return;
            }

            if (isMenuCommand) {
                 // Fall through to showMenu below
            } else {
                console.log(`🔇 Ignorando input '${input}' de ${msg.from} (Menu já exibido).`);
                return;
            }
        }

        // LOGIC: DEFAULT (FIRST MESSAGE or MENU COMMAND)
        const contact = await msg.getContact();
        const rawName = contact.pushname || '';
        const name = rawName.split(' ')[0] || 'Cliente'; 
        
        const hour = new Date().getHours();
        let greeting = 'Boa noite';
        if (hour >= 5 && hour < 12) greeting = 'Bom dia';
        else if (hour >= 12 && hour < 18) greeting = 'Boa tarde';

        const today = new Date().toDateString();
        const lastGreeting = (state as any).lastGreetingAt ? (state as any).lastGreetingAt.toDateString() : '';
        const shouldGreet = today !== lastGreeting;

        // LOG ANALYTICS
        await prisma.analyticsLog.create({
            data: { remoteId: msg.from, optionKey: isMenuCommand ? 'menu' : 'welcome' }
        });

        if (shouldGreet) {
            const personalGreeting = `👋 ${greeting}, *${name}*!\n\nBem-vindo ao atendimento automatizado do Supermercado Colorado. Fique à vontade para interagir com nossas opções abaixo:`;
            await replyWithTyping(msg, personalGreeting);
            
            await prisma.conversationState.update({
                where: { id: state.id },
                data: { lastGreetingAt: new Date() }
            });
        }

        await showMenu(msg, settings, options);
        await prisma.conversationState.update({ where: { id: state.id }, data: { hasSeenMenu: true } });

    } catch (err) {
        console.error('❌ Erro no processamento da mensagem:', err);
    }
});

// Helper: Show Menu
async function showMenu(msg: Message, settings: any, options: any[]) {
    const welcome = settings?.marketBanner || "Olá! Como podemos ajudar hoje?";
    const mTitle = settings?.menuTitle || "ATENDIMENTO VIRTUAL";

    if (settings?.menuImage) {
        const fullPath = path.join(process.cwd(), settings.menuImage);
        console.log(`📸 [BANNER] Tentando enviar banner: ${fullPath}`);
        
        if (fs.existsSync(fullPath)) {
            try {
                const media = MessageMedia.fromFilePath(fullPath);
                await whatsapp.sendMessage(msg.from, media);
                console.log(`✅ [BANNER] Banner enviado com sucesso para ${msg.from}`);
            } catch (e: any) {
                console.error(`❌ [BANNER] Erro ao enviar a foto do banner:`, e);
            }
        } else {
            console.warn(`⚠️ [BANNER] Arquivo não localizado: ${fullPath}`);
        }
    }

    if (settings?.menuType === 'INTERACTIVE') {
        const sections = [{
            title: "Nossos Serviços",
            rows: [
                ...options.map(o => ({ id: o.key, title: o.label, description: `Opção ${o.key}` })),
                { id: '0', title: 'Encerrar Atendimento', description: 'Finalizar' }
            ]
        }];
        const list = new List(welcome, "Ver Menu 📋", sections, mTitle, "Colorado Bot v2.0");
        return await replyWithTyping(msg, list);
    } else {
        let menuStr = `✨ *${mTitle.toUpperCase()}* ✨\n━━━━━━━━━━━━━━━━━━━━━━\n\n *${welcome}*\n\nEscolha uma das opções abaixo para continuar:\n\n`;
        options.forEach(o => { menuStr += `🟢 *Digite [${o.key}]* para: *${o.label}*\n`; });
        menuStr += `🟢 *Digite [0]* para: *Encerrar Atendimento*\n\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        menuStr += `\n*Aguardamos sua resposta!* 🛒`;
        return await replyWithTyping(msg, menuStr);
    }
}

// Job: Status Posting (Fica escondido pois so envia para 'status@broadcast' e nao para clientes)
export function startStatusJob() {
    setInterval(async () => {
        if (botStatus !== 'ONLINE') return;
        try {
            const now = new Date();
            const pending = await prisma.statusSchedule.findMany({
                where: { scheduledAt: { lte: now }, isPosted: false }
            });

            for (const item of pending) {
                if (item.imagePath) {
                    const filePath = path.join(process.cwd(), item.imagePath);
                    if (fs.existsSync(filePath)) {
                        const media = MessageMedia.fromFilePath(filePath);
                        await whatsapp.sendMessage('status@broadcast', media, { caption: item.text || '' });
                    }
                } else if (item.text) {
                    await whatsapp.sendMessage('status@broadcast', item.text);
                }
                await prisma.statusSchedule.update({ where: { id: item.id }, data: { isPosted: true } });
            }
        } catch (e) {
            console.error('Erro no Job de Status:', e);
        }
    }, 60000);
}

export async function checkLicense() { return true; }
