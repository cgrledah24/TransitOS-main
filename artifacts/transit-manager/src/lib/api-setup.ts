// Patches the global fetch to automatically include the JWT token from localStorage.
// This ensures that the generated Orval custom-fetch client sends authenticated requests.
//
// IMPORTANT: The generated customFetch builds a `Headers` object internally.
// Spreading a `Headers` instance with `{ ...headersObj }` does NOT copy its entries —
// it just yields `{}`. We must use `new Headers(existing)` to correctly clone it
// before adding the Authorization header, otherwise Content-Type gets silently
// dropped and Express's body-parser never parses the request body (req.body === undefined).

const originalFetch = window.fetch;

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem("transit_token");

  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : (input as Request).url;

  if (token && url.includes("/api/")) {
    init = init ?? {};
    // Correctly clone existing headers (works for Headers objects, plain objects, or arrays)
    const merged = new Headers(init.headers as HeadersInit | undefined);
    merged.set("Authorization", `Bearer ${token}`);
    init = { ...init, headers: merged };
  }

  return originalFetch(input, init);
};

export {};
