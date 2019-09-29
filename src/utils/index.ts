import fs from 'fs'
import path from 'path'
import vscode from 'vscode'
import { execSync } from 'child_process'

import Localize from './localize'

const { workspaceFolders } = vscode.workspace

export const WORKSPACE_PATH = workspaceFolders ? workspaceFolders[0].uri.fsPath.replace(/\\/g, '/') : undefined

/**
 * 读取文件 (文本)
 * @param {String} path 文件路径
 * @returns {Promise}
 */
export function readFile(path: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf-8', (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

/**
 * 写入文件 (文本)
 * @param {String} path
 * @param {String} data
 * @returns {Promise}
 */
export function writeFile(path: string, data: string) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, 'utf-8', err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

/**
 * 同步执行命令
 * @param {String} bash
 * @param {String} msg
 */
export function syncExec(paramsSrc: { bash: string; msg?: string; inputPath?: string }) {
  let params = paramsSrc
  if (typeof params === 'string') params = { bash: params }

  const { bash, msg, inputPath = WORKSPACE_PATH } = params

  try {
    const res = execSync(bash, {
      cwd: inputPath,
    }).toString()
    if (msg) console.log(`=> ${msg} 成功`)
    return res
  } catch (ex) {
    if (msg) console.log(`=> ${msg} 失败\n`, ex)
    return ex.toString()
  }
}

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

export const localize = new Localize()
