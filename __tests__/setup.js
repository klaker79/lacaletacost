/**
 * Jest Test Setup
 * Configura el entorno global para simular el navegador
 */

// En ES modules, jest ya está disponible en el contexto de test
// Este archivo solo configura variables globales que usa la app

// Mock de variables globales que usa la app
global.window = global.window || {};
global.window.ingredientes = [];
global.window.recetas = [];
global.window.proveedores = [];
global.window.pedidos = [];
global.window.ventas = [];

// localStorage ya está mockeado por jsdom, pero añadimos fallback
if (!global.localStorage) {
    global.localStorage = {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
        clear: () => { }
    };
}

// Mock de XLSX (SheetJS) - para tests de exportación
global.XLSX = {
    utils: {
        book_new: () => ({}),
        json_to_sheet: () => ({}),
        book_append_sheet: () => { }
    },
    writeFile: () => { }
};

// Silenciar console en tests (opcional, comentar para debug)
// global.console.log = () => {};
// global.console.warn = () => {};
