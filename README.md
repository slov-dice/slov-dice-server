# Slov Dice Server

## Installing

1. yarn prisma init
2. Update .env DATABASE_URL by docker-compose.yaml

## Starting

1. Start Docker Desktop
2. docker-compose up
3. yarn start:dev
4. yarn prisma studio

## Migration DB

1. yarn prisma migrate dev --create-only
2. yarn prisma db push
