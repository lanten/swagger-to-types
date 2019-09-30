import fetch from 'node-fetch'

export function getSwaggerJson(url: string): Promise<SwaggerJson> {
  return fetch(url)
    .then(res => {
      const json = res.json()
      $ext.log.info(`fetch => ${url} - ${JSON.stringify(json)}`)
      return json
    })
    .catch(err => {
      $ext.log.error(`fetch => ${url} - ${err}`, true)
      Promise.reject(err)
    })
}
