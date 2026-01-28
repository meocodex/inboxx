// Configuracao de ambiente em runtime.
// Em producao, valores sao injetados pelo Dockerfile (entrypoint).
// Em desenvolvimento, deixe vazio — o fallback /api e window.location.origin funcionam na porta 5000.
window.__ENV__ = {
  VITE_API_URL: "",
  VITE_WS_URL: ""
};
