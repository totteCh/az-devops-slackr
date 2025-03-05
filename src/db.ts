import { PrismaClient, PullRequest, User } from '@prisma/client'
// import { pipelines } from '../prisma/pipelines';
// import { users } from '../prisma/users';

export class Database {
  private static instance: Database
  // //@ts-expect-error
  private readonly prisma: PrismaClient

  private constructor() {
    this.prisma = new PrismaClient()
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }

  async getPullRequests(): Promise<PullRequest[]> {
    // return [];
    return this.prisma.pullRequest.findMany({
      include: { testPipeline: true },
    })
  }

  async createPullRequest(pr: PullRequest): Promise<void> {
    // return;
    await this.prisma.pullRequest.create({
      data: pr,
    })
  }

  async updatePullRequest(id: number, pr: Partial<PullRequest>): Promise<void> {
    await this.prisma.pullRequest.update({
      where: { id },
      data: pr,
    })
  }

  async getUser(email: string): Promise<User | undefined> {
    // return users.find((user) => user.email === email);
    return (
      (await this.prisma.user.findFirst({
        where: {
          email,
        },
      })) ?? undefined
    )
  }

  async getTestPipelineIdForRepository(
    repositoryName: string,
  ): Promise<number | undefined> {
    // return pipelines.find(
    //   (pipeline) => pipeline.name === `${repositoryName}-tests`,
    // )?.id;
    const pipeline = await this.prisma.pipeline.findFirst({
      where: {
        name: `${repositoryName}-tests`,
      },
    })
    return pipeline?.id
  }

  async storeSlackMessageId(prId: number, messageId: string): Promise<void> {
    // return;
    await this.prisma.slackThread.create({
      data: {
        pullRequestId: prId,
        ts: messageId,
      },
    })
  }
}
