/**
 * Módulo de Ingredientes - Gestión de Proveedores
 * Permite gestionar múltiples proveedores por ingrediente
 */

import { showToast } from '../../ui/toast.js';
import { getElement } from '../../utils/dom-helpers.js';

const API_BASE = window.API_CONFIG?.baseUrl || 'https://lacaleta-api.mindloop.cloud';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : '',
    };
}

// Cache de proveedores por ingrediente
let suppliersCache = {};

/**
 * Obtiene los proveedores de un ingrediente
 */
async function getIngredientSuppliers(ingredientId) {
    try {
        const response = await fetch(`${API_BASE}/api/ingredients/${ingredientId}/suppliers`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Error obteniendo proveedores');
        const suppliers = await response.json();
        suppliersCache[ingredientId] = suppliers;
        return suppliers;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

/**
 * Añade un proveedor a un ingrediente
 */
async function addSupplierToIngredient(ingredientId, supplierId, precio, esPrincipal = false) {
    try {
        const response = await fetch(`${API_BASE}/api/ingredients/${ingredientId}/suppliers`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                proveedor_id: supplierId,
                precio: precio,
                es_proveedor_principal: esPrincipal
            })
        });
        if (!response.ok) throw new Error('Error añadiendo proveedor');
        delete suppliersCache[ingredientId]; // Invalidar cache
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Actualiza el precio de un proveedor
 */
async function updateSupplierPrice(ingredientId, supplierId, precio, esPrincipal = false) {
    try {
        const response = await fetch(`${API_BASE}/api/ingredients/${ingredientId}/suppliers/${supplierId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                precio: precio,
                es_proveedor_principal: esPrincipal
            })
        });
        if (!response.ok) throw new Error('Error actualizando precio');
        delete suppliersCache[ingredientId];
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Elimina un proveedor de un ingrediente
 */
async function removeSupplierFromIngredient(ingredientId, supplierId) {
    try {
        const response = await fetch(`${API_BASE}/api/ingredients/${ingredientId}/suppliers/${supplierId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Error eliminando proveedor');
        delete suppliersCache[ingredientId];
        return true;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Muestra el modal de gestión de proveedores para un ingrediente
 */
async function showSuppliersModal(ingredientId) {
    const ingredient = window.ingredientes?.find(i => i.id === ingredientId);
    if (!ingredient) {
        showToast('Ingrediente no encontrado', 'error');
        return;
    }

    // Crear modal si no existe
    let modal = getElement('modal-suppliers');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-suppliers';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 id="suppliers-modal-title" style="margin: 0;">🏢 Proveedores</h3>
                    <button onclick="window.closeSuppliersModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                <div id="suppliers-content"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Añadir estilos si no existen
    if (!document.getElementById('suppliers-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'suppliers-modal-styles';
        style.textContent = `
            #modal-suppliers {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
                justify-content: center;
                align-items: center;
            }
            #modal-suppliers.active {
                display: flex;
            }
            #modal-suppliers .modal-content {
                background: white;
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .supplier-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                border-bottom: 1px solid #e2e8f0;
                gap: 12px;
            }
            .supplier-row:hover {
                background: #f8fafc;
            }
            .supplier-row.principal {
                background: #ecfdf5;
                border-left: 4px solid #10b981;
            }
            .supplier-price-input {
                width: 80px;
                padding: 6px 10px;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                text-align: right;
            }
            .supplier-actions {
                display: flex;
                gap: 8px;
            }
            .add-supplier-form {
                display: flex;
                gap: 12px;
                padding: 16px;
                background: #f8fafc;
                border-radius: 12px;
                margin-top: 16px;
                flex-wrap: wrap;
            }
            .add-supplier-form select,
            .add-supplier-form input {
                padding: 10px 12px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                flex: 1;
                min-width: 120px;
            }
            .add-supplier-form button {
                padding: 10px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
            }
            .btn-principal {
                padding: 4px 8px;
                background: #10b981;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
            }
            .btn-remove {
                padding: 4px 8px;
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }

    // Cargar proveedores
    const suppliers = await getIngredientSuppliers(ingredientId);
    const allProveedores = window.proveedores || [];

    // Renderizar contenido
    const content = getElement('suppliers-content');
    const title = getElement('suppliers-modal-title');

    title.innerHTML = `🏢 Proveedores de <strong>${ingredient.nombre}</strong>`;

    let html = '';

    if (suppliers.length === 0) {
        html += '<p style="color: #64748b; text-align: center; padding: 20px;">No hay proveedores asignados</p>';
    } else {
        html += '<div class="suppliers-list">';
        suppliers.forEach(sup => {
            html += `
                <div class="supplier-row ${sup.es_proveedor_principal ? 'principal' : ''}" data-supplier-id="${sup.proveedor_id}">
                    <div style="flex: 2;">
                        <strong>${sup.proveedor_nombre || 'Proveedor'}</strong>
                        ${sup.es_proveedor_principal ? '<span style="color: #10b981; font-size: 11px; margin-left: 8px;">⭐ Principal</span>' : ''}
                    </div>
                    <div style="flex: 1;">
                        <input type="number" step="0.01" class="supplier-price-input" 
                               value="${parseFloat(sup.precio || 0).toFixed(2)}" 
                               onchange="window.updateSupplierPriceUI(${ingredientId}, ${sup.proveedor_id}, this.value)">
                        <span style="color: #64748b;">€/${ingredient.unidad}</span>
                    </div>
                    <div class="supplier-actions">
                        ${!sup.es_proveedor_principal ? `<button class="btn-principal" onclick="window.setMainSupplier(${ingredientId}, ${sup.proveedor_id})">⭐ Principal</button>` : ''}
                        <button class="btn-remove" onclick="window.removeSupplierUI(${ingredientId}, ${sup.proveedor_id})">🗑️</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    // Formulario para añadir proveedor
    const assignedIds = suppliers.map(s => s.proveedor_id);
    const availableProvs = allProveedores.filter(p => !assignedIds.includes(p.id));

    if (availableProvs.length > 0) {
        html += `
            <div class="add-supplier-form">
                <select id="new-supplier-select">
                    <option value="">Seleccionar proveedor...</option>
                    ${availableProvs.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
                </select>
                <input type="number" step="0.01" id="new-supplier-price" placeholder="Precio €" value="0">
                <label style="display: flex; align-items: center; gap: 6px;">
                    <input type="checkbox" id="new-supplier-principal"> Principal
                </label>
                <button onclick="window.addSupplierUI(${ingredientId})">➕ Añadir</button>
            </div>
        `;
    } else {
        html += '<p style="color: #64748b; text-align: center; padding: 16px; font-size: 13px;">Todos los proveedores ya están asignados</p>';
    }

    content.innerHTML = html;
    modal.classList.add('active');
}

/**
 * Cierra el modal de proveedores
 */
function closeSuppliersModal() {
    const modal = getElement('modal-suppliers');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Handler: Añadir proveedor desde UI
 */
async function addSupplierUI(ingredientId) {
    const select = getElement('new-supplier-select');
    const priceInput = getElement('new-supplier-price');
    const principalCheck = getElement('new-supplier-principal');

    const supplierId = select?.value;
    const precio = parseFloat(priceInput?.value) || 0;
    const esPrincipal = principalCheck?.checked || false;

    if (!supplierId) {
        showToast('Selecciona un proveedor', 'warning');
        return;
    }

    try {
        await addSupplierToIngredient(ingredientId, supplierId, precio, esPrincipal);
        showToast('✅ Proveedor añadido', 'success');
        // Recargar modal
        await showSuppliersModal(ingredientId);
        // Recargar ingredientes si el principal cambió
        if (esPrincipal && window.cargarIngredientes) {
            await window.cargarIngredientes();
        }
    } catch (error) {
        showToast('❌ Error añadiendo proveedor', 'error');
    }
}

/**
 * Handler: Actualizar precio desde UI
 */
async function updateSupplierPriceUI(ingredientId, supplierId, newPrice) {
    try {
        await updateSupplierPrice(ingredientId, supplierId, parseFloat(newPrice) || 0);
        showToast('✅ Precio actualizado', 'success');
    } catch (error) {
        showToast('❌ Error actualizando precio', 'error');
    }
}

/**
 * Handler: Establecer como principal
 */
async function setMainSupplier(ingredientId, supplierId) {
    try {
        // Obtener el precio actual de este proveedor
        const suppliers = suppliersCache[ingredientId] || await getIngredientSuppliers(ingredientId);
        const supplier = suppliers.find(s => s.proveedor_id === supplierId);
        const precio = supplier?.precio || 0;

        await updateSupplierPrice(ingredientId, supplierId, precio, true);
        showToast('✅ Proveedor principal actualizado', 'success');
        // Recargar modal
        await showSuppliersModal(ingredientId);
        // Recargar ingredientes para reflejar el cambio
        if (window.cargarIngredientes) {
            await window.cargarIngredientes();
        }
    } catch (error) {
        showToast('❌ Error actualizando proveedor principal', 'error');
    }
}

/**
 * Handler: Eliminar proveedor desde UI
 */
async function removeSupplierUI(ingredientId, supplierId) {
    if (!confirm('¿Eliminar este proveedor del ingrediente?')) return;

    try {
        await removeSupplierFromIngredient(ingredientId, supplierId);
        showToast('✅ Proveedor eliminado', 'success');
        // Recargar modal
        await showSuppliersModal(ingredientId);
    } catch (error) {
        showToast('❌ Error eliminando proveedor', 'error');
    }
}

// Exponer funciones globalmente
window.showSuppliersModal = showSuppliersModal;
window.closeSuppliersModal = closeSuppliersModal;
window.addSupplierUI = addSupplierUI;
window.updateSupplierPriceUI = updateSupplierPriceUI;
window.setMainSupplier = setMainSupplier;
window.removeSupplierUI = removeSupplierUI;

export {
    showSuppliersModal,
    closeSuppliersModal,
    getIngredientSuppliers
};
