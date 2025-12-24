<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-left">
        <div class="logo">
          <el-icon :size="24" color="#409eff"><MagicStick /></el-icon>
          <span class="logo-text">AI 低代码平台</span>
        </div>
        <el-divider direction="vertical" />
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>工作区</el-breadcrumb-item>
          <el-breadcrumb-item>模型构建</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      
      <div class="header-center">
        <div class="project-info">
          <el-input 
            v-model="projectName" 
            placeholder="项目名称" 
            size="small" 
            style="width: 200px"
          >
            <template #prefix>
              <el-icon><Edit /></el-icon>
            </template>
          </el-input>
          <el-tooltip content="自动保存" placement="bottom">
            <el-switch
              v-model="autoSave"
              size="small"
              style="margin-left: 12px"
            />
          </el-tooltip>
        </div>
      </div>
      
      <div class="header-right">
        <!-- <el-button-group>
          <el-tooltip content="新建项目" placement="bottom">
            <el-button size="small" @click="handleNewProject">
              <el-icon><DocumentAdd /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="打开项目" placement="bottom">
            <el-button size="small" @click="handleOpenProject">
              <el-icon><FolderOpened /></el-icon>
            </el-button>
          </el-tooltip> -->
          <!-- 添加代码生成相关按钮 -->
          <!-- <el-tooltip content="生成代码" placement="bottom">
            <el-button 
              size="small" 
              type="primary"
              @click="generateCode"
              :disabled="!hasNodes"
            >
              <el-icon><MagicStick /></el-icon>
              生成代码
            </el-button>
          </el-tooltip>
          <el-tooltip content="保存项目" placement="bottom">
            <el-button size="small" @click="handleSaveProject">
              <el-icon><Document /></el-icon>
            </el-button>
          </el-tooltip>
        </el-button-group> -->
        
        <!-- <el-divider direction="vertical" style="margin: 0 12px" /> -->
        
        <!-- <el-button-group>
          <el-tooltip content="撤销" placement="bottom">
            <el-button size="small" :disabled="!canUndo" @click="handleUndo">
              <el-icon><RefreshLeft /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="重做" placement="bottom">
            <el-button size="small" :disabled="!canRedo" @click="handleRedo">
              <el-icon><RefreshRight /></el-icon>
            </el-button>
          </el-tooltip>
        </el-button-group> -->
        
        <!-- <el-divider direction="vertical" style="margin: 0 12px" /> -->
        
        <!-- <el-button-group>
          <el-button type="primary" size="small" @click="handlePreview">
            <el-icon><View /></el-icon>
            预览
          </el-button>
          <el-button type="success" size="small" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-button-group> -->
        
        <!-- <el-divider direction="vertical" style="margin: 0 12px" /> -->
        
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
        :min-width="200"
        :max-width="500"
        resizable-edge="right"
      >
        <Toolbox />
      </ResizablePanel>
      
      <!-- 中间画布 -->
      <div class="main-canvas">
        <WorkspaceCanvas />
      </div>
      
      <!-- 右侧代码预览 -->
      <ResizablePanel 
        v-if="uiStore.isRightPanelVisible"
        v-model="rightPanelWidth" 
        :min-width="320"
        :max-width="800"
        resizable-edge="left"
      >
        <CodePreview />
      </ResizablePanel>
    </main>
    
    <!-- 底部状态栏 -->
    <footer class="app-footer">
      <div class="footer-left">
        <el-icon :size="14" :color="codeStatus.color"><component :is="codeStatus.icon" /></el-icon>
        <span>{{ codeStatus.text }}</span>
      </div>
      <div class="footer-center">
        <span>版本: v1.0.0 | 代码生成: {{ codeStore.generationHistory.length }}次</span>
      </div>
      <div class="footer-right">
        <span v-if="codeStore.generatedCode">代码已生成 | </span>
        <span>最后保存: {{ lastSaveTime }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUIStore } from './stores/ui'
import { 
  MagicStick, 
  Edit, 
  View, 
  Download,
  ArrowRight,
  ArrowLeft,
  DocumentAdd,
  FolderOpened,
  Document,
  RefreshLeft,
  RefreshRight,
  Check,
  Warning,
  Close
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import ResizablePanel from './components/common/ResizablePanel.vue'
import Toolbox from './components/workspace/Toolbox.vue'
import WorkspaceCanvas from './components/workspace/WorkspaceCanvas.vue'
import CodePreview from './components/workspace/CodePreview.vue'

const projectName = ref('我的AI模型项目')
const autoSave = ref(true)
const canUndo = ref(false)
const canRedo = ref(false)
const lastSaveTime = ref('从未保存')
const workspaceCanvasRef = ref()

const uiStore = useUIStore()
//const { isRightPanelVisible, toggleRightPanel } = uiStore
const leftPanelWidth = ref(300)
const rightPanelWidth = ref(480)
import { useCodeStore } from './stores/code'
const codeStore = useCodeStore()
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
// 连接状态
const connectionStatus = computed(() => {
  return {
    icon: Check,
    color: '#67c23a',
    text: '已连接'
  }
})

// 处理新建项目
const handleNewProject = () => {
  if (confirm('确定要新建项目吗？未保存的更改将会丢失。')) {
    projectName.value = '新的AI模型项目'
    ElMessage.success('已创建新项目')
  }
}

// 处理打开项目
const handleOpenProject = () => {
  ElMessage.info('打开项目功能开发中...')
}

// 处理保存项目
const handleSaveProject = () => {
  ElMessage.success('项目保存成功')
  lastSaveTime.value = new Date().toLocaleTimeString()
}

// 处理撤销
const handleUndo = () => {
  ElMessage.info('撤销功能开发中...')
}

// 处理重做
const handleRedo = () => {
  ElMessage.info('重做功能开发中...')
}

// 处理预览
const handlePreview = () => {
  ElMessage.info('模型预览功能开发中...')
}

// 处理导出
const handleExport = () => {
  ElMessage.info('模型导出功能开发中...')
}

// 键盘快捷键
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

const handleKeyDown = (e: KeyboardEvent) => {
  // Ctrl+S 保存
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    handleSaveProject()
  }
  
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
    background: #ffffff;
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
    
    .header-center {
      flex: 1;
      max-width: 400px;
      margin: 0 20px;
      display: flex;
      align-items: center;
      
      .project-info {
        display: flex;
        align-items: center;
        width: 100%;
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
    background: #ffffff;
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