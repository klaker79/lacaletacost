/**
 * Ventas CRUD Module
 * Funciones de eliminar ventas
 */

/**
 * Elimina una venta
 */
export async function eliminarVenta(id) {
    if (!confirm('¿Eliminar esta venta?')) return;

    window.showLoading();

    try {
        await window.api.deleteSale(id);
        await window.renderizarVentas();
        window.hideLoading();
        window.showToast('Venta eliminada', 'success');
    } catch (error) {
        window.hideLoading();
        console.error('Error:', error);
        window.showToast('Error eliminando venta: ' + error.message, 'error');
    }
}
