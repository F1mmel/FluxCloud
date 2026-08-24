<template>
  <PublicShareLanding :share-id="shareId" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PublicShareLanding from '../../components/views/PublicShareLanding.vue'

const route = useRoute()
const shareId = computed(() => route.params.id)
</script>
