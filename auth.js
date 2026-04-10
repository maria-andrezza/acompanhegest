// ==================== AcompanheGest - Sistema de Autenticação ====================

class AuthSystem {
  constructor() {
    this.usuarios = this.carregarUsuarios();
  }

  carregarUsuarios() {
    const saved = localStorage.getItem("acompanhegest_usuarios");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao carregar usuários:", e);
        return {};
      }
    }
    return {};
  }

  salvarUsuarios() {
    localStorage.setItem(
      "acompanhegest_usuarios",
      JSON.stringify(this.usuarios),
    );
  }

  // Hash simples para senhas (Segurança básica para portfólio)
  hashSenha(senha) {
    let hash = 0;
    for (let i = 0; i < senha.length; i++) {
      const char = senha.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  registrar(username, senha) {
    if (this.usuarios[username]) {
      return false;
    }

    this.usuarios[username] = {
      senhaHash: this.hashSenha(senha),
      dataCriacao: new Date().toISOString(),
    };

    this.salvarUsuarios();

    // Estrutura de dados inicial para o novo usuário
    const dadosIniciais = {
      config: {
        nome: username,
        dataInicioGestacao: null,
        nomeBebe: "Íris",
        sexoBebe: "Menina",
      },
      consultas: [],
      exames: [],
      registrosDiarios: [],
    };

    localStorage.setItem(
      `acompanhegest_dados_${username}`,
      JSON.stringify(dadosIniciais),
    );
    return true;
  }

  autenticar(username, senha) {
    const usuario = this.usuarios[username];
    if (!usuario) return false;
    return usuario.senhaHash === this.hashSenha(senha);
  }

  getUsuarioAtivo() {
    return sessionStorage.getItem("acompanhegest_usuario_ativo");
  }

  setUsuarioAtivo(username) {
    sessionStorage.setItem("acompanhegest_usuario_ativo", username);
  }

  logout() {
    sessionStorage.removeItem("acompanhegest_usuario_ativo");
    window.location.href = "login.html";
  }

  /**
   * AJUSTE PARA EVITAR TELA BRANCA:
   * Se não houver login.html ou usuário logado, ele define um
   * usuário padrão para o app carregar normalmente.
   */
  verificarAutenticacao() {
    const usuario = this.getUsuarioAtivo();
    if (!usuario) {
      console.warn(
        "Nenhum usuário logado. Definindo usuário temporário para teste.",
      );
      this.setUsuarioAtivo("Andrezza"); // Define um user padrão
      return true;
    }
    return true;
  }
}

// Instância global para ser usada pelo script.js
const auth = new AuthSystem();

// Funções auxiliares para chamadas no HTML/Console
function login(username, password) {
  if (auth.autenticar(username, password)) {
    auth.setUsuarioAtivo(username);
    window.location.reload();
    return true;
  }
  return false;
}

function registrarUsuario(username, password) {
  return auth.registrar(username, password);
}

function logout() {
  auth.logout();
}
