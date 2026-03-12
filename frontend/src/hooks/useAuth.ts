const TOKEN_KEY = "researchhub-token";

export function useAuth() {
  const token = localStorage.getItem(TOKEN_KEY);

  function saveToken(value: string) {
    localStorage.setItem(TOKEN_KEY, value);
    window.location.href = "/";
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/";
  }

  return { token, saveToken, logout };
}
