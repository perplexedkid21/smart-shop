/* eslint react-refresh/only-export-components: off */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'smartshop_auth_v1'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function loadAuth() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  return safeParse(raw)
}

function persistAuth(value) {
  if (typeof window === 'undefined') return
  if (!value) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => loadAuth() ?? { token: null, user: null })

  const user = auth.user
  const token = auth.token

  const login = useCallback(async ({ email }) => {
    // Dummy JWT login (UI + state only).
    await new Promise((r) => setTimeout(r, 650))

    // Basic "JWT based auth" simulation.
    const fakeToken = btoa(`${email}:${Date.now()}`)
    const role = email.toLowerCase().includes('admin') ? 'admin' : 'customer'

    const nextUser = {
      id: `u_${email.replace(/[^a-z0-9]/gi, '').slice(0, 12)}`,
      name: email.split('@')[0].slice(0, 1).toUpperCase() + email.split('@')[0].slice(1),
      email,
      role,
      createdAt: new Date().toISOString(),
      profile: {
        phone: '',
        addressLine1: '',
        city: '',
        postalCode: '',
      },
    }

    const nextAuth = { token: fakeToken, user: nextUser }
    setAuth(nextAuth)
    persistAuth(nextAuth)
    return nextAuth
  }, [])

  const register = useCallback(async ({ name, email }) => {
    await new Promise((r) => setTimeout(r, 750))

    const fakeToken = btoa(`${email}:${Date.now()}`)
    const nextUser = {
      id: `u_${Date.now()}`,
      name,
      email,
      role: 'customer',
      createdAt: new Date().toISOString(),
      profile: {
        phone: '',
        addressLine1: '',
        city: '',
        postalCode: '',
      },
    }

    const nextAuth = { token: fakeToken, user: nextUser }
    setAuth(nextAuth)
    persistAuth(nextAuth)
    return nextAuth
  }, [])

  const socialLogin = useCallback(async ({ provider }) => {
    await new Promise((r) => setTimeout(r, 650))
    const email = `${provider.toLowerCase()}_user@smartshop.demo`
    return login({ email })
  }, [login])

  const logout = useCallback(() => {
    setAuth({ token: null, user: null })
    persistAuth(null)
  }, [])

  const updateProfile = useCallback((patch) => {
    setAuth((prev) => {
      if (!prev?.user) return prev
      const next = {
        ...prev,
        user: {
          ...prev.user,
          profile: { ...(prev.user.profile ?? {}), ...patch },
        },
      }
      persistAuth(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      socialLogin,
      logout,
      updateProfile,
    }),
    [token, user, login, register, socialLogin, logout, updateProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

