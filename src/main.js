/**
 * ============================================
 * main.js - Punto de Entrada de LaCaletaCost
 * ============================================
 * 
 * Este archivo es el CONTROLADOR CENTRAL de la aplicación.
 * 
 * ARQUITECTURA:
 * - Los módulos ES6 en src/modules/ contienen la lógica
 * - Este archivo expone las funciones en window.* para
 *   compatibilidad con los onclick en index.html
 * - Al cargarse DESPUÉS del código inline de index.html,
 *   las funciones aquí SOBRESCRIBEN las legacy
 * 
 * MANTENIMIENTO:
 * - Para modificar funcionalidad, edita el módulo ES6
 * - No edites el código legacy en index.html
 * - Ver ARQUITECTURA.md para más detalles
 * 
 * @author LaCaletaCost Team
 * @version 2.0.0 (Arquitectura Modular)
 * @date 2025-12-21
 */

// ============================================
// UTILIDADES CORE
// ============================================
import { showToast } from './ui/toast.js';
import * as DOM from './utils/dom-helpers.js';
import * as Helpers from './utils/helpers.js';

window.showToast = showToast;
window.DOM = DOM;
Object.assign(window, DOM);

// Utilidades adicionales
window.showLoading = Helpers.showLoading;
window.hideLoading = Helpers.hideLoading;
window.exportarAExcel = Helpers.exportarAExcel;
window.formatCurrency = Helpers.formatCurrency;
window.formatDate = Helpers.formatDate;

// ============================================
// MÓDULO: INGREDIENTES ✅ (Legacy comentado)
// ============================================
import * as IngredientesUI from './modules/ingredientes/ingredientes-ui.js';
import * as IngredientesCRUD from './modules/ingredientes/ingredientes-crud.js';

// UI
window.renderizarIngredientes = IngredientesUI.renderizarIngredientes;
window.mostrarFormularioIngrediente = IngredientesUI.mostrarFormularioIngrediente;
window.cerrarFormularioIngrediente = IngredientesUI.cerrarFormularioIngrediente;
window.exportarIngredientes = IngredientesUI.exportarIngredientes;

// CRUD
window.guardarIngrediente = IngredientesCRUD.guardarIngrediente;
window.editarIngrediente = IngredientesCRUD.editarIngrediente;
window.eliminarIngrediente = IngredientesCRUD.eliminarIngrediente;

// ============================================
// MÓDULO: RECETAS ✅ (Legacy comentado)
// ============================================
import * as RecetasUI from './modules/recetas/recetas-ui.js';
import * as RecetasCRUD from './modules/recetas/recetas-crud.js';

// UI
window.renderizarRecetas = RecetasUI.renderizarRecetas;
window.mostrarFormularioReceta = RecetasUI.mostrarFormularioReceta;
window.cerrarFormularioReceta = RecetasUI.cerrarFormularioReceta;
window.agregarIngredienteReceta = RecetasUI.agregarIngredienteReceta;
window.calcularCosteReceta = RecetasUI.calcularCosteReceta;
window.exportarRecetas = RecetasUI.exportarRecetas;

// CRUD
window.guardarReceta = RecetasCRUD.guardarReceta;
window.editarReceta = RecetasCRUD.editarReceta;
window.eliminarReceta = RecetasCRUD.eliminarReceta;
window.calcularCosteRecetaCompleto = RecetasCRUD.calcularCosteRecetaCompleto;

// Producción
window.abrirModalProducir = RecetasCRUD.abrirModalProducir;
window.cerrarModalProducir = RecetasCRUD.cerrarModalProducir;
window.actualizarDetalleDescuento = RecetasCRUD.actualizarDetalleDescuento;
window.confirmarProduccion = RecetasCRUD.confirmarProduccion;

// ============================================
// MÓDULO: PROVEEDORES ✅ (Legacy comentado)
// ============================================
import * as ProveedoresUI from './modules/proveedores/proveedores-ui.js';
import * as ProveedoresCRUD from './modules/proveedores/proveedores-crud.js';

