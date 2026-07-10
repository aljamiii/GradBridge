// One tiny helper for ALL API calls.
// It automatically attaches the login token and parses errors,
// so pages never repeat that boilerplate.

export async function api(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("gradbridge_token");

  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  if (!res.ok) {
    // Throw so callers can catch and show data.message to the user.
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}
