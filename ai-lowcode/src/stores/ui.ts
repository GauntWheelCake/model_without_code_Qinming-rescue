import { defineStore } from 'pinia'
import { ref } from 'vue'

export type GenerationMode = 'deep_learning' | 'reinforcement_learning'

export interface RLConfig {
  httpUrl: string
  tcpPort: number
  udpPort: number
  savePath: string
  interval: number
}

export const useUIStore = defineStore('ui', () => {
  // 侧边栏宽度状态
  const leftPanelWidth = ref(300)
  const rightPanelWidth = ref(400)
  const isRightPanelVisible = ref(true)

  // 拖拽状态
  const isDragging = ref(false)

  // 代码生成模式
  const generationMode = ref<GenerationMode>('deep_learning')

  // 强化学习配置
  const rlConfig = ref<RLConfig>({
    httpUrl: 'http://172.18.218.12:8086/dtkz-frame/hfXdzbJbxx/getXdById',
    tcpPort: 3331,
    udpPort: 4444,
    savePath: './received_data',
    interval: 5
  })

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

  // 切换代码生成模式
  const toggleGenerationMode = () => {
    generationMode.value = generationMode.value === 'deep_learning'
      ? 'reinforcement_learning'
      : 'deep_learning'
  }

  // 设置代码生成模式
  const setGenerationMode = (mode: GenerationMode) => {
    generationMode.value = mode
  }

  // 更新强化学习配置
  const updateRLConfig = (config: Partial<RLConfig>) => {
    rlConfig.value = { ...rlConfig.value, ...config }
  }

  return {
    leftPanelWidth,
    rightPanelWidth,
    isRightPanelVisible,
    isDragging,
    generationMode,
    rlConfig,
    updateLeftPanelWidth,
    updateRightPanelWidth,
    toggleRightPanel,
    toggleGenerationMode,
    setGenerationMode,
    updateRLConfig
  }
})