# 🚀 BOT TEXUGO V2 - Automação WhatsApp Premium

Sistema completo de automação para supermercados com Dashboard Administrativo.

## 🛠️ Tecnologias
- **Backend**: Node.js, TypeScript, Express, Prisma ORM (SQLite).
- **WhatsApp**: whatsapp-web.js com LocalAuth.
- **Frontend**: React (Vite), TailwindCSS, Lucide Icons.
- **Segurança**: Hardware Lock (Machine ID) & Reset Secret Key.

## 📂 Estrutura de Pastas
- `/client`: Frontend React (Vite).
- `/server`: Backend API & WhatsApp Bot.
- `/uploads`: Armazenamento de encartes (PDF/PNG).
- `squarecloud.config`: Configuração para deploy Cloud.

## 🚀 Como Iniciar

### 1. Instalação
No terminal raiz do projeto, execute:
```bash
npm run install:all
```

### 2. Configuração do Banco de Dados
Sincronize o schema com o SQLite local:
```bash
cd server
npx prisma db push
```

### 3. Execução (Desenvolvimento)
Inicie ambos Frontend e Backend simultaneamente:
```bash
npm run dev
```

### 4. Build & Deploy (SquareCloud)
O sistema já está configurado para o SquareCloud. O script de build unificado prepara os arquivos estáticos para o backend servir:
```bash
npm run build
```

## 🔒 Regras de Negócio
- **Trava de Hardware**: O sistema registra o ID único do computador no primeiro uso. Se copiado para outro hardware, o bot não iniciará (ignorável via `SQUARE_CLOUD=true`).
- **Billing**: As mensagens são cobradas a R$ 0,20 cada. O saldo só pode ser zerado via Painel com a `resetSecret` configurada no `.env`.
- **Menu Dinâmico**: Configure teclas (1, 2, 3...) via dashboard para respostas automáticas e envio de arquivos.
- **Alertas**: Banner global no topo do menu e lembretes diários baseados no dia da semana.

---
Desenvolvido por **Antigravity AI**.
