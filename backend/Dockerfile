FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (cacheo de capas)
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]
