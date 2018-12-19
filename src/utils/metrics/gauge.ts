export default class Gauge {
  private value = 0
  private used = false

  val () {
    return this.value
  }

  set (value) {
    this.used = true
    this.value = value
  }

  isUsed () {
    return this.used
  }
}
