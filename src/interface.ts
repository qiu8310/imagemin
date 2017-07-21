export interface IBinWrappers {
  /*# INJECT_START binWrappers #*/
  jpegtran: IBinWrapper
  mozjpeg: IBinWrapper
  jpegoptim: IBinWrapper
  guetzli: IBinWrapper
  optipng: IBinWrapper
  pngcrush: IBinWrapper
  pngquant: IBinWrapper
  zopflipng: IBinWrapper
  gifsicle: IBinWrapper
  /*# INJECT_END #*/
}

export interface IBinWrapper {
  path: () => string
  run: (args: string[], callback: (err) => void) => void
}

export interface IImageInfo {
  // type: 'image' | 'flash'
  format?: 'GIF' | 'JPG' | 'PNG' | 'SVG'
  width?: number
  height?: number
}

/*# INJECT_START bins #*/
export declare type IBin = 'jpegtran' | 'mozjpeg' | 'jpegoptim' | 'guetzli' | 'optipng' | 'pngcrush' | 'pngquant' | 'zopflipng' | 'gifsicle'
/*# INJECT_END #*/

export interface IOptions {
  /** 指定需要使用的压缩工具，可以指定多个，系统会自动使用压缩效率最好的工具（有可能会失真） */
  tools?: IBin[] | 'all'

  /** 保存临时图片文件的目录 */
  tempDir?: string

