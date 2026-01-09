/**
 * Form Protection Utilities
 * Previene double-submit, proporciona feedback visual durante operaciones
 *
 * @module utils/form-protection
 */

/**
 * Protege un formulario contra double-submit
 * Deshabilita el botón de submit durante la operación
 *
 * @param {HTMLFormElement|string} formElement - Elemento form o ID
 * @param {Function} submitHandler - Función async a ejecutar en submit
 * @param {Object} options - Opciones de configuración
 * @returns {Function} Cleanup function
 *
 * @example
 * // Uso básico
 * const form = document.getElementById('form-ingrediente');
 * protectForm(form, async (formData) => {
 *   await api.createIngrediente(formData);
 * });
 *
 * @example
 * // Con opciones custom
 * protectForm('form-ingrediente', handleSubmit, {
 *   disableOnSubmit: true,
 *   showLoadingState: true,
 *   loadingText: 'Guardando...'
 * });
 */
export function protectForm(formElement, submitHandler, options = {}) {
    const form = typeof formElement === 'string'
        ? document.getElementById(formElement)
        : formElement;

    if (!form) {
        console.warn('Form element not found:', formElement);
        return () => {};
    }

    const config = {
        disableOnSubmit: true,
        showLoadingState: true,
        loadingText: 'Guardando...',
        resetOnError: true,
        ...options
    };

    let isSubmitting = false;

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Prevenir double-submit
        if (isSubmitting) {
            console.warn('Form already submitting, ignoring duplicate submit');
            return;
        }

        isSubmitting = true;

        // Obtener botón de submit
        const submitButton = form.querySelector('button[type="submit"]');
        let originalButtonText = '';
        let originalButtonDisabled = false;

        // Guardar estado original del botón
        if (submitButton && config.disableOnSubmit) {
            originalButtonText = submitButton.textContent;
            originalButtonDisabled = submitButton.disabled;
            submitButton.disabled = true;

            if (config.showLoadingState) {
                submitButton.textContent = config.loadingText;
                submitButton.style.opacity = '0.6';
                submitButton.style.cursor = 'not-allowed';
            }
        }

        try {
            // Ejecutar handler con FormData
            const formData = new FormData(form);
            await submitHandler(formData, event);

            // Éxito - resetear form si se especifica
            if (config.resetOnSuccess !== false) {
                // No resetear automáticamente - dejar que el handler lo haga
            }
        } catch (error) {
            console.error('Form submission error:', error);

            // Mostrar error si hay toast disponible
            if (typeof window.showToast === 'function') {
                window.showToast('Error: ' + error.message, 'error');
            }

            // Re-enable form on error si se especifica
            if (config.resetOnError) {
                // El botón se re-habilitará en el finally
            }

            throw error; // Re-throw para que el caller pueda manejarlo
        } finally {
            // Restaurar estado del botón
            if (submitButton && config.disableOnSubmit) {
                submitButton.disabled = originalButtonDisabled;
                submitButton.textContent = originalButtonText;
                submitButton.style.opacity = '';
                submitButton.style.cursor = '';
            }

            // Delay para prevenir clicks rápidos consecutivos
            setTimeout(() => {
                isSubmitting = false;
            }, 300);
        }
    };

    // Attach listener
    form.addEventListener('submit', handleSubmit);

    // Return cleanup function
    return () => {
        form.removeEventListener('submit', handleSubmit);
    };
}

/**
 * Protege un botón individual contra doble-click
 * Útil para botones que no están en forms (ej: botones de eliminar)
 *
 * @param {HTMLElement|string} buttonElement - Elemento button o ID
 * @param {Function} clickHandler - Función async a ejecutar en click
 * @param {Object} options - Opciones de configuración
 * @returns {Function} Cleanup function
 *
 * @example
 * protectButton('btn-delete', async () => {
 *   await api.deleteIngrediente(id);
 * }, { cooldownMs: 1000 });
 */
export function protectButton(buttonElement, clickHandler, options = {}) {
    const button = typeof buttonElement === 'string'
        ? document.getElementById(buttonElement)
        : buttonElement;

    if (!button) {
        console.warn('Button element not found:', buttonElement);
        return () => {};
    }

    const config = {
        disableOnClick: true,
        showLoadingState: true,
        loadingText: '⏳',
        cooldownMs: 500,
        ...options
    };

    let isProcessing = false;

    const handleClick = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        // Prevenir double-click
        if (isProcessing) {
            console.warn('Button already processing, ignoring duplicate click');
            return;
        }

        isProcessing = true;

        const originalText = button.textContent;
        const originalDisabled = button.disabled;

        // Deshabilitar botón
        if (config.disableOnClick) {
            button.disabled = true;

            if (config.showLoadingState) {
                button.textContent = config.loadingText;
                button.style.opacity = '0.6';
            }
        }

        try {
            await clickHandler(event);
        } catch (error) {
            console.error('Button click handler error:', error);
            throw error;
        } finally {
            // Restaurar estado
            if (config.disableOnClick) {
                button.disabled = originalDisabled;
                button.textContent = originalText;
                button.style.opacity = '';
            }

            // Cooldown
            setTimeout(() => {
                isProcessing = false;
            }, config.cooldownMs);
        }
    };

    // Attach listener
    button.addEventListener('click', handleClick);

    // Return cleanup function
    return () => {
        button.removeEventListener('click', handleClick);
    };
}

/**
 * Wrapper conveniente para proteger submit de formularios inline
 * Extrae datos del formulario y llama a la función con objeto de datos
 *
 * @param {Event} event - Submit event
 * @param {Function} handler - Función async que recibe objeto con datos del form
 * @returns {Promise<void>}
 *
 * @example
 * // En ingredientes-crud.js
 * export async function guardarIngrediente(event) {
 *   return protectedSubmit(event, async (data) => {
 *     await window.api.createIngrediente(data);
 *     window.renderizarIngredientes();
 *   });
 * }
 */
export async function protectedSubmit(event, handler) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // Verificar si ya está submitting (protección global)
    if (submitButton && submitButton.disabled) {
        console.warn('Form already submitting');
        return;
    }

    // Deshabilitar botón
    const originalText = submitButton?.textContent || '';
    const originalDisabled = submitButton?.disabled || false;

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '⏳ Guardando...';
        submitButton.style.opacity = '0.6';
    }

    try {
        // Extraer datos del formulario
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Ejecutar handler
        await handler(data, event);
    } finally {
        // Restaurar botón después de 500ms (prevenir double-click)
        setTimeout(() => {
            if (submitButton) {
                submitButton.disabled = originalDisabled;
                submitButton.textContent = originalText;
                submitButton.style.opacity = '';
            }
        }, 500);
    }
}

/**
 * Debounce para funciones (útil para búsquedas)
 * Re-exportado aquí para convenience
 *
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función debounced
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle para funciones (útil para scroll, resize)
 *
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Límite en ms
 * @returns {Function} Función throttled
 */
export function throttle(func, limit = 100) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Exponer globalmente para uso desde HTML inline (legacy compatibility)
if (typeof window !== 'undefined') {
    window.FormProtection = {
        protectForm,
        protectButton,
        protectedSubmit,
        debounce,
        throttle
    };
}

export default {
    protectForm,
    protectButton,
    protectedSubmit,
    debounce,
    throttle
};
