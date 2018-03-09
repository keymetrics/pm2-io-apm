import units from './units'

export default class ExponentiallyWeightedMovingAverage {
  private _timePeriod: number
  private _tickInterval: number
  private _alpha: number
  private _count: number = 0
  private _rate: number = 0

  private TICK_INTERVAL: number = 5 * units.SECONDS

  constructor (timePeriod: number, tickInterval: number) {
    this._timePeriod = timePeriod || 1 * units.MINUTES
    this._tickInterval = tickInterval || this.TICK_INTERVAL
    this._alpha = 1 - Math.exp(-this._tickInterval / this._timePeriod)
  }

  update (n) {
    this._count += n
  }

  tick () {
    const instantRate = this._count / this._tickInterval
    this._count = 0

    this._rate += (this._alpha * (instantRate - this._rate))
  }

  rate (timeUnit) {
    return (this._rate || 0) * timeUnit
  }
}
