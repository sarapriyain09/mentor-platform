export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }
}

// Handle install prompt
let deferredPrompt;

export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Update UI to notify the user they can install the PWA
    console.log('Install prompt available');
    
    // Optionally show a custom install button
    showInstallPromotion();
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    deferredPrompt = null;
  });
}

function showInstallPromotion() {
  // Create install banner if it doesn't exist
  if (document.getElementById('install-banner')) return;
  
  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 15px;
    max-width: 90%;
    animation: slideUp 0.3s ease-out;
  `;

  banner.innerHTML = `
    <style>
      @keyframes slideUp {
        from { transform: translate(-50%, 100px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
      #install-banner button {
        background: white;
        color: #667eea;
        border: none;
        padding: 8px 20px;
        border-radius: 5px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s;
      }
      #install-banner button:hover {
        transform: scale(1.05);
      }
      #install-banner .close-btn {
        background: transparent;
        color: white;
        padding: 5px 10px;
        font-size: 18px;
      }
    </style>
    <span>📱 Install MendForWorks app for quick access!</span>
    <button id="install-btn">Install</button>
    <button class="close-btn" id="close-banner">✕</button>
  `;

  document.body.appendChild(banner);

  // Install button click handler
  document.getElementById('install-btn').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      deferredPrompt = null;
      banner.remove();
    }
  });

  // Close button handler
  document.getElementById('close-banner').addEventListener('click', () => {
    banner.remove();
  });

  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (banner.parentNode) {
      banner.remove();
    }
  }, 10000);
}

export { deferredPrompt };
