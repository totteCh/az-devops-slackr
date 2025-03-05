import * as dotenv from 'dotenv'
dotenv.config()

import { start } from './app'
import { DevOps } from './devops'

const devops = DevOps.getInstance()
devops
  .configure()
  .then(() => devops.login())
  .then(start)
