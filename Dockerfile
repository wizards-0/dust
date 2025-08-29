FROM mcr.microsoft.com/playwright:v1.55.0-noble
WORKDIR /workspace
COPY package.json yarn.lock ./
RUN npm install --global yarn &&\
    yarn install
COPY . .
EXPOSE 4200
EXPOSE 3040
ENTRYPOINT ["./docker-entrypoint.sh"]