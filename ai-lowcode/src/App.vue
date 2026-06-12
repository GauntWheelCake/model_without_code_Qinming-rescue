<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-left">
        <div class="logo">
          <el-icon :size="24" color="#409eff"><MagicStick /></el-icon>
          <span class="logo-text">智能训练服务-拖拉拽编程</span>
        </div>
        <el-divider direction="vertical" />
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>工作区</el-breadcrumb-item>
          <el-breadcrumb-item>模型构建</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      
      <div class="header-right">
        <el-button size="small" plain data-tour="tour-entry" @click="openOnboarding">
          <el-icon><QuestionFilled /></el-icon>
          新手引导
        </el-button>
        <!-- 强化学习模式切换 -->
        <el-switch
          v-model="isRLMode"
          active-text="强化学习"
          inactive-text="深度学习"
          size="small"
          @change="handleModeChange"
        />
        <el-tooltip
          :content="uiStore.generationMode === 'reinforcement_learning' ? '环境配置' : '仅强化学习模式可用'"
          placement="bottom"
        >
          <el-button
            size="small"
            :disabled="uiStore.generationMode !== 'reinforcement_learning'"
            @click="rlConfigVisible = true"
          >
            <el-icon><Setting /></el-icon>
          </el-button>
        </el-tooltip>

        <el-tooltip :content="uiStore.isRightPanelVisible ? '隐藏代码面板' : '显示代码面板'" placement="bottom">
          <el-button size="small" @click="uiStore.toggleRightPanel">
            <el-icon>
              <component :is="uiStore.isRightPanelVisible ? 'ArrowRight' : 'ArrowLeft'" />
            </el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </header>
    
    <!-- 主工作区 -->
    <main class="app-main">
      <!-- 左侧工具栏 -->
      <ResizablePanel 
        v-model="leftPanelWidth"  
        :min-width="300"
        :max-width="500"
        resizable-edge="right"
      >
        <Toolbox data-tour="toolbox" />
      </ResizablePanel>
      
      <!-- 中间画布 -->
      <div class="main-canvas">
        <WorkspaceCanvas ref="workspaceCanvasRef" data-tour="canvas" />
      </div>
      
      <!-- 右侧代码预览 -->
      <ResizablePanel 
        v-if="uiStore.isRightPanelVisible"
        v-model="rightPanelWidth" 
        :min-width="320"
        :max-width="800"
        resizable-edge="left"
      >
        <CodePreview data-tour="code-preview" />
      </ResizablePanel>
    </main>
    
    <!-- 底部状态栏 -->
    <footer class="app-footer">
      <div class="footer-left">
        <el-icon :size="14" :color="codeStatus.color"><component :is="codeStatus.icon" /></el-icon>
        <span>{{ codeStatus.text }}</span>
      </div>
      <div class="footer-right">
        <span v-if="codeStore.generatedCode">代码已生成</span>
      </div>
    </footer>
    <OnboardingTour />
    <RLConfigDialog v-model:visible="rlConfigVisible" @config-updated="handleRLConfigUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUIStore } from './stores/ui'
