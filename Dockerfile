
FROM node:alpine

WORKDIR /usr/app

RUN npm install --global pm2

COPY ./package*.json ./
RUN apk --no-cache add --virtual builds-deps build-base python
RUN npm install --production

COPY ./ ./

RUN chown 1000:1000 uploads

EXPOSE 8000

USER node

CMD [ "pm2-runtime", "start", "npm", "--", "start" ]