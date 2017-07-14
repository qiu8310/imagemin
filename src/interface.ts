export interface IBinWrappers {
  /*# INJECT_START bins #*/
  gifsicle: IBinWrapper
  optipng: IBinWrapper
  jpegtran: IBinWrapper
  mozjpeg: IBinWrapper
  guetzli: IBinWrapper
  jpegoptim: IBinWrapper
  pngcrush: IBinWrapper
  pngquant: IBinWrapper
  zopflipng: IBinWrapper
  /*# INJECT_END #*/
}

export interface IBinWrapper {
  path: () => string
  run: (args: string[], callback: (err) => void) => void
}
