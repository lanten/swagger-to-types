import path from 'path'
import fetch from 'node-fetch'
import SwaggerParser from '@apidevtools/swagger-parser'
import { OpenAPI } from 'openapi-types'

import { log, requireModule, WORKSPACE_PATH } from '../tools'

interface DocumentCommom {
  swagger?: string
  openapi?: string
}

export async function getSwaggerJson(url: string): Promise<OpenAPI.Document & DocumentCommom> {
  return new Promise((resolve, reject) => {
    if (/^https?:\/\//.test(url)) {
      fetch(url)
        .then(async (res) => {
          const json = await res.json()
          log.info(`<fetch> ${url}`)
          parseJsonData(json).then(resolve).catch(reject)
        })
        .catch((err) => {
          log.error(`<fetch>: ${url} - ${err}`, true)
          reject(err)
        })
    } else {
      try {
        const res = requireModule(path.join(WORKSPACE_PATH || '', url))
        parseJsonData(res).then(resolve).catch(reject)
      } catch (err) {
        reject(err)
      }
    }
  })
}

function parseJsonData(data: OpenAPI.Document & DocumentCommom): Promise<OpenAPI.Document> {
  return new Promise((resolve, reject) => {
    if (data.openapi) {
      SwaggerParser.dereference(data, { parse: { json: {} } }, (err, api) => {
        if (api) {
          resolve(api)
        } else {
          reject(err)
        }
      })
    } else if (data.swagger) {
      resolve(data) // v2 api 不做处理
    } else {
      log.error('swagger-json error.', true)
    }
  })
}
