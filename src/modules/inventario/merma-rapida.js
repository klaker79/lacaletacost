/**
 * Quick Merma Module
 * Allows quick registration of product waste/loss
 * 
 * @module modules/inventario/merma-rapida
 */

/**
 * Shows the quick merma modal
 */
export function mostrarModalMermaRapida() {
    const select = document.getElementById('merma-ingrediente');
    if (!select) return;

    // Populate ingredient select
    const ingredientes = (window.ingredientes || []).sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );

    let optionsHtml = '<option value="">Selecciona ingrediente...</option>';
    ingredientes.forEach(ing => {
        optionsHtml += `<option value="${ing.id}" data-unidad="${ing.unidad || 'ud'}" data-stock="${ing.stockActual || 0}">${ing.nombre}</option>`;
    });
    select.innerHTML = optionsHtml;

    // Reset form
    document.getElementById('merma-cantidad').value = '';
    document.getElementById('merma-motivo').value = 'caduco';
    document.getElementById('merma-nota').value = '';
    document.getElementById('merma-unidad').textContent = 'ud';
    document.getElementById('merma-preview').style.display = 'none';

    // Add change listener to update unit and preview
    select.onchange = actualizarPreviewMerma;
    document.getElementById('merma-cantidad').oninput = actualizarPreviewMerma;

    // Show modal
    document.getElementById('modal-merma-rapida').classList.add('active');
}

/**
 * Updates the preview section showing the result of the adjustment
 */
function actualizarPreviewMerma() {
    const select = document.getElementById('merma-ingrediente');
    const cantidadInput = document.getElementById('merma-cantidad');
    const previewDiv = document.getElementById('merma-preview');
    const previewText = document.getElementById('merma-preview-text');
    const unidadSpan = document.getElementById('merma-unidad');

    const selectedOption = select.options[select.selectedIndex];
    const unidad = selectedOption?.dataset?.unidad || 'ud';
    const stockActual = parseFloat(selectedOption?.dataset?.stock || 0);
    const cantidad = parseFloat(cantidadInput.value) || 0;

    unidadSpan.textContent = unidad;

    if (select.value && cantidad > 0) {
        const nuevoStock = Math.max(0, stockActual - cantidad);
        const ingrediente = window.ingredientes.find(i => i.id === parseInt(select.value));
        const precio = parseFloat(ingrediente?.precio || 0);
        const perdida = precio * cantidad;

        previewText.innerHTML = `
            <strong>${ingrediente?.nombre || 'Ingrediente'}</strong><br>
            Stock actual: ${stockActual.toFixed(2)} ${unidad}<br>
            <span style="color: #dc2626;">- ${cantidad.toFixed(3)} ${unidad} (merma)</span><br>
            <strong>Nuevo stock: ${nuevoStock.toFixed(2)} ${unidad}</strong><br>
            <span style="font-size: 12px; color: #92400e;">💰 Pérdida estimada: ${perdida.toFixed(2)}€</span>
        `;
        previewDiv.style.display = 'block';
    } else {
        previewDiv.style.display = 'none';
    }
}

/**
 * Confirms and executes the quick merma
 */
export async function confirmarMermaRapida() {
    const ingredienteId = parseInt(document.getElementById('merma-ingrediente').value);
    const cantidad = parseFloat(document.getElementById('merma-cantidad').value);
    const motivo = document.getElementById('merma-motivo').value;
    const nota = document.getElementById('merma-nota').value;

    if (!ingredienteId) {
        window.showToast?.('Selecciona un ingrediente', 'warning');
        return;
    }

    if (!cantidad || cantidad <= 0) {
        window.showToast?.('Ingresa una cantidad válida', 'warning');
        return;
    }

    const ingrediente = (window.ingredientes || []).find(i => i.id === ingredienteId);
    if (!ingrediente) {
        window.showToast?.('Ingrediente no encontrado', 'error');
        return;
    }

    const stockActual = parseFloat(ingrediente.stockActual || 0);
    const nuevoStock = Math.max(0, stockActual - cantidad);

    if (typeof window.showLoading === 'function') window.showLoading();

    try {
        // Update ingredient stock
        await window.api.updateIngrediente(ingredienteId, {
            ...ingrediente,
            stockActual: nuevoStock
        });

        // Log the merma (could be expanded to save to a mermas table)
        console.log('📝 Merma registrada:', {
            ingrediente: ingrediente.nombre,
            cantidad,
            motivo,
            nota,
            stockAnterior: stockActual,
            stockNuevo: nuevoStock,
            fecha: new Date().toISOString()
        });

        // Reload data
        window.ingredientes = await window.api.getIngredientes();

        // Update UI
        if (typeof window.renderizarIngredientes === 'function') window.renderizarIngredientes();
        if (typeof window.renderizarInventario === 'function') window.renderizarInventario();
        if (typeof window.actualizarKPIs === 'function') window.actualizarKPIs();
        if (typeof window.actualizarDashboardExpandido === 'function') window.actualizarDashboardExpandido();

        if (typeof window.hideLoading === 'function') window.hideLoading();

        // Close modal
        document.getElementById('modal-merma-rapida').classList.remove('active');

        // Show success
        const perdida = (parseFloat(ingrediente.precio || 0) * cantidad).toFixed(2);
        window.showToast?.(`Merma registrada: -${cantidad} ${ingrediente.unidad || 'ud'} de ${ingrediente.nombre} (${perdida}€)`, 'success');

    } catch (error) {
        if (typeof window.hideLoading === 'function') window.hideLoading();
        console.error('Error registrando merma:', error);
        window.showToast?.('Error registrando merma: ' + error.message, 'error');
    }
}
