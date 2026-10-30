const API_BASE = "http://localhost:3000";

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    const message = `Request failed (${response.status}). Check that JSON Server is running.`;
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

const resource = (name) => `${API_BASE}/${name}`;

export const getAll = (name) => request(resource(name));
export const getById = (name, id) => request(`${resource(name)}/${id}`);

export const createItem = (name, item) =>
  request(resource(name), {
    method: "POST",
    body: JSON.stringify(item)
  });

export const updateItem = (name, id, item) =>
  request(`${resource(name)}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...item, id: String(id) })
  });

export const deleteItem = (name, id) =>
  request(`${resource(name)}/${id}`, { method: "DELETE" });

export const API_BASE_URL = API_BASE;
