/**
 * Ventas UI Module
 * Funciones de interfaz de usuario para ventas
 */

/**
 * Renderiza la tabla de ventas
 * ⚡ OPTIMIZADO: Usa map+join en lugar de concatenación con +=
 */
export async function renderizarVentas() {
    try {
        // ⚡ OPTIMIZACIÓN: Poblar select de recetas con map+join
        const select = document.getElementById('venta-receta');
        const recetas = window.recetas || [];
        if (select) {
            const options = ['<option value="">Selecciona un plato...</option>'];
            options.push(...recetas.map(r => {
                const precio = parseFloat(r.precio_venta) || 0;
                return `<option value="${r.id}">${r.nombre} - ${precio.toFixed(2)}€</option>`;
            }));
            select.innerHTML = options.join('');
        }

        const ventas = await window.api.getSales();
        const container = document.getElementById('tabla-ventas');

        if (ventas.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="icon">💰</div>
          <h3>No hay ventas registradas</h3>
        </div>
      `;
            return;
        }

        // Agrupar por fecha
        const ventasPorFecha = {};
        ventas.forEach(v => {
            const fecha = new Date(v.fecha).toLocaleDateString('es-ES');
            if (!ventasPorFecha[fecha]) ventasPorFecha[fecha] = [];
            ventasPorFecha[fecha].push(v);
        });

        // ⚡ OPTIMIZACIÓN: Construir tabla con map+join en lugar de concatenación
        const rows = Object.keys(ventasPorFecha)
            .sort((a, b) => new Date(b) - new Date(a))
            .map(fecha => {
                const ventasDia = ventasPorFecha[fecha];
                const totalDia = ventasDia.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);

                const headerRow = `<tr style="background:#F8FAFC;"><td colspan="6" style="padding:12px 16px;font-weight:600;color:#1E293B;border-bottom:1px solid #E2E8F0;">${fecha} - Total: ${totalDia.toFixed(2)}€</td></tr>`;

                const ventasRows = ventasDia.map(v => {
                    const hora = new Date(v.fecha).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                    return `<tr><td style="padding:8px 16px 8px 32px;color:#64748B;">${fecha}</td><td style="padding:8px 16px;color:#64748B;">${hora}</td><td style="padding:8px 16px;color:#1E293B;">${v.receta_nombre}</td><td style="padding:8px 16px;text-align:center;color:#64748B;">${v.cantidad}</td><td style="padding:8px 16px;text-align:right;"><strong style="color:#1E293B;">${parseFloat(v.total).toFixed(2)}€</strong></td><td style="padding:8px 16px;text-align:center;"><button class="icon-btn delete" onclick="window.eliminarVenta(${v.id})" title="Eliminar">🗑️</button></td></tr>`;
                }).join('');

                return headerRow + ventasRows;
            });

        const html = `<table style="width:100%;border-collapse:collapse;"><tbody>${rows.join('')}</tbody></table>`;
        container.innerHTML = html;
    } catch (error) {
        console.error('Error renderizando ventas:', error);
        window.showToast('Error cargando ventas', 'error');
    }
}

/**
 * Exporta ventas a Excel
 */
export function exportarVentas() {
    window.api.getSales().then(ventas => {
        const columnas = [
            { header: 'ID', key: 'id' },
            { header: 'Fecha', value: v => new Date(v.fecha).toLocaleDateString('es-ES') },
            {
                header: 'Hora',
                value: v =>
                    new Date(v.fecha).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
            },
            {
                header: 'Código Receta',
                value: v => {
                    const rec = window.recetas.find(r => r.id === v.receta_id);
                    return rec?.codigo || `REC-${String(v.receta_id).padStart(4, '0')}`;
                },
            },
            {
                header: 'Descripción',
                value: v =>
                    v.receta_nombre ||
                    window.recetas.find(r => r.id === v.receta_id)?.nombre ||
                    'Desconocida',
            },
            { header: 'Cantidad', key: 'cantidad' },
            {
                header: 'Precio Unitario (€)',
                value: v => parseFloat(v.precio_unitario || 0).toFixed(2),
            },
            { header: 'Total (€)', value: v => parseFloat(v.total || 0).toFixed(2) },
        ];

        window.exportarAExcel(ventas, `Ventas_${window.getRestaurantNameForFile()}`, columnas);
    });
}
