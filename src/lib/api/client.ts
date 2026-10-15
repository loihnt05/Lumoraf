export type ApiErrorBody = {
  code: string;
  message: string;
  details: Record<string, string>;
  requestId: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
  ) {
    super(body.message);
    this.name = "ApiError";
  }
}

type ApiOptions = RequestInit & { token?: string; timeoutMs?: number };

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const { token, timeoutMs = 10000, signal, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const timeout = AbortSignal.timeout(timeoutMs);
  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
    {
      ...init,
      headers,
      cache: "no-store",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    },
  );

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => null)) as Partial<ApiErrorBody> | null;
    throw new ApiError(response.status, {
      code: body?.code ?? "REQUEST_FAILED",
      message:
        body?.message ??
        "The request could not be completed. Please try again.",
      details: body?.details ?? {},
      requestId: body?.requestId ?? response.headers.get("X-Request-Id") ?? "",
    });
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
