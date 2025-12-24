<template>
  <div class="resizable-panel" :style="{ width: `${modelValue}px` }">
    <!-- 左侧调整手柄 -->
    <div 
      v-if="resizableEdge === 'left' || resizableEdge === 'both'"
      class="resize-handle left"
      @mousedown="startResize($event, 'left')"
    >
      <div class="handle-line"></div>
    </div>
    
    <!-- 面板内容 -->
    <div class="panel-content" :class="[customClass]">
      <slot></slot>
    </div>
    
    <!-- 右侧调整手柄 -->
    <div 
      v-if="resizableEdge === 'right' || resizableEdge === 'both'"
      class="resize-handle right"
      @mousedown="startResize($event, 'right')"
    >
      <div class="handle-line"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  modelValue: number  // 改为 modelValue
  resizableEdge?: 'left' | 'right' | 'both'
  minWidth?: number
  maxWidth?: number
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 300,
  resizableEdge: 'right',
  minWidth: 200,
  maxWidth: 500,
  customClass: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: number]  // 改为 update:modelValue
}>()

let startX = 0
let startWidth = 0

const startResize = (e: MouseEvent, edge: 'left' | 'right') => {
  e.preventDefault()
  startX = e.clientX
  startWidth = props.modelValue
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
}

const handleMouseMove = (e: MouseEvent) => {
  const deltaX = e.clientX - startX
  let newWidth = startWidth
  
  // 根据调整边计算新宽度
  if (props.resizableEdge === 'left' || props.resizableEdge === 'both') {
    newWidth = startWidth - deltaX
  } else {
    newWidth = startWidth + deltaX
  }
  
  // 限制宽度范围
  newWidth = Math.max(props.minWidth, Math.min(props.maxWidth, newWidth))
  
  emit('update:modelValue', newWidth)
}

const stopResize = () => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
}
</script>

<style scoped lang="scss">
.resizable-panel {
  position: relative;
  height: 100%;
  display: flex;
  
  .resize-handle {
    position: absolute;
    top: 0;
    height: 100%;
    width: 6px;
    cursor: col-resize;
    z-index: 10;
    
    &.left {
      left: -3px;
    }
    
    &.right {
      right: -3px;
    }
    
    .handle-line {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 2px;
      height: 40px;
      background-color: #dcdfe6;
      border-radius: 1px;
      transition: background-color 0.2s;
    }
    
    &:hover .handle-line {
      background-color: #409eff;
    }
  }
  
  .panel-content {
    flex: 1;
    height: 100%;
    overflow: hidden;
  }
}
</style>