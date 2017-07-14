#!/usr/bin/env ts-node

import * as fs from 'fs-extra'
import * as path from 'path'
import * as cli from 'mora-scripts/libs/tty/cli'
import * as exists from 'mora-scripts/libs/fs/exists'

const root = path.dirname(__dirname)
const submoduleFolders = ((dir) => {
  return fs.readdirSync(dir).filter(name => !/\.\w+$/.test(name)).map(name => path.join(dir, name))
})(path.join(root, 'modules'))

cli({help: false, version: false})
  .commands({
    submodule: {
      desc: '根据 map-extra.json 判断是否所有 submodule 都安装了，没安装的话输出安装命令',
      cmd() {
        const submodules = Object.keys(require('./modules.json'))
        let existKeys = submoduleFolders.map(f => path.basename(f))
        submodules
          .filter(key => existKeys.indexOf(key) < 0)
          .forEach(key => console.log(`git submodule add https://github.com/imagemin/${key}-bin.git modules/${key}`))
      }
    },
    extract: {
      desc: '根据已安装的 submodule，提取出文件 modules-map.json',
      cmd() {
        let data = submoduleFolders.reduce((map, folder) => {
          let key = path.basename(folder)

          let src = []
          let vendorDir = path.join(folder, 'vendor')
          fs.readdirSync(vendorDir).forEach(platform => {
            src.push(...parseOsDir(path.join(vendorDir, platform)))
          })

          map[key] = {
            base: `https://raw.githubusercontent.com/imagemin/${key}-bin/v${require(folder + '/package.json').version}/vendor/`,
            src
          }
          return map
        }, {})

        fs.writeFileSync(path.join(root, 'src', 'modules-map.json'), JSON.stringify(data, null, 2))
      }
    },
    preinstall: {
      desc: '预安装指定的二进制文件',
      cmd() {
        submoduleFolders.forEach(folder => {
          let distDir = path.join(root, 'vendors', path.basename(folder))
          fs.ensureDirSync(distDir)
          let srcDir = ['macos', 'osx'].map(n => path.join(folder, 'vendor', n)).find(f => fs.existsSync(f))
          // let destDir = path.join(folder, 'vendors', 'macos')

          console.log(srcDir)
          // fs.removeSync(destDir)
          // if (srcDir) {
          //   fs.copySync(srcDir, destDir)
          // }
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
