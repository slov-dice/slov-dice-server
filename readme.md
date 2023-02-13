# Slov Dice | API | D&D playground

Website: [slov-dice.com](https://slov-dice.com)

Client: [github.com/slov-dice/slov-dice-client](https://github.com/slov-dice/slov-dice-client)

## Deploy

### Prisma db push for prod

```
env $(cat .env.prod| grep -v '#'|sed 's/"//g') yarn prisma db push
```
