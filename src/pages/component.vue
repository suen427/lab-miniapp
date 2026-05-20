<script setup lang="ts">
/**
 * 组件列表页
 * 汇总展示所有内置组件的 demo 页面入口
 */
definePage({
  layout: 'default',
  style: {
    navigationBarTitleText: '内置组件',
  },
})

/**
 * 组件列表配置
 * name: 显示名称
 * path: 页面路由路径
 * icon: Carbon 图标类名
 */
const components = [
  { name: 'Button 按钮', path: '/pages/component/button/button', icon: 'i-carbon:button-flush-left' },
  { name: 'Checkbox 复选框', path: '/pages/component/checkbox/checkbox', icon: 'i-carbon:checkbox' },
  { name: 'Editor 富文本编辑器', path: '/pages/component/editor/editor', icon: 'i-carbon:document' },
  { name: 'Audio 音频', path: '/pages/component/audio/audio', icon: 'i-carbon:volume-up' },
  { name: 'Canvas 画布', path: '/pages/component/canvas/canvas', icon: 'i-carbon:pen' },
  { name: 'Cover-View 覆盖视图', path: '/pages/component/cover-view/cover-view', icon: 'i-carbon:layers' },
  { name: 'Ad 广告', path: '/pages/component/ad/ad', icon: 'i-carbon:badge' },
]

/**
 * 跳转到对应的组件 demo 页面
 */
function navigateTo(path: string) {
  uni.navigateTo({ url: path })
}
</script>

<template>
  <!-- 页面标题区域 -->
  <view class="page-header">
    <text class="page-title">
      uni-app 内置组件
    </text>
    <text class="page-desc">
      点击列表项查看各组件 demo
    </text>
  </view>

  <!-- 组件列表 -->
  <view class="component-list">
    <view
      v-for="item in components"
      :key="item.path"
      class="component-item"
      hover-class="component-item--hover"
      @click="navigateTo(item.path)"
    >
      <!-- 图标 -->
      <view class="item-icon" :class="item.icon" />

      <!-- 名称与箭头 -->
      <view class="item-content">
        <text class="item-name">
          {{ item.name }}
        </text>
      </view>
      <view class="item-arrow i-carbon:chevron-right" />
    </view>
  </view>
</template>

<style scoped>
/* ===== 页面容器 ===== */
.page-header {
  padding: 48rpx 40rpx 32rpx;
}

.page-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.4;
}

.page-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: $text-secondary;
}

/* ===== 组件列表 ===== */
.component-list {
  padding: 0 32rpx 40rpx;
}

.component-item {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
  background: $bg-primary;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  transition: transform 0.15s;
}

.component-item--hover {
  background: $bg-hover;
  transform: scale(0.98);
}

/* 图标 */
.item-icon {
  width: 48rpx;
  height: 48rpx;
  font-size: 44rpx;
  color: $brand-primary;
  flex-shrink: 0;
}

/* 中间内容区域 */
.item-content {
  flex: 1;
  margin-left: 20rpx;
}

.item-name {
  font-size: 28rpx;
  font-weight: 500;
  color: $text-primary;
}

/* 右侧箭头 */
.item-arrow {
  width: 36rpx;
  height: 36rpx;
  font-size: 32rpx;
  color: $text-extra;
  flex-shrink: 0;
}
</style>
