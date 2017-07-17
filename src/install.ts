import wrappers from './bin-wrappers'
import * as path from 'path'
import * as fs from 'fs-extra'

const wrappersData = require('../modules.json')
const vendorsDir = path.join(path.dirname(__dirname), 'vendors')

Object.keys(wrappers).forEach(key => {
  let isGuetzli = key === 'guetzli'
  let args = isGuetzli ? [path.join(vendorsDir, 'pixel.png'), path.join(vendorsDir, 'pixel.min.jpg')] : wrappersData[key].test
  wrappers[key].run(args, (err) => {
    if (err) {
      console.log(`安装 ${key} 失败，请手动安装并将其放于 ${wrappers[key].path()} 处`)
    } else {
      if (isGuetzli) fs.removeSync(path.join(vendorsDir, 'pixel.min.jpg'))
    }
  })
})

