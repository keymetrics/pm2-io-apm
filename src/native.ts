interface Error {
  prepareStackTrace?: () => void,
  __error_callsites?: Array<any>,
  stackframes?: Array<Object>
}
