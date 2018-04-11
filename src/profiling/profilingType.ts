export default interface ProfilingType {
  init (): void
  start (): void
  stop (): void
  destroy (): void
}
