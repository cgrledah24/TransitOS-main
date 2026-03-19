// Patches the global fetch to automatically include the JWT token from localStorage.
// This ensures that the generated Orval custom-fetch client sends authenticated requests.

const originalFetch = window.fetch;

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem("transit_token");
  
  // Only patch requests starting with /api
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  
  if (token && url.includes("/api/")) {
    init = init || {};
    init.headers = {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return originalFetch(input, init);
};

export {};
