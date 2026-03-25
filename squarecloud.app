DISPLAY_NAME=ColoradoBotV2
MAIN=server/dist/index.js
MEMORY=1024
VERSION=recommended
AUTORESTART=true

# PERSISTENCIA (Crucial para nao perder o QR Code e as Fotos)
# Caminhos atualizados para a nova estrutura unificada
PROTECTED_FILES=[".wwebjs_auth", "server/uploads", "prisma/dev.db"]
