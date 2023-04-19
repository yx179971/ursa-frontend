<script setup>
import { ref } from 'vue'

let count = 0

function increment() {
  count++
  console.log(count)
}
</script>

<template>
  <button @click="increment">
    {{ count }} <!-- 无需 .value -->
  </button>
</template>