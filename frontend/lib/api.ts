const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const API_TIMEOUT_MS = 12000;

type ApiError = { error?: string };

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${path}`;
  console.log(`[DEBUG] apiFetch calling URL: ${url}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      let payload: ApiError | null = null;
      try {
        payload = (await response.json()) as ApiError;
      } catch {
        payload = null;
      }
      const message = payload?.error ?? `request_failed_${response.status}`;
      throw new Error(message);
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("request_timeout");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export { API_BASE_URL };
