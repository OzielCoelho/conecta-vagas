export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = `Erro ao acessar ${path}.`;

    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      message = response.statusText || message;
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function apiGet<T>(path: string, token?: string | null) {
  return apiRequest<T>(path, { method: "GET", token });
}

export function apiPost<T>(path: string, body: unknown, token?: string | null) {
  return apiRequest<T>(path, { method: "POST", body, token });
}

export function apiPut<T>(path: string, body: unknown, token?: string | null) {
  return apiRequest<T>(path, { method: "PUT", body, token });
}

export function apiPatch<T>(path: string, body?: unknown, token?: string | null) {
  return apiRequest<T>(path, { method: "PATCH", body, token });
}
