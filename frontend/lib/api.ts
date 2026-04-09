// const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_URL ="http://localhost:8080" ;

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