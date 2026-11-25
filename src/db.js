// Capa de datos: Firebase Realtime Database o, si no hay configuración, modo demo
// con localStorage. Las vistas usan solo estas funciones, así funcionan igual en los dos modos.
import { initializeApp } from 'firebase/app'
import {
  getDatabase, ref, onValue, set, push, update, remove, runTransaction
} from 'firebase/database'
import { firebaseConfig } from './firebase.config.js'

export const modoFirebase = Boolean(firebaseConfig.databaseURL && firebaseConfig.apiKey)

const fb = modoFirebase ? getDatabase(initializeApp(firebaseConfig)) : null

/* ---------- Modo demo (localStorage) ---------- */
const CLAVE = 'pasajes-pauza-db'
const oyentes = new Set()
let arbol = leerLocal()

function leerLocal () {
  try { return JSON.parse(localStorage.getItem(CLAVE)) || {} } catch { return {} }
}
function clonar (v) { return v == null ? null : JSON.parse(JSON.stringify(v)) }
function partes (ruta) { return String(ruta).split('/').filter(Boolean) }
function obtener (ruta) {
  return partes(ruta).reduce((a, k) => (a == null ? null : (a[k] ?? null)), arbol)
}
function poner (ruta, valor) {
  const ps = partes(ruta)
  if (!ps.length) { arbol = clonar(valor) || {}; return }
  let a = arbol
  for (const k of ps.slice(0, -1)) {
    if (typeof a[k] !== 'object' || a[k] === null) a[k] = {}
    a = a[k]
  }
  const ultima = ps[ps.length - 1]
  if (valor == null) delete a[ultima]
  else a[ultima] = clonar(valor)
}
function avisar () {
  for (const o of oyentes) o.cb(clonar(obtener(o.ruta)))
}
function escribirLocal () {
  try { localStorage.setItem(CLAVE, JSON.stringify(arbol)) } catch { /* sin almacenamiento */ }
  avisar()
}
if (!modoFirebase && typeof window !== 'undefined') {
  // Si se abre en dos pestañas, las dos se mantienen al día.
  window.addEventListener('storage', e => {
    if (e.key === CLAVE) { arbol = leerLocal(); avisar() }
  })
}

/* ---------- API común ---------- */

/** Escucha una ruta y llama a cb(valor) cada vez que cambia. Devuelve la función para dejar de escuchar. */
export function escuchar (ruta, cb) {
  if (fb) {
    return onValue(ref(fb, ruta), s => cb(s.val()), err => {
      console.error('Firebase:', err)
      cb(null)
    })
  }
  const o = { ruta, cb }
  oyentes.add(o)
  cb(clonar(obtener(ruta)))
  return () => oyentes.delete(o)
}

export function claveNueva (ruta) {
  if (fb) return push(ref(fb, ruta)).key
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export async function guardar (ruta, valor) {
  if (fb) return set(ref(fb, ruta), valor)
  poner(ruta, valor)
  escribirLocal()
}

export async function agregar (ruta, valor) {
  const id = claveNueva(ruta)
  await guardar(`${ruta}/${id}`, valor)
  return id
}

export async function actualizar (ruta, cambios) {
  if (fb) return update(ref(fb, ruta), cambios)
  poner(ruta, { ...(obtener(ruta) || {}), ...cambios })
  escribirLocal()
}

export async function borrar (ruta) {
  if (fb) return remove(ref(fb, ruta))
  poner(ruta, null)
  escribirLocal()
}

/**
 * Transacción: fn(valorActual) devuelve el nuevo valor, o undefined para cancelar.
 * En Firebase evita que dos vendedores vendan el mismo asiento a la vez.
 */
export async function transaccion (ruta, fn) {
  if (fb) {
    const r = await runTransaction(ref(fb, ruta), fn)
    return { ok: r.committed, valor: r.snapshot.val() }
  }
  const nuevo = fn(clonar(obtener(ruta)))
  if (nuevo === undefined) return { ok: false, valor: clonar(obtener(ruta)) }
  poner(ruta, nuevo)
  escribirLocal()
  return { ok: true, valor: clonar(nuevo) }
}

/** Número correlativo del boleto. */
export async function siguienteNumero () {
  const r = await transaccion('contadores/boleto', n => (Number(n) || 0) + 1)
  return r.valor
}
