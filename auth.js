// ==================== AcompanheGest - Sistema de Autenticação ====================

class AuthSystem {
  constructor() {
    // Tudo agora é gerenciado via backend + sessionStorage
  }

  getUsuarioAtivo() {
    return sessionStorage.getItem("acompanhegest_usuario_ativo");
  }

  setUsuarioAtivo(username) {
    sessionStorage.setItem("acompanhegest_usuario_ativo", username);
  }

  logout() {
    sessionStorage.removeItem("acompanhegest_usuario_ativo");
    window.location.href = "/login.html";
  }

  /**
   * Verificação principal de autenticação
   */
  async verificarAutenticacao() {
    const usuario = this.getUsuarioAtivo();

    if (!usuario) {
      if (!window.location.href.includes("login.html")) {
        window.location.href = "/login.html";
      }
      return false;
    }

    // Se estiver na página de login, não precisa verificar no backend
    if (window.location.href.includes("login.html")) {
      return true;
    }

    try {
      const response = await fetch("/api/verificar-sessao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usuario }),
      });

      if (!response.ok) {
        console.error("Sessão inválida no servidor");
        this.logout();
        return false;
      }

      const data = await response.json();

      if (!data.valid) {
        console.error("Usuário não encontrado no banco");
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
      // Em caso de erro de rede, mantém o usuário logado (modo offline)
      console.warn("Modo offline - mantendo sessão local");
      return true;
    }
  }

  /**
   * Verificação síncrona (usada no carregamento inicial)
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

// ==================== FUNÇÕES DE LOGIN E REGISTRO ====================

async function realizarLogin(username, password) {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      auth.setUsuarioAtivo(username);
      return {
        success: true,
        message: data.message || "Login realizado com sucesso",
      };
    } else {
      return {
        success: false,
        error: data.error || "Credenciais inválidas",
      };
    }
  } catch (error) {
    console.error("Erro no login:", error);
    return { success: false, error: "Erro de conexão com o servidor" };
  }
}

async function realizarRegistro(username, password) {
  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: data.message || "Conta criada com sucesso!",
      };
    } else {
      return {
        success: false,
        error: data.error || "Erro ao criar conta",
      };
    }
  } catch (error) {
    console.error("Erro no registro:", error);
    return { success: false, error: "Erro de conexão com o servidor" };
  }
}

// Export para uso em outros arquivos (módulos)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { auth, logout, realizarLogin, realizarRegistro };
}
