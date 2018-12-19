export default class Counter {
  private _count: number
  private used: boolean = false

  constructor (opts?) {
    opts = opts || {}
    this._count = opts.count || 0
  }

  val () {
    return this._count
  }

  inc (n?: number) {
    this.used = true
    this._count += (n || 1)
  }

  dec (n?: number) {
    this.used = true
    this._count -= (n || 1)
  }

  reset (count?: number) {
    this._count = count || 0
  }

  isUsed () {
    return this.used
  }
}
