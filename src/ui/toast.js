/**
 * Sistema de notificaciones Toast
 * Muestra mensajes temporales al usuario
 */

/**
 * Muestra un mensaje toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 */
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.error('toast-container no encontrado en DOM');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    // Crear estructura HTML con progress bar
    toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-message"></div>
    <div class="toast-progress"></div>
  `;

    // Establecer mensaje de forma segura (previene XSS)
    const messageEl = toast.querySelector('.toast-message');
    if (messageEl) {
        messageEl.textContent = message;
    }

    // Estilos premium para toast
    toast.style.cssText = `
    animation: slideInDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    border-radius: 12px;
    backdrop-filter: blur(10px);
  `;

    const progressBar = toast.querySelector('.toast-progress');
    if (progressBar) {
        progressBar.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
      width: 100%;
      animation: progressShrink 3s linear;
      border-radius: 0 0 12px 12px;
    `;
    }

    container.appendChild(toast);

    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOutUp 0.4s cubic-bezier(0.4, 0, 1, 1)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Añadir animaciones CSS al DOM si no existen
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
    @keyframes slideInDown {
      from {
        transform: translateY(-100px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    @keyframes slideOutUp {
      from {
        transform: translateY(0);
        opacity: 1;
      }
      to {
        transform: translateY(-100px);
        opacity: 0;
      }
    }
    @keyframes progressShrink {
      from { width: 100%; }
      to { width: 0%; }
    }
  `;
    document.head.appendChild(style);
}

/**
 * Alias para compatibilidad con código existente
 */
export default showToast;
