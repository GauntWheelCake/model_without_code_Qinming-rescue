<template>
  <g
    :class="['connection-line', { 'selected': isSelected, 'hovered': isHovered }]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
    @contextmenu="handleRightClick"
  >
    <!-- 连接路径 -->
    <path
      :d="pathData"
      :stroke="connection.style.color"
      :stroke-width="connection.style.width"
      :stroke-dasharray="connection.style.dashed ? '5,5' : 'none'"
      fill="none"
      marker-end="url(#arrowhead)"
      class="connection-path"
    />
    
    <!-- 交互区域（更宽的透明路径） -->
    <path
      :d="pathData"
      stroke="transparent"
      :stroke-width="interactiveWidth"
      fill="none"
      class="connection-interactive"
    />
    
    <!-- 连接信息标签 -->
    <g v-if="showLabel" class="connection-label">
      <rect
        :x="labelPosition.x - labelWidth / 2"
        :y="labelPosition.y - 15"
        :width="labelWidth"
        height="20"
        rx="4"
        fill="white"
        stroke="#409eff"
        stroke-width="1"
        class="label-background"
      />
      <text
        :x="labelPosition.x"
        :y="labelPosition.y"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="11"
        fill="#409eff"
        class="label-text"
      >
        {{ connection.data.tensorName || 'Tensor' }}
      </text>
    </g>
    
    <!-- 删除按钮（悬停时显示） -->
    <g v-if="isHovered" class="connection-delete" @click="handleDeleteClick">
      <circle
        :cx="deleteButtonPosition.x"
        :cy="deleteButtonPosition.y"
        r="12"
        fill="white"
        stroke="#f56c6c"
        stroke-width="1"
        class="delete-background"
      />
      <text
        :x="deleteButtonPosition.x"
        :y="deleteButtonPosition.y + 1"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="12"
        fill="#f56c6c"
        class="delete-icon"
      >
        ×
      </text>
    </g>
  </g>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Connection } from '../../types/node'

interface Props {
  connection: Connection
  isSelected?: boolean
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  showLabel: true
})

const emit = defineEmits<{
  'click': [connectionId: string]
  'delete': [connectionId: string]
}>()

const isHovered = ref(false)
const interactiveWidth = 12 // 交互区域的宽度

// 计算贝塞尔曲线路径
const pathData = computed(() => {
  const { source, target } = props.connection
  
  // 控制点偏移量，使连接线更平滑
  const offsetX = Math.abs(target.x - source.x) * 0.3
  
  return `
    M ${source.x} ${source.y}
    C ${source.x + offsetX} ${source.y},
      ${target.x - offsetX} ${target.y},
      ${target.x} ${target.y}
  `
})

// 计算标签位置
const labelPosition = computed(() => {
  const { source, target } = props.connection
  return {
    x: (source.x + target.x) / 2,
    y: (source.y + target.y) / 2 - 20
  }
})

// 计算删除按钮位置
const deleteButtonPosition = computed(() => {
  const { source, target } = props.connection
  const t = 0.5 // 在路径中点
  const offset = 30
  
  // 计算中点坐标
  const midX = (source.x + target.x) / 2
  const midY = (source.y + target.y) / 2
  
  // 计算垂直方向
  const dx = target.x - source.x
  const dy = target.y - source.y
  const length = Math.sqrt(dx * dx + dy * dy)
  
  if (length === 0) {
    return { x: midX, y: midY - offset }
  }
  
  // 垂直方向
  const perpendicularX = -dy / length
  const perpendicularY = dx / length
  
  // 在上方显示删除按钮
  return {
    x: midX + perpendicularX * offset,
    y: midY + perpendicularY * offset
  }
})

// 计算标签宽度
const labelWidth = computed(() => {
  const text = props.connection.data.tensorName || 'Tensor'
  return text.length * 7 + 20 // 简单估算
})

const handleMouseEnter = () => {
  isHovered.value = true
}

const handleMouseLeave = () => {
  isHovered.value = false
}

const handleClick = (event: MouseEvent) => {
  event.stopPropagation()
  emit('click', props.connection.id)
}

// 删除按钮点击
const handleDeleteClick = (event: MouseEvent) => {
  event.stopPropagation()
  emit('delete', props.connection.id)
}

// 右键菜单删除
const handleRightClick = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  emit('delete', props.connection.id)
}
</script>

<style scoped lang="scss">
.connection-line {
  cursor: pointer;
  
  .connection-path {
    transition: all 0.2s;
    
    .connection-line:hover & {
      stroke-width: 3;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
    
    .connection-line.selected & {
      stroke-width: 3;
      stroke-dasharray: none !important;
      filter: drop-shadow(0 2px 8px rgba(64, 158, 255, 0.3));
    }
  }
  
  .connection-interactive {
    pointer-events: all;
    
    &:hover {
      cursor: pointer;
    }
  }
  
  .connection-label {
    pointer-events: none;
    
    .label-background {
      opacity: 0.9;
      transition: all 0.2s;
    }
    
    .label-text {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-weight: 500;
      pointer-events: none;
    }
  }
  
  .connection-delete {
    pointer-events: all;
    cursor: pointer;
    transition: all 0.2s;
    
    .delete-background {
      opacity: 0.9;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      
      &:hover {
        fill: #fef0f0;
        stroke-width: 2;
      }
    }
    
    .delete-icon {
      font-weight: bold;
      pointer-events: none;
    }
  }
}
</style>