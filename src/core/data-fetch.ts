import fetch from 'node-fetch'

export function getSwaggerJson(): Promise<SwaggerJson> {
  return fetch(
    'http://trade-center-api.c29675d010ae94f3e868d99177da0d9ed.cn-shenzhen.alicontainer.com/v2/api-docs'
  ).then(res => res.json())
}
