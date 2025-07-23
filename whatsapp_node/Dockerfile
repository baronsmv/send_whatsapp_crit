FROM node:20-slim

# Instala dependencias necesarias para Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxshmfence1 \
    libdrm2 \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    --no-install-recommends \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Crea el directorio de trabajo
WORKDIR /app

# Copia el package.json y package-lock.json
COPY package*.json ./

# Instala dependencias de Node.js
RUN npm install

# Copia el resto del código fuente
COPY . .

# Expone el puerto
EXPOSE 3000

# Ejecuta la app
CMD ["node", "index.js"]
