<script setup lang="ts">
function go() {
  uni.navigateTo({
    url: `/pages/demo/index`,
  })
}

function goComponent() {
  uni.navigateTo({
    url: `/pages/component`,
  })
}

const show = ref(true)
</script>

<template>
  <AppLogos />
  <InputEntry />
  <button
    type="primary"
    m="t-3 auto"
    w-220rpx
    rounded
    px-4
    py-1
    text-sm
    @click="go"
  >
    GO Demo
  </button>
  <button
    type="primary"
    m="t-3 auto"
    w-220rpx
    rounded
    px-4
    py-1
    text-sm
    @click="goComponent"
  >
    GO Component
  </button>

  <uni-nav-bar left-icon="back" title="导航标题" />

  <uni-calendar v-model:show="show" />
</template>

<style></style>
