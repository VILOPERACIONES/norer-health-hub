import { test, expect } from '@playwright/test';

// Escenario: Validación de entrada de Macros (100%) y botón de guardado.
test.describe('Creador de Planes Nutricionales - Validaciones', () => {
  
  test.beforeEach(async ({ page }) => {
    // Interceptar las peticiones de autenticación y paciente (Mocking)
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, json: { data: { id: 1, role: 'admin' } } });
    });
    
    await page.route('**/api/platillos', async (route) => {
      await route.fulfill({ status: 200, json: { data: [] } });
    });

    // Simular que estamos creando un menú base (isBasePlan)
    // Suponiendo que la ruta para ver esto con el componente CreateEditPlan es /planes?new=true
    // Ajustaremos esto asumiendo que el componente se monta en "/planes"
    await page.goto('/planes');
  });

  test('Debería deshabilitar el botón de Guardar si los macros no suman 100%', async ({ page }) => {
    // Buscar los inputs de macros. Tienen como etiqueta o texto cercano "Prot %", "Carb %", "Gras %"
    // Ya que son inputs de tipo number dentro de un contenedor decorado
    
    // Al cargar por defecto, el componente tiene 30% Prot, 40% Carb, 30% Gras = 100%
    // El botón debería estar habilitado (Generar Menú)
    const btnSubmit = page.getByRole('button', { name: /Generar Menú|Guardar Cambios/i });
    
    // Asegurarnos que carga primero la página
    await btnSubmit.waitFor({ state: 'visible' });
    await expect(btnSubmit).not.toBeDisabled();

    // Cambiar la suma a un valor distinto (ej. Prot 90%)
    // Vamos a buscar el input de Proteínas. Debido al marcado, el input no tiene id/name.
    // Usaremos page.locator y filtraremos por los que están cerca de la etiqueta "Prot %".
    const protInput = page.locator('div.group:has-text("Prot %") input[type="number"]');
    
    // Rellenamos erróneo para causar desbalance (Suma = 160%)
    await protInput.fill('90');
    
    // Verificar que el mensaje de error "Ajuste a 100%" aparezca
    await expect(page.locator('text=Suma 160% (Ajuste a 100%)')).toBeVisible();

    // El botón debe estar deshabilitado
    await expect(btnSubmit).toBeDisabled();
    
    // Corregir la suma: 90 + 10 = 100. (Carb y Gras deben sumar 10)
    const carbInput = page.locator('div.group:has-text("Carb %") input[type="number"]');
    await carbInput.fill('5');
    const grasInput = page.locator('div.group:has-text("Gras %") input[type="number"]');
    await grasInput.fill('5');

    // Ahora suma 100%
    // El mensaje rojo de suma debe desaparecer
    await expect(page.locator('text=Suma 100% (Ajuste a 100%)')).not.toBeVisible();
    await expect(page.locator('text=Suma')).not.toBeVisible(); // Asegura que no hay label tipo Suma X% 

    // Botón nuevamente habilitado
    await expect(btnSubmit).not.toBeDisabled();
  });
});
