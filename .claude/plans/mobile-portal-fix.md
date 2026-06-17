# Plan: Fix Norder Health Portal — Mobile Layout Broken

**Fecha:** 2026-06-05  
**Branch:** feat--chat-nut-agent  
**Síntoma:** En prod mobile, todo el portal (Login, Home, Chat) no se ve igual que desktop.

---

## Root Cause Analysis

`index.html` tiene:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

`black-translucent` = app renderiza DETRÁS del status bar/notch/Dynamic Island.  
`viewport-fit=cover` = viewport cubre el area de la notch.

**Consecuencia:** SIN `env(safe-area-inset-top/bottom)`, el contenido queda:
- **Arriba:** bajo Dynamic Island (~59px iPhone 15 Pro) o notch (~44px iPhone X-13)
- **Abajo:** bajo home indicator (~34px iPhone X+)

Ninguna de las 3 páginas usa safe-area insets. Tampoco está instalado `tailwindcss-safe-area`.

**Bugs secundarios:**
- `font-size: 14px` en `<input>` y `<textarea>` → iOS Safari hace zoom automático al focus (mínimo es 16px)
- Chat keyboard en iOS: `h-[100dvh]` no se recalcula bien cuando aparece teclado virtual; el `visualViewport` listener solo hace scroll, no ajusta layout

---

## Phase 0: Documentation Discovery

**Goal:** Confirmar APIs reales de `tailwindcss-safe-area` y comportamiento de `dvh` en iOS Safari antes de escribir código.

**Tasks:**
1. Verificar que `tailwindcss-safe-area` exporte clases `pb-safe`, `pt-safe`, `px-safe` y variantes con `pt-safe-or-N` (suma safe-area + padding base)
2. Confirmar que `100dvh` en iOS 16+ se comporta igual a `100svh` cuando el teclado está abierto
3. Listar todos los puntos en las 3 páginas que necesitan corrección (grep por `pt-\d+`, `pb-\d+`, `text-\[1[0-4]px\]`)

**Deliverable:** Lista de clases a cambiar y su reemplazo exacto.

**Verification:** `grep -n "safe-area\|env(safe" src/pages/norderhealth/*.tsx` → debe retornar 0 resultados (baseline para comparar después)

---

## Phase 1: Install `tailwindcss-safe-area` + Config

**Goal:** Tener utilidades Tailwind para safe-area disponibles en todo el proyecto.

**Steps:**
1. Instalar:
   ```bash
   npm install tailwindcss-safe-area
   ```
2. Agregar plugin en `tailwind.config.ts`:
   ```ts
   plugins: [require("tailwindcss-animate"), require("tailwindcss-safe-area")],
   ```
3. Verificar que el build no falla:
   ```bash
   npm run build 2>&1 | tail -20
   ```

**Clases disponibles tras instalar:**
- `pt-safe` → `padding-top: env(safe-area-inset-top)`
- `pb-safe` → `padding-bottom: env(safe-area-inset-bottom)`
- `pt-safe-or-4` → `max(env(safe-area-inset-top), 1rem)` (el mayor entre safe-area y el fallback)

**Anti-patterns:**
- NO usar `env(safe-area-inset-top)` en `style={}` inline si se puede evitar con la clase Tailwind
- NO cambiar `viewport-fit=cover` — es correcto, el problema está en el CSS, no en el meta tag

**Verification:** `grep -r "tailwindcss-safe-area" node_modules/.package-lock.json` → debe existir

---

## Phase 2: Fix Safe Area — Login.tsx

**File:** `src/pages/norderhealth/Login.tsx`

**Problem:** El contenedor outer es `min-h-[100dvh] flex flex-col` sin top padding safe-area. El degradado superior (`h-64`) solapa el logo.

**Fix:**
```tsx
// ANTES (línea 53):
<div className="min-h-[100dvh] bg-[#0d0d0d] flex flex-col">

// DESPUÉS:
<div className="min-h-[100dvh] bg-[#0d0d0d] flex flex-col pt-safe">
```

El `py-12` del inner `flex-1` container (línea 58) ya proporciona padding suficiente abajo, pero hay que verificar que el `pt-safe` no duplique con él — si sí, ajustar `pt-12` del inner a algo menor o eliminarlo.

**Also fix — iOS input zoom (Login inputs):**

Línea 82 (input teléfono) y línea 96 (input fecha):
```tsx
// ANTES:
className="... text-[14px] ..."

// DESPUÉS:
className="... text-[16px] ..."
```

Nota: `text-[16px]` en `<input>` es el mínimo para que iOS no haga zoom. El cambio visual es mínimo.

**Verification:**
- En iOS DevTools emulation: top del logo no queda bajo el status bar
- Al tocar el campo teléfono: NO hace zoom automático

---

## Phase 3: Fix Safe Area — Home.tsx

**File:** `src/pages/norderhealth/Home.tsx`

**Problem 1 — Header:** `pt-14` (56px) en header. En iPhone 15 Pro, Dynamic Island necesita ~59px. En iPhone 15 Plus, ~54px. `pt-14` es insuficiente para todos los dispositivos.

