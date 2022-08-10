# Slov Dice Server

## Installing

1. npx prisma init
2. Update .env DATABASE_URL by docker-compose.yaml

## Starting

1. Start Docker Desktop
2. docker-compose up
3. yarn start:dev
4. npx prisma studio

## Migration DB

1. npx prisma migrate dev --create-only
2. npx prisma db push

│ This is a major update - please follow the guide at │
│ https://pris.ly/d/major-version-upgrade │
│ │
│ Run the following to update │
│ npm i --save-dev prisma@latest │
│ npm i @prisma/client@latest
