// One tiny helper for ALL API calls.
// It automatically attaches the login token and parses errors,
// so pages never repeat that boilerplate.
//
// The thrown Error keeps the same `.message` it has always had, so every
// existing `catch (err) => setError(err.message)` behaves exactly as before.
// It now also carries `.status` and `.kind` for anything that wants to tell a
// permission failure apart from a server fault apart from a dead connection.

// In development this stays empty, so requests use relative paths and the vite
// proxy forwards them. In production Vercel serves the app on one domain and
// Render serves the API on another, so the build needs the absolute API origin.
// Vite inlines this at BUILD time - changing it in the dashboard needs a redeploy.
const API_BASE = import.meta.env.VITE_API_URL || "";

const kindFor = (status) => {
  if (status === 401 || status === 403) return "permission";
  if (status === 404) return "notfound";
  if (status === 400 || status === 409 || status === 422) return "validation";
  return "api";
};

function apiError(message, { status = 0, kind = "api", payload = null } = {}) {
  const err = new Error(message);
  err.status = status;
  err.kind = kind;
  err.payload = payload;
  return err;
}

export async function api(path, { method = "GET", body, signal } = {}) {
  const token = localStorage.getItem("gradbridge_token");

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (cause) {
    // fetch only rejects when the request never completed — offline, DNS
    // failure, CORS. This used to reach the user as "Failed to fetch".
    if (cause?.name === "AbortError") throw cause;
    throw apiError("Couldn't reach the server. Check your connection and try again.", {
      status: 0,
      kind: "network",
    });
  }

  // A crashed server or a proxy error returns HTML, not JSON. Parsing that
  // before checking res.ok used to surface "Unexpected token '<'" verbatim.
  let data = null;
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  if (isJson) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    // Throw so callers can catch and show data.message to the user.
    throw apiError(data?.message || "Something went wrong.", {
      status: res.status,
      kind: kindFor(res.status),
      payload: data,
    });
  }

  if (data === null) {
    throw apiError("The server returned an unreadable response.", {
      status: res.status,
      kind: "api",
    });
  }

  return data;
}
