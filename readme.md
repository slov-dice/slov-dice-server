## Prisma

**prisma db push for prod:**

```
env $(cat .env.prod| grep -v '#'|sed 's/"//g') yarn prisma db push
```
