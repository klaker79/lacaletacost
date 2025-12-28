/**
 * Sales Calendar Heatmap Module
 * Shows monthly view with color-coded sales intensity
 * 
 * @module modules/analytics/sales-calendar
 */

/**
 * Calculates percentile thresholds for color coding
 * @param {Array} values - Array of sales values
 * @returns {Object} Thresholds for each color level
 */
function calcularUmbrales(values) {
    const sorted = [...values].filter(v => v > 0).sort((a, b) => a - b);

    if (sorted.length === 0) {
        return { p20: 0, p40: 0, p60: 0, p80: 0 };
    }

    const getPercentile = (arr, p) => {
        const index = Math.ceil((p / 100) * arr.length) - 1;
        return arr[Math.max(0, index)] || 0;
    };

    return {
        p20: getPercentile(sorted, 20),
        p40: getPercentile(sorted, 40),
        p60: getPercentile(sorted, 60),
        p80: getPercentile(sorted, 80)
    };
}

/**
 * Gets color based on value and thresholds
 * @param {number} value - Sales value for the day
 * @param {Object} umbrales - Percentile thresholds
 * @returns {Object} Color info with background and text color
 */
function getColorPorValor(value, umbrales) {
    if (value === 0 || value === null || value === undefined) {
        return { bg: '#f1f5f9', text: '#94a3b8', level: 0 };
    }
    if (value <= umbrales.p20) {
        return { bg: '#dcfce7', text: '#166534', level: 1 }; // Verde claro
    }
    if (value <= umbrales.p40) {
        return { bg: '#86efac', text: '#166534', level: 2 }; // Verde
    }
    if (value <= umbrales.p60) {
        return { bg: '#fef08a', text: '#854d0e', level: 3 }; // Amarillo
    }
    if (value <= umbrales.p80) {
        return { bg: '#fdba74', text: '#9a3412', level: 4 }; // Naranja
    }
    return { bg: '#f87171', text: '#7f1d1d', level: 5 }; // Rojo
}

/**
 * Generates calendar data for a specific month
 * @param {Array} ventas - Sales data
 * @param {Date} fecha - Date within the target month
 * @returns {Object} Calendar data with days and stats
 */
export function generarCalendarioMes(ventas, fecha = new Date()) {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();

    // Get first and last day of month
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();

    // Day of week for first day (0=Sun, 1=Mon...)
    // Adjust for Monday start (0=Mon, 6=Sun)
    let primerDiaSemana = primerDia.getDay();
    primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

    // Group sales by date
    const ventasPorDia = {};
    ventas.forEach(v => {
        const fechaVenta = (v.fecha || '').split('T')[0];
        if (fechaVenta) {
            if (!ventasPorDia[fechaVenta]) {
                ventasPorDia[fechaVenta] = 0;
            }
            ventasPorDia[fechaVenta] += parseFloat(v.total) || 0;
        }
    });

    // Get all values for this month to calculate percentiles
    const valoresMes = [];
    for (let d = 1; d <= diasEnMes; d++) {
        const fechaStr = `${año}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        valoresMes.push(ventasPorDia[fechaStr] || 0);
    }

    const umbrales = calcularUmbrales(valoresMes);

    // Generate calendar days
    const dias = [];

    // Empty cells for days before month starts
    for (let i = 0; i < primerDiaSemana; i++) {
        dias.push({ empty: true });
    }

    // Days of the month
    for (let d = 1; d <= diasEnMes; d++) {
        const fechaStr = `${año}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const valor = ventasPorDia[fechaStr] || 0;
        const color = getColorPorValor(valor, umbrales);
        const esFuturo = new Date(fechaStr) > new Date();

        dias.push({
            dia: d,
            fecha: fechaStr,
            valor: valor,
            color: color,
            esFuturo: esFuturo,
            esHoy: fechaStr === new Date().toISOString().split('T')[0]
        });
    }

    // Stats
    const totalMes = valoresMes.reduce((a, b) => a + b, 0);
    const diasConVentas = valoresMes.filter(v => v > 0).length;
    const mediaDiaria = diasConVentas > 0 ? totalMes / diasConVentas : 0;
    const mejorDia = Math.max(...valoresMes);

    return {
        año,
        mes,
        mesNombre: primerDia.toLocaleDateString('es-ES', { month: 'long' }),
        dias,
        stats: {
            totalMes: Math.round(totalMes),
            diasConVentas,
            mediaDiaria: Math.round(mediaDiaria),
            mejorDia: Math.round(mejorDia)
        },
        umbrales
    };
}

/**
 * Renders the calendar heatmap
 * @param {string} containerId - Container element ID
 * @param {Array} ventas - Sales data
 * @param {Date} fecha - Month to display
 */
