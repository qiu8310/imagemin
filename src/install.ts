import wrappers from './bin-wrappers'

// Object.keys(bin).forEach(key => {
//   bin[key].run()
// })

console.log(wrappers.gifsicle.path())
wrappers.gifsicle.run(['--version'], (err) => {
  if (err) {
    console.log(err)
  } else {
    console.log('success')
  }
})
