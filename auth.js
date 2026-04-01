// ==================== AcompanheGest - Sistema de Autenticação ====================

class AuthSystem {
  constructor() {
    this.usuarios = this.carregarUsuarios();
  }

  carregarUsuarios() {
    const saved = localStorage.getItem("acompanhegest_usuarios");
    if (saved) {
      return JSON.parse(saved);
    }
    return {};
  }

  salvarUsuarios() {
    localStorage.setItem(
      "acompanhegest_usuarios",
      JSON.stringify(this.usuarios),
    );
  }

  // Hash simples para senhas
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

    // Criar dados vazios para o novo usuário
    const dadosVazios = {
      config: {
        nome: "",
        altura: 0,
        pesoPreGestacional: 0,
        dpp: "",
        nomeBebe: "",
        sexoBebe: "Menina",
      },
      registrosPeso: [],
      pressaoArterial: [],
      movimentosFetais: [],
      sintomas: [],
      exames: [],
      consultas: [],
      registrosDiarios: [],
    };

    localStorage.setItem(
      `acompanhegest_dados_${username}`,
      JSON.stringify(dadosVazios),
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

  verificarAutenticacao() {
    const usuario = this.getUsuarioAtivo();
    if (!usuario) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  }
}

// Instância global
const auth = new AuthSystem();

// Funções globais para usar no HTML
function login(username, password) {
  if (auth.autenticar(username, password)) {
    auth.setUsuarioAtivo(username);
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

function getUsuarioAtual() {
  return auth.getUsuarioAtivo();
}
