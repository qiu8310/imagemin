import wrappers from './bin-wrappers'
import * as path from 'path'
import * as fs from 'fs-extra'
import * as info from 'mora-scripts/libs/sys/info'

const wrappersData = require('../modules.json')
const resDir = path.join(path.dirname(__dirname), 'res')

const installBinKeys = Object.keys(wrappers)
let installedCount = 0
let installedErrorCount = 0
let needInstallTotal = installBinKeys.length

installBinKeys.forEach(key => {
  let isGuetzli = key === 'guetzli'
  let args = isGuetzli ? [path.join(resDir, 'pixel.png'), path.join(resDir, 'pixel.min.jpg')] : wrappersData[key].test
  wrappers[key].run(args, (err) => {
    installedCount++
    if (err) {
      installedErrorCount++
      console.log(`安装 ${key} 失败，请手动安装并将其放于 ${wrappers[key].path()} 处`)
    } else {
      if (isGuetzli) fs.removeSync(path.join(resDir, 'pixel.min.jpg'))
    }

    if (installedCount === needInstallTotal && !installedErrorCount) {
      info(`Install ${require('../package.json').name} successfully!`)
    }
  })
})
