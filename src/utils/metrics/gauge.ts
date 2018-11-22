export default class Gauge {
  private value: number = 0

  val (): number {
    return this.value
  }

  set (value: number) {
    this.value = value
  }
}
