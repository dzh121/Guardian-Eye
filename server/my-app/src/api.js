export const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });
  return response.json();
};
