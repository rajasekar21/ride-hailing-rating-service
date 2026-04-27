FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y python3 build-essential libsqlite3-dev && \
    npm install --build-from-source sqlite3 && \
    npm install && \
    rm -rf /var/lib/apt/lists/*
COPY . .
CMD ["node","app.js"]
