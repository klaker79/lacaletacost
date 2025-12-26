/**
 * ⚡ Sistema de Optimización de Rendimiento - MindLoop CostOS
 *
 * Este módulo proporciona:
 * - Memoización de funciones costosas
 * - Cache de datos con TTL
 * - Mapas de búsqueda optimizados
 * - Utilidades de rendimiento
 *
 * @copyright MindLoopIA
 * @version 2.1.0
 */

// ═══════════════════════════════════════════════════════════════
// 🧠 SISTEMA DE MEMOIZACIÓN
// ═══════════════════════════════════════════════════════════════

/**
 * Cache para funciones memoizadas
 */
const memoCache = new Map();

/**
 * Memoiza una función costosa con cache por clave
 * @param {string} namespace - Namespace para el cache
 * @param {Function} fn - Función a memoizar
 * @param {Function} keyFn - Función que genera la clave del cache
 * @returns {Function} Función memoizada
 */
export function memoize(namespace, fn, keyFn) {
    if (!memoCache.has(namespace)) {
        memoCache.set(namespace, new Map());
    }

    const cache = memoCache.get(namespace);

    return function (...args) {
        const key = keyFn ? keyFn(...args) : JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}

/**
 * Limpia el cache de un namespace específico
 * @param {string} namespace - Namespace a limpiar
 */
export function clearMemoCache(namespace) {
    if (memoCache.has(namespace)) {
        memoCache.get(namespace).clear();
    }
}

/**
 * Limpia todo el cache de memoización
 */
export function clearAllMemoCache() {
    memoCache.clear();
}

// ═══════════════════════════════════════════════════════════════
// 🗺️ MAPAS DE BÚSQUEDA OPTIMIZADOS
// ═══════════════════════════════════════════════════════════════

/**
 * Crea un Map de búsqueda rápida desde un array
 * @param {Array} array - Array de objetos
 * @param {string} keyField - Campo a usar como clave
 * @returns {Map} Map optimizado para búsquedas O(1)
 */
export function createLookupMap(array, keyField = 'id') {
    if (!Array.isArray(array)) return new Map();
    return new Map(array.map(item => [item[keyField], item]));
}

/**
 * Crea múltiples maps de búsqueda para datos relacionados
 * Actualizado automáticamente cuando los datos globales cambian
 */
export class DataMaps {
    constructor() {
        this.proveedoresMap = new Map();
        this.ingredientesMap = new Map();
        this.recetasMap = new Map();
        this.inventarioMap = new Map();
        this.lastUpdate = null;
    }

    /**
     * Actualiza todos los mapas con los datos globales actuales
     */
    update() {
        this.proveedoresMap = createLookupMap(window.proveedores || []);
        this.ingredientesMap = createLookupMap(window.ingredientes || []);
        this.recetasMap = createLookupMap(window.recetas || []);
        this.inventarioMap = createLookupMap(window.inventarioCompleto || []);
        this.lastUpdate = Date.now();
    }

    /**
     * Obtiene un proveedor por ID (O(1))
     */
    getProveedor(id) {
        return this.proveedoresMap.get(id);
    }

    /**
     * Obtiene nombre de proveedor (O(1))
     */
    getNombreProveedor(id) {
        const prov = this.proveedoresMap.get(id);
        return prov ? prov.nombre : 'Sin proveedor';
    }

    /**
     * Obtiene un ingrediente por ID (O(1))
     */
    getIngrediente(id) {
        return this.ingredientesMap.get(id);
    }

    /**
     * Obtiene una receta por ID (O(1))
     */
    getReceta(id) {
        return this.recetasMap.get(id);
    }

    /**
     * Obtiene un item del inventario por ID (O(1))
     */
    getInventarioItem(id) {
        return this.inventarioMap.get(id);
    }

    /**
     * Verifica si los mapas están actualizados
     */
    isStale() {
        return !this.lastUpdate || Date.now() - this.lastUpdate > 60000; // 1 minuto
    }

    /**
     * Actualiza si está desactualizado
     */
    updateIfStale() {
        if (this.isStale()) {
            this.update();
        }
    }
}

// Instancia global
export const dataMaps = new DataMaps();

// ═══════════════════════════════════════════════════════════════
// 💾 SISTEMA DE CACHE CON TTL
// ═══════════════════════════════════════════════════════════════

/**
 * Cache con tiempo de vida (TTL)
 */
export class TTLCache {
    constructor(ttl = 300000) {
        // 5 minutos por defecto
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    has(key) {
        return this.get(key) !== null;
    }

    clear() {
        this.cache.clear();
    }

    size() {
        // Limpiar items expirados primero
        for (const [key, item] of this.cache.entries()) {
            if (Date.now() - item.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
        return this.cache.size;
    }
}

// ═══════════════════════════════════════════════════════════════
// 🎯 FUNCIONES OPTIMIZADAS ESPECÍFICAS
// ═══════════════════════════════════════════════════════════════

/**
 * Calcula el coste de una receta con memoización
 * @param {Object} receta - Objeto receta
 * @returns {number} Coste total
 */
export function calcularCosteRecetaMemoizado(receta) {
    if (!receta || !receta.ingredientes) return 0;

    // Usar ID + hash de ingredientes como clave
    const key = `${receta.id}-${JSON.stringify(receta.ingredientes.map(i => [i.ingredienteId, i.cantidad]))}`;

    const cached = costeRecetasCache.get(key);
    if (cached !== null) return cached;

    const coste = receta.ingredientes.reduce((total, item) => {
        const ing = dataMaps.getIngrediente(item.ingredienteId);
        const precio = ing ? parseFloat(ing.precio || 0) : 0;
        return total + precio * (item.cantidad || 0);
    }, 0);

    costeRecetasCache.set(key, coste);
    return coste;
}

// Cache específico para costes de recetas
const costeRecetasCache = new TTLCache(300000); // 5 minutos

/**
 * Invalida cache de costes cuando se actualizan precios
 */
export function invalidarCacheRecetas() {
    costeRecetasCache.clear();
    clearMemoCache('recetas');
}

/**
 * Invalida cache cuando se actualizan ingredientes
 */
export function invalidarCacheIngredientes() {
    clearMemoCache('ingredientes');
    invalidarCacheRecetas(); // Las recetas dependen de ingredientes
    dataMaps.update(); // Actualizar mapas
}

// ═══════════════════════════════════════════════════════════════
// 📊 MEDICIÓN DE RENDIMIENTO
// ═══════════════════════════════════════════════════════════════

/**
 * Mide el tiempo de ejecución de una función
 * @param {string} label - Etiqueta para el log
 * @param {Function} fn - Función a medir
 * @returns {Promise} Resultado de la función
 */
export async function measurePerformance(label, fn) {
    const start = performance.now();
    try {
        const result = await fn();
        const duration = performance.now() - start;
        console.log(`⚡ [Perf] ${label}: ${duration.toFixed(2)}ms`);
        return result;
    } catch (error) {
        const duration = performance.now() - start;
        console.error(`❌ [Perf] ${label}: ${duration.toFixed(2)}ms (ERROR)`, error);
        throw error;
    }
}

/**
 * Throttle - Limita frecuencia de ejecución
 * @param {Function} fn - Función a throttlear
 * @param {number} wait - Tiempo mínimo entre ejecuciones (ms)
 * @returns {Function}
 */
export function throttle(fn, wait = 300) {
    let timeout;
    let lastRan;

    return function (...args) {
        if (!lastRan) {
            fn.apply(this, args);
            lastRan = Date.now();
        } else {
            clearTimeout(timeout);
            timeout = setTimeout(
                () => {
                    if (Date.now() - lastRan >= wait) {
                        fn.apply(this, args);
                        lastRan = Date.now();
                    }
                },
                wait - (Date.now() - lastRan)
            );
        }
    };
}

// ═══════════════════════════════════════════════════════════════
// 🌍 EXPORTAR AL SCOPE GLOBAL
// ═══════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.Performance = {
        memoize,
        clearMemoCache,
        clearAllMemoCache,
        createLookupMap,
        dataMaps,
        TTLCache,
        calcularCosteRecetaMemoizado,
        invalidarCacheRecetas,
        invalidarCacheIngredientes,
        measurePerformance,
        throttle,
    };
}
