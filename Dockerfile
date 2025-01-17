FROM node:alpine
WORKDIR /workspace
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 4200
EXPOSE 3040
ENTRYPOINT ["./docker-entrypoint.sh"]