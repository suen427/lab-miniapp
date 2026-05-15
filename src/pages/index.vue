<script setup lang="ts">
function go() {
  uni.navigateTo({
    url: `/pages/demo/index`,
  })
}
</script>

<template>
  <AppLogos />
  <InputEntry />
  <button
    m="t-3 auto"
    m-auto
    w-220rpx
    rounded
    bg-teal-600
    px-4
    py-1
    text-sm
    text-white
    hover-class="bg-teal-700"
    @click="go"
  >
    GO Demo
  </button>
</template>

<style></style>
