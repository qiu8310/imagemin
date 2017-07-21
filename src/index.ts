import * as fs from 'fs-extra'
import * as path from 'path'
import * as imageinfo from 'imageinfo'
import * as child from 'child_process'
import * as ospath from 'mora-scripts/libs/fs/ospath'
import * as _ from 'lodash'
import Tinypng from '@mora/tinypng'

import wrappers from './bin-wrappers'

import {IOptions, IImageInfo, IBin} from './interface'
const schema = require('../imagemin-schema.json').properties

export interface IImageminResultListItem {
  key: IBin,
  buffer: Buffer
}
export interface IImageminResult {
  srcBuffer: Buffer
  minBuffer: Buffer
  minTool: string
  list: IImageminResultListItem[]
}

export default class Imagemin {
  opt: IOptions
  private meta = {
    gifsicle: {
      formats: ['GIF'],
      parseArgs: {useEquals: ['optimize']},
      appendArgs(args, output, input) { args.push('--output', output, input) }
    },
    jpegtran: {
      formats: ['JPG'],
      parseArgs: {singlePrefix: true},
      appendArgs(args, output, input) { args.push('-outfile', output, input) }
    },
    jpegoptim: {
      formats: ['JPG'],
      parseArgs: {useEquals: 'all'},
      appendArgs(args, output, input) { args.push('--dest=' + path.dirname(output), input) }
    },
    // 压缩有问题，暂时不用它
    // mozjpeg: {
    //   formats: ['JPG'],
    //   parseArgs: {singlePrefix: true},
    //   appendArgs(args, output, input) { args.push('-outfile', output, input) }
    // },
    guetzli: {
      formats: ['JPG'],
      appendArgs(args, output, input) { args.push(input, output) }
    },
    optipng: {
      formats: ['PNG'],
      parseArgs: {singlePrefix: true},
      appendArgs(args, output, input) { args.push('-out', output, input) }
    },
    pngcrush: {
      formats: ['PNG'],
      parseArgs: {singlePrefix: true},
      appendArgs(args, output, input) { args.push(input, output) }
    },
    pngquant: {
      formats: ['PNG'],
      appendArgs(args, output, input) { args.push('--output', output, input) }
    },
    zopflipng: {
      formats: ['PNG'],
      parseArgs: {nameCase: 'snakeCase'},
      appendArgs(args, output, input) { args.push(input, output) }
    },
    tinypng: {
      formats: ['PNG', 'JPG']
    },
    svgo: {
      formats: ['SVG']
    }
  }

  constructor(opt: IOptions = {}) {
    this.opt = initDefaultOptions(opt)
    /*
      ## 生成类似于下面的函数

      private jpegtran(filepath: string, opt: IOptions) {
        return new Promise((resolve, reject) => {
          let output = getOutputFilepath(filepath, opt)
          let args = parseOptionsToArgs(opt.jpegtran, {singlePrefix: true})
          args.push('-outfile', output, filepath)
          run(wrappers.jpegtran, args, err => {
            if (err) reject(err)
            else resolve(fs.readFileSync(output))
          })
        })
      }
    */

    Object.keys(this.meta).forEach(key => {
      if (!this[key]) {
        this[key] = (filepath: string, options: IOptions) => {
          let meta = this.meta[key]
          return new Promise((resolve, reject) => {
            let output = getOutputFilepath(filepath, options)
            let args = parseOptionsToArgs(options[key], meta.parseArgs || {})
            meta.appendArgs(args, output, filepath)

            run(wrappers[key], args, err => {
              if (err) return reject(err)
              return resolve(fs.readFileSync(output))
            })
          })
        }
      }
    })
  }

