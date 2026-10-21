import { notifySessionInvalidated } from "../auth/auth-session";

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

async function parseApiResponse<T>(response: Response, path: string, token?: string | null): Promise<T> {
  if (!response.ok) {
    let message = `Erro ao acessar ${path}.`;

    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) message = errorBody.message;
    } catch {
      message = response.statusText || message;
    }

    if (response.status === 401 && token
        && !(path === "/users/password" && message === "Senha atual incorreta.")) {
      notifySessionInvalidated(token);
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("Não foi possível enviar a solicitação. Verifique sua conexão com o servidor e tente novamente.", 0);
  }

  return parseApiResponse<T>(response, path, options.token);
}

export async function apiUpload<T>(path: string, formData: FormData, token?: string | null) {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { method: "POST", headers, body: formData });
  } catch {
    throw new ApiError("Não foi possível enviar a solicitação. Verifique sua conexão com o servidor e tente novamente.", 0);
  }

  return parseApiResponse<T>(response, path, token);
}

export async function apiDownload(path: string, token?: string | null) {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { method: "GET", headers });
  } catch {
    throw new ApiError("Não foi possível baixar o arquivo. Verifique sua conexão com o servidor e tente novamente.", 0);
  }

  if (!response.ok) {
    await parseApiResponse(response, path, token);
  }

  return response.blob();
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