// UI
window.renderizarProveedores = ProveedoresUI.renderizarProveedores;
window.mostrarFormularioProveedor = ProveedoresUI.mostrarFormularioProveedor;
window.cerrarFormularioProveedor = ProveedoresUI.cerrarFormularioProveedor;
window.cargarIngredientesProveedor = ProveedoresUI.cargarIngredientesProveedor;
window.filtrarIngredientesProveedor = ProveedoresUI.filtrarIngredientesProveedor;
window.verProveedorDetalles = ProveedoresUI.verProveedorDetalles;
window.cerrarModalVerProveedor = ProveedoresUI.cerrarModalVerProveedor;

// CRUD
window.guardarProveedor = ProveedoresCRUD.guardarProveedor;
window.editarProveedor = ProveedoresCRUD.editarProveedor;
window.eliminarProveedor = ProveedoresCRUD.eliminarProveedor;

// ============================================
// MÓDULO: PEDIDOS ⚙️ (Híbrido - ES6 tiene prioridad)
// ============================================
import * as PedidosUI from './modules/pedidos/pedidos-ui.js';
import * as PedidosCRUD from './modules/pedidos/pedidos-crud.js';

// UI
window.renderizarPedidos = PedidosUI.renderizarPedidos;
window.mostrarFormularioPedido = PedidosUI.mostrarFormularioPedido;
window.cerrarFormularioPedido = PedidosUI.cerrarFormularioPedido;
window.cargarIngredientesPedido = PedidosUI.cargarIngredientesPedido;
window.agregarIngredientePedido = PedidosUI.agregarIngredientePedido;
window.calcularTotalPedido = PedidosUI.calcularTotalPedido;
window.exportarPedidos = PedidosUI.exportarPedidos;

// CRUD
window.guardarPedido = PedidosCRUD.guardarPedido;
window.eliminarPedido = PedidosCRUD.eliminarPedido;
window.marcarPedidoRecibido = PedidosCRUD.marcarPedidoRecibido;
window.cerrarModalRecibirPedido = PedidosCRUD.cerrarModalRecibirPedido;
window.confirmarRecepcionPedido = PedidosCRUD.confirmarRecepcionPedido;
window.verDetallesPedido = PedidosCRUD.verDetallesPedido;
window.cerrarModalVerPedido = PedidosCRUD.cerrarModalVerPedido;
window.descargarPedidoPDF = PedidosCRUD.descargarPedidoPDF;

// ============================================
// MÓDULO: VENTAS ⚙️ (Híbrido - ES6 tiene prioridad)
// ============================================
import * as VentasUI from './modules/ventas/ventas-ui.js';
import * as VentasCRUD from './modules/ventas/ventas-crud.js';

// UI
window.renderizarVentas = VentasUI.renderizarVentas;
window.exportarVentas = VentasUI.exportarVentas;

// CRUD
window.eliminarVenta = VentasCRUD.eliminarVenta;

// ============================================
// MÓDULO: DASHBOARD ⚙️ (Híbrido - ES6 tiene prioridad)
// ============================================
import * as Dashboard from './modules/dashboard/dashboard.js';

window.actualizarKPIs = Dashboard.actualizarKPIs;

// ============================================
// MÓDULO: EXPORT PDF
// ============================================
import * as PDFGenerator from './modules/export/pdf-generator.js';
import { descargarPDFReceta } from './modules/export/pdf-helper.js';

window.generarPDFReceta = PDFGenerator.generarPDFReceta;
window.generarPDFIngredientes = PDFGenerator.generarPDFIngredientes;
window.descargarPDFReceta = descargarPDFReceta;

// ============================================
// VARIABLES GLOBALES DE ESTADO
// ============================================
window.editandoIngredienteId = null;
window.editandoRecetaId = null;
window.editandoPedidoId = null;
window.editandoProveedorId = null;

// ============================================
// LOG DE INICIALIZACIÓN
// ============================================
console.log('');
console.log('🍽️ LaCaletaCost v2.0.0');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Módulo Ingredientes - ACTIVO');
console.log('✅ Módulo Recetas - ACTIVO');
console.log('✅ Módulo Proveedores - ACTIVO');
console.log('✅ Módulo Pedidos - ACTIVO');
console.log('✅ Módulo Ventas - ACTIVO');
console.log('✅ Módulo Dashboard - ACTIVO');
console.log('✅ Módulo Export PDF - ACTIVO');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 Todos los módulos cargados');
console.log('');