export function renderCalendarioHeatmap(containerId, ventas, fecha = new Date()) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const data = generarCalendarioMes(ventas, fecha);

    const diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

    container.innerHTML = `
        <div style="font-family: system-ui, -apple-system, sans-serif;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <button onclick="window.cambiarMesCalendario(-1)" style="background: #f1f5f9; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 16px;">←</button>
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: 700; color: #1e293b; text-transform: capitalize;">${data.mesNombre} ${data.año}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Total: ${data.stats.totalMes.toLocaleString()}€</div>
                </div>
                <button onclick="window.cambiarMesCalendario(1)" style="background: #f1f5f9; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 16px;">→</button>
            </div>
            
            <!-- Days of week header -->
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 8px;">
                ${diasSemana.map(d => `<div style="text-align: center; font-size: 11px; color: #94a3b8; font-weight: 600;">${d}</div>`).join('')}
            </div>
            
            <!-- Calendar grid -->
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
                ${data.dias.map(dia => {
        if (dia.empty) {
            return `<div style="aspect-ratio: 1; border-radius: 6px;"></div>`;
        }

        const opacity = dia.esFuturo ? '0.4' : '1';
        const border = dia.esHoy ? '2px solid #3b82f6' : 'none';

        return `
                        <div 
                            onclick="window.verDetallesDia('${dia.fecha}')"
                            style="
                                aspect-ratio: 1;
                                background: ${dia.color.bg};
                                border-radius: 6px;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                cursor: pointer;
                                opacity: ${opacity};
                                border: ${border};
                                transition: transform 0.15s;
                            "
                            onmouseover="this.style.transform='scale(1.1)'"
                            onmouseout="this.style.transform='scale(1)'"
                            title="${dia.dia}/${data.mes + 1}: ${dia.valor.toFixed(0)}€"
                        >
                            <span style="font-size: 11px; font-weight: 600; color: ${dia.color.text};">${dia.dia}</span>
                            ${dia.valor > 0 ? `<span style="font-size: 8px; color: ${dia.color.text}; opacity: 0.8;">${dia.valor.toFixed(0)}€</span>` : ''}
                        </div>
                    `;
    }).join('')}
            </div>
            
            <!-- Legend -->
            <div style="display: flex; justify-content: center; gap: 8px; margin-top: 16px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="width: 12px; height: 12px; background: #f1f5f9; border-radius: 2px;"></div>
                    <span style="font-size: 10px; color: #64748b;">Sin ventas</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="width: 12px; height: 12px; background: #86efac; border-radius: 2px;"></div>
                    <span style="font-size: 10px; color: #64748b;">Normal</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="width: 12px; height: 12px; background: #fef08a; border-radius: 2px;"></div>
                    <span style="font-size: 10px; color: #64748b;">Bueno</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="width: 12px; height: 12px; background: #f87171; border-radius: 2px;"></div>
                    <span style="font-size: 10px; color: #64748b;">Excelente</span>
                </div>
            </div>
            
            <!-- Stats -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 16px;">
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 700; color: #10b981;">${data.stats.diasConVentas}</div>
                    <div style="font-size: 10px; color: #64748b;">Días activos</div>
                </div>
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 700; color: #6366f1;">${data.stats.mediaDiaria}€</div>
                    <div style="font-size: 10px; color: #64748b;">Media/día</div>
                </div>
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 700; color: #f97316;">${data.stats.mejorDia}€</div>
                    <div style="font-size: 10px; color: #64748b;">Mejor día</div>
                </div>
            </div>
        </div>
    `;
}

// Current displayed month
let mesActual = new Date();

/**
 * Changes the displayed month
 */
export function cambiarMesCalendario(delta) {
    mesActual.setMonth(mesActual.getMonth() + delta);
    renderCalendarioHeatmap('calendario-ventas', window.ventas || [], mesActual);
}

/**
 * Shows details for a specific day
 */
export function verDetallesDia(fecha) {
    const ventas = (window.ventas || []).filter(v =>
        (v.fecha || '').startsWith(fecha)
    );

    if (ventas.length === 0) {
        window.showToast?.(`Sin ventas registradas el ${fecha}`, 'info');
        return;
    }

    const total = ventas.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    window.showToast?.(`${fecha}: ${ventas.length} ventas, ${total.toFixed(2)}€ total`, 'success');
}

// Export to window
if (typeof window !== 'undefined') {
    window.renderCalendarioHeatmap = renderCalendarioHeatmap;
    window.cambiarMesCalendario = cambiarMesCalendario;
    window.verDetallesDia = verDetallesDia;
}

export default {
    generarCalendarioMes,
    renderCalendarioHeatmap,
    cambiarMesCalendario,
    verDetallesDia
};
