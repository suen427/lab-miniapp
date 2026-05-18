<script>
export default {
  data() {
    return {
      title: 'checkbox 复选框',
      items: [{
        value: 'USA',
        name: '美国',
      }, {
        value: 'CHN',
        name: '中国',
        checked: 'true',
      }, {
        value: 'BRA',
        name: '巴西',
      }, {
        value: 'JPN',
        name: '日本',
      }, {
        value: 'ENG',
        name: '英国',
      }, {
        value: 'FRA',
        name: '法国',
      }],
    }
  },
  methods: {
    checkboxChange(e) {
      const items = this.items
      const values = e.detail.value
      for (let i = 0, lenI = items.length; i < lenI; ++i) {
        const item = items[i]
        if (values.includes(item.value)) {
          this.$set(item, 'checked', true)
        }
        else {
          this.$set(item, 'checked', false)
        }
      }
    },
  },
}
</script>

<template>
  <view>
    <page-head :title="title" />
    <view class="uni-padding-wrap uni-common-mt">
      <view class="uni-common-mt uni-title">
        默认样式
      </view>
      <view>
        <checkbox-group>
          <label>
            <checkbox value="cb1" :checked="true" />选中
          </label>
          <label>
            <checkbox value="cb" />未选中
          </label>
        </checkbox-group>
      </view>
      <view class="uni-title uni-common-mt">
        不同颜色和尺寸的checkbox
      </view>
      <view>
        <checkbox-group>
          <label>
            <checkbox value="cb1" :checked="true" color="#FFCC33" style="transform:scale(0.7)" />选中
          </label>
          <label>
            <checkbox value="cb" color="#FFCC33" style="transform:scale(0.7)" />未选中
          </label>
        </checkbox-group>
      </view>
    </view>

    <view class="uni-padding-wrap">
      <view class="uni-title uni-common-mt">
        推荐展示样式
        <text>\n使用 uni-list 布局</text>
      </view>
    </view>
    <view class="uni-list">
      <checkbox-group @change="checkboxChange">
        <label v-for="item in items" :key="item.value" class="uni-list-cell uni-list-cell-pd">
          <view>
            <checkbox :value="item.value" :checked="item.checked" />
          </view>
          <view>{{ item.name }}</view>
        </label>
      </checkbox-group>
    </view>
  </view>
</template>

<style>
.uni-list-cell {
  justify-content: flex-start
}
</style>
