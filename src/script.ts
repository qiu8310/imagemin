#!/usr/bin/env ts-node

import * as fs from 'fs-extra'
import * as path from 'path'
import * as cli from 'mora-scripts/libs/tty/cli'
import * as shell from 'mora-scripts/libs/tty/shell'
import * as exists from 'mora-scripts/libs/fs/exists'
import * as inject from 'mora-scripts/libs/fs/inject'
import * as info from 'mora-scripts/libs/sys/info'

const EOL = require('os').EOL
const root = path.dirname(__dirname)
const submodules = Object.keys(require('../modules.json'))
const submoduleFolders = ((dir) => {
  return fs.readdirSync(dir).filter(name => !/\.\w+$/.test(name)).map(name => path.join(dir, name))
})(path.join(root, 'modules'))

cli({help: false, version: false})
  .commands({
    submodule: {
      desc: '根据 modules.json 判断是否所有 submodule 都安装了，没安装的话输出安装命令',
      cmd() {
        let existKeys = submoduleFolders.map(f => path.basename(f))
        submodules
          .filter(key => existKeys.indexOf(key) < 0)
          .forEach(key => console.log(`git submodule add https://github.com/imagemin/${key}-bin.git modules/${key}`))
      }
    },
    extract: {
      desc: '根据已安装的 submodule，提取出文件 modules-map.json',
      cmd() {
        let map = {}
        reducePromise(submoduleFolders.map(async folder => {
          process.chdir(folder)
          let key = path.basename(folder)
          info('extract ' + key)

          // tag 版本可能和 master 版本的文件结构不一样
          await shell.promise('git checkout --quiet v' + require(folder + '/package.json').version, {stdio: ['ignore', 'ignore', 'ignore']})

          let src = []
          let vendorDir = path.join(folder, 'vendor')
          fs.readdirSync(vendorDir).forEach(platform => {
            src.push(...parseOsDir(path.join(vendorDir, platform)))
          })

          await shell.promise('git checkout --quiet master', {stdio: ['ignore', 'ignore', 'inherit']})
          map[key] = {
            base: `https://raw.githubusercontent.com/imagemin/${key}-bin/v${require(folder + '/package.json').version}/vendor/`,
            src
          }
        }))
        .then(() => {
          fs.writeFileSync(path.join(root, 'modules-map.json'), JSON.stringify(map, null, 2))
        })
        .catch(e => {
          console.error('error code: ' + e + ' 请重试')
        })
      }
    },
    inject: {
      desc: '注入 modules 到 interface.ts 中',
      cmd() {
        const properties = require('../imagemin-schema.json').properties
        let binOptions = Object.keys(properties)
          .filter(key => key !== 'tools')
          .map(key => parseSchemaDefineToTS(key, properties[key])).join(EOL)
        console.log(inject(path.join(root, 'src', 'interface.ts'), {
          binWrappers: submodules.map(s => `${s}: IBinWrapper`).join(require('os').EOL),
          bins: 'export declare type IBin = \'' + submodules.join('\' | \'') + '\'',
          binOptions
        }))
      }
    },
    preinstall: {
      desc: '预安装指定的二进制文件',
      cmd() {
        submoduleFolders.forEach(folder => {
          let distDir = path.join(root, 'vendors', 'macos')

          let srcDir = ['macos', 'osx'].map(k => path.join(folder, 'vendor', k)).find(f => fs.existsSync(f))
          if (srcDir) {
            fs.ensureDirSync(distDir)
            readdirSync(srcDir).forEach(file => fs.copySync(path.join(srcDir, file), path.join(distDir, file)))
          }
        })
      }
    }
  })
  .parse(function() {
    this.help()
  })

function parseOsDir(osDir) {
  let result = []
  let os = path.basename(osDir)
  let platform = os === 'macos' ? 'darwin' : os === 'win' ? 'win32' : os
  let arch
  let addFiles = (files: string[]) => {
    files.forEach(f => result.push({
      platform, arch, file: os + f.replace(osDir, '')
    }))
  }

  let osDirFiles = readfulldirSync(osDir)
  if (isAllFiles(osDirFiles)) {
    addFiles(osDirFiles)
  } else {
    osDirFiles.forEach(archDir => {
      arch = path.basename(archDir)
      addFiles(readfulldirSync(archDir))
    })
  }
  return result
}

function readdirSync(dir) {
  return fs.readdirSync(dir).filter(n => !/^\./.test(n))
}

function readfulldirSync(dir) {
  return readdirSync(dir).map(n => path.join(dir, n))
}

function isAllFiles(files: string[]) {
  return files.every(f => exists.file(f))
}

function reducePromiseFunctions<T>(values: Array<(last: any) => PromiseLike<T>>, initArg: any = null): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    let total = values.length
    if (!total) resolve()
    let start = 1
    let next = (nextArg) => {
      if (values[start]) {
        values[start++](nextArg).then(next, reject)
      } else {
        resolve()
      }
    }
    values[0](initArg).then(next, reject)
  })
}

function reducePromise<T>(values: Array<PromiseLike<T>>): Promise<undefined> {
  return reducePromiseFunctions(values.map(v => () => v))
}

function parseSchemaDefineToTS(name, schemaDefine) {
  /*
    jpegtran: {
      ** desc *
      copy: string
    }
   */
  let {properties, required = []} = schemaDefine
  let allLines = Object.keys(properties).map(key => {
    let {description, anyOf, type, items} = properties[key]
    let lines = []
    if (description) lines.push('  /** ' + description + ' */')
    let ts = anyOf && anyOf[0] && anyOf[0].enum
      ? `${anyOf[0].enum.map(n => typeof n === 'number' ? n : '\'' + n + '\'').join(' | ')}`  // 枚举
      : type === 'array'
        ? (items && items.type ? items.type + '[]' : 'any[]')
        : [].concat(type).join(' | ')       // type 类型
    lines.push(`  '${key}'${required.indexOf(key) < 0 ? '?' : ''}: ${ts}`)
    return lines.join(EOL)
  })
  return `${name}?: {${EOL}${allLines.join(EOL)}${EOL}}`
}
