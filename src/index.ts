import * as ospath from 'mora-scripts/libs/fs/ospath'
import * as cli from 'mora-scripts/libs/tty/cli'
import * as fs from 'fs-extra'
import * as path from 'path'

const tmpDir = path.join(ospath.tmp(), 'imagemin')

function prepareTmpDir() { fs.ensureDirSync(tmpDir) }
function destroyTmpDir() { fs.removeSync(tmpDir) }

cli({
  usage: 'imagemin [options] <file1, file2, file3, ...>',
  version: require('../package.json').version
})
.options({
  'config': '<string> 配置文件路径，默认是在『当前目录』、『package.json目录』、『用户 home 目录』中第一次出现的： ./imagemin-config.js 或 imagemin-config.json 文件',
  'b | backupDir': '<string> 备份目录，源文件会保存在这里，压缩后的文件会覆盖原源文件',
  'o | outputDir': '<string> 输出目录, 源文件不会改变，压缩后的文件会保存在此'
})
.commands({

})
.parse((res) => {
  console.log(res)
  prepareTmpDir()
  destroyTmpDir()
})
