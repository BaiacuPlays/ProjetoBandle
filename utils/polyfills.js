// Sistema de polyfills inteligente para compatibilidade máxima
export class PolyfillManager {
  constructor() {
    this.loadedPolyfills = new Set();
    this.initializePolyfills();
  }

  // Inicializar polyfills essenciais
  initializePolyfills() {
    if (typeof window === 'undefined') return;

    // Polyfills críticos que devem ser carregados imediatamente
    this.loadCriticalPolyfills();
    
    // Polyfills opcionais baseados em detecção de features
    this.loadConditionalPolyfills();
  }

  // Polyfills críticos
  loadCriticalPolyfills() {
    // Promise polyfill
    if (typeof Promise === 'undefined') {
      this.loadPromisePolyfill();
    }

    // Fetch polyfill
    if (typeof fetch === 'undefined') {
      this.loadFetchPolyfill();
    }

    // Object.assign polyfill
    if (typeof Object.assign !== 'function') {
      this.loadObjectAssignPolyfill();
    }

    // Array methods polyfills
    this.loadArrayPolyfills();

    // String methods polyfills
    this.loadStringPolyfills();

    // URL polyfill
    if (typeof URL === 'undefined') {
      this.loadURLPolyfill();
    }
  }

  // Polyfills essenciais apenas
  loadConditionalPolyfills() {
    // Apenas polyfills críticos para funcionalidade básica

    // CustomEvent polyfill (essencial)
    if (typeof CustomEvent !== 'function') {
      this.loadCustomEventPolyfill();
    }

    // requestAnimationFrame polyfill (essencial)
    if (!window.requestAnimationFrame) {
      this.loadRequestAnimationFramePolyfill();
    }
  }

  // Promise polyfill
  loadPromisePolyfill() {
    if (this.loadedPolyfills.has('promise')) return;

    window.Promise = class Promise {
      constructor(executor) {
        this.state = 'pending';
        this.value = undefined;
        this.handlers = [];

        const resolve = (value) => {
          if (this.state === 'pending') {
            this.state = 'fulfilled';
            this.value = value;
            this.handlers.forEach(handler => handler.onFulfilled(value));
          }
        };

        const reject = (reason) => {
          if (this.state === 'pending') {
            this.state = 'rejected';
            this.value = reason;
            this.handlers.forEach(handler => handler.onRejected(reason));
          }
        };

        try {
          executor(resolve, reject);
        } catch (error) {
          reject(error);
        }
      }

      then(onFulfilled, onRejected) {
        return new Promise((resolve, reject) => {
          const handler = {
            onFulfilled: (value) => {
              try {
                const result = onFulfilled ? onFulfilled(value) : value;
                resolve(result);
              } catch (error) {
                reject(error);
              }
            },
            onRejected: (reason) => {
              try {
                const result = onRejected ? onRejected(reason) : reason;
                reject(result);
              } catch (error) {
                reject(error);
              }
            }
          };

          if (this.state === 'fulfilled') {
            setTimeout(() => handler.onFulfilled(this.value), 0);
          } else if (this.state === 'rejected') {
            setTimeout(() => handler.onRejected(this.value), 0);
          } else {
            this.handlers.push(handler);
          }
        });
      }

      catch(onRejected) {
        return this.then(null, onRejected);
      }

      static resolve(value) {
        return new Promise(resolve => resolve(value));
      }

      static reject(reason) {
        return new Promise((_, reject) => reject(reason));
      }
    };

    this.loadedPolyfills.add('promise');
  }

