type Fields = Record<string, unknown>

function redact(v: unknown) {
  if (typeof v === 'string') {
    if (v.length > 8) return v.slice(0, 2) + '***' + v.slice(-2)
    return '***'
  }
  return v
}

function safeFields(fields?: Fields) {
  if (!fields) return {}
  const out: Fields = {}
  for (const [k, v] of Object.entries(fields)) {
    if (/(password|secret|token|key|shared|cookie|session)/i.test(k)) out[k] = redact(v)
    else out[k] = v
  }
  return out
}

export const log = {
  info: (msg: string, fields?: Fields) => console.log(JSON.stringify({ level: 'info', msg, ...safeFields(fields) })),
  warn: (msg: string, fields?: Fields) => console.warn(JSON.stringify({ level: 'warn', msg, ...safeFields(fields) })),
  error: (msg: string, fields?: Fields) => console.error(JSON.stringify({ level: 'error', msg, ...safeFields(fields) })),
}
