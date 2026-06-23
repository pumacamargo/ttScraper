// Mostrar notificación tipo toast en la esquina
function showToastNotification(message, type = 'success') {
  // Crear contenedor si no existe
  let container = document.getElementById('tiktok-scraper-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'tiktok-scraper-toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    `;
    document.body.appendChild(container);
  }

  // Crear elemento de notificación
  const toast = document.createElement('div');

  let backgroundColor, borderColor, textColor, icon;

  if (type === 'success') {
    backgroundColor = '#4caf50';
    borderColor = '#45a049';
    textColor = '#fff';
    icon = '✅';
  } else if (type === 'error') {
    backgroundColor = '#f44336';
    borderColor = '#da190b';
    textColor = '#fff';
    icon = '❌';
  } else {
    backgroundColor = '#2196f3';
    borderColor = '#0b7dda';
    textColor = '#fff';
    icon = 'ℹ️';
  }

  toast.style.cssText = `
    background-color: ${backgroundColor};
    color: ${textColor};
    padding: 16px 20px;
    margin-bottom: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-left: 4px solid ${borderColor};
    animation: slideIn 0.3s ease-out;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 500;
    max-width: 350px;
    word-wrap: break-word;
  `;

  toast.innerHTML = `
    <span style="font-size: 18px; flex-shrink: 0;">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Animar entrada
  const style = document.createElement('style');
  if (!document.getElementById('toast-animations')) {
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Remover después de 3 segundos
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Exponer la función globalmente
window.showToastNotification = showToastNotification;
