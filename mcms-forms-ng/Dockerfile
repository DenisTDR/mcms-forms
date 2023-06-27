FROM node:18-alpine as builder
WORKDIR /app/src

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build:form

FROM nginx:alpine as runtime
WORKDIR /usr/share/nginx/html

COPY --from=builder /app/src/dist/mcms-form ./

RUN ls -lah ./
