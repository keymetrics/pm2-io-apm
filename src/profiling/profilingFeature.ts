export default interface ProfilingFeature {
  init (): void
  start (): void
  stop (): void
  destroy (): void
}
