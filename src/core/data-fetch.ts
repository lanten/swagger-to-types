import path from 'path'
import fetch from 'node-fetch'

import { log, requireModule, WORKSPACE_PATH } from '../tools'

export async function getSwaggerJson(url: string): Promise<SwaggerJson> {
  if (/^https?:\/\//.test(url)) {
    return fetch(url)
      .then((res) => {
        const json = res.json()
        log.info(`<fetch> ${url}`)
        return json
      })
      .catch((err) => {
        log.error(`<fetch>: ${url} - ${err}`, true)
        Promise.reject(err)
      })
  } else {
    return new Promise((resolve, reject) => {
      try {
        const res = requireModule(path.join(WORKSPACE_PATH || '', url))
        resolve(res)
      } catch (err) {
        reject(err)
      }
    })
  }
}
