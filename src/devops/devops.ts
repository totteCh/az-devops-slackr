import { exec } from 'child_process'
import util from 'util'
import { z } from 'zod'
import { PipelineStatus, PullRequest, WorkItem } from '../types'
import { pullRequestSchema, workItemSchema } from './schemas'

const execPromise = util.promisify(exec)
const deviceCodeOutputFileName = 'login.output.txt'

export class DevOps {
  private readonly organizationUrl = process.env.DEVOPS_ORGANIZATION_URL ?? ''
  private readonly projectName = process.env.DEVOPS_PROJECT_NAME ?? ''
  private static instance: DevOps

  private constructor() {
    if (this.projectName === '') {
      throw new Error('DEVOPS_PROJECT_NAME is required')
    }
    if (this.organizationUrl === '') {
      throw new Error('DEVOPS_ORGANIZATION_URL is required')
    }
  }

  public static getInstance(): DevOps {
    if (!DevOps.instance) {
      DevOps.instance = new DevOps()
    }
    return DevOps.instance
  }

  async configure() {
    console.log('Configuring Azure DevOps...')
    await execPromise(
      `az devops configure --defaults organization=${this.organizationUrl} project=${this.projectName}`,
    )
  }

  async login() {
    console.log('Checking Azure CLI authentication status...')
    try {
      // Check if the user is already logged in
      await execPromise('az account get-access-token')
      console.log('Already logged in to Azure CLI.')
    } catch (error) {
      console.log('Not logged in to Azure CLI. Initiating login process...')
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Login process timed out'))
        }, 60000) // Wait for maximum 60 seconds

        exec(
          `az login --use-device-code &> ${deviceCodeOutputFileName}`,
          (err) => {
            console.log('Login process completed')
            if (err) {
              console.error('Error logging in:', err)
              clearTimeout(timeout)
              return reject(new Error('Failed to log in'))
            }

            clearTimeout(timeout)
            resolve(void 0)
          },
        )

        // Wait for 1 second for the login process to start and write output to the file
        setTimeout(getDeviceCode, 1000)
      })
    }
  }

  async getPullRequests(reviewer: string): Promise<PullRequest[]> {
    const query = getQuery({
      id: 'pullRequestId',
      url: 'url',
      createdBy: 'createdBy.uniqueName',
      title: 'title',
      repositoryName: 'repository.name',
      status: 'status',
      isDraft: 'isDraft',
    })
    const command = `az repos pr list --status active --reviewer "${reviewer}" --query "${query}" --output json`
    try {
      const { stdout } = await execPromise(command)
      const parsed = JSON.parse(stdout)
      return z.array(pullRequestSchema).parse(parsed)
    } catch (error) {
      console.error('Error getting pull requests:', error)
      return []
    }
  }

  async getLastRunStatus(
    pipelineId: number,
    prNumber: number,
  ): Promise<PipelineStatus> {
    const command = `az pipelines runs list --pipeline-id ${pipelineId} --query "[?sourceBranch=='refs/pull/${prNumber}/merge'] | [0].status" --output tsv`
    try {
      const { stdout } = await execPromise(command)
      return stdout.trim() as PipelineStatus
    } catch (error) {
      console.error('Error getting last run status:', error)
      throw new Error('Failed to get last run status')
    }
  }

  async getWorkItems(pr: Pick<PullRequest, 'id'>): Promise<WorkItem[]> {
    const query = getQuery({
      id: 'id',
      title: 'fields."System.Title"',
      type: 'fields."System.WorkItemType"',
      url: 'url',
    })
    const command = `az repos pr work-item list --id ${pr.id} --query '${query}' --output json`
    try {
      const { stdout } = await execPromise(command)
      return z.array(workItemSchema).parse(JSON.parse(stdout))
    } catch (error) {
      console.error('Error getting work items:', error)
      throw new Error('Failed to get work items')
    }
  }
}

const getQuery = (extractions: Record<string, string>) =>
  `[].{${Object.entries(extractions)
    .map(([key, value]) => `${key}:${value}`)
    .join(',')}}`

const getDeviceCode = () => {
  // Read the output from the file
  const fs = require('fs')
  const output = fs.readFileSync(deviceCodeOutputFileName, 'utf8')

  // Extract the device code from the output
  const codeMatch = output.match(/enter the code (\w+) to authenticate/)
  if (codeMatch) {
    const code = codeMatch[1]
    console.log(
      `To sign in, use a web browser to open the page https://microsoft.com/devicelogin and enter the code ${code} to authenticate.`,
    )
    console.log('Waiting for user to complete the login process...')
    return code
  } else {
    throw new Error('Failed to retrieve the device code from the login output.')
  }
}
