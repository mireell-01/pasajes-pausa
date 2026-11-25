# Sistema de venta de pasajes · Pauza – Nasca – Ica – Lima

**Sistema publicado:** https://mireell-01.github.io/pasajes-pausa/

Sistema web hecho con **Vue.js 3** y **Firebase Realtime Database** para vender boletos de
una empresa de transporte.

## Qué hace

- **Croquis del bus de 39 asientos**: 19 de ventana (franja azul) y 20 de pasillo, con chofer,
  puerta y SS.HH. Cada asiento muestra si está libre, ocupado o libre solo en el tramo elegido.
- **Venta por tramos en el mismo bus**: Pauza → Nasca, Ica o Lima, y de regreso Lima → Ica, Nasca
  o Pauza. Un asiento vendido Pauza → Nasca se puede volver a vender Nasca → Lima.
- **Boleto para imprimir** (tamaño A5) con talón de control.
- **Administración de la flota** (placa, marca, modelo, año, estado).
- **Administración de choferes** (DNI, licencia, categoría, vencimiento, estado). No se puede
  asignar un chofer con la licencia vencida.
- **Viajes**: programar salidas con bus y chofer, y cambiar las tarifas por tramo.
- La venta usa una **transacción** de Firebase: si dos vendedores eligen el mismo asiento a la vez,
  solo uno lo vende.

## Probarlo en la computadora

```bash
npm install
npm run dev
```

Abra http://localhost:5173. Sin configurar Firebase funciona en **modo demo** (guarda los datos
solo en ese navegador). En la pantalla «Vender» está el botón «Cargar datos de ejemplo».

## Conectar con Firebase Realtime Database

1. Entre a https://console.firebase.google.com y cree un proyecto.
2. Menú **Compilación → Realtime Database → Crear base de datos**.
3. En la pestaña **Reglas**, pegue el contenido de `database.rules.json` y publique.
4. En **Configuración del proyecto → Tus apps → Web (</>)**, registre la app y copie los datos
   de `firebaseConfig` en `src/firebase.config.js` (incluido `databaseURL`).
5. Al recargar la página, arriba a la derecha dirá **● Firebase** en vez de «Modo demo».

> Las reglas dejan leer y escribir a cualquiera que tenga el enlace (adecuado para una práctica).
> Para uso real, agregue inicio de sesión con Firebase Authentication y cambie `.read` y `.write`
> por `auth != null`.

## Publicar en GitHub Pages

1. Cree un repositorio vacío en GitHub (aquí: `pasajes-pausa`).
2. Súbalo:
   ```bash
   git init
   git add .
   git commit -m "Sistema de venta de pasajes"
   git branch -M main
   git remote add origin https://github.com/mireell-01/pasajes-pausa.git
   git push -u origin main
   ```
3. Publique: `npm run publicar` (compila y sube la carpeta `dist` a la rama `gh-pages`).
4. En GitHub: **Settings → Pages → Branch: gh-pages / (root) → Save**.
5. El enlace será `https://mireell-01.github.io/pasajes-pausa/`.

## Estructura

```
src/
  vistas/       Venta, Boleto, Viajes, Flota, Choferes
  componentes/  CroquisBus.vue
  asientos.js   distribución de los 39 asientos
  ruta.js       paradas, tarifas y cruce de tramos
  db.js         Firebase Realtime Database (o modo demo)
  empresa.js    datos que salen en el boleto
```

## Datos en Firebase

```
buses/{id}            placa, marca, modelo, anio, asientos, estado
choferes/{id}         nombres, dni, licencia, categoria, vencimiento, telefono, estado
viajes/{id}           fecha, hora, sentido (PL | LP), busId, choferId
boletos/{viaje}/{id}  asiento, tipoAsiento, origen, destino, nombres, dni, telefono, precio, numero, vendidoEn
tarifas               Pauza_Nasca, Pauza_Ica, Pauza_Lima, Nasca_Ica, Nasca_Lima, Ica_Lima
contadores/boleto     último número de boleto
```