**Fix header (línea 67):**
```tsx
// ANTES:
<div className="px-5 pt-14 pb-2 flex items-start justify-between">

// DESPUÉS:
<div className="px-5 pt-safe pb-2 flex items-start justify-between" style={{ paddingTop: 'max(env(safe-area-inset-top), 3.5rem)' }}>
```

O con clase compuesta si el plugin la soporta:
```tsx
<div className="px-5 pb-2 flex items-start justify-between" style={{ paddingTop: 'max(env(safe-area-inset-top), 56px)' }}>
```

**Problem 2 — CTA fijo (línea 188):** `pb-10` (40px) en el área del botón. Home indicator en iPhone X+ es ~34px. En dispositivos sin notch (SE), 40px es innecesariamente grande. Usar safe-area + fallback:

```tsx
// ANTES:
<div className="flex-shrink-0 px-4 pb-10 pt-3 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent">

// DESPUÉS:
<div className="flex-shrink-0 px-4 pt-3 pb-safe bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 2rem)' }}>
```

**Verification:**
- Saludo y nombre visibles sin ser tapados por Dynamic Island
- Botón "Hablar con Eyder" visible sin quedar bajo home indicator

---

## Phase 4: Fix Safe Area + Keyboard — Chat.tsx

**File:** `src/pages/norderhealth/Chat.tsx`

### 4a. Header safe area (línea 220)

```tsx
// ANTES:
<div className="flex-shrink-0 bg-[#0d0d0d] border-b border-[#1c1c1c] px-4 pt-6 pb-3 flex items-center gap-3">

// DESPUÉS — usar max() para garantizar cobertura en todos los devices:
<div 
  className="flex-shrink-0 bg-[#0d0d0d] border-b border-[#1c1c1c] px-4 pb-3 flex items-center gap-3"
  style={{ paddingTop: 'max(env(safe-area-inset-top), 3rem)' }}
>
```

### 4b. Input area — safe area bottom + keyboard (línea 268)

El `pb-8` actual no alcanza para el home indicator.  
Además, cuando aparece el teclado virtual en iOS, el layout no se ajusta automáticamente.

**Solución CSS:**
```tsx

// ANTES:
<div className="flex-shrink-0 bg-[#0d0d0d] px-3 pb-8 pt-3 border-t border-[#1c1c1c]">

// DESPUÉS:
<div 
  className="flex-shrink-0 bg-[#0d0d0d] px-3 pt-3 border-t border-[#1c1c1c]"
  style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)' }}
>
```

### 4c. Fix container para keyboard iOS

El root `h-[100dvh]` en iOS Safari cuando se abre el teclado puede no reducir el viewport. La solución recomendada para 2024+ es agregar al meta viewport:
```html
interactive-widget=resizes-content
```
Esto le dice a iOS Safari que el contenido se debe redimensionar cuando aparece el teclado.

**En `index.html` (línea 5):**
```html
<!-- ANTES: -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

<!-- DESPUÉS: -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
```

⚠️ Nota: `interactive-widget` es soportado en Chrome/Android desde 108+. En iOS Safari, `dvh` ya maneja esto correctamente en iOS 16+. Verificar comportamiento en ambas plataformas.

### 4d. Fix iOS input zoom en textarea (Chat.tsx línea 298)

```tsx
// ANTES:
className="w-full bg-transparent text-[14px] text-[#e8e8e8] ..."

// DESPUÉS:
className="w-full bg-transparent text-[16px] text-[#e8e8e8] ..."
```

**Anti-pattern:** NO usar `transform: scale(0.875)` para simular 14px — complica el layout.

**Verification (Phase 4):**
- Abrir Chat en iPhone (DevTools emulation: iPhone 15 Pro)
- Header visible sin solapar Dynamic Island
- Al tocar textarea: NO hace zoom
- Al abrir teclado: input area visible por encima del teclado
- Mensajes scrollean correctamente mientras teclado está abierto

---

## Phase 5: Final Verification

**Checklist:**
- [ ] `grep -n "pt-12\|pt-14\|pb-8\|pb-10" src/pages/norderhealth/*.tsx` → todos deben haber migrado a safe-area approach
- [ ] `grep -n "text-\[1[0-4]px\]" src/pages/norderhealth/*.tsx` → 0 resultados en `<input>` y `<textarea>`
- [ ] `npm run build` → sin errores
- [ ] Test en iOS Safari (DevTools emulation iPhone 15 Pro): Login, Home, Chat — todos visibles sin clipping
- [ ] Test en Android Chrome (DevTools emulation Pixel 7): mismo check
- [ ] Test en Safari standalone PWA mode: header no tapado por status bar
- [ ] Chat: abrir teclado → input area sigue visible

**Commit message pattern:**
```
fix(portal): add iOS safe-area insets and fix input zoom on mobile
```

---

## Files to Change

| File | Changes |
|------|---------|
| `package.json` / `node_modules` | + `tailwindcss-safe-area` |
| `tailwind.config.ts` | + plugin |
| `index.html` | + `interactive-widget` en viewport meta |
| `src/pages/norderhealth/Login.tsx` | pt-safe en container, text-[16px] en inputs |
| `src/pages/norderhealth/Home.tsx` | safe-area en header y CTA |
| `src/pages/norderhealth/Chat.tsx` | safe-area en header e input, text-[16px] en textarea |
