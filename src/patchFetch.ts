const originalJson = Response.prototype.json;
Response.prototype.json = async function() {
  const text = await this.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    if (text.includes("Rate exceeded")) {
      throw new Error("Rate exceeded. Please wait a moment and try again.");
    }
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
  }
};

const originalFetch = window.fetch;
const patchedFetch = function(this: any, input: RequestInfo | URL, init?: RequestInit) {
  const options = init || {};
  const headers = new Headers(options.headers || {});

  // Load tokens from localStorage
  const jwtToken = localStorage.getItem("tileflow_jwt_token");
  const sessionToken = localStorage.getItem("tileflow_session_token");

  if (jwtToken) {
    headers.set("Authorization", `Bearer ${jwtToken}`);
  } else if (sessionToken) {
    headers.set("x-session-token", sessionToken);
  }

  options.headers = headers;
  return originalFetch.call(this, input, options);
};

try {
  window.fetch = patchedFetch;
} catch (e) {
  try {
    Object.defineProperty(window, 'fetch', {
      value: patchedFetch,
      configurable: true,
      writable: true,
      enumerable: true
    });
  } catch (err) {
    console.warn("Failed to patch window.fetch directly, using a custom global reference:", err);
  }
}

