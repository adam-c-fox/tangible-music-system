FROM node:latest
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . . 

EXPOSE 8001
EXPOSE 8003
CMD ["node", "logic.js"]