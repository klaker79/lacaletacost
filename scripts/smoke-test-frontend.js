#!/usr/bin/env node
/**
 * 🧪 Smoke Test - Validación de Funciones Frontend
 * 
 * Verifica que todas las funciones window.* críticas están definidas.
 * Ejecutar en el navegador o con puppeteer.
 * 
 * USO (en consola del navegador):
 *   Copy-paste este código después de cargar la app
 * 
 * O ejecutar con puppeteer/playwright para automatizar
 */

const REQUIRED_FUNCTIONS = [
    // API
    'window.API',
    'window.API.getIngredients',
    'window.API.getRecipes',
    'window.API.getSuppliers',
    'window.API.getOrders',
    'window.API.getSales',
    'window.API.getEmpleados',
    'window.API.getHorarios',
    'window.API.getMermas',
    'window.API.getGastosFijos',

    // Navegación
    'window.cambiarSeccion',
    'window.mostrarSeccion',

    // Ingredientes
    'window.renderizarIngredientes',
    'window.abrirModalNuevoIngrediente',
    'window.guardarIngrediente',

    // Recetas
    'window.renderizarRecetas',
    'window.abrirModalNuevaReceta',
    'window.guardarReceta',

    // Proveedores
    'window.renderizarProveedores',

    // Pedidos
    'window.renderizarPedidos',
    'window.abrirModalNuevoPedido',

    // Ventas
    'window.renderizarVentas',

    // Dashboard
    'window.renderizarDashboard',
    'window.actualizarKPIs',

    // Inventario
    'window.renderizarInventario',

    // Empleados/Horarios
    'window.inicializarModuloHorarios',

    // Inteligencia
    'window.renderizarInteligencia',

    // Utils
    'window.escapeHTML',
    'window.safeNumber',
    'window.formatearFecha',
    'window.showToast',
    'window.getApiUrl',
];

/**
 * Ejecutar en consola del navegador
 */
function runFrontendSmokeTest() {
    console.log('\n🧪 SMOKE TEST - Funciones Frontend\n');
    console.log('='.repeat(50));

    let passed = 0;
    let failed = 0;
    const failures = [];

    for (const funcPath of REQUIRED_FUNCTIONS) {
        const parts = funcPath.split('.');
        let current = window;
        let exists = true;

        for (const part of parts) {
            if (part === 'window') continue;
            if (current && current[part] !== undefined) {
                current = current[part];
            } else {
                exists = false;
                break;
            }
        }

        if (exists) {
            console.log(`✅ ${funcPath}`);
            passed++;
        } else {
            console.log(`❌ ${funcPath}`);
            failed++;
            failures.push(funcPath);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`RESULTADOS: ${passed} pasaron, ${failed} fallaron`);
    console.log('='.repeat(50));

    if (failed > 0) {
        console.log('\n❌ FUNCIONES FALTANTES:\n');
        failures.forEach(f => console.log(`  - ${f}`));
        return false;
    } else {
        console.log('\n✅ TODAS LAS FUNCIONES EXISTEN\n');
        return true;
    }
}

// Si se ejecuta directamente, mostrar instrucciones
if (typeof window === 'undefined') {
    console.log(`
🧪 Smoke Test Frontend - Instrucciones

Este script debe ejecutarse en el NAVEGADOR después de cargar la app.

Pasos:
1. Abre https://app.mindloop.cloud
2. Haz login
3. Abre DevTools (F12)
4. Ve a Console
5. Copia y pega TODO el contenido de este archivo
6. Ejecuta: runFrontendSmokeTest()

El test mostrará qué funciones window.* están disponibles.
    `);
} else {
    // Ejecutar automáticamente si estamos en el navegador
    window.runFrontendSmokeTest = runFrontendSmokeTest;
    console.log('💡 Ejecuta runFrontendSmokeTest() para iniciar el test');
}

// Export para uso con puppeteer
if (typeof module !== 'undefined') {
    module.exports = { REQUIRED_FUNCTIONS, runFrontendSmokeTest };
}
