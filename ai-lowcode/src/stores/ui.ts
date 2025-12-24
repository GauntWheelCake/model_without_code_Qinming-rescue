import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // 侧边栏宽度状态
  const leftPanelWidth = ref(300)
  const rightPanelWidth = ref(400)
  const isRightPanelVisible = ref(true)
  
  // 拖拽状态
  const isDragging = ref(false)
  
  // 更新侧边栏宽度
  const updateLeftPanelWidth = (width: number) => {
    leftPanelWidth.value = Math.max(200, Math.min(500, width))
  }
  
  const updateRightPanelWidth = (width: number) => {
    rightPanelWidth.value = Math.max(200, Math.min(500, width))
  }
  
  // 切换右侧面板可见性
  const toggleRightPanel = () => {
    isRightPanelVisible.value = !isRightPanelVisible.value
  }
  
  return {
    leftPanelWidth,
    rightPanelWidth,
    isRightPanelVisible,
    isDragging,
    updateLeftPanelWidth,
    updateRightPanelWidth,
    toggleRightPanel
  }
})