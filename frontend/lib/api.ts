export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function resolveApiUrl(path: string) {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalized}`;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const isFormData = options.body instanceof FormData;

  const headers: any = {
    ...options.headers,
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.errors || errorData.error || response.statusText;
    throw new Error(errorMessage);
  }

  if (response.status === 204) return null;
  return response.json();
}
