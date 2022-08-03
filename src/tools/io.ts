import fs from 'fs'
import path from 'path'

import { WORKSPACE_PATH, log, config } from '.'

/**
 * 递归创建路径
 * @param dir
 * @param inputPath
 * @param split
 */
export function mkdirRecursive(dir: string, inputPath = WORKSPACE_PATH || '', split = '/') {
  const dirArr = dir.split(split)
  const dir2 = dirArr.reduce((dirPath, folder) => {
    const p1 = path.join(inputPath, dirPath)
    if (!fs.existsSync(p1)) fs.mkdirSync(p1)
    return dirPath + '/' + folder
  })
  const p2 = path.join(inputPath, dir2)
  if (!fs.existsSync(p2)) fs.mkdirSync(p2)
}

/**
 * 动态导入一个 JS 文件
 * @param modulePath 要导入的文件路径
 * @param clearCache 是否清除缓存
 */
export function requireModule(modulePath: string, clearCache = true) {
  try {
    const m = require(modulePath)
    if (clearCache) {
      setTimeout(() => {
        delete require.cache[require.resolve(modulePath)]
      }, 200)
    }
    return m
  } catch (error: any) {
    throw new Error(error)
  }
}

/**
 * 保存文件
 * @param docStr
 * @param filePath
 */
export async function saveDocument(docStr: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    try {
      fs.writeFileSync(filePath, docStr, 'utf-8')
      resolve(void 0)
    } catch (error: any) {
      log.error(error, true)
      reject()
    }
  })
}
