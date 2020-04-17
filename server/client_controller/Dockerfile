FROM node:latest
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . . 

EXPOSE 8000
EXPOSE 8002
CMD ["node", "client_controller.js"]