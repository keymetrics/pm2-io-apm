
export type MissFunction = (key: string) => any
export type CacheOptions = {
  miss: MissFunction
  ttl?: number
}
export type StackContext = {
  callsite: string,
  context: string
}

export type FrameMetadata = {
  line_number: number
  file_name: string
}

/**
 * Simple cache implementation
 *
 * @param {Object} opts cache options
 * @param {Function} opts.miss function called when a key isn't found in the cache
 */
export class Cache {

  private cache: { [key: string]: any } = {}
  private ttlCache: { [key: string]: number } = {}
  private worker: NodeJS.Timer
  private tllTime: number
  private onMiss: MissFunction

  constructor (opts: CacheOptions) {
    this.onMiss = opts.miss
    this.tllTime = opts.ttl || -1

    if (opts.ttl) {
      this.worker = setInterval(this.workerFn.bind(this), 1000)
      this.worker.unref()
    }
  }

  workerFn () {
    let keys = Object.keys(this.ttlCache)
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i]
      let value = this.ttlCache[key]
      if (Date.now() > value) {
        delete this.cache[key]
        delete this.ttlCache[key]
      }
    }
  }

  /**
   * Get a value from the cache
   *
   * @param {String} key
   */
  get (key: string) {
    if (!key) return null
    let value = this.cache[key]
    if (value) return value

    value = this.onMiss(key)

    if (value) {
      this.set(key, value)
    }
    return value
  }

  /**
   * Set a value in the cache
   *
   * @param {String} key
   * @param {Mixed} value
   */
  set (key: string, value: any) {
    if (!key || !value) return false
    this.cache[key] = value
    if (this.tllTime > 0) {
      this.ttlCache[key] = Date.now() + this.tllTime
    }
    return true
  }

  reset () {
    this.cache = {}
    this.ttlCache = {}
  }
}

export type StackTraceParserOptions = {
  cache: Cache,
  contextSize: number
}

/**
 * StackTraceParser is used to parse callsite from stacktrace
 * and get from FS the context of the error (if available)
 *
 * @param {Cache} cache cache implementation used to query file from FS and get context
 */
export class StackTraceParser {

  private cache: Cache
  private contextSize: number = 3

  constructor (options: StackTraceParserOptions) {
    this.cache = options.cache
    this.contextSize = options.contextSize
  }

  isAbsolute (path) {
    if (process.platform === 'win32') {
      // https://github.com/nodejs/node/blob/b3fcc245fb25539909ef1d5eaa01dbf92e168633/lib/path.js#L56
      let splitDeviceRe = /^([a-zA-Z]:|[\\/]{2}[^\\/]+[\\/]+[^\\/]+)?([\\/])?([\s\S]*?)$/
      let result = splitDeviceRe.exec(path)
      if (result === null) return path.charAt(0) === '/'
      let device = result[1] || ''
      let isUnc = Boolean(device && device.charAt(1) !== ':')
      // UNC paths are always absolute
      return Boolean(result[2] || isUnc)
    } else {
      return path.charAt(0) === '/'
    }
  }

  parse (stack: FrameMetadata[]): StackContext | null {
    if (stack.length === 0) return null

    const userFrame = stack.find(frame => {
      const type = this.isAbsolute(frame.file_name) || frame.file_name[0] === '.' ? 'user' : 'core'
      return type !== 'core' && frame.file_name.indexOf('node_modules') < 0 && frame.file_name.indexOf('@pm2/io') < 0
    })
    if (userFrame === undefined) return null

    // get the whole context (all lines) and cache them if necessary
    const context = this.cache.get(userFrame.file_name) as string[] | null
    const source: string[] = []
    if (context === null || context.length === 0) return null
      // get line before the call
    const preLine = userFrame.line_number - this.contextSize - 1
    const start = preLine > 0 ? preLine : 0
    context.slice(start, userFrame.line_number - 1).forEach(function (line) {
      source.push(line.replace(/\t/g, '  '))
    })
    // get the line where the call has been made
    if (context[userFrame.line_number - 1]) {
      source.push(context[userFrame.line_number - 1].replace(/\t/g, '  ').replace('  ', '>>'))
    }
    // and get the line after the call
    const postLine = userFrame.line_number + this.contextSize
    context.slice(userFrame.line_number, postLine).forEach(function (line) {
      source.push(line.replace(/\t/g, '  '))
    })
    return {
      context: source.join('\n'),
      callsite: [ userFrame.file_name, userFrame.line_number ].join(':')
    }
  }

  retrieveContext (error: Error): StackContext | null {
    if (error.stack === undefined) return null
    const frameRegex = /(\/[^\\\n]*)/g
    let tmp: any
    let frames: string[] = []

    while ((tmp = frameRegex.exec(error.stack))) {  // tslint:disable-line
      frames.push(tmp[1])
    }
    const stackFrames = frames.map((callsite) => {
      if (callsite[callsite.length - 1] === ')') {
        callsite = callsite.substr(0, callsite.length - 1)
      }
      let location = callsite.split(':')

      return {
        file_name: location[0],
        line_number: parseInt(location[1], 10)
      } as FrameMetadata
    })

    return this.parse(stackFrames)
  }
}
