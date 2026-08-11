import { setServerStatus } from "../server-status";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      // la session voyage en cookie httpOnly plutôt qu'en header
      // Authorization — "include" pour qu'il soit envoyé même dans les cas
      // cross-origin (test direct de l'API sans passer par le proxy Next.js)
      credentials: "include",
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    setServerStatus(false);
    throw new ApiError(0, "Le serveur est injoignable");
  }

  return handleResponse<T>(response);
}

// pas de JSON.stringify ni de Content-Type ici : le navigateur doit poser
// lui-même le boundary multipart, sans quoi le corps de la requête est
// illisible côté serveur
export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
  } catch {
    setServerStatus(false);
    throw new ApiError(0, "Le serveur est injoignable");
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  setServerStatus(true);

  if (!response.ok) {
    const message = await response
      .json()
      .then((data) => data.message ?? response.statusText)
      .catch(() => response.statusText);

    throw new ApiError(
      response.status,
      Array.isArray(message) ? message.join(", ") : message,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
