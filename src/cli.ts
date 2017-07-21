import * as cli from 'mora-scripts/libs/tty/cli'
import * as config from 'mora-scripts/libs/fs/config'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as child from 'child_process'
import {IOptions} from './interface'
import Imagemin from './index'

import wrappers from './bin-wrappers'

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
  'ro | renameOld': '<string> 重命名旧的文件，如需要给旧文件加个 ".old" 后缀可以写：--ro ${name}.old',
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

  res._.forEach(filepath => {
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

        writeFileSync(newFile, target.minBuffer)
        if (oldFile !== newFile) writeFileSync(oldFile, target.srcBuffer)
      })
      .catch(e => console.error(e))
  })

})

function writeFileSync(file, data) {
  fs.ensureDirSync(path.dirname(file))
  fs.writeFileSync(file, data)
}

function rename(name, rule) {
  return rule.replace(/\$\{name\}/g, name)
}

