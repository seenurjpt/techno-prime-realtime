export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

/** JSON fetch wrapper: throws ApiError with server-provided field errors. */
export async function api<T>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);

  // The session expired mid-use: send the person to sign in again. The login route's own 401
  // means "wrong email or password", so it is left for the form to show.
  if (res.status === 401 && !url.startsWith('/api/auth/') && typeof window !== 'undefined') {
    window.location.assign(`/login?reason=expired&next=${encodeURIComponent(window.location.pathname)}`);
  }
  if (!res.ok) {
    throw new ApiError(data?.error ?? 'Something went wrong. Try again.', res.status, data?.fields ?? {});
  }
  return data as T;
}
