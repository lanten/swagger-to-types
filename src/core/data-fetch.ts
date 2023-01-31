import path from 'path'
import http from 'http'
import https from 'https'
import { OpenAPI } from 'openapi-types'

import { log, requireModule, WORKSPACE_PATH } from '../tools'

interface DocumentCommom {
  swagger?: string
  openapi?: string
}

/** 获取 Swagger JSON 数据 */
export async function getSwaggerJson(url: string) {
  if (/^https?:\/\//.test(url)) {
    return requestJson(url)
  } else {
    try {
      const res = requireModule(path.join(WORKSPACE_PATH || '', url))
      return Promise.resolve(res)
    } catch (err) {
      log.error(err, true)
      return Promise.reject(err)
    }
  }
}

/** 发起请求 */
export function requestJson(url: string): Promise<OpenAPI.Document & DocumentCommom> {
  return new Promise((resolve, reject) => {
    let TM: NodeJS.Timeout
    const request = /^https/.test(url) ? https.request : http.request

    log.info(`Request Start: ${url}`)

    const req = request(
      url,
      {
        method: 'GET',
        rejectUnauthorized: false,
        headers: {
          Accept: '*/*',
          'Accept-Encoding': 'utf-8',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
      (res) => {
        res.setEncoding('utf-8') // 解决中文乱码

        let dataStr = ''
        res.on('data', (data: Buffer) => {
          dataStr += data.toString()
        })

        res.on('end', () => {
          clearTimeout(TM)
          try {
            const json = JSON.parse(dataStr)
            log.info(`Request Successful: ${url}`)
            resolve(json)
          } catch (error) {
            log.error(`Request Failed: ${url}`, true)
            reject(error)
          }
        })

        res.on('error', (err) => {
          log.error(`Request Failed: ${url}`, true)
          reject(err)
        })
      }
    )

    req.on('timeout', (err: Error) => {
      log.error(err, true)
      reject(err)
    })

    TM = setTimeout(() => {
      const err = new Error()
      err.name = 'Request Timeout'
      err.message = url
      req.emit('timeout', err)
    }, 15000) // 15秒超时

    req.end()
  })
}
