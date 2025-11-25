/**
 * Custom notification system without URL display
 *
 * Creates a custom modal-style notification that doesn't show browser URL
 */

let notificationContainer = null;

/**
 * Initialize notification container
 */
function getNotificationContainer() {
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(notificationContainer);
  }
  return notificationContainer;
}

/**
 * Show custom notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type: 'success', 'error', 'info', 'confirm'
 * @returns {Promise<boolean>} - For confirm type, returns user's choice
 */
export function notify(message, type = 'info') {
  return new Promise((resolve) => {
    const container = getNotificationContainer();

    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      background: rgba(0, 0, 0, 0.5);
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      animation: fadeIn 0.2s ease-out;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      animation: slideUp 0.3s ease-out;
    `;

    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      font-size: 16px;
      line-height: 1.6;
      color: #1f2937;
      margin-bottom: ${type === 'confirm' ? '20px' : '0'};
      white-space: pre-line;
      text-align: center;
    `;
    messageEl.textContent = message;

    box.appendChild(messageEl);

    if (type === 'confirm') {
      // Confirm dialog with Yes/No buttons
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 20px;
      `;

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '취소';
      cancelBtn.style.cssText = `
        padding: 10px 24px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        color: #6b7280;
        transition: all 0.2s;
      `;
      cancelBtn.onmouseover = () => {
        cancelBtn.style.background = '#f3f4f6';
      };
      cancelBtn.onmouseout = () => {
        cancelBtn.style.background = 'white';
      };
      cancelBtn.onclick = () => {
        closeNotification(notification);
        resolve(false);
      };

      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = '확인';
      confirmBtn.style.cssText = `
        padding: 10px 24px;
        border: none;
        background: #2563eb;
        color: white;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      `;
      confirmBtn.onmouseover = () => {
        confirmBtn.style.background = '#1d4ed8';
      };
      confirmBtn.onmouseout = () => {
        confirmBtn.style.background = '#2563eb';
      };
      confirmBtn.onclick = () => {
        closeNotification(notification);
        resolve(true);
      };

      buttonContainer.appendChild(cancelBtn);
      buttonContainer.appendChild(confirmBtn);
      box.appendChild(buttonContainer);
    } else {
      // Info/Success/Error dialog with single OK button
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        display: flex;
        justify-content: center;
        margin-top: 20px;
      `;

      const okBtn = document.createElement('button');
      okBtn.textContent = '확인';
      okBtn.style.cssText = `
        padding: 10px 32px;
        border: none;
        background: #2563eb;
        color: white;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      `;
      okBtn.onmouseover = () => {
        okBtn.style.background = '#1d4ed8';
      };
      okBtn.onmouseout = () => {
        okBtn.style.background = '#2563eb';
      };
      okBtn.onclick = () => {
        closeNotification(notification);
        resolve(true);
      };

      buttonContainer.appendChild(okBtn);
      box.appendChild(buttonContainer);
    }

    notification.appendChild(box);
    container.appendChild(notification);

    // Auto-close on backdrop click for non-confirm notifications
    if (type !== 'confirm') {
      notification.onclick = (e) => {
        if (e.target === notification) {
          closeNotification(notification);
          resolve(true);
        }
      };
    }
  });
}

/**
 * Close notification with animation
 */
function closeNotification(notification) {
  notification.style.animation = 'fadeOut 0.2s ease-out';
  setTimeout(() => {
    notification.remove();
  }, 200);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

export default notify;