  /*# INJECT_START binOptions #*/
  gifsicle?: {
    /** Turn on interlacing */
    'interlace'?: boolean
    /** Optimize output GIFs, 0-7 */
    'optimize'?: number
    'noWarnings'?: boolean
    /** Reduce the number of colors, 0-256 */
    'colors'?: number
    /** WxH  Resize the output GIF to WxH */
    'resize'?: string
    /** Resize to width W and proportional height */
    'resizeWidth'?: number
    /** Resize to height H and proportional width */
    'resizeHeight'?: number
    /** WxH  Resize if necessary to fit within WxH */
    'resizeFit'?: string
    /** XFACTOR[xYFACTOR]  Scale the output GIF by XFACTORxYFACTOR */
    'scale'?: string
    /** Set background color */
    'background'?: string
    /** Set some color to transparent */
    'transparent'?: string
    /** X,Y+WxH | X,Y-X2,Y2  Crop the image */
    'crop'?: string
    /** Crop transparent borders off the image */
    'cropTransparency'?: boolean
    'flipHorizontal'?: boolean
    'flipVertical'?: boolean
    'rotate_90'?: boolean
    'rotate_180'?: boolean
    'rotate_270'?: boolean
    'noRotate'?: boolean
  }
  jpegtran?: {
    /** Copy how much markers from source file */
    'copy'?: 'none' | 'comments' | 'all'
    /** Optimize Huffman table (smaller file, but slow compression) */
    'optimize'?: boolean
    /** Create progressive JPEG file */
    'progressive'?: boolean
    /** WxH+X+Y  Crop to a rectangular subarea */
    'crop'?: string
    /** Reduce to grayscale (omit color data) */
    'grayscale'?: boolean
    /** Mirror image (left-right or top-bottom) */
    'flip'?: 'horizontal' | 'vertical'
    /** Fail if there is non-transformable edge blocks */
    'perfect'?: string
    /** Rotate image (degrees clockwise) */
    'rotate'?: 90 | 180 | 270
    /** Transpose image */
    'transpose'?: boolean
    /** Transverse transpose image */
    'transverse'?: boolean
    /** Drop non-transformable edge blocks */
    'trim'?: boolean
  }
  jpegoptim?: {
    /** force optimization */
    'force'?: boolean
    /** 0-100  Set maximum image quality factor (disables lossless optimization mode, which is by default on) */
    'quality'?: number
    /** 0-100  Set maximum image quality factor (disables lossless optimization mode, which is by default on) */
    'max'?: number
    /** Try to optimize file to given size (disables lossless optimization mode). Target size is specified either in kilo bytes (1 - n) or as percentage (1% - 99%) */
    'size'?: string
    /** strip all markers from output file */
    'stripAll'?: boolean
    /** do not strip any markers */
    'stripNone'?: boolean
    /** strip Comment markers from output file */
    'stripCom'?: boolean
    /** strip Exif markers from output file */
    'stripExif'?: boolean
    /** strip IPTC/Photoshop (APP13) markers from output file */
    'stripIptc'?: boolean
    /** strip ICC profile markers from output file */
    'stripIcc'?: boolean
    /** strip XMP markers markers from output file */
    'stripXmp'?: boolean
    /** force all output files to be progressive */
    'allProgressive'?: boolean
    /** force all output files to be non-progressive */
    'allNormal'?: boolean
  }
  mozjpeg?: {
    /** Compression quality (0..100; 5-95 is useful range) */
    'quality'?: number
    /** Create monochrome JPEG file */
    'grayscale'?: boolean
    /** Create RGB JPEG file */
    'rgb'?: boolean
    /** Create progressive JPEG file (enabled by default) */
    'progressive'?: boolean
    /** Create baseline JPEG file (disable progressive coding) */
    'baseline'?: boolean
    /** Disable progressive scan optimization */
    'fastcrush'?: boolean
  }
  guetzli?: {
    /** Visual quality to aim for, expressed as a JPEG quality value */
    'quality'?: number
    /** Memory limit in MB. Guetzli will fail if unable to stay under the limit. Default is 6000 MB */
    'memlimit'?: string
    /** Do not limit memory usage */
    'nomemlimit'?: boolean
  }
  optipng?: {
    /** strip metadata objects (e.g. 'all') */
    'strip'?: string
    /** enable error recovery */
    'fix'?: boolean
    /** optimization level (0-7) */
    'o'?: number
    /** PNG delta filters (0-5) */
    'f'?: string
    /** PNG interlace type (0-1) */
    'i'?: string
  }
  pngcrush?: {
    /** zero samples underlying fully-transparent pixels.  Changing the color samples to zero can improve the compressibility. Since this is a lossy operation, blackening is off by default. */
    'blacken'?: boolean
    /** use brute-force: try 148 different methods.  Very time-consuming and generally not worthwhile. You can restrict this option to certain filter types, compression levels, or strategies by following it with '-f filter', '-l level', or '-z strategy'. */
    'brute'?: boolean
    /** write output even if IDAT is larger */
    'force'?: boolean
    /** do lossless color-type or bit-depth reduction.  (if possible). Also reduces palette length if possible. Currently only attempts to reduce the bit depth from 16 to 8. Reduces all-gray RGB or RGBA image to gray or gray-alpha. Reduces all-opaque RGBA or GA image to RGB or grayscale. */
    'reduce'?: boolean
    /** PNG delta filters (0-5).  filter to use with the method specified in the preceding '-m method' or '-brute' argument. 0: none; 1-4: use specified filter; 5: adaptive */
    'f'?: string
    /** method [1 through 150].  pngcrush method to try.  Can be repeated as in '-m 1 -m 4 -m 7'. This can be useful if pngcrush runs out of memory when it tries methods 2, 3, 5, 6, 8, 9, or 10 which use filtering and are memory-intensive.  Methods 1, 4, and 7 use no filtering; methods 11 and up use a specified filter, compression level, and strategy. */
    'm'?: string
    /** salvage PNG with otherwise fatal conditions */
    'fix'?: boolean
    /** use only zlib strategy 2, Huffman-only.  Fast, but almost never very effective except for certain rare image types */
    'huffman'?: boolean
  }
  pngquant?: {
    /** min-max  don't save below min, use fewer colors below max (0-100) */
    'quality'?: string
    /** speed/quality trade-off. 1=slow, 3=default, 11=fast & rough */
    'speed'?: string
    /** disable Floyd-Steinberg dithering */
    'nofs'?: boolean
    /** output lower-precision color (e.g. for ARGB4444 output) */
    'posterize'?: string
  }
  zopflipng?: {
    /** compress more: use more iterations (depending on file size) */
    'm'?: boolean
    /** remove colors behind alpha channel 0. No visual difference, removes hidden information. */
    'lossyTransparent'?: boolean
  }
  tinypng?: {
    'tokens': string[]
    /** 缓存 tinypng 处理后的文件，避免重复处理，节省 api 调用次数 */
    'cacheDir'?: string
    /** 记录文件，记录 token 使用或过期情况，给系统用的，对用户无意义，推建设置 */
    'recordFile'?: string
  }
  svgo?: {
    'plugins'?: any[]
  }
  /*# INJECT_END #*/
}
