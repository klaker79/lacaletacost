/**
 * Tests para src/utils/helpers.js
 * Funciones de utilidad: formateo, exportación, etc.
 */

import {
    formatCurrency,
    formatDate,
    formatDateTime
} from '../../src/utils/helpers.js';

describe('Helpers - Formateo de Moneda', () => {

    test('formatCurrency formatea número entero correctamente', () => {
        expect(formatCurrency(100)).toBe('100,00€');
    });

    test('formatCurrency formatea decimales correctamente', () => {
        expect(formatCurrency(12.5)).toBe('12,50€');
    });

    test('formatCurrency maneja cero', () => {
        expect(formatCurrency(0)).toBe('0,00€');
    });

    test('formatCurrency maneja valores negativos', () => {
        expect(formatCurrency(-50.25)).toBe('-50,25€');
    });

    test('formatCurrency maneja undefined/null como 0', () => {
        expect(formatCurrency(undefined)).toBe('0,00€');
        expect(formatCurrency(null)).toBe('0,00€');
    });

    test('formatCurrency maneja strings numéricos', () => {
        expect(formatCurrency('25.99')).toBe('25,99€');
    });

});

describe('Helpers - Formateo de Fechas', () => {

    test('formatDate formatea fecha ISO correctamente', () => {
        const result = formatDate('2025-12-21');
        expect(result).toMatch(/21\/12\/2025|21-12-2025/);
    });

    test('formatDate maneja Date object', () => {
        const fecha = new Date(2025, 11, 21); // Diciembre 21, 2025
        const result = formatDate(fecha);
        expect(result).toMatch(/21/);
    });

    test('formatDate retorna "-" para null/undefined', () => {
        expect(formatDate(null)).toBe('-');
        expect(formatDate(undefined)).toBe('-');
    });

});
