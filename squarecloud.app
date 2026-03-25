DISPLAY_NAME=ColoradoBotV2
MAIN=server/dist/index.js
MEMORY=1024
VERSION=recommended
AUTORESTART=true

# PERSISTENCIA (Crucial para nao perder o QR Code e as Fotos)
# A SquareCloud protegera essas pastas de serem apagadas em restarts
# Nota: Verifique se os caminhos estao relativos a raiz do seu Git
PROTECTED_FILES=[".wwebjs_auth", "server/uploads", "server/prisma/dev.db"]
