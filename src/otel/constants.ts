/** General purpose constants. */
const constants = {
  /* CUSTOM - MINIMUM_DURATION trace in uS to send to backend (avoid *vaportrace*)*/
  MINIMUM_TRACE_DURATION: process.env.NODE_ENV === 'test' ? 0 : 1000 * 1000,
}

export { constants as Constants }
