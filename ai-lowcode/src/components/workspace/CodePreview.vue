<template>
  <div class="code-preview">
    <div class="code-header">
      <div class="header-top">
        <h3>
          <el-icon><Document /></el-icon>
          {{ codeStore.currentTabTitle }}
        </h3>
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-tooltip content="复制代码" placement="bottom">
            <el-button type="text" size="small" @click="handleCopyCode">
              <el-icon><DocumentCopy /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="下载当前文件" placement="bottom">
            <el-button type="text" size="small" @click="handleDownloadCode">
              <el-icon><Download /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="下载完整项目" placement="bottom">
            <el-button type="text" size="small" @click="handleDownloadProject">
              <el-icon><Folder /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="刷新代码" placement="bottom">
            <el-button 
              type="text" 
              size="small" 
              @click="handleRefreshCode"
              :disabled="!hasNodes"
            >
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
      
      <!-- 代码选项卡 - 段式导航 -->
      <div class="code-tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-item"
          :class="{ 'active': codeStore.activeTab === tab.id }"
          @click="codeStore.setActiveTab(tab.id)"
        >
          <el-icon v-if="tab.icon">
            <component :is="tab.icon" />
          </el-icon>
          <span class="tab-label">{{ tab.label }}</span>
        </div>
      </div>
    </div>
    
    <div class="code-content">
      <!-- 空状态 -->
      <div v-if="!codeStore.generatedCode" class="empty-state">
        <div class="empty-icon">
          <el-icon :size="48" color="#c0c4cc"><MagicStick /></el-icon>
        </div>
        <h4>暂无生成的代码</h4>
        <p>从左侧拖拽组件到画布构建模型，代码将自动生成</p>
        <el-button 
          type="primary" 
          size="small" 
          @click="emit('generate')"
          :disabled="!hasNodes"
        >
          <el-icon><MagicStick /></el-icon>
          生成代码
        </el-button>
      </div>
      
      <!-- 代码编辑器 -->
      <div v-else class="code-editor-wrapper">
        <!-- 代码统计 -->
        <div class="code-stats">
          <div class="stat-item">
            <span class="stat-label">行数:</span>
            <span class="stat-value">{{ lineCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">大小:</span>
            <span class="stat-value">{{ codeSize }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最后更新:</span>
            <span class="stat-value">{{ lastGeneratedTime }}</span>
          </div>
        </div>
        
        <!-- 代码高亮区域 -->
        <div class="code-highlight-area" ref="codeRef">
          <pre><code class="language-python" v-html="highlightedCode"></code></pre>
        </div>
        
        <!-- 代码操作 -->
        <div class="code-actions">
          <el-button-group size="small">
            <el-button @click="copySelection">
              <el-icon><CopyDocument /></el-icon>
              复制选中
            </el-button>
            <el-button @click="formatCode">
              <el-icon><MagicStick /></el-icon>
              格式化
            </el-button>
            <el-button @click="exportAsNotebook">
              <el-icon><Notebook /></el-icon>
              导出为笔记本
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>
    
    <!-- 代码帮助面板 -->
    <el-collapse-transition>
      <div v-if="showHelpPanel" class="help-panel">
        <div class="help-header">
          <h4><el-icon><QuestionFilled /></el-icon> 代码说明</h4>
          <el-button type="text" size="small" @click="showHelpPanel = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <div class="help-content">
          <div v-if="codeStore.activeTab === 'model'" class="help-section">
            <h5>模型定义说明</h5>
            <ul>
              <li>此代码定义了一个完整的PyTorch模型类</li>
              <li>__init__方法中定义了模型的各个层</li>
              <li>forward方法定义了数据的前向传播路径</li>
              <li>summary方法可以打印模型结构和参数统计</li>
            </ul>
          </div>
          <div v-else-if="codeStore.activeTab === 'training'" class="help-section">
            <h5>训练代码说明</h5>
            <ul>
              <li>包含完整的数据加载、模型训练和验证逻辑</li>
              <li>使用Adam优化器和交叉熵损失函数</li>
              <li>支持学习率调度和进度条显示</li>
              <li>自动保存训练历史和模型检查点</li>
            </ul>
          </div>
          <div v-else-if="codeStore.activeTab === 'inference'" class="help-section">
            <h5>推理代码说明</h5>
            <ul>
              <li>提供单张图像和批量推理功能</li>
              <li>支持加载预训练模型</li>
              <li>包含图像预处理和结果后处理</li>
              <li>输出预测结果和置信度</li>
            </ul>
          </div>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useCodeStore } from '../../stores/code'
import { ElMessage } from 'element-plus'
import { 
  Document, 
  DocumentCopy, 
  Download,
  Folder,
  Refresh,
  MagicStick,
  Notebook,
  QuestionFilled,
  Close,
  Check,
  Warning,
  Collection,
  Clock,
  Setting
} from '@element-plus/icons-vue'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
//import python from 'highlight.js/lib/languages/python'

// 注册Python语言高亮
//hljs.registerLanguage('python', python)

interface Props {
  nodesCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  nodesCount: 0
})

const emit = defineEmits<{
  'generate': []
}>()

const codeStore = useCodeStore()
const codeRef = ref<HTMLElement>()
const showHelpPanel = ref(true)

// 选项卡定义
const tabs = [
  { id: 'model', label: '模型定义', icon: 'MagicStick' },
  { id: 'training', label: '训练代码', icon: 'Collection' },
  { id: 'inference', label: '推理代码', icon: 'Download' },
  { id: 'summary', label: '模型摘要', icon: 'Document' },
  { id: 'requirements', label: '依赖项', icon: 'Setting' }
]

// 计算属性
const hasNodes = computed(() => props.nodesCount > 0)

const lineCount = computed(() => {
  if (!codeStore.currentCode) return 0
  return codeStore.currentCode.split('\n').length
})

const codeSize = computed(() => {
  if (!codeStore.currentCode) return '0 KB'
  const bytes = new Blob([codeStore.currentCode]).size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
})

const lastGeneratedTime = computed(() => {
  if (codeStore.generationHistory.length === 0) return '从未生成'
  return codeStore.generationHistory[0].replace('Generated at ', '')
})

const highlightedCode = computed(() => {
  if (!codeStore.currentCode) return ''
  
  try {
    return hljs.highlight(codeStore.currentCode, { language: 'python' }).value
  } catch (error) {
    console.error('Code highlighting failed:', error)
    return codeStore.currentCode
  }
})

// 方法
const handleCopyCode = async () => {
  if (!codeStore.currentCode) {
    ElMessage.warning('没有可复制的代码')
    return
  }
  
  const success = await codeStore.copyCode()
  if (success) {
    ElMessage.success({
      message: '代码已复制到剪贴板'
    })
  } else {
    ElMessage.error('复制失败')
  }
}

const handleDownloadCode = () => {
  if (!codeStore.currentCode) {
    ElMessage.warning('没有可下载的代码')
    return
  }
  
  const success = codeStore.downloadCode()
  if (success) {
    ElMessage.success('代码文件已下载')
  } else {
    ElMessage.error('下载失败')
  }
}

const handleDownloadProject = () => {
  if (!codeStore.generatedCode) {
    ElMessage.warning('没有可下载的项目')
    return
  }
  
  const success = codeStore.downloadFullProject()
  if (success) {
    ElMessage.success('项目文件已下载')
  } else {
    ElMessage.error('下载失败，请确保已安装JSZip库')
  }
}

const handleRefreshCode = () => {
  emit('generate')
}

const copySelection = () => {
  const selection = window.getSelection()
  if (!selection || selection.toString().length === 0) {
    ElMessage.warning('请先选择要复制的文本')
    return
  }
  
  navigator.clipboard.writeText(selection.toString())
    .then(() => {
      ElMessage.success('选中文本已复制')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
}

const formatCode = () => {
  // 这里可以添加代码格式化逻辑
  // 由于在前端格式化Python代码比较复杂，这里先提示
  ElMessage.info('代码格式化功能开发中，建议使用IDE进行格式化')
}

const exportAsNotebook = () => {
  if (!codeStore.generatedCode) {
    ElMessage.warning('没有可导出的代码')
    return
  }
  
  // 辅助函数：将代码字符串转换为 Jupyter Notebook source 格式
  // 每行代码需要单独作为数组元素，并保留换行符
  const codeToSource = (code: string): string[] => {
    if (!code) return []
    const lines = code.split('\n')
    return lines.map((line, index) => {
      // 最后一行不加换行符，其他行都加
      return index === lines.length - 1 ? line : line + '\n'
    })
  }
  
  // 辅助函数：移除模型导入语句（Notebook 中不需要导入）
  const removeModelImport = (code: string): string => {
    if (!code) return ''
    // 移除 from model import XXX 这样的导入语句
    const lines = code.split('\n')
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim()
      // 移除从 model.py 导入的语句
      return !trimmed.startsWith('from model import') && 
             !trimmed.startsWith('from .model import')
    })
    return filteredLines.join('\n')
  }
  
  // 生成Jupyter Notebook内容（标准格式）
  const notebookContent = {
    cells: [
      // 标题和说明
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '# AI Model Notebook\n',
          '\n',
          '**此 Notebook 由 AI 低代码平台自动生成**\n',
          '\n',
          `生成时间：${new Date().toLocaleString()}\n`,
          '\n',
          '---'
        ]
      },
      
      // 模型定义说明
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## 1. 模型定义\n',
          '\n',
          '以下是完整的 PyTorch 模型类定义：'
        ]
      },
      
      // 模型代码
      {
        cell_type: 'code',
        metadata: {},
        source: codeToSource(codeStore.generatedCode.modelCode),
        execution_count: null,
        outputs: []
      },
      
      // 训练代码说明
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## 2. 训练代码\n',
          '\n',
          '以下是完整的模型训练脚本，包括：\n',
          '- 数据加载\n',
          '- 模型训练循环\n',
          '- 验证逻辑\n',
          '- 模型保存'
        ]
      },
      
      // 训练代码（移除模型导入语句）
      {
        cell_type: 'code',
        metadata: {},
        source: codeToSource(removeModelImport(codeStore.generatedCode.trainingCode)),
        execution_count: null,
        outputs: []
      },
      
      // 推理代码说明
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## 3. 推理代码\n',
          '\n',
          '以下是模型推理脚本，用于加载训练好的模型并进行预测：'
        ]
      },
      
      // 推理代码（移除模型导入语句）
      {
        cell_type: 'code',
        metadata: {},
        source: codeToSource(removeModelImport(codeStore.generatedCode.inferenceCode)),
        execution_count: null,
        outputs: []
      },
      
      // 模型摘要说明
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## 4. 模型摘要\n',
          '\n',
          '以下是模型结构的详细信息：'
        ]
      },
      
      // 模型摘要（作为代码块显示）
      {
        cell_type: 'code',
        metadata: {},
        source: codeToSource('# 模型摘要\n' + codeStore.generatedCode.modelSummary),
        execution_count: null,
        outputs: []
      },
      
      // 依赖项说明
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## 5. 依赖项\n',
          '\n',
          '运行此项目需要安装以下 Python 包：'
        ]
      },
      
      // 依赖项安装命令
      {
        cell_type: 'code',
        metadata: {},
        source: codeToSource('# 安装依赖项\n!pip install ' + codeStore.generatedCode.requirements.join(' ')),
        execution_count: null,
        outputs: []
      }
    ],
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3'
      },
      language_info: {
        name: 'python',
        version: '3.8.0',
        mimetype: 'text/x-python',
        codemirror_mode: {
          name: 'ipython',
          version: 3
        },
        pygments_lexer: 'ipython3',
        nbconvert_exporter: 'python',
        file_extension: '.py'
      }
    },
    nbformat: 4,
    nbformat_minor: 4
  }
  
  // 下载Notebook文件
  const blob = new Blob([JSON.stringify(notebookContent, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ai_model_notebook.ipynb'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('Notebook 文件已生成，可在 Jupyter/Colab 中打开')
}

// 监听代码变化，重新高亮
watch(() => codeStore.currentCode, () => {
  nextTick(() => {
    if (codeRef.value) {
      const codeBlocks = codeRef.value.querySelectorAll('pre code')
      codeBlocks.forEach((block) => {
        hljs.highlightElement(block as HTMLElement)
      })
    }
  })
})

// 初始化
onMounted(() => {
  // 如果有已生成的代码，应用高亮
  if (codeStore.currentCode && codeRef.value) {
    nextTick(() => {
      const codeBlocks = codeRef.value.querySelectorAll('pre code')
      codeBlocks.forEach((block) => {
        hljs.highlightElement(block as HTMLElement)
      })
    })
  }
})
</script>

<style scoped lang="scss">
.code-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-left: 1px solid var(--border-color);
  
  .code-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: #303133;
      font-size: 15px;
      font-weight: 600;
      
      .el-icon {
        color: #409eff;
      }
    }
    
    .action-buttons {
      display: flex;
      gap: 2px;
      
      .el-button {
        color: #909399;
        padding: 4px 8px;
        
        &:hover {
          color: #409eff;
        }
        
        &:disabled {
          color: #c0c4cc;
          cursor: not-allowed;
        }
      }
    }
    
    .code-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      
      .tab-item {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        font-size: 12px;
        color: #606266;
        background: #f5f7fa;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        
        .el-icon {
          font-size: 13px;
          color: #909399;
        }
        
        .tab-label {
          white-space: nowrap;
        }
        
        &:hover {
          background: #e8f4ff;
          color: #409eff;
          
          .el-icon {
            color: #409eff;
          }
        }
        
        &.active {
          background: #409eff;
          color: white;
          border-color: #409eff;
          box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
          
          .el-icon {
            color: white;
          }
        }
      }
    }
  }
  
  .code-content {
    flex: 1;
    overflow: hidden;
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 40px;
      color: #606266;
      text-align: center;
      
      .empty-icon {
        margin-bottom: 16px;
      }
      
      h4 {
        margin: 0 0 8px;
        font-size: 16px;
        font-weight: 500;
        color: #303133;
      }
      
      p {
        margin: 0 0 20px;
        font-size: 14px;
        color: #909399;
      }
    }
    
    .code-editor-wrapper {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .code-stats {
      display: flex;
      gap: 16px;
      padding: 8px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e4e7ed;
      font-size: 12px;
      
      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        
        .stat-label {
          color: #909399;
        }
        
        .stat-value {
          color: #303133;
          font-weight: 500;
        }
      }
    }
    
    .code-highlight-area {
      flex: 1;
      overflow: auto;
      background: #1e1e1e;
      padding: 16px;
      
      pre {
        margin: 0;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.5;
        
        code {
          color: #d4d4d4;
        }
      }
    }
    
    .code-actions {
      padding: 8px 16px;
      background: #f8f9fa;
      border-top: 1px solid #e4e7ed;
      display: flex;
      justify-content: flex-end;
      
      .el-button-group {
        .el-button {
          font-size: 12px;
          padding: 4px 12px;
        }
      }
    }
  }
  
  .help-panel {
    border-top: 1px solid var(--border-color);
    background: #f8f9fa;
    
    .help-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      border-bottom: 1px solid #e4e7ed;
      
      h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        display: flex;
        align-items: center;
        gap: 6px;
        
        .el-icon {
          color: #409eff;
        }
      }
      
      .el-button {
        padding: 0;
        color: #909399;
      }
    }
    
    .help-content {
      padding: 12px 16px;
      font-size: 13px;
      
      .help-section {
        h5 {
          margin: 0 0 8px;
          font-size: 13px;
          font-weight: 500;
          color: #303133;
        }
        
        ul {
          margin: 0;
          padding-left: 16px;
          color: #606266;
          
          li {
            margin-bottom: 4px;
            
            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
    }
  }
}

// 代码高亮样式增强
:deep(.hljs) {
  background: transparent !important;
  
  .hljs-keyword { color: #569cd6; }
  .hljs-built_in { color: #4ec9b0; }
  .hljs-string { color: #ce9178; }
  .hljs-comment { color: #6a9955; }
  .hljs-number { color: #b5cea8; }
  .hljs-title { color: #dcdcaa; }
  .hljs-params { color: #d4d4d4; }
  .hljs-function { color: #dcdcaa; }
  .hljs-class { color: #4ec9b0; }
  .hljs-attr { color: #9cdcfe; }
  .hljs-variable { color: #9cdcfe; }
  .hljs-operator { color: #d4d4d4; }
}
</style>