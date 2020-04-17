FROM node:latest
WORKDIR /app
COPY package*.json ./
RUN npm install
# COPY . . 
COPY utils.js ./

EXPOSE 8005
CMD ["node", "utils.js"]