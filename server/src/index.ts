import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import router from './routes/api';
import { whatsapp, checkLicense, startStatusJob } from './whatsapp';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Paths - Unificados na Raiz para estabilidade total
const rootPath = process.cwd();
const distPath = path.join(rootPath, 'public');
const uploadsPath = path.join(rootPath, 'uploads');

console.log(`📂 Servindo Frontend de: ${distPath}`);
console.log(`📂 Servindo Uploads de: ${uploadsPath}`);

// Create uploads if not exists
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Routes
app.use('/api', router);
app.use('/uploads', express.static(uploadsPath));

// Serve Frontend
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
            return res.sendFile(path.join(distPath, 'index.html'));
        }
        next();
    });
} else {
    app.get('/', (req, res) => {
        res.send('Backend Online - Frontend não encontrado (rode npm run build no client)');
    });
}

// Start Server
app.listen(PORT, () => {
    console.log(`--- BOT TEXUGO V2 ---`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 URL local: http://localhost:${PORT}`);
    
    // Start Background Jobs
    startStatusJob();

    // Auto-Initialize WhatsApp
    try {
        console.log('🔄 Autoinicializando WhatsApp Client...');
        whatsapp.initialize().catch(e => console.error('Erro na inicialização:', e));
    } catch (e) {
        console.error('Erro ao autoinicializar o bot:', e);
    }
});
