import { EMPRESA } from './empresa.js'

/** Objeto de Firebase { id: {...} } → lista [{ id, ... }] */
export const lista = obj =>
  Object.entries(obj || {})
    .filter(([, v]) => v && typeof v === 'object')
    .map(([id, v]) => ({ id, ...v }))

export const soles = n => 'S/ ' + Number(n || 0).toFixed(2)

export function fechaCorta (iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
export function diaSemana (iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-').map(Number)
  return DIAS[new Date(a, m - 1, d).getDay()]
}

export function hoyISO () {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export function fechaHora (ms) {
  if (!ms) return ''
  return new Date(ms).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
}

export const licenciaVencida = ch => Boolean(ch?.vencimiento && ch.vencimiento < hoyISO())

export const numeroBoleto = n => `${EMPRESA.serie}-${String(n || 0).padStart(6, '0')}`
