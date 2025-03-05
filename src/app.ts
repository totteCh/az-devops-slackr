import { PullRequest as LocalPullRequest, User } from '@prisma/client'
import { Database } from './db'
import { DevOps } from './devops'
import { Slack } from './slack'
import { PullRequest } from './types'

const db = Database.getInstance()
const devops = DevOps.getInstance()
const slack = Slack.getInstance()

const checkPRs = async () => {
  console.log('\nChecking PRs...')
  const reviewer = process.env.DEVOPS_REVIEWER ?? ''
  const prs = await devops.getPullRequests(reviewer)
  if (prs.length === 0) {
    console.log('No PRs found')
    return
  }
  console.log('Found PRs:', prs.length)

  const localPRs = await db.getPullRequests()
  console.log('Local PRs:', localPRs.length, '\n')

  const promises = []
  for (const pr of prs) {
    const localPR = localPRs.find((p) => p.id === pr.id)
    promises.push(checkPR(pr, localPR))
  }

  await Promise.allSettled(promises)
}

const checkPR = async (pr: PullRequest, localPR?: LocalPullRequest) => {
  console.log(`Checking PR ${pr.id}...`)

  const author = await db.getUser(pr.createdBy)
  if (!author) {
    console.log('Author not found:', pr.createdBy)
    throw new Error('Author not found')
  }

  if (!localPR) {
    await handleNewPR(pr, author)
    return
  }

  if (localPR.isDraft && !pr.isDraft) {
    console.log(`PR ${pr.id} is no longer a draft`)
    await db.updatePullRequest(pr.id, { isDraft: pr.isDraft })
    await notifyPR(pr, author)
  }

  console.log(`PR ${pr.id} already exists in database`)
}

const handleNewPR = async (pr: PullRequest, author: User) => {
  if (pr.isDraft) {
    console.log(`PR ${pr.id} is a draft, will not post message yet`)
    return
  }

  const pipelineId = await db.getTestPipelineIdForRepository(pr.repositoryName)

  if (pipelineId) {
    const lastTestRunStatus = await devops.getLastRunStatus(pipelineId, pr.id)
    if (lastTestRunStatus !== 'completed') {
      console.log(
        `Last test run for PR ${pr.id} is not completed, will not post message yet`,
      )
      return
    }
  }

  await db.createPullRequest({ ...pr, testPipelineId: pipelineId ?? null })
  await notifyPR(pr, author)
}

const notifyPR = async (pr: PullRequest, author: User) => {
  console.log(`Notifying for PR ${pr.id}`)
  const workItems = await devops.getWorkItems(pr)
  const ts = await slack.postMessageForNewPR(pr, author, workItems?.[0])
  await db.storeSlackMessageId(pr.id, ts)
}

export const start = async () => {
  const fetchInterval = process.env.FETCH_INTERVAL_MINUTES
    ? parseInt(process.env.FETCH_INTERVAL_MINUTES)
    : 2
  setInterval(checkPRs, fetchInterval * 60 * 1000)
  checkPRs()
}
