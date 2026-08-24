<template>
  <div class="min-h-screen w-full flex items-center justify-center p-4 bg-transparent text-[#0f172a] dark:text-[#fafafa] relative overflow-hidden select-none transition-colors duration-200">
    <!-- Ambient Glow Background -->
    <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full accent-bg opacity-15 blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-cyan-500 opacity-15 blur-3xl pointer-events-none"></div>

    <div class="max-w-md w-full glass-modal border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
      <!-- Brand Logo & Header -->
      <div class="flex flex-col items-center text-center mb-8">
        <img :src="config?.logo || '/fluxcloud_icon.png'" alt="Brand Logo" class="w-14 h-14 rounded-2xl p-1 bg-white/80 dark:bg-[#18181b]/80 border border-white/20 dark:border-white/10 shadow-md object-contain mb-3" />
        <h1 class="text-2xl font-black tracking-tight accent-text">{{ config?.siteName || 'FluxCloud' }}</h1>
        <p class="text-xs text-[#64748b] dark:text-[#71717a] mt-1 font-medium">Private Cloud Storage &amp; CDN</p>
      </div>

      <!-- Mode 1: First-Run Setup Admin Account -->
      <div v-if="!hasUsers" class="space-y-5">
        <div class="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/40 text-xs text-indigo-700 dark:text-indigo-300">
          <div class="font-bold mb-1 flex items-center gap-1.5">
            <ShieldCheckIcon class="w-4 h-4 text-indigo-500" />
            <span>First-Run Setup</span>
          </div>
          Create your primary Administrator account. As admin, you can manage users and system settings.
        </div>

        <form @submit.prevent="handleSetupAdmin" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-[#475569] dark:text-[#a1a1aa] block">Admin Username</label>
            <input 
              v-model="username" 
              type="text" 
              placeholder="e.g. admin" 
              required
              class="w-full px-3.5 py-2.5 bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 focus:border-indigo-500 rounded-xl text-sm text-[#0f172a] dark:text-[#fafafa] focus:outline-none transition-all shadow-sm"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-[#475569] dark:text-[#a1a1aa] block">Password</label>
            <input 
              v-model="password" 
              type="password" 
              placeholder="Choose a strong password" 
              required
              class="w-full px-3.5 py-2.5 bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 focus:border-indigo-500 rounded-xl text-sm text-[#0f172a] dark:text-[#fafafa] focus:outline-none transition-all shadow-sm"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-[#475569] dark:text-[#a1a1aa] block">Confirm Password</label>
            <input 
              v-model="confirmPassword" 
              type="password" 
              placeholder="Repeat your password" 
              required
              class="w-full px-3.5 py-2.5 bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 focus:border-indigo-500 rounded-xl text-sm text-[#0f172a] dark:text-[#fafafa] focus:outline-none transition-all shadow-sm"
            />
          </div>

          <p v-if="errorMessage" class="text-xs text-red-500 font-medium">{{ errorMessage }}</p>

          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="w-full py-3 accent-bg accent-bg-hover disabled:opacity-50 font-bold text-white text-xs rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <ShieldCheckIcon class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Creating Administrator...' : 'Create Admin & Enter Cloud' }}</span>
          </button>
        </form>
      </div>

      <!-- Mode 2: First-Time User Password Setup (Chosen by User) -->
      <div v-else-if="requiresPasswordSetup" class="space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div class="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-300">
          <div class="font-bold mb-1 flex items-center gap-1.5">
            <KeyIcon class="w-4 h-4 text-emerald-500" />
            <span>Welcome, {{ targetUsername }}!</span>
          </div>
          This is your first login. Please choose your password now to activate your account and private storage space.
        </div>

        <form @submit.prevent="handleSetInitialPassword" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-[#475569] dark:text-[#a1a1aa] block">New Password</label>
            <input 
              v-model="newPassword" 
              type="password" 
              placeholder="Enter your new password" 
              required
              autofocus
              class="w-full px-3.5 py-2.5 bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 focus:border-indigo-500 rounded-xl text-sm text-[#0f172a] dark:text-[#fafafa] focus:outline-none transition-all shadow-sm"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-[#475569] dark:text-[#a1a1aa] block">Confirm Password</label>
            <input 
              v-model="confirmNewPassword" 
              type="password" 
              placeholder="Repeat your new password" 
              required
              class="w-full px-3.5 py-2.5 bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 focus:border-indigo-500 rounded-xl text-sm text-[#0f172a] dark:text-[#fafafa] focus:outline-none transition-all shadow-sm"
            />
          </div>

          <p v-if="errorMessage" class="text-xs text-red-500 font-medium">{{ errorMessage }}</p>

          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="w-full py-3 accent-bg accent-bg-hover disabled:opacity-50 font-bold text-white text-xs rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <KeyIcon class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Saving Password...' : 'Set Password & Enter Cloud' }}</span>
          </button>

          <div class="text-center pt-2">
            <button 
              type="button" 
              @click="requiresPasswordSetup = false; errorMessage = ''" 
              class="text-xs text-[#64748b] dark:text-[#a1a1aa] hover:text-[#0f172a] dark:hover:text-[#fafafa] transition-colors"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>

      <!-- Mode 3: Normal User Login -->
      <div v-else class="space-y-5">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-[#475569] dark:text-[#a1a1aa] block">Username</label>
            <input 
              v-model="username" 
              @blur="checkUsernameStatus"
              @input="onUsernameInput"
              type="text" 
              placeholder="Enter your username" 
              required
              autofocus
              class="w-full px-3.5 py-2.5 bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 focus:border-indigo-500 rounded-xl text-sm text-[#0f172a] dark:text-[#fafafa] focus:outline-none transition-all shadow-sm"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-[#475569] dark:text-[#a1a1aa] block">Password</label>
            <input 
              v-model="password" 
              type="password" 
              placeholder="••••••••" 
              class="w-full px-3.5 py-2.5 bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/15 focus:border-indigo-500 rounded-xl text-sm text-[#0f172a] dark:text-[#fafafa] focus:outline-none transition-all shadow-sm"
            />
          </div>

          <p v-if="errorMessage" class="text-xs text-red-500 font-medium">{{ errorMessage }}</p>

          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="w-full py-3 accent-bg accent-bg-hover disabled:opacity-50 font-bold text-white text-xs rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <LogInIcon class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Signing In...' : 'Sign In' }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { 
  ShieldCheck as ShieldCheckIcon, 
  Key as KeyIcon, 
  LogIn as LogInIcon 
} from 'lucide-vue-next'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'

defineProps({
  config: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['authenticated'])

const { hasUsers, setupAdmin, login, setInitialPassword } = useAuth()
const { success, error } = useToast()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

const requiresPasswordSetup = ref(false)
const targetUsername = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
let checkTimer = null

const checkUsernameStatus = async () => {
  const name = username.value.trim()
  if (!name || name.length < 2) return

  try {
    const res = await $fetch('/api/auth/check-user', {
      method: 'POST',
      body: { username: name }
    })
    if (res.exists && res.requiresPasswordSetup) {
      targetUsername.value = res.username || name
      requiresPasswordSetup.value = true
      errorMessage.value = ''
    }
  } catch {}
}

const onUsernameInput = () => {
  if (checkTimer) clearTimeout(checkTimer)
  checkTimer = setTimeout(() => {
    checkUsernameStatus()
  }, 400)
}

const handleSetupAdmin = async () => {
  errorMessage.value = ''
  if (!username.value.trim()) {
    errorMessage.value = 'Username is required'
    return
  }
  if (password.value.length < 4) {
    errorMessage.value = 'Password must be at least 4 characters long'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  isSubmitting.value = true
  try {
    const res = await setupAdmin(username.value.trim(), password.value)
    success('Admin created', `Welcome, ${res.user.username}!`)
    emit('authenticated', res.user)
  } catch (err) {
    errorMessage.value = err?.data?.statusMessage || 'Failed to create administrator'
  } finally {
    isSubmitting.value = false
  }
}

const handleLogin = async () => {
  errorMessage.value = ''
  const name = username.value.trim()
  if (!name) {
    errorMessage.value = 'Please enter your username'
    return
  }

  // Pre-check if first-time user
  try {
    const check = await $fetch('/api/auth/check-user', {
      method: 'POST',
      body: { username: name }
    })
    if (check.exists && check.requiresPasswordSetup) {
      targetUsername.value = check.username || name
      requiresPasswordSetup.value = true
      return
    }
  } catch {}

  isSubmitting.value = true
  try {
    const res = await login(name, password.value)
    if (res.requiresPasswordSetup) {
      targetUsername.value = res.username || name
      requiresPasswordSetup.value = true
    } else if (res.user) {
      success('Logged in', `Welcome back, ${res.user.username}!`)
      emit('authenticated', res.user)
    }
  } catch (err) {
    errorMessage.value = err?.data?.statusMessage || 'Invalid username or password'
  } finally {
    isSubmitting.value = false
  }
}

const handleSetInitialPassword = async () => {
  errorMessage.value = ''
  if (newPassword.value.length < 4) {
    errorMessage.value = 'Password must be at least 4 characters long'
    return
  }
  if (newPassword.value !== confirmNewPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  isSubmitting.value = true
  try {
    const res = await setInitialPassword(targetUsername.value, newPassword.value)
    success('Password set', `Your account is ready, ${res.user.username}!`)
    emit('authenticated', res.user)
  } catch (err) {
    errorMessage.value = err?.data?.statusMessage || 'Failed to set password'
  } finally {
    isSubmitting.value = false
  }
}
</script>
