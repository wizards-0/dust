FROM mcr.microsoft.com/playwright:v1.50.1-noble
WORKDIR /workspace
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 4200
EXPOSE 3040
ENTRYPOINT ["./docker-entrypoint.sh"]