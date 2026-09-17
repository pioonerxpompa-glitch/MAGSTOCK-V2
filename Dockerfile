FROM node:22-alpine AS build
WORKDIR /app
COPY apps/api/package.json apps/api/package-lock.json* ./api/
RUN cd api && npm install
COPY apps/api ./api
RUN cd api && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/api ./api
WORKDIR /app/api
ENV NODE_ENV=production
EXPOSE 4000
CMD ["npm","start"]
