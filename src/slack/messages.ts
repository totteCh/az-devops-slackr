import { User } from '@prisma/client'
import { ChatPostMessageArguments } from '@slack/web-api'
import { PullRequest, WorkItem } from '../types'

export const getMessageForNewPR = (
  pr: PullRequest,
  author: User,
  workItem?: WorkItem,
): ChatPostMessageArguments => {
  const plainText = `${author.name} created a pull request`
  const mainText = `*${author.name}* created a pull request`
  const workItemText = workItem
    ? `<${workItem.url}|${workItem.type} ${workItem.id}: ${workItem.title}>`
    : 'N/A'

  return {
    channel: process.env.SLACK_CHANNEL ?? '',
    text: plainText,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: mainText,
        },
      },
    ],
    attachments: [
      {
        color: '#3376c3',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*<${pr.url}|${pr.title}>*`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Repository*\n${pr.repositoryName}`,
              },
              {
                type: 'mrkdwn',
                text: `*Work item*\n${workItemText}`,
              },
            ],
          },
        ],
      },
    ],
  }
}
