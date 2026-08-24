import { ref } from 'vue'
import { useToast } from './useToast'

// Global shared reactive Set of favorited relative paths
const favoritePaths = ref<Set<string>>(new Set())
const isInitialized = ref(false)

export function useFavorites() {
  const { success, error } = useToast()

  const syncFavoritesFromFiles = (files: any[]) => {
    if (!files || !Array.isArray(files)) return
    const newSet = new Set(favoritePaths.value)
    for (const f of files) {
      const key = f.relativePath || f.name
      if (f.isFavorite) {
        newSet.add(key)
      } else if (!isInitialized.value) {
        newSet.delete(key)
      }
    }
    favoritePaths.value = newSet
    isInitialized.value = true
  }

  const isFavorite = (item: any): boolean => {
    if (!item) return false
    const key = item.relativePath || item.name
    return favoritePaths.value.has(key) || !!item.isFavorite
  }

  const toggleFavorite = async (item: any) => {
    if (!item) return false
    const key = item.relativePath || item.name
    const currentlyFav = isFavorite(item)
    const nextFav = !currentlyFav

    // 1. Optimistic instant UI update (0ms delay)
    const newSet = new Set(favoritePaths.value)
    if (nextFav) {
      newSet.add(key)
    } else {
      newSet.delete(key)
    }
    favoritePaths.value = newSet
    item.isFavorite = nextFav

    // 2. Persist to server
    try {
      const res: any = await $fetch('/api/favorites', {
        method: 'POST',
        body: { path: key }
      })
      item.isFavorite = res.isFavorite
      if (res.isFavorite) {
        newSet.add(key)
        success('Favorited', `Added "${item.name}" to favorites`)
      } else {
        newSet.delete(key)
        success('Unfavorited', `Removed "${item.name}" from favorites`)
      }
      favoritePaths.value = new Set(newSet)
      return res.isFavorite
    } catch (err: any) {
      // Revert optimistic state on error
      const revertSet = new Set(favoritePaths.value)
      if (currentlyFav) revertSet.add(key); else revertSet.delete(key)
      favoritePaths.value = revertSet
      item.isFavorite = currentlyFav
      error('Favorite failed', err?.data?.statusMessage || 'Could not update favorite')
      return currentlyFav
    }
  }

  return {
    favoritePaths,
    isFavorite,
    toggleFavorite,
    syncFavoritesFromFiles
  }
}
