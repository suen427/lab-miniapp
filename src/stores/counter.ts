/**
 * 计数器示例 store
 * 演示 Pinia 基础用法（Option Store 风格）
 */
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)

  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  return { count, increment, decrement }
})
