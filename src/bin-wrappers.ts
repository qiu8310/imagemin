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

  bins[key] = wrapper
    .dest(path.resolve(__dirname, '../vendors', key))
    .use(process.platform === 'win32' ? key + '.exe' : key)
  return bins
}, {})

export default BinWrappers
