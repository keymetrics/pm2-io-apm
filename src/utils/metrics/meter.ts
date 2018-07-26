import EWMA from '../EWMA'
import units from '../units'

export default class Meter {

  private _tickInterval: number
  private _samples: number
  private _timeframe: number
  private _rate
  private _interval

  constructor (opts?: any) {
    const self = this

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

  mark = function (n?) {
    n = n || 1

    this._rate.update(n)
  }

  val = function () {
    return Math.round(this._rate.rate(this._samples * units.SECONDS) * 100 ) / 100
  }
}
