import { z } from 'zod'

export const pipelineSchema = z.object({
  name: z.string(),
  id: z.number(),
})

export const pullRequestSchema = z.object({
  id: z.number(),
  url: z.string().url(),
  repositoryName: z.string(),
  status: z.string(),
  isDraft: z.boolean(),
  title: z.string(),
  createdBy: z.string().email(),
})

export const workItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.enum(['Task', 'Bug', 'User Story']),
  url: z.string().url(),
})
