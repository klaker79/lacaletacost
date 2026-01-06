/**
 * Módulo de Gestión de Proveedores por Ingrediente
 * Permite asociar múltiples proveedores a un ingrediente, cada uno con su precio
 */

import { showToast } from '../../ui/toast.js';

// Variable para tracking del ingrediente actual
let ingredienteActualId = null;

/**
 * Abre el modal de gestión de proveedores para un ingrediente
 * @param {number} ingredienteId - ID del ingrediente
 */
export async function gestionarProveedoresIngrediente(ingredienteId) {
    ingredienteActualId = ingredienteId;

    // Obtener datos del ingrediente
    const ingrediente = window.ingredientes?.find(i => i.id === ingredienteId);
    if (!ingrediente) {
        showToast('Ingrediente no encontrado', 'error');
        return;
    }

    // Actualizar título del modal
    const modalTitulo = document.getElementById('modal-proveedores-titulo');
    if (modalTitulo) {
        modalTitulo.textContent = `Proveedores de "${ingrediente.nombre}"`;
    }

    // Cargar proveedores asociados
    await cargarProveedoresIngrediente(ingredienteId);

    // Mostrar modal
    const modal = document.getElementById('modal-proveedores-ingrediente');
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Carga y renderiza los proveedores asociados a un ingrediente
 * @param {number} ingredienteId - ID del ingrediente
 */
async function cargarProveedoresIngrediente(ingredienteId) {
    try {
        window.showLoading?.();

        // Obtener proveedores asociados del backend
        const response = await window.API.fetch(`/api/ingredients/${ingredienteId}/suppliers`);
        const proveedoresAsociados = Array.isArray(response) ? response : [];

        // Renderizar lista
        renderizarProveedoresAsociados(proveedoresAsociados);

        // Renderizar select de proveedores disponibles para agregar
        renderizarSelectProveedoresDisponibles(proveedoresAsociados);

        window.hideLoading?.();
    } catch (error) {
        window.hideLoading?.();
        console.error('Error cargando proveedores del ingrediente:', error);
        showToast('Error cargando proveedores', 'error');
    }
}

/**
 * Renderiza la lista de proveedores asociados
 * @param {Array} proveedoresAsociados - Lista de proveedores asociados
 */
function renderizarProveedoresAsociados(proveedoresAsociados) {
    const container = document.getElementById('lista-proveedores-asociados');
    if (!container) return;

    if (proveedoresAsociados.length === 0) {
        container.innerHTML = `
            <div style="padding: 60px 40px; text-align: center; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 16px; border: 2px dashed #cbd5e1;">
                <div style="font-size: 72px; margin-bottom: 20px; filter: grayscale(0.3); opacity: 0.8;">🏢</div>
                <h4 style="color: #475569; font-size: 18px; margin-bottom: 8px; font-weight: 600;">No hay proveedores asociados</h4>
                <p style="font-size: 14px; color: #64748B; margin: 0;">Agrega un proveedor usando el formulario de abajo 👇</p>
            </div>
        `;
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 16px;">';

    proveedoresAsociados.forEach(pa => {
        const esPrincipal = pa.es_proveedor_principal;

        // Badge y botón para marcar como principal - mucho más visual
        const badgePrincipal = esPrincipal
            ? '<div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); display: inline-flex; align-items: center; gap: 6px;"><span style="font-size: 16px;">⭐</span><span>PRINCIPAL</span></div>'
            : '<button class="btn-sm" onclick="window.marcarProveedorPrincipal(' +
              ingredienteActualId +
              ', ' +
              pa.proveedor_id +
              ')" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; border: none; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3); cursor: pointer; transition: all 0.2s;">⭐ Marcar como principal</button>';

        // Gradiente y estilos según si es principal
        const borderColor = esPrincipal ? '#10B981' : '#cbd5e1';
        const bgGradient = esPrincipal
            ? 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
        const shadowColor = esPrincipal
            ? 'rgba(16, 185, 129, 0.15)'
            : 'rgba(0, 0, 0, 0.05)';

        html += `
            <div style="border: 2px solid ${borderColor}; border-radius: 16px; padding: 20px; background: ${bgGradient}; box-shadow: 0 4px 12px ${shadowColor}; transition: all 0.2s; position: relative; overflow: hidden;">
                ${esPrincipal ? '<div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%); pointer-events: none;"></div>' : ''}

                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; position: relative; z-index: 1;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <span style="font-size: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">🏭</span>
                            <h4 style="margin: 0; color: #0f172a; font-size: 18px; font-weight: 700;">${escapeHTML(pa.proveedor_nombre)}</h4>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 6px; margin-left: 44px;">
                            ${pa.proveedor_contacto ? '<p style="margin: 0; font-size: 14px; color: #475569; display: flex; align-items: center; gap: 8px;"><span style="font-size: 16px;">👤</span><span>' + escapeHTML(pa.proveedor_contacto) + '</span></p>' : ''}
                            ${pa.proveedor_telefono ? '<p style="margin: 0; font-size: 14px; color: #475569; display: flex; align-items: center; gap: 8px;"><span style="font-size: 16px;">📞</span><span>' + escapeHTML(pa.proveedor_telefono) + '</span></p>' : ''}
                            ${pa.proveedor_email ? '<p style="margin: 0; font-size: 14px; color: #475569; display: flex; align-items: center; gap: 8px;"><span style="font-size: 16px;">✉️</span><span>' + escapeHTML(pa.proveedor_email) + '</span></p>' : ''}
                        </div>
                    </div>
                    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 12px;">
                        <div style="background: white; padding: 12px 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <div style="font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Precio</div>
                            <div style="font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                                ${parseFloat(pa.precio).toFixed(2)} €
                            </div>
                        </div>
                        ${badgePrincipal}
                    </div>
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; padding-top: 16px; border-top: 2px solid ${esPrincipal ? '#BBF7D0' : '#e2e8f0'};">
                    <button class="btn-sm" onclick="window.editarPrecioProveedor(${ingredienteActualId}, ${pa.proveedor_id}, ${pa.precio})" style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; border: none; box-shadow: 0 3px 10px rgba(59, 130, 246, 0.3); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 15px;">✏️</span><span>Editar precio</span>
                    </button>
                    <button class="btn-sm" onclick="window.eliminarProveedorIngrediente(${ingredienteActualId}, ${pa.proveedor_id})" style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; border: none; box-shadow: 0 3px 10px rgba(239, 68, 68, 0.3); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 15px;">🗑️</span><span>Eliminar</span>
                    </button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Renderiza el select de proveedores disponibles para agregar
 * @param {Array} proveedoresAsociados - Lista de proveedores ya asociados
 */
function renderizarSelectProveedoresDisponibles(proveedoresAsociados) {
    const select = document.getElementById('select-proveedor-nuevo');
    if (!select) return;

    const idsAsociados = proveedoresAsociados.map(pa => pa.proveedor_id);
    const proveedoresDisponibles = (window.proveedores || []).filter(
        p => !idsAsociados.includes(p.id)
    );

    if (proveedoresDisponibles.length === 0) {
        select.innerHTML = '<option value="">No hay más proveedores disponibles</option>';
        select.disabled = true;
        return;
    }

    select.disabled = false;
    select.innerHTML = '<option value="">Seleccionar proveedor...</option>';
    proveedoresDisponibles.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${escapeHTML(p.nombre)}</option>`;
    });
}

/**
 * Agrega un nuevo proveedor al ingrediente
 */
export async function agregarProveedorIngrediente() {
    const proveedorId = document.getElementById('select-proveedor-nuevo')?.value;
    const precio = document.getElementById('input-precio-nuevo')?.value;

    if (!proveedorId) {
        showToast('Selecciona un proveedor', 'warning');
        return;
    }

    if (!precio || parseFloat(precio) <= 0) {
        showToast('Ingresa un precio válido', 'warning');
        return;
    }

    try {
        window.showLoading?.();

        await window.API.fetch(`/api/ingredients/${ingredienteActualId}/suppliers`, {
            method: 'POST',
            body: JSON.stringify({
                proveedor_id: parseInt(proveedorId),
                precio: parseFloat(precio),
                es_proveedor_principal: false,
            }),
        });

        showToast('Proveedor agregado exitosamente', 'success');

        // Limpiar inputs
        document.getElementById('select-proveedor-nuevo').value = '';
        document.getElementById('input-precio-nuevo').value = '';

        // Recargar lista
        await cargarProveedoresIngrediente(ingredienteActualId);

        window.hideLoading?.();
    } catch (error) {
        window.hideLoading?.();
        console.error('Error agregando proveedor:', error);
        showToast('Error agregando proveedor: ' + (error.message || 'Error desconocido'), 'error');
    }
}

/**
 * Marca un proveedor como principal
 * @param {number} ingredienteId - ID del ingrediente
 * @param {number} proveedorId - ID del proveedor
 */
export async function marcarProveedorPrincipal(ingredienteId, proveedorId) {
    try {
        window.showLoading?.();

        // Obtener precio actual del proveedor
        const proveedoresActuales = await window.API.fetch(
            `/api/ingredients/${ingredienteId}/suppliers`
        );
        const proveedorActual = proveedoresActuales.find(p => p.proveedor_id === proveedorId);

        if (!proveedorActual) {
            throw new Error('Proveedor no encontrado');
        }

        await window.API.fetch(`/api/ingredients/${ingredienteId}/suppliers/${proveedorId}`, {
            method: 'PUT',
            body: JSON.stringify({
                precio: proveedorActual.precio,
                es_proveedor_principal: true,
            }),
        });

        showToast('Proveedor marcado como principal', 'success');

        // Recargar lista
        await cargarProveedoresIngrediente(ingredienteId);

        window.hideLoading?.();
    } catch (error) {
        window.hideLoading?.();
        console.error('Error marcando proveedor como principal:', error);
        showToast('Error actualizando proveedor', 'error');
    }
}

/**
 * Edita el precio de un proveedor
 * @param {number} ingredienteId - ID del ingrediente
 * @param {number} proveedorId - ID del proveedor
 * @param {number} precioActual - Precio actual
 */
export async function editarPrecioProveedor(ingredienteId, proveedorId, precioActual) {
    const nuevoPrecio = prompt('Nuevo precio:', precioActual);

    if (nuevoPrecio === null) return; // Cancelado

    if (!nuevoPrecio || parseFloat(nuevoPrecio) <= 0) {
        showToast('Precio inválido', 'error');
        return;
    }

    try {
        window.showLoading?.();

        // Obtener es_proveedor_principal actual
        const proveedoresActuales = await window.API.fetch(
            `/api/ingredients/${ingredienteId}/suppliers`
        );
        const proveedorActual = proveedoresActuales.find(p => p.proveedor_id === proveedorId);

        await window.API.fetch(`/api/ingredients/${ingredienteId}/suppliers/${proveedorId}`, {
            method: 'PUT',
            body: JSON.stringify({
                precio: parseFloat(nuevoPrecio),
                es_proveedor_principal: proveedorActual?.es_proveedor_principal || false,
            }),
        });

        showToast('Precio actualizado', 'success');

        // Recargar lista
        await cargarProveedoresIngrediente(ingredienteId);

        window.hideLoading?.();
    } catch (error) {
        window.hideLoading?.();
        console.error('Error actualizando precio:', error);
        showToast('Error actualizando precio', 'error');
    }
}

/**
 * Elimina un proveedor del ingrediente
 * @param {number} ingredienteId - ID del ingrediente
 * @param {number} proveedorId - ID del proveedor
 */
export async function eliminarProveedorIngrediente(ingredienteId, proveedorId) {
    if (!confirm('¿Eliminar este proveedor del ingrediente?')) return;

    try {
        window.showLoading?.();

        await window.API.fetch(`/api/ingredients/${ingredienteId}/suppliers/${proveedorId}`, {
            method: 'DELETE',
        });

        showToast('Proveedor eliminado', 'success');

        // Recargar lista
        await cargarProveedoresIngrediente(ingredienteId);

        window.hideLoading?.();
    } catch (error) {
        window.hideLoading?.();
        console.error('Error eliminando proveedor:', error);
        showToast('Error eliminando proveedor', 'error');
    }
}

/**
 * Cierra el modal de proveedores
 */
export function cerrarModalProveedoresIngrediente() {
    const modal = document.getElementById('modal-proveedores-ingrediente');
    if (modal) {
        modal.classList.remove('active');
    }

    ingredienteActualId = null;
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHTML(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
