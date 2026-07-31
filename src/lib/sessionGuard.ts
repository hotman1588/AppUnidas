/**
 * Vigilancia de sesión vencida.
 *
 * El backend firma los JWT con expiresIn 24h y responde 401 "No token" / 403
 * "Invalid token" cuando el token ya no sirve. Sin esto el front se queda con
 * una sesión zombi (el token vive en localStorage vía zustand/persist) y el
 * recolector solo se entera cuando falla el guardado.
 *
 * Aquí se envuelve window.fetch una sola vez: ante esas respuestas se emite un
 * evento que la app usa para mostrar el aviso de reconexión.
 */

export const SESSION_EXPIRED_EVENT = 'unidas:session-expired';

const EXPIRED_MESSAGES = ['invalid token', 'no token'];

let installed = false;

export function installSessionGuard() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const response = await originalFetch(...args);

    if (response.status === 401 || response.status === 403) {
      // Se clona para no consumir el cuerpo que espera quien hizo la llamada.
      try {
        const data = await response.clone().json();
        const message = String(data?.error || '').toLowerCase();
        if (EXPIRED_MESSAGES.includes(message)) {
          window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
        }
      } catch {
        // Respuesta sin JSON: no es el caso de token vencido.
      }
    }

    return response;
  };
}
