export default class Counter {
  private _count: number

  constructor (opts?) {
    opts = opts || {}
    this._count = opts.count || 0
  }

  val () {
    return this._count
  }

  inc (n?: number) {
    this._count += (n || 1)
  }

  dec (n?: number) {
    this._count -= (n || 1)
  }

  reset (count?: number) {
    this._count = count || 0
  }
}
