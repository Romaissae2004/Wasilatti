const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8082';

// Décode le JWT et extrait les rôles (sans librairie)
function parseToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      username: payload.sub,
      email: payload.email || null,
      roles: payload.roles || [],   // ["ADMIN"] ou ["USER"]
      collaboratorId: payload.collaboratorId || null,
    };
  } catch {
    return null;
  }
}

const authService = {

  async login(username, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Identifiants incorrects');
  }

  const data = await response.json();

  // ✅ Correction : votre backend envoie "access-token" (avec tiret)
  const accessToken  = data['access-token'];
  const refreshToken = data['refresh-token'];

  if (!accessToken) throw new Error('Token manquant dans la réponse');

  localStorage.setItem('accessToken',  accessToken);
  localStorage.setItem('refreshToken', refreshToken);

  // ✅ Décoder le JWT pour extraire username + roles + collaboratorId + email
  const payload = JSON.parse(atob(accessToken.split('.')[1]));
  const user = {
    username: payload.sub,
    email: payload.email || null,
    roles: payload.roles || [],  // ["ADMIN"] ou ["USER"]
    collaboratorId: payload.collaboratorId || null,
  };

  localStorage.setItem('user', JSON.stringify(user));

  return { user };
},

  async register(username, email, password, roles = []) {
    const payload = { username, email, password };
    if (roles && roles.length > 0) {
      payload.appRoles = roles.map(roleName => ({ roleName }));
    }
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Erreur lors de l'inscription");
    }

    return response.json();
  },

  async logout() {
    const token = localStorage.getItem('accessToken');
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => {});
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getToken() {
    return localStorage.getItem('accessToken');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    if (!user || user === 'undefined' || user === 'null') return null;
    try {
      return JSON.parse(user);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  async forgotPassword(email) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Erreur lors de la demande de réinitialisation');
    }

    return response.json();
  },

  async resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Erreur lors de la réinitialisation');
    }

    return response.json();
  },

  async loginWithGoogleCode(code) {
    const response = await fetch(`${API_BASE_URL}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Erreur lors de la connexion Google');
    }

    const data = await response.json();
    const accessToken  = data['access-token'];
    const refreshToken = data['refresh-token'];

    if (!accessToken) throw new Error('Token manquant dans la réponse');

    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const user = {
      username: payload.sub,
      email: payload.email || null,
      roles: payload.roles || [],
      collaboratorId: payload.collaboratorId || null,
    };

    localStorage.setItem('user', JSON.stringify(user));

    return { user };
  },
};

export default authService;