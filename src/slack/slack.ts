import { WebClient } from '@slack/web-api'
import { getMessageForNewPR } from './messages'
import { PullRequest, WorkItem } from '../types'
import { User } from '@prisma/client'

export class Slack {
  private static instance: Slack

  public static getInstance(): Slack {
    if (!Slack.instance) {
      Slack.instance = new Slack()
    }
    return Slack.instance
  }

  private readonly web: WebClient

  private constructor() {
    const token = process.env.SLACK_TOKEN ?? ''
    const channel = process.env.SLACK_CHANNEL ?? ''
    if (token == '' || channel == '') {
      console.error('Missing Slack environment variables')
      process.exit(1)
    }

    this.web = new WebClient(token)
  }

  async postMessageForNewPR(
    pr: PullRequest,
    author: User,
    workItem?: WorkItem,
  ): Promise<string> {
    const message = getMessageForNewPR(pr, author, workItem)
    const result = await this.web.chat.postMessage(message)
    if (!result.ok) {
      console.error('Error sending message:', result.error)
      throw new Error('Failed to send message')
    }

    console.log('Message sent in Slack:', result.ts)
    return result.ts!
  }
}
