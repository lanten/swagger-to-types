import fetch from 'node-fetch'

import { log } from '../tools'

export async function getSwaggerJson(url: string): Promise<SwaggerJson> {
  return fetch(url)
    .then((res) => {
      const json = res.json()
      log.info(`fetch => ${url}`)
      return json
    })
    .catch((err) => {
      log.error(`fetch => ${url} - ${err}`, true)
      Promise.reject(err)
    })
}
