// ==================== AcompanheGest - Sistema de Autenticação ====================

class AuthSystem {
  constructor() {
    // Não precisa mais carregar usuários do localStorage, agora é tudo no backend
  }

  // Obtém o utilizador logado na sessão atual
  getUsuarioAtivo() {
    return sessionStorage.getItem("acompanhegest_usuario_ativo");
  }

  // Define o utilizador na sessão
  setUsuarioAtivo(username) {
    sessionStorage.setItem("acompanhegest_usuario_ativo", username);
  }

  // Termina a sessão
  logout() {
    sessionStorage.removeItem("acompanhegest_usuario_ativo");
    window.location.href = "/login.html";
  }

  /**
   * VERIFICAÇÃO DE AUTENTICAÇÃO MELHORADA:
   * 1. Verifica se há usuário na sessão
   * 2. Consulta o backend para confirmar se a sessão ainda é válida
   * 3. Se falhar, redireciona para o login
   */
  async verificarAutenticacao() {
    const usuario = this.getUsuarioAtivo();

    // Se não tem usuário na sessão, redireciona
    if (!usuario) {
      // Evita loop infinito na página de login
      if (!window.location.href.includes("login.html")) {
        window.location.href = "/login.html";
      }
      return false;
    }

    // Se já está na página de login, não precisa verificar
    if (window.location.href.includes("login.html")) {
      return true;
    }

    try {
      // Verifica no backend se o usuário ainda existe e está ativo
      const response = await fetch("/api/verificar-sessao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: usuario }),
      });

      if (!response.ok) {
        // Sessão inválida - limpa e redireciona
        console.error("Sessão inválida, redirecionando para login...");
        this.logout();
        return false;
      }

      const data = await response.json();
      if (!data.valid) {
        console.error("Usuário não encontrado no banco, redirecionando...");
        this.logout();
        return false;
      }

      // Sessão válida
      return true;
    } catch (error) {
      // Erro de rede ou API indisponível
      console.error("Erro ao verificar autenticação:", error);

      // Se for erro de conexão, mantém o usuário logado (modo offline)
      // Mas mostra um aviso silencioso
      console.warn("Modo offline - usando sessão local");
      return true;
    }
  }

  /**
   * Verificação síncrona para uso em páginas que não precisam de backend
   * (usada antes do carregamento completo da página)
   */
  verificarAutenticacaoSync() {
    const usuario = this.getUsuarioAtivo();
    if (!usuario && !window.location.href.includes("login.html")) {
      window.location.href = "/login.html";
      return false;
    }
    return true;
  }
}

// Instância global
const auth = new AuthSystem();

// Função global de logout
function logout() {
  auth.logout();
}

// Função para login (deve ser chamada após sucesso no backend)
async function realizarLogin(username, password) {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      auth.setUsuarioAtivo(username);
      return { success: true, message: data.message };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error("Erro no login:", error);
    return { success: false, error: "Erro de conexão com o servidor" };
  }
}

// Função para registrar novo usuário
async function realizarRegistro(username, password) {
  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, message: data.message };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error("Erro no registro:", error);
    return { success: false, error: "Erro de conexão com o servidor" };
  }
}

// Exportar para uso em outros arquivos (se necessário)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { auth, logout, realizarLogin, realizarRegistro };
}
