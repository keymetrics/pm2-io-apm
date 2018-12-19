import EWMA from '../EWMA'
import units from '../units'

export default class Meter {

  private _tickInterval: number
  private _samples: number
  private _timeframe: number
  private _rate
  private _interval
  private used: boolean = false

  constructor (opts?: any) {
    const self = this

    if (typeof opts !== 'object') {
      opts = {}
    }

    this._samples = opts.samples || opts.seconds || 1
    this._timeframe = opts.timeframe || 60
    this._tickInterval = opts.tickInterval || 5 * units.SECONDS

    this._rate = new EWMA(this._timeframe * units.SECONDS, this._tickInterval)

    if (opts.debug && opts.debug === true) {
      return
    }

    this._interval = setInterval(function () {
      self._rate.tick()
    }, this._tickInterval)

    this._interval.unref()
  }

  mark = function (n: number = 1) {
    this.used = true
    this._rate.update(n)
  }

  val = function () {
    return Math.round(this._rate.rate(this._samples * units.SECONDS) * 100) / 100
  }

  isUsed () {
    return this.used
  }
}
