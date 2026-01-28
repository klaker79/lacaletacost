/**
 * ============================================
 * tests/stores/ingredientStore.test.js
 * ============================================
 *
 * Tests unitarios para el store de ingredientes.
 *
 * @author MindLoopIA
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('IngredientStore', () => {
    let ingredientStore;

    beforeEach(async () => {
        // Reset modules to get fresh store
        vi.resetModules();
        vi.clearAllMocks();

        // Import fresh store
        const module = await import('../../src/stores/ingredientStore.js');
        ingredientStore = module.ingredientStore;

        // Reset store state
        ingredientStore.getState().reset();
    });

    describe('Initial State', () => {
        it('should have empty ingredients array', () => {
            const state = ingredientStore.getState();
            expect(state.ingredients).toEqual([]);
        });

        it('should not be loading initially', () => {
            const state = ingredientStore.getState();
            expect(state.isLoading).toBe(false);
        });

        it('should have no error initially', () => {
            const state = ingredientStore.getState();
            expect(state.error).toBe(null);
        });

        it('should have default filters', () => {
            const state = ingredientStore.getState();
            expect(state.searchTerm).toBe('');
            expect(state.familyFilter).toBe('all');
            expect(state.sortBy).toBe('nombre');
        });
    });

    describe('fetchIngredients', () => {
        it('should fetch and store ingredients', async () => {
            const mockIngredients = [
                { id: 1, nombre: 'Tomate', precio: 2.5, stock_actual: 10 },
                { id: 2, nombre: 'Cebolla', precio: 1.5, stock_actual: 20 }
            ];

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockIngredients)
            });

            const result = await ingredientStore.getState().fetchIngredients();

            expect(result).toEqual(mockIngredients);
            expect(ingredientStore.getState().ingredients).toEqual(mockIngredients);
            expect(ingredientStore.getState().isLoading).toBe(false);
        });

        it('should handle fetch error', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await ingredientStore.getState().fetchIngredients();

            expect(result).toEqual([]);
            expect(ingredientStore.getState().error).toBe('Network error');
            expect(ingredientStore.getState().isLoading).toBe(false);
        });

        it('should set loading state during fetch', async () => {
            global.fetch.mockImplementationOnce(() =>
                new Promise(resolve => setTimeout(() => resolve({
                    ok: true,
                    json: () => Promise.resolve([])
                }), 100))
            );

            const fetchPromise = ingredientStore.getState().fetchIngredients();
            expect(ingredientStore.getState().isLoading).toBe(true);

            await fetchPromise;
            expect(ingredientStore.getState().isLoading).toBe(false);
        });
    });

    describe('Filtering', () => {
        beforeEach(() => {
            // Set up test data
            ingredientStore.setState({
                ingredients: [
                    { id: 1, nombre: 'Tomate', familia: 'verdura', precio: 2.5 },
                    { id: 2, nombre: 'Cebolla', familia: 'verdura', precio: 1.5 },
                    { id: 3, nombre: 'Pollo', familia: 'carne', precio: 8.0 },
                    { id: 4, nombre: 'Salmón', familia: 'pescado', precio: 15.0 }
                ]
            });
            ingredientStore.getState().applyFilters();
        });

        it('should filter by search term', () => {
            ingredientStore.getState().setSearchTerm('tom');
            const filtered = ingredientStore.getState().filteredIngredients;

            expect(filtered).toHaveLength(1);
            expect(filtered[0].nombre).toBe('Tomate');
        });

        it('should filter by family', () => {
            ingredientStore.getState().setFamilyFilter('verdura');
            const filtered = ingredientStore.getState().filteredIngredients;

            expect(filtered).toHaveLength(2);
            expect(filtered.every(i => i.familia === 'verdura')).toBe(true);
        });

        it('should combine search and family filters', () => {
            ingredientStore.getState().setFamilyFilter('verdura');
            ingredientStore.getState().setSearchTerm('ceb');
            const filtered = ingredientStore.getState().filteredIngredients;

            expect(filtered).toHaveLength(1);
            expect(filtered[0].nombre).toBe('Cebolla');
        });

        it('should sort by specified field', () => {
            ingredientStore.getState().setSorting('precio', 'desc');
            const filtered = ingredientStore.getState().filteredIngredients;

            expect(filtered[0].nombre).toBe('Salmón');
            expect(filtered[3].nombre).toBe('Cebolla');
        });
    });

    describe('CRUD Operations', () => {
        it('should create ingredient', async () => {
            const newIngredient = { id: 1, nombre: 'Nuevo', precio: 5.0 };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(newIngredient)
            });

            const result = await ingredientStore.getState().createIngredient({ nombre: 'Nuevo', precio: 5.0 });

            expect(result.success).toBe(true);
            expect(ingredientStore.getState().ingredients).toContainEqual(newIngredient);
        });

        it('should update ingredient', async () => {
            ingredientStore.setState({
                ingredients: [{ id: 1, nombre: 'Viejo', precio: 3.0 }]
            });

            const updatedIngredient = { id: 1, nombre: 'Actualizado', precio: 4.0 };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(updatedIngredient)
            });

            const result = await ingredientStore.getState().updateIngredient(1, { nombre: 'Actualizado', precio: 4.0 });

            expect(result.success).toBe(true);
            expect(ingredientStore.getState().ingredients[0].nombre).toBe('Actualizado');
        });

        it('should delete ingredient', async () => {
            ingredientStore.setState({
                ingredients: [
                    { id: 1, nombre: 'A eliminar' },
                    { id: 2, nombre: 'Mantener' }
                ]
            });

            global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

            const result = await ingredientStore.getState().deleteIngredient(1);

            expect(result.success).toBe(true);
            expect(ingredientStore.getState().ingredients).toHaveLength(1);
            expect(ingredientStore.getState().ingredients[0].id).toBe(2);
        });
    });

    describe('Computed Values', () => {
        it('should calculate total inventory value', () => {
            ingredientStore.setState({
                ingredients: [
                    { id: 1, precio: 10, stock_actual: 5 },  // 50
                    { id: 2, precio: 20, stock_actual: 3 }   // 60
                ]
            });

            const totalValue = ingredientStore.getState().totalValue;
            expect(totalValue).toBe(110);
        });

        it('should identify low stock items', () => {
            ingredientStore.setState({
                ingredients: [
                    { id: 1, nombre: 'Bajo', stock_actual: 2, stock_minimo: 5 },
                    { id: 2, nombre: 'OK', stock_actual: 10, stock_minimo: 5 },
                    { id: 3, nombre: 'Sin minimo', stock_actual: 1, stock_minimo: 0 }
                ]
            });

            const lowStock = ingredientStore.getState().lowStockItems;
            expect(lowStock).toHaveLength(1);
            expect(lowStock[0].nombre).toBe('Bajo');
        });
    });

    describe('getById', () => {
        it('should return ingredient by id', () => {
            ingredientStore.setState({
                ingredients: [
                    { id: 1, nombre: 'A' },
                    { id: 2, nombre: 'B' }
                ]
            });

            const ingredient = ingredientStore.getState().getById(2);
            expect(ingredient.nombre).toBe('B');
        });

        it('should return undefined for non-existent id', () => {
            ingredientStore.setState({
                ingredients: [{ id: 1, nombre: 'A' }]
            });

            const ingredient = ingredientStore.getState().getById(999);
            expect(ingredient).toBeUndefined();
        });
    });
});
