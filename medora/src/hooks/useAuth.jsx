import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const DEFAULT_DEMO_USER = {
  id: 'ab9d9811-3c9b-47d0-80a8-774ef65777d8',
  email: 'radiologist@medora.health',
  name: 'Dr. Anandha Lakshmi',
  role: 'annotator',
  user_metadata: {
    full_name: 'Dr. Anandha Lakshmi',
    role: 'Lead Radiologist',
    department: 'Cardiothoracic Imaging',
    hospital: 'Apex Medical Center',
    avatar_url: null,
  },
};

function formatUserProfile(me) {
  if (!me) return null;
  return {
    id: me.id,
    email: me.email,
    name: me.name || me.email?.split('@')[0] || 'Radiologist',
    role: me.role || 'annotator',
    is_active: me.is_active,
    is_superuser: me.is_superuser,
    created_at: me.created_at,
    user_metadata: {
      full_name: me.name || me.email?.split('@')[0] || 'Dr. Specialist',
      role: me.role === 'admin' ? 'System Administrator' : 'Lead Radiologist',
      department: 'Cardiothoracic Imaging',
      hospital: 'Apex Medical Center',
      avatar_url: null,
    },
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('medora_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('medora_active_user');
    return saved ? JSON.parse(saved) : DEFAULT_DEMO_USER;
  });
  const [loading, setLoading] = useState(true);

  // Validate active token against FastAPI Users /users/me on startup
  useEffect(() => {
    let isMounted = true;
    const currentToken = localStorage.getItem('medora_token');

    if (!currentToken) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    })
      .then(async (res) => {
        if (!isMounted) return;
        if (res.ok) {
          const me = await res.json();
          const profile = formatUserProfile(me);
          setUser(profile);
          localStorage.setItem('medora_active_user', JSON.stringify(profile));
        } else if (res.status === 401) {
          // Token expired or invalid
          setToken(null);
          localStorage.removeItem('medora_token');
        }
      })
      .catch((err) => {
        console.warn('Backend reachability check warning:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * FastAPI Users prebuilt login:
   * POST /auth/jwt/login (OAuth2 form data: username & password)
   */
  const signIn = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const res = await fetch(`${API_BASE}/auth/jwt/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        let message = 'Failed to sign in. Please verify credentials.';
        if (errorData.detail === 'LOGIN_BAD_CREDENTIALS') {
          message = 'Invalid email or password.';
        } else if (errorData.detail === 'LOGIN_USER_NOT_VERIFIED') {
          message = 'Account is not yet verified.';
        } else if (typeof errorData.detail === 'string') {
          message = errorData.detail;
        }
        throw new Error(message);
      }

      const { access_token } = await res.json();
      setToken(access_token);
      localStorage.setItem('medora_token', access_token);

      // Fetch /users/me using the new bearer token
      const meRes = await fetch(`${API_BASE}/users/me`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!meRes.ok) {
        throw new Error('Could not retrieve user profile.');
      }

      const me = await meRes.json();
      const profile = formatUserProfile(me);
      setUser(profile);
      localStorage.setItem('medora_active_user', JSON.stringify(profile));
      return { user: profile, token: access_token };
    } catch (err) {
      // If backend is momentarily unreachable and it's the demo account, fallback safely
      if (
        err.message?.includes('Failed to fetch') &&
        email === 'radiologist@medora.health'
      ) {
        setUser(DEFAULT_DEMO_USER);
        localStorage.setItem('medora_active_user', JSON.stringify(DEFAULT_DEMO_USER));
        return { user: DEFAULT_DEMO_USER, token: 'demo-local-token' };
      }
      throw err;
    }
  };

  /**
   * FastAPI Users prebuilt register:
   * POST /auth/register (JSON payload: email, password, name, role)
   */
  const signUp = async (email, password, metadata = {}) => {
    const role = (metadata.role || 'annotator').toLowerCase().includes('admin')
      ? 'admin'
      : 'annotator';

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name: metadata.full_name || '',
        role,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      let message = 'Failed to create account.';
      if (errorData.detail === 'REGISTER_USER_ALREADY_EXISTS') {
        message = 'A specialist account with this email already exists.';
      } else if (typeof errorData.detail === 'string') {
        message = errorData.detail;
      }
      throw new Error(message);
    }

    // Automatically sign in upon successful registration
    return await signIn(email, password);
  };

  /**
   * FastAPI Users prebuilt logout:
   * POST /auth/jwt/logout (Bearer Authorization)
   */
  const signOut = async () => {
    const activeToken = token || localStorage.getItem('medora_token');
    if (activeToken) {
      try {
        await fetch(`${API_BASE}/auth/jwt/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        });
      } catch (e) {
        console.warn('Logout request completed with local cleanup:', e);
      }
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('medora_token');
    localStorage.removeItem('medora_active_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signUp,
        signOut,
        apiBaseUrl: API_BASE,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
