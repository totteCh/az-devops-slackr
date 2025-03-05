import { z } from 'zod'
import { pipelineSchema, pullRequestSchema, workItemSchema } from './devops'

export type Pipeline = z.infer<typeof pipelineSchema>
export type PipelineStatus = 'active' | 'inProgress' | 'completed'

export type PullRequest = z.infer<typeof pullRequestSchema>

export type WorkItem = z.infer<typeof workItemSchema>
