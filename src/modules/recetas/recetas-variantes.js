/**
 * Módulo de Gestión de Variantes de Receta
 * Permite asociar múltiples formatos de venta a una receta (ej: botella, copa)
 */

import { showToast } from '../../ui/toast.js';

// Variable para tracking de la receta actual
let recetaActualId = null;

/**
 * Abre el modal de gestión de variantes para una receta
 * @param {number} recetaId - ID de la receta
 */
export async function gestionarVariantesReceta(recetaId) {
    recetaActualId = recetaId;

    // Obtener datos de la receta
    const receta = window.recetas?.find(r => r.id === recetaId);
    if (!receta) {
        showToast('Receta no encontrada', 'error');
        return;
    }

    // Actualizar título del modal
    const modalTitulo = document.getElementById('modal-variantes-titulo');
    if (modalTitulo) {
        modalTitulo.textContent = `Variantes de "${receta.nombre}"`;
    }

    // Cargar variantes
    await cargarVariantesReceta(recetaId);

    // Mostrar modal
    const modal = document.getElementById('modal-variantes-receta');
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Carga y renderiza las variantes de una receta
 */
async function cargarVariantesReceta(recetaId) {
    try {
        window.showLoading?.();

        const response = await window.API.fetch(`/api/recipes/${recetaId}/variants`);
        const variantes = Array.isArray(response) ? response : [];

        renderizarVariantes(variantes);

        window.hideLoading?.();
    } catch (error) {
        window.hideLoading?.();
        console.error('Error cargando variantes:', error);
        showToast('Error cargando variantes', 'error');
    }
}

/**
 * Renderiza la lista de variantes
 */
function renderizarVariantes(variantes) {
    const container = document.getElementById('lista-variantes');
    if (!container) return;

    if (variantes.length === 0) {
        container.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #94A3B8;">
                <div style="font-size: 48px; margin-bottom: 16px;">🍷</div>
                <p>No hay variantes definidas</p>
                <p style="font-size: 14px;">Añade formatos de venta (ej: Botella, Copa)</p>
            </div>
        `;
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';

    variantes.forEach(v => {
        html += `
            <div style="border: 2px solid #E2E8F0; border-radius: 12px; padding: 16px; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0; color: #1E293B; font-size: 16px;">${escapeHTML(v.nombre)}</h4>
                        <p style="margin: 4px 0; font-size: 13px; color: #64748B;">
                            Factor: ${v.factor}x ${v.codigo ? '| Código: ' + escapeHTML(v.codigo) : ''}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 24px; font-weight: bold; color: #10B981;">
                            ${parseFloat(v.precio_venta).toFixed(2)} €
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px;">
                    <button class="btn-sm" onclick="window.editarVariante(${recetaActualId}, ${v.id}, '${escapeHTML(v.nombre)}', ${v.precio_venta}, ${v.factor})" style="background: #3B82F6; color: white;">
                        ✏️ Editar
                    </button>
                    <button class="btn-sm" onclick="window.eliminarVariante(${recetaActualId}, ${v.id})" style="background: #EF4444; color: white;">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Agrega una nueva variante
 */
export async function agregarVarianteReceta() {
    const nombre = document.getElementById('input-variante-nombre')?.value;
    const precio = document.getElementById('input-variante-precio')?.value;
    const factor = document.getElementById('input-variante-factor')?.value || 1;

    if (!nombre) {
        showToast('Ingresa un nombre (ej: Copa, Botella)', 'warning');
        return;
    }

    if (!precio || parseFloat(precio) <= 0) {
        showToast('Ingresa un precio válido', 'warning');
        return;
    }

    try {
        window.showLoading?.();

        await window.API.fetch(`/api/recipes/${recetaActualId}/variants`, {
            method: 'POST',
            body: JSON.stringify({
                nombre: nombre,
                precio_venta: parseFloat(precio),
                factor: parseFloat(factor),
            }),
        });

        showToast('Variante añadida', 'success');

        // Limpiar inputs
        document.getElementById('input-variante-nombre').value = '';
        document.getElementById('input-variante-precio').value = '';
        document.getElementById('input-variante-factor').value = '1';

        // Recargar lista
        await cargarVariantesReceta(recetaActualId);

        window.hideLoading?.();
    } catch (error) {
        window.hideLoading?.();
        console.error('Error agregando variante:', error);
        showToast('Error agregando variante: ' + (error.message || 'Error'), 'error');
    }
}

/**
 * Edita una variante
 */
export async function editarVariante(recetaId, varianteId, nombreActual, precioActual, factorActual) {
    const nuevoPrecio = prompt(`Nuevo precio para "${nombreActual}":`, precioActual);
    if (nuevoPrecio === null) return;

    if (!nuevoPrecio || parseFloat(nuevoPrecio) <= 0) {
        showToast('Precio inválido', 'error');
        return;
    }

    try {
        window.showLoading?.();

        await window.API.fetch(`/api/recipes/${recetaId}/variants/${varianteId}`, {
            method: 'PUT',
            body: JSON.stringify({
                precio_venta: parseFloat(nuevoPrecio),
            }),
        });

        showToast('Variante actualizada', 'success');
        await cargarVariantesReceta(recetaId);

        window.hideLoading?.();
    } catch (error) {
        window.hideLoading?.();
        console.error('Error actualizando variante:', error);
        showToast('Error actualizando variante', 'error');
    }
}

/**
 * Elimina una variante
 */
export async function eliminarVariante(recetaId, varianteId) {
    if (!confirm('¿Eliminar esta variante?')) return;

    try {
        window.showLoading?.();

        await window.API.fetch(`/api/recipes/${recetaId}/variants/${varianteId}`, {
            method: 'DELETE',
        });

        showToast('Variante eliminada', 'success');
        await cargarVariantesReceta(recetaId);

        window.hideLoading?.();
    } catch (error) {
        window.hideLoading?.();
        console.error('Error eliminando variante:', error);
        showToast('Error eliminando variante', 'error');
    }
}

/**
 * Cierra el modal
 */
export function cerrarModalVariantes() {
    const modal = document.getElementById('modal-variantes-receta');
    if (modal) {
        modal.classList.remove('active');
    }
    recetaActualId = null;
}

/**
 * Escapa HTML
 */
function escapeHTML(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Exponer funciones globalmente
window.gestionarVariantesReceta = gestionarVariantesReceta;
window.agregarVarianteReceta = agregarVarianteReceta;
window.editarVariante = editarVariante;
window.eliminarVariante = eliminarVariante;
window.cerrarModalVariantes = cerrarModalVariantes;