  min(filepath: string, opt: IOptions = {}): Promise<IImageminResult> {
    opt = Object.assign({}, this.opt, opt)

    prepareDir(opt.tempDir)

    return new Promise((resolve, reject) => {
      let fileBuffer: Buffer = fs.readFileSync(filepath)
      let fileInfo: IImageInfo = imageinfo(fileBuffer) || {}
      let binKeys

      if (/\.svg$/i.test(filepath)) fileInfo = {format: 'SVG'}

      if (['GIF', 'JPG', 'PNG', 'SVG'].indexOf(fileInfo.format) < 0) return reject('Not supported file')

      binKeys = Object.keys(this.meta).filter(k => {
        return (k !== 'tinypng' || !!(opt.tinypng.tokens && opt.tinypng.tokens.length)) && this.meta[k].formats.indexOf(fileInfo.format) >= 0
      })
      if (!binKeys.length) return reject('No minify tools')

      Promise.all(binKeys.map(k => this[k](filepath, opt).catch(e => console.error(k, e))))
        .then(
          buffers => {
            destroyDir(opt.tempDir)

            resolve(buffers.reduce((result: IImageminResult, buffer: Buffer, index: number) => {
              if (!buffer) return result
              if (buffer.length < result.minBuffer.length) {
                result.minBuffer = buffer
                result.minTool = binKeys[index]
              }
              result.list.push({key: binKeys[index], buffer})
              return result
            }, {list: [], minBuffer: fileBuffer, minTool: 'none', srcBuffer: fileBuffer}))
          },

          err => {
            destroyDir(opt.tempDir)
            reject(err)
          }
        )
    })
  }

  private tinypng(filepath: string, opt: IOptions): Promise<Buffer> {
    return new Tinypng(opt.tinypng).tiny(filepath)
  }
  private svgo(filepath: string, opt: IOptions): Promise<Buffer> {
    return new Tinypng({svgo: opt.svgo, tokens: []}).tiny(filepath)
  }
}

function initDefaultOptions(opt: IOptions): IOptions {
  opt.tools = opt.tools || 'all'
  opt.tempDir = opt.tempDir || path.join(ospath.tmp(), 'imagemin')

  Object.keys(wrappers).forEach(key => {
    opt[key] = opt[key] || {}
    let conf = schema[key].properties
    Object.keys(conf).forEach(confKey => {
      if (conf[confKey] && conf[confKey].default) opt[key][confKey] = conf[confKey].default
    })
  })

  if ('quality' in opt.jpegoptim) {
    opt.jpegoptim.max = opt.jpegoptim.quality
    delete opt.jpegoptim.quality
  }

  if (opt.mozjpeg.progressive === false) opt.mozjpeg.baseline = true

  return opt
}
function parseOptionsToArgs(opt, {nameCase = 'kebabCase', singlePrefix = false, useEquals = []} = {}): string[] {
  let result = []
  Object.keys(opt).forEach(k => {
    let v = opt[k]
    if (nameCase) k = _[nameCase](k)

    let prefix = singlePrefix || k.length === 1 ? '-' : '--'
    if (typeof v === 'boolean' && v) result.push(prefix + k)
    else if ((useEquals as any) === 'all' || useEquals.indexOf(k) >= 0) result.push(`${prefix}${k}=${v}`)
    else result.push(`${prefix}${k}`, v)
  })
  return result
}
function getOutputFilepath(filepath: string, opt: IOptions) {
  let dir = path.join(opt.tempDir, Math.random().toString(16).substr(2, 8))
  fs.ensureDirSync(dir)
  return path.join(dir, path.basename(filepath))
}
function prepareDir(dir) { fs.ensureDirSync(dir) }
function destroyDir(dir) { fs.removeSync(dir) }

function run(bin, args, cb) {
  let ps = child.spawn(bin.path(), args)
  let err: any = ''
  ps.stderr.on('data', data => { err += data })
  ps.on('close', code => {
    if (code === 0) cb()
    else cb(Buffer.isBuffer(err) ? err.toString() : (err || `Unknown spawn error ( ${bin.path()} ${args.join(' ')} )`))
  })
}
