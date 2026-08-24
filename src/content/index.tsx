import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import App from '../app/App';
import tailwindStyles from '../styles/index.css?inline';

const initMeloExtension = () => {
  // Prevent injection on non-HTML pages (like standalone SVG, XML, PDF)
  if (typeof document === 'undefined' || !document.documentElement) {
    return;
  }

  // Check if it's a standard HTML document
  if (document.documentElement.tagName.toUpperCase() !== 'HTML') {
    return;
  }

  // Avoid duplicate injection
  if (document.getElementById('melowrapper')) {
    return;
  }

  const mount = () => {
    if (!document.body || document.getElementById('melowrapper')) {
      return;
    }

    try {
      // Create wrapper container
      const wrapper = document.createElement('div');
      wrapper.id = 'melowrapper';
      wrapper.style.cssText =
        'position: absolute; top: 0; left: 0; z-index: 2147483647; pointer-events: none;';
      document.body.appendChild(wrapper);

      // Create Shadow DOM to isolate styles from host webpage
      const shadowRoot = wrapper.attachShadow({ mode: 'open' });

      // Inject Tailwind styles into Shadow DOM
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        :host {
          all: initial;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        * {
          box-sizing: border-box;
        }
        ${tailwindStyles}
      `;
      shadowRoot.appendChild(styleElement);

      // Mount React App inside Shadow DOM
      const rootElement = document.createElement('div');
      rootElement.id = 'melo-root';
      rootElement.style.cssText = 'pointer-events: auto;';

      // Completely isolate all keyboard, input, text selection, and form events from leaking into host page
      const isolatedEvents = [
        'keydown',
        'keyup',
        'keypress',
        'input',
        'change',
        'submit',
        'contextmenu',
        'copy',
        'cut',
        'paste',
        'select',
        'selectstart',
      ];

      isolatedEvents.forEach((eventName) => {
        rootElement.addEventListener(eventName, (e) => {
          e.stopPropagation();
        });
      });

      shadowRoot.appendChild(rootElement);

      const root = createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <Provider store={store}>
            <App />
          </Provider>
        </React.StrictMode>,
      );

      // Developer helper: window.__MELO_TOGGLE__()
      (window as any).__MELO_TOGGLE__ = () => {
        window.dispatchEvent(new CustomEvent('melo:toggle'));
      };

      console.log(
        '%c🎵 [Melo] Music Extension active! Press Alt+M or click the floating dot to open.',
        'color: #E0645D; font-weight: bold; font-size: 12px;',
      );
    } catch (err) {
      console.warn('[Melo] Injection deferred or skipped:', err);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
};

initMeloExtension();
