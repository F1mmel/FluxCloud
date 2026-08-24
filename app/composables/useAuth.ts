import { ref } from 'vue'

export interface CurrentUser {
  id: string
  username: string
  role: 'admin' | 'user'
}

const currentUser = ref<CurrentUser | null>(null)
const hasUsers = ref<boolean>(true)
const isAuthLoading = ref<boolean>(true)

export function useAuth() {
  const checkAuthStatus = async () => {
    isAuthLoading.value = true
    try {
      const res = await $fetch<{ hasUsers: boolean; currentUser: CurrentUser | null }>('/api/auth/status')
      hasUsers.value = res.hasUsers
      currentUser.value = res.currentUser
    } catch {
      currentUser.value = null
    } finally {
      isAuthLoading.value = false
    }
  }

  const setupAdmin = async (username: string, password: string) => {
    const res = await $fetch<{ success: boolean; user: CurrentUser }>('/api/auth/setup-admin', {
      method: 'POST',
      body: { username, password }
    })
    currentUser.value = res.user
    hasUsers.value = true
    return res
  }

  const login = async (username: string, password?: string) => {
    const res = await $fetch<{ success: boolean; requiresPasswordSetup?: boolean; username?: string; user?: CurrentUser }>('/api/auth/login', {
      method: 'POST',
      body: { username, password }
    })
    if (res.user) {
      currentUser.value = res.user
    }
    return res
  }

  const setInitialPassword = async (username: string, password: string) => {
    const res = await $fetch<{ success: boolean; user: CurrentUser }>('/api/auth/set-password', {
      method: 'POST',
      body: { username, password }
    })
    currentUser.value = res.user
    return res
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      currentUser.value = null
    }
  }

  return {
    currentUser,
    hasUsers,
    isAuthLoading,
    checkAuthStatus,
    setupAdmin,
    login,
    setInitialPassword,
    logout
  }
}
