DISPLAY_NAME=ColoradoBotV2
MAIN=server/dist/index.js
MEMORY=1024
VERSION=recommended
AUTORESTART=true

# PERSISTENCIA (Crucial para nao perder o QR Code e as Fotos)
# Caminhos unificados na raiz para estabilidade absoluta
PROTECTED_FILES=[".wwebjs_auth", "uploads", "prisma/dev.db"]
