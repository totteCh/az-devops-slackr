declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DEVOPS_REVIEWER: string
      DEVOPS_ORGANIZATION_URL: string
      DEVOPS_PROJECT_NAME: string
      FETCH_INTERVAL_MINUTES?: string
      SLACK_TOKEN: string
      SLACK_CHANNEL: string
    }
  }
}

export {}
