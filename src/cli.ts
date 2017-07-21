import * as cli from 'mora-scripts/libs/tty/cli'
import * as config from 'mora-scripts/libs/fs/config'
import * as table from 'mora-scripts/libs/tty/table'
import * as clog from 'mora-scripts/libs/sys/clog'
import prettyBytes from 'mora-common/util/prettyBytes'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as child from 'child_process'
import {IOptions} from './interface'
import Imagemin from './index'
import {runProgressTasks} from '@mora/tinypng/lib/helper'

import wrappers from './bin-wrappers'

const color = clog.format

cli({
  usage: 'imagemin [options] <file1, file2, file3, ...>',
  desc: 'backupDir, outputDir, renameOld, renameNew 四个选项最好设置一个，否则新生成的文件会覆盖源文件',
  version: require('../package.json').version
})
.options({
  'config': '<string> 配置文件路径，默认是在『当前目录』、『package.json所在目录』、『用户 home 目录』中第一次出现的： ./imagemin-config.js 或 imagemin-config.json 文件',
  't | tools': '<string> 指定需要使用的压缩工具，默认是 all (多个值用空格隔开)，支持的压缩工具有：' + Object.keys(wrappers).concat('tinypng', 'svgo').join(', '),
  'b | backupDir': '<string> 备份目录，源文件会保存在这里，压缩后的文件会覆盖原源文件',
  'o | outputDir': '<string> 输出目录, 源文件不会改变，压缩后的文件会保存在此',
  'd | dry': '<boolean> 只输出结果，不生成文件',
  'ro | renameOld': '<string> 重命名旧的文件，如需要给旧文件加个 ".old" 后缀可以写：--ro [name].old',
  'rn | renameNew': '<string> 重命名新生成的文件，类似于 renameOld'
})
.commands({
  ...(Object.keys(wrappers).reduce((commands, key) => {
    commands[key] = {
      cmd(res) {
        child.spawn(wrappers[key].path(), res._, {stdio: 'inherit'})
      }
    }
    return commands
  }, {}))
})
.parse((res) => {
  let options: IOptions
  if (res.config) options = require(res.config)
  else options = config('imagemin-config') || {}

  let im = new Imagemin(options)

  let data = []
  runProgressTasks(
      res._.map(filepath => done => {
        let end = (target) => {
          let original = target ? target.srcBuffer.length : 0
          let tinified = target ? target.minBuffer.length : 0

          data.push([
            filepath,
            original ? prettyBytes(original) : '-',
            tinified ? prettyBytes(tinified) : '-',
            target ? colorRate(getRate(original, tinified)) : '-',
            target ? target.minTool : '-'
          ])

          done(filepath)
        }

        im.min(filepath)
          .then(target => {
            let basedir = path.dirname(path.resolve(filepath))
            let basename = path.basename(filepath)
            let extname = path.extname(filepath)
            let name = basename.substr(0, basename.length - extname.length)

            let oldName = (res.renameOld ? rename(name, res.renameOld) : name) + extname
            let newName = (res.renameNew ? rename(name, res.renameNew) : name) + extname

            let oldFile = path.resolve(path.join(res.backupDir || basedir, oldName))
            let newFile = path.resolve(path.join(res.outputDir || basedir, newName))

            if (res.dry) {
              writeFileSync(newFile, target.minBuffer)
              if (oldFile !== newFile) writeFileSync(oldFile, target.srcBuffer)
            }
            end(target)
          })
          .catch(e => {
            console.error(e)
            end(null)
          })
        return filepath
      }
    ),
    () => {
      let head = [['File', 'Original Size', 'Tinified Size', 'Tinified Rate', 'Tool'].map(l => color(`%c${l}`, 'white.bold'))]
      data = head.concat(data)
      console.log()
      console.log(table(data.map(list => list.map(item => '  ' + item))))
      console.log()
    },
    {indent: '  '}
  )
})

function writeFileSync(file, data) {
  fs.ensureDirSync(path.dirname(file))
  fs.writeFileSync(file, data)
}

function rename(name, rule) {
  return rule.replace(/\[name\]/g, name)
}

function getRate(original, tinified) {
  return Math.round((original - tinified) * 100 / original)
}

function colorRate(value: number) {
  return color(`%c${value + '%'}`, value > 50 ? 'red' : value > 25 ? 'yellow' : value > 0 ? 'green' : 'gray')
}
