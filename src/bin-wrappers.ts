import * as BinWrapper from 'bin-wrapper'
import * as path from 'path'

import {IBinWrappers} from './interface'

const map = require('../modules-map.json')

let BinWrappers: IBinWrappers = Object.keys(map).reduce((bins: any, key) => {
  const wrapper = new BinWrapper()
  const data = map[key]
  data.src.forEach(s => {
    wrapper.src(data.base + s.file, s.platform, s.arch)
  })

  const platformFile = data.src.find(o => o.platform !== 'win32' && !/\.dll$/.test(o.file))
  const binFilename = platformFile ? path.basename(platformFile.file) : key

  bins[key] = wrapper
    .dest(path.resolve(__dirname, '../vendors', process.platform))
    // .dest(path.resolve(__dirname, '../vendors', 'test'))
    .use(binFilename + (process.platform === 'win32' ? '.exe' : ''))
  return bins
}, {})

export default BinWrappers
