# Quitar diseño de menú (solo tiempos de comida + porciones)

## Dónde está hoy

Existe el toggle **"Solo equivalencias"** dentro de **Configurar PDF**:

1. Abrir el plan en `PlanView.tsx` (vista de un plan).
2. Botón **"Configurar PDF"** (junto a "Descargar") → abre `PDFPreviewModal.tsx`.
3. En "Selección de Hojas" → bajo "2. Menús Ejemplo" está el sub-toggle
   **"Solo equivalencias"** (`meta.soloEquivalencias`).

Se guarda en `plan.pdfCustomMeta` (columna JSON del plan) vía
`POST /api/planes/:id/pdf` y se previsualiza con
`POST /api/planes/:id/pdf/preview`. La preferencia del toggle también se
cachea en `localStorage` (`norder_pdfCustomMetaPrefs`) para precargarla en
el siguiente plan.

## Qué hace exactamente

En `norder-crm-api/src/templates/plan.ejs` (página 2, "MENÚS"), por cada
columna de menú:

- **`soloEquivalencias = false` (default)**: agrupa por platillo, muestra
  nombre del platillo + cada ingrediente con descripción, cantidad, unidad
  y equivalencias — el "diseño" completo.
- **`soloEquivalencias = true`**: ignora descripciones/platillos y solo
  imprime las equivalencias resumidas, ej. `2 eq Cereal s/grasa + 1 eq
  AOA Bajo`, más los ingredientes "libres" (sin equivalencia) por
  separado.

Esto YA cubre el caso "solo tiempos de comida con porciones, sin diseño":
activando el toggle, cada renglón de tiempo de comida (Desayuno, Almuerzo,
etc.) muestra solo las porciones/equivalencias, sin el detalle de
platillos/ingredientes.

## Si se quisiera un modo distinto (`meta.plantilla: 'simple'`)

No implementado. Si en el futuro Eyder pide algo más allá de
"soloEquivalencias" (ej. layout de tabla totalmente distinto, sin
columnas Menú #1/#2), se haría:

1. Agregar un toggle nuevo en `PDFPreviewModal.tsx` (ej.
   `meta.plantilla === 'simple'`).
2. En `plan.ejs`, página 2: condicional adicional junto a
   `meta.soloEquivalencias` para renderizar una tabla simple
   (tiempo → lista de porciones) en vez del grid de 2 columnas.
3. No requiere cambios de schema (`pdfCustomMeta` ya es JSON libre).

## Limitación conocida (dos "Colación")

El barrido de equivalencias llavea columnas por **nombre**. Si el plan
tiene dos tiempos llamados igual ("Colación"), el barrido usa
"Colación" y "Colación 2" como columnas distintas, y
`findBarridoTiempoKey` (en `CreateEditPlan.tsx`) mapea la 2ª "Colación"
del plan → columna "Colación 2" del barrido. Si se quisiera que ambas
digan "Colación" sin el "2", se requiere refactor de
`BarridoEquivalencias.tsx` para indexar `distribucion`/`porciones` por
posición/id en vez de por nombre, más migración de los JSON ya guardados
con el formato viejo. No se hizo por riesgo de romper barridos de
pacientes activos.
