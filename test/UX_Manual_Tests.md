# Protocolo de Pruebas de Usabilidad (UX Manual) - Creador de Planes

Este documento sirve como guía paso a paso para el Nutriólogo o Clínico que validará empíricamente la "facilidad y practicidad" del módulo `CreateEditPlan.tsx`.

## Pre-requisitos
1. Correr el proyecto de frontend (`npm run dev`).
2. Entrar a la plataforma con una cuenta de prueba.
3. Crear un paciente de prueba o usar la URL directa de Creación de Menú Base si aplica.

---

## Escenario 1: Asignación de Macros "Desde Cero"
**Objetivo:** Medir la fricción al capturar los macros manualmente y verificar la responsividad de los gráficos de rosca.

### Pasos:
1. Ingresa el nombre del plan (ej. "Dieta Mediterránea Prueba").
2. En la sección "Energía", escribe `2000` Kcal.
3. Observa los campos de **Prot %**, **Carb %** y **Gras %**. 
4. Escribe `30` en Proteínas, `40` en Carbohidratos y `30` en Grasas.
5. **Resultado Esperado:** 
   - El porcentaje debe actualizarse en tiempo real.
   - El anillo/círculo debe animarse hasta el nivel deseado.
   - El mensaje rojo de "Tus macros no suman 100%" debe desaparecer.
   - El botón principal "Generar Menú" debe **habilitarse**.

---

## Escenario 2: Sincronización de "Barrido de Equivalencias"
**Objetivo:** Asegurar que si hay una Valoración Nutricional previa, los macros y Kcal aterricen automáticamente al Creador de Planes y guíen la sesión.

### Pasos:
1. Acceder al plan a través del perfil de un paciente que ya cuente con una **Valoración Nutricional (Barrido)** configurada con X porciones.
2. Al cargar la pantalla de `CreateEditPlan`, localizar el "Dashboard de Requerimientos".
3. **Resultado Esperado (Lectura Ocular):**
   - El total de Kcal objetivo debe mostrarse en pantalla gigante sin necesidad de teclear.
   - Debajo de los aros de porcentajes de Proteína/Carb/Gras, debe decir **"Barrido: X%"** correspondiente a las calorías de la valoración.
   - La tabla "Carga Estratégica de Equivalencias" debe estar pre-cargada y funcional al colapsar/desplegar con el ícono del electrocardiograma verde (`Activity`).

---

## Escenario 3: Interacción Fluida con Platillos (Menús y Tiempos)
**Objetivo:** Comprobar la facilidad de arrastrar/renombrar/subir/bajar platillos para ahorrar tiempo de clics.

### Pasos:
1. En el **Menú 1**, localiza el tiempo "DESAYUNO".
2. Añade un grupo/platillo llamado "Huevos Revueltos".
3. Busca ingredientes (Usando `SmaeIngredientePicker`). Agrega "Huevo Entero" y "Aceite".
4. Ahora, ubica los controles a la derecha del platillo (flechas subir/bajar). Haz clic en Bajar.
5. **Resultado Esperado:** 
   - Las flechas deben mover el platillo hacia abajo sin perder los ingredientes asociados.
   - El botón "Borrar" (junto al botón de subir/bajar) no debe apretarse por accidente (verificar el "hover area").
   - El Picker de ingredientes debe buscar de forma fluida (sin lag al teclear).
   
---

## 4. Encuesta de Satisfacción Posterior (Para el Usuario de Pruebas)
*(Se recomienda enviar estas 3 preguntas al nutriólogo de prueba)*
1. Del 1 al 5, ¿qué tan rápido entendiste por qué el botón "Guardar" estaba bloqueado?
2. ¿Qué te pareció el nivel de "ruido visual" (exceso de botones) en la sección de menús? (Bajo / Aceptable / Alto)
3. ¿Pudiste encontrar los alimentos SMAE que esperabas?
