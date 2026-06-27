# F5d — PWA: Informe de implementación

**Commit:** `2d6888f`
**Build:** `pnpm --filter web build` → 0 errores, 0 warnings TypeScript.
**Rama:** `main`

---

## Qué se implementó

### 1. Manifest (instalable)

Fichero: `apps/web/src/app/manifest.ts`

Usa la convención de fichero de Next.js 16 (`app/manifest.ts` → `MetadataRoute.Manifest`).
Se sirve automáticamente en `/manifest.webmanifest` (visible en el output de build como ruta `○`).

Valores clave:
- `name` / `short_name`: "ReliefHub"
- `display`: `standalone`
- `theme_color`: `#111827` (Tailwind gray-900, coherente con la UI)
- `background_color`: `#ffffff`
- `start_url`: `/`
- `icons`: 192×192 y 512×512, `purpose: maskable`

### 2. Service Worker

Fichero: `apps/web/public/sw.js` (JS plano, sin bundler, servido directamente por Next.js).

Estrategias:
- **Navegación** (`request.mode === 'navigate'`): network-first → fallback a `/offline`.
- **Assets estáticos** (`/_next/static/`, `/icons/`, extensiones de imagen/fuente): cache-first.
- **API / backend** (ruta `/api/*` o hostname diferente): sin interceptar (`return` sin `event.respondWith`).
- **Métodos no-GET** (POST, PUT, DELETE — i.e., Server Actions): sin interceptar; van directo a red.

Precaché: `/` y `/offline` en `install`.
Limpieza de cachés obsoletas en `activate`.

Registro: componente cliente `apps/web/src/components/atoms/sw-register.tsx` montado en el root layout. Sólo registra en `process.env.NODE_ENV === 'production'`; guard `'serviceWorker' in navigator`. Sin impacto SSR (se ejecuta en `useEffect`).

### 3. Página offline

Fichero: `apps/web/src/app/offline/page.tsx` (`'use client'` — tiene botón de recarga).

Prerrenderizada como estática (`○` en el build). El SW la sirve desde caché cuando no hay red y falla la navegación.

### 4. Hook `useFormDraft`

Fichero: `apps/web/src/lib/use-form-draft.ts`

Interfaz:
```ts
useFormDraft(key: string, values: T, setters: Setters<T>, opts?)
  → { clearDraft, wasRestored }
```

- En el mount lee `localStorage.getItem('rh-draft:<key>')` y llama a los setters para restaurar.
- Devuelve `wasRestored: boolean` (emitido con `useState`) para que el formulario muestre el banner.
- Persiste (debounced 600 ms) en cada cambio de `values`, pero sólo después del primer restore para no sobreescribir el borrador con los valores vacíos iniciales.
- `clearDraft()` elimina la entrada y cancela el timer pendiente.

### 5. Banner `DraftRestoredBanner`

Átomo: `apps/web/src/components/atoms/draft-restored-banner.tsx`.
Muestra "Borrador restaurado" con `role="status" aria-live="polite"`. Discreto (borde gris, fondo gris-50, texto xs).

### 6. Formularios con autoguardado

`useFormDraft` aplicado a los 5 formularios controlados principales:

| Formulario | Fichero | Campos persistidos |
|---|---|---|
| `RegistrarForm` | `e/[slug]/registrar/registrar-form.tsx` | type, stage, name, description |
| `PeticionForm` | `e/[slug]/peticion/peticion-form.tsx` | title, description, priority |
| `DonarForm` | `e/[slug]/donar/donar-form.tsx` | category, description, quantity, unit, notes |
| `VoluntarioForm` | `e/[slug]/voluntario/voluntario-form.tsx` | name, contact, municipality, availability, vehicle |
| `ReportForm` | `e/[slug]/reportar/report-form.tsx` | type, priority, note, resourceId |

En todos: `clearDraft()` se llama en `useEffect` cuando `state.status === 'success'`.
El `SignupForm` (login/signup) no usa el hook: sería contraindicado persistir credenciales en localStorage.

Campos NO persistidos por diseño:
- `skills` (Set<Skill>) en voluntario: no es un string record plano.
- `photoUrls` en reportar: gestión por `useRef`, URLs de upload externo.
- `consentAccepted` (checkbox GDPR): no debe pre-marcarse desde borrador.
- Campos de ubicación/mapa: gestionados por `LocationPicker` (componente propio con estado interno).

---

## Cómo se generaron los iconos

Script: `apps/web/scripts/gen-icons.mjs` (Node, sin dependencias externas).

Usa `node:zlib` (`deflateSync`) para comprimir las scanlines PNG y construye el fichero binario a mano (cabecera PNG, chunks IHDR/IDAT/IEND con CRC32 correcto). Dibuja un cuadrado `#111827` con una "R" blanca rasterizada geométricamente (trazo vertical, barra superior, barra media, trazo vertical derecho y pata diagonal).

**Son iconos placeholder** — sustituir por arte real antes de producción.

Salida: `apps/web/public/icons/icon-192.png` (1083 B) y `icon-512.png` (4944 B).

---

## Verificación del build

```
Route (app)
├ ○ /manifest.webmanifest   ← sirve el manifest
├ ○ /offline                ← página offline estática en caché
```

`/sw.js` se sirve desde `public/` (fichero estático Next.js, accesible en `/sw.js` sin procesamiento).

---

## Preocupaciones y trabajo futuro

1. **Offline submit queue**: los formularios NO encolan los envíos fallidos para sincronizar cuando vuelva la conexión. Sólo guardan el borrador local. Una implementación futura requeriría IndexedDB + Background Sync API (o polling manual en `online` event) y revisión del wiring de Server Actions.

2. **Iconos placeholder**: los PNGs generados son funcionales para la instalación PWA pero no son la identidad visual definitiva. Necesitan arte real.

3. **SW en desarrollo**: el SW sólo se registra en producción (`NODE_ENV === 'production'`), lo que evita interferencias con HMR y el dev server de Next.js. Para probarlo localmente hay que hacer `pnpm build && pnpm start`.

4. **Campos de mapa no persistidos**: `LocationPicker` gestiona sus coordenadas internamente. Si el usuario abandona el formulario antes de enviar, la ubicación se pierde aunque los demás campos se restauren. Requeriría exponer el estado del mapa hacia arriba o usar un store global.

5. **`voluntario` con perfil existente**: cuando `existingProfile !== null` el hook se configura con debounce muy alto (efectivamente desactivado) para no sobreescribir el borrador con datos del servidor, pero tampoco restaura. Podría refinarse para distinguir explícitamente los dos modos.

6. **Precaché mínimo**: el shell precacheado es sólo `/` y `/offline`. En producción convendría añadir los assets críticos del build (fonts, chunk CSS principal) al precaché del SW para offline real. Esto requiere inyectar el manifest de build en el SW (lo que hace `next-pwa` automáticamente).