import { 
  MagicStick,
  QuestionFilled,
  ArrowRight,
  ArrowLeft,
  Check,
  Warning,
  Setting
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import ResizablePanel from './components/common/ResizablePanel.vue'
import OnboardingTour from './components/common/OnboardingTour.vue'
import Toolbox from './components/workspace/Toolbox.vue'
import WorkspaceCanvas from './components/workspace/WorkspaceCanvas.vue'
import CodePreview from './components/workspace/CodePreview.vue'
import RLConfigDialog from './components/workspace/RLConfigDialog.vue'
import { useOnboardingStore } from './stores/onboarding'

const workspaceCanvasRef = ref()

const uiStore = useUIStore()
const onboardingStore = useOnboardingStore()
//const { isRightPanelVisible, toggleRightPanel } = uiStore
const leftPanelWidth = ref(440)
const rightPanelWidth = ref(480)
const rlConfigVisible = ref(false)
import { useCodeStore } from './stores/code'
const codeStore = useCodeStore()

// 强化学习模式绑定
const isRLMode = computed({
  get: () => uiStore.generationMode === 'reinforcement_learning',
  set: (val: boolean) => {
    uiStore.setGenerationMode(val ? 'reinforcement_learning' : 'deep_learning')
  }
})

const handleModeChange = () => {
  const mode = uiStore.generationMode === 'reinforcement_learning' ? '强化学习' : '深度学习'
  ElMessage.info(`已切换至${mode}模式`)
  // 模式切换后自动重新生成代码
  if (workspaceCanvasRef.value?.handleManualGenerate) {
    workspaceCanvasRef.value.handleManualGenerate()
  }
}

const handleRLConfigUpdated = () => {
  // 配置更新后，如果画布有节点，自动重新生成代码
  if (workspaceCanvasRef.value?.handleManualGenerate) {
    workspaceCanvasRef.value.handleManualGenerate()
  }
}
// 应用状态
const appStatus = computed(() => {
  if (codeStore.generatedCode) {
    return {
      color: '#67c23a',
      text: '代码已生成'
    }
  }
  
  // 检查画布中是否有节点
  const hasNodes = workspaceCanvasRef.value?.nodes?.length > 0 || false
  if (hasNodes) {
    return {
      color: '#409eff',
      text: '模型就绪'
    }
  }
  
  return {
    color: '#67c23a',
    text: '就绪'
  }
})

// 是否有节点的计算属性
const hasNodes = computed(() => {
  // 如果workspaceCanvasRef有节点数据，使用它
  if (workspaceCanvasRef.value?.nodes) {
    return workspaceCanvasRef.value.nodes.length > 0
  }
  
  // 否则检查codeStore中是否有生成的代码
  if (codeStore.generatedCode) {
    return true
  }
  
  // 默认返回false
  return false
})
// 添加生成代码方法
// 生成代码方法（通过ref调用子组件的方法）
const generateCode = () => {
  if (!hasNodes.value) {
    ElMessage.warning('请先在画布中添加节点')
    return
  }
  
  // 如果workspaceCanvasRef有generateCode方法，调用它
  if (workspaceCanvasRef.value?.generateCode) {
    workspaceCanvasRef.value.generateCode()
  } else {
    // 否则显示消息
    ElMessage.info('正在生成代码...')
    
    // 模拟生成代码
    setTimeout(() => {
      ElMessage.success('代码生成成功！请在右侧面板查看')
    }, 1000)
  }
}
// 代码状态计算属性
const codeStatus = computed(() => {
  if (!codeStore.generatedCode) {
    return {
      icon: Warning,
      color: '#e6a23c',
      text: '等待生成代码'
    }
  }
  
  // 根据生成历史判断代码状态
  if (codeStore.generationHistory.length > 0) {
    return {
      color: '#67c23a',
      text: '代码已生成'
    }
  }
  
  return {
    color: '#909399',
    text: '代码待生成'
  }
})
// 键盘快捷键
onMounted(() => {
  onboardingStore.initialize()
  window.addEventListener('keydown', handleKeyDown)
})

const openOnboarding = () => {
  onboardingStore.open()
}

const handleKeyDown = (e: KeyboardEvent) => {
  // F1 显示帮助
  if (e.key === 'F1') {
    e.preventDefault()
    ElMessage.info('帮助文档开发中...')
  }
}
</script>

<style scoped lang="scss">
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color);
  
  .app-header {
    height: var(--header-height);
    background: #f5f5f5;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    flex-shrink: 0;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .logo {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .logo-text {
          font-size: 18px;
          font-weight: 600;
          color: #303133;

          /* 渐变文字的标准三件套 */
          background: linear-gradient(135deg, #409eff, #67c23a);
          -webkit-background-clip: text;   /* 核心：裁剪背景到文字形状 */
          background-clip: text;
          -webkit-text-fill-color: transparent; /* 让文字透明，只显示背景渐变 */
        }
      }
      
      :deep(.el-divider) {
        height: 20px;
        margin: 0;
      }
      
      :deep(.el-breadcrumb) {
        .el-breadcrumb__item {
          &:last-child {
            .el-breadcrumb__inner {
              color: #409eff;
              font-weight: 500;
            }
          }
        }
      }
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      
      :deep(.el-divider) {
        height: 20px;
        margin: 0 12px;
      }
    }
  }
  
  .app-main {
    flex: 1;
    display: flex;
    overflow: hidden;
    
    .main-canvas {
      flex: 1;
      overflow: hidden;
    }
  }
  
  .app-footer {
    height: 28px;
    background: #f5f5f5;
    border-top: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    font-size: 12px;
    color: #909399;
    flex-shrink: 0;
    
    .footer-left,
    .footer-center,
    .footer-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }
}
// 添加代码状态样式
.code-status {
  &.ready {
    color: #67c23a;
  }
  
  &.generating {
    color: #e6a23c;
  }
  
  &.error {
    color: #f56c6c;
  }
}
</style>