  // Fetch polyfill
  loadFetchPolyfill() {
    if (this.loadedPolyfills.has('fetch')) return;

    window.fetch = function(url, options = {}) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.open(options.method || 'GET', url);
        
        // Set headers
        if (options.headers) {
          Object.keys(options.headers).forEach(key => {
            xhr.setRequestHeader(key, options.headers[key]);
          });
        }

        xhr.onload = () => {
          const response = {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: {
              get: (name) => xhr.getResponseHeader(name)
            },
            text: () => Promise.resolve(xhr.responseText),
            json: () => Promise.resolve(JSON.parse(xhr.responseText)),
            arrayBuffer: () => Promise.resolve(xhr.response)
          };
          resolve(response);
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.ontimeout = () => reject(new Error('Request timeout'));

        if (options.timeout) {
          xhr.timeout = options.timeout;
        }

        xhr.send(options.body);
      });
    };

    this.loadedPolyfills.add('fetch');
  }

  // Object.assign polyfill
  loadObjectAssignPolyfill() {
    if (this.loadedPolyfills.has('objectAssign')) return;

    Object.assign = function(target, ...sources) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      const to = Object(target);

      sources.forEach(source => {
        if (source != null) {
          Object.keys(source).forEach(key => {
            to[key] = source[key];
          });
        }
      });

      return to;
    };

    this.loadedPolyfills.add('objectAssign');
  }

  // Array methods polyfills
  loadArrayPolyfills() {
    if (this.loadedPolyfills.has('arrayMethods')) return;

    // Array.from
    if (!Array.from) {
      Array.from = function(arrayLike, mapFn, thisArg) {
        const items = Object(arrayLike);
        const len = parseInt(items.length) || 0;
        const result = new Array(len);
        
        for (let i = 0; i < len; i++) {
          result[i] = mapFn ? mapFn.call(thisArg, items[i], i) : items[i];
        }
        
        return result;
      };
    }

    // Array.includes
    if (!Array.prototype.includes) {
      Array.prototype.includes = function(searchElement, fromIndex = 0) {
        const len = this.length;
        let i = fromIndex < 0 ? Math.max(0, len + fromIndex) : fromIndex;
        
        for (; i < len; i++) {
          if (this[i] === searchElement || (Number.isNaN(this[i]) && Number.isNaN(searchElement))) {
            return true;
          }
        }
        
        return false;
      };
    }

    // Array.find
    if (!Array.prototype.find) {
      Array.prototype.find = function(predicate, thisArg) {
        for (let i = 0; i < this.length; i++) {
          if (predicate.call(thisArg, this[i], i, this)) {
            return this[i];
          }
        }
        return undefined;
      };
    }

    this.loadedPolyfills.add('arrayMethods');
  }

  // String methods polyfills
  loadStringPolyfills() {
    if (this.loadedPolyfills.has('stringMethods')) return;

    // String.includes
    if (!String.prototype.includes) {
      String.prototype.includes = function(search, start = 0) {
        return this.indexOf(search, start) !== -1;
      };
    }

    // String.startsWith
    if (!String.prototype.startsWith) {
      String.prototype.startsWith = function(search, pos = 0) {
        return this.substr(pos, search.length) === search;
      };
    }

    // String.endsWith
    if (!String.prototype.endsWith) {
      String.prototype.endsWith = function(search, length = this.length) {
        return this.substr(length - search.length, search.length) === search;
      };
    }

    this.loadedPolyfills.add('stringMethods');
  }

  // URL polyfill
  loadURLPolyfill() {
    if (this.loadedPolyfills.has('url')) return;

    window.URL = window.URL || function(url, base) {
      const a = document.createElement('a');
      a.href = base ? new URL(base).href + '/' + url : url;
      
      return {
        href: a.href,
        protocol: a.protocol,
        host: a.host,
        hostname: a.hostname,
        port: a.port,
        pathname: a.pathname,
        search: a.search,
        hash: a.hash,
        origin: a.protocol + '//' + a.host
      };
    };

    this.loadedPolyfills.add('url');
  }

  // Web Audio API polyfill básico
  loadWebAudioPolyfill() {
    if (this.loadedPolyfills.has('webAudio')) return;

    // Polyfill muito básico - apenas para evitar erros
    if (!window.AudioContext && !window.webkitAudioContext) {
      window.AudioContext = function() {
        return {
          createGain: () => ({ connect: () => {}, gain: { value: 1 } }),
          createOscillator: () => ({ 
            connect: () => {}, 
            start: () => {}, 
            stop: () => {},
            frequency: { value: 440 }
          }),
          destination: {}
        };
      };
    }

    this.loadedPolyfills.add('webAudio');
  }

  // CustomEvent polyfill
  loadCustomEventPolyfill() {
    if (this.loadedPolyfills.has('customEvent')) return;

    window.CustomEvent = function(event, params = {}) {
      const evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles || false, params.cancelable || false, params.detail || null);
      return evt;
    };

    this.loadedPolyfills.add('customEvent');
  }

  // requestAnimationFrame polyfill
  loadRequestAnimationFramePolyfill() {
    if (this.loadedPolyfills.has('requestAnimationFrame')) return;

    let lastTime = 0;
    
    window.requestAnimationFrame = function(callback) {
      const currTime = new Date().getTime();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      const id = window.setTimeout(() => {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };

    this.loadedPolyfills.add('requestAnimationFrame');
  }

  // Clipboard polyfill
  loadClipboardPolyfill() {
    if (this.loadedPolyfills.has('clipboard')) return;

    navigator.clipboard = {
      writeText: function(text) {
        return new Promise((resolve, reject) => {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          
          try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
              resolve();
            } else {
              reject(new Error('Copy failed'));
            }
          } catch (err) {
            document.body.removeChild(textArea);
            reject(err);
          }
        });
      }
    };

    this.loadedPolyfills.add('clipboard');
  }

  // Intersection Observer polyfill (versão simplificada)
  loadIntersectionObserverPolyfill() {
    if (this.loadedPolyfills.has('intersectionObserver')) return;

    window.IntersectionObserver = function(callback, options = {}) {
      this.callback = callback;
      this.options = options;
      this.elements = new Set();

      this.observe = (element) => {
        this.elements.add(element);
        // Simular intersecção imediata
        setTimeout(() => {
          this.callback([{
            target: element,
            isIntersecting: true,
            intersectionRatio: 1
          }]);
        }, 0);
      };

      this.unobserve = (element) => {
        this.elements.delete(element);
      };

      this.disconnect = () => {
        this.elements.clear();
      };
    };

    this.loadedPolyfills.add('intersectionObserver');
  }

  // ResizeObserver polyfill (versão simplificada)
  loadResizeObserverPolyfill() {
    if (this.loadedPolyfills.has('resizeObserver')) return;

    window.ResizeObserver = function(callback) {
      this.callback = callback;
      this.elements = new Set();

      this.observe = (element) => {
        this.elements.add(element);
      };

      this.unobserve = (element) => {
        this.elements.delete(element);
      };

      this.disconnect = () => {
        this.elements.clear();
      };
    };

    this.loadedPolyfills.add('resizeObserver');
  }

  // Verificar se todos os polyfills necessários estão carregados
  isReady() {
    const required = ['promise', 'fetch', 'objectAssign', 'arrayMethods', 'stringMethods'];
    return required.every(polyfill => this.loadedPolyfills.has(polyfill));
  }

  // Obter status dos polyfills
  getStatus() {
    return {
      loaded: Array.from(this.loadedPolyfills),
      ready: this.isReady()
    };
  }
}

// Instância global
export const polyfillManager = typeof window !== 'undefined' ? new PolyfillManager() : null;
