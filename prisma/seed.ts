import { PrismaClient } from '@prisma/client'
import { users } from './users'
import { pipelines } from './pipelines'

const prisma = new PrismaClient()

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: user,
      update: {},
    })
  }
  for (const pipeline of pipelines) {
    await prisma.pipeline.upsert({
      where: { id: pipeline.id },
      create: pipeline,
      update: {},
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
