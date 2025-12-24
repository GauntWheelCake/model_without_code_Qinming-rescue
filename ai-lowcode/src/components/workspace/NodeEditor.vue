<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="`编辑 ${currentNode?.name}`"
    width="600px"
    destroy-on-close
    @close="handleClose"
  >
    <div v-if="currentNode" class="node-editor">
      <!-- 基本信息 -->
      <div class="section">
        <h4 class="section-title">基本信息</h4>
        <el-form label-width="120px">
          <el-form-item label="节点名称">
            <el-input v-model="currentNode.name" placeholder="请输入节点名称" />
          </el-form-item>
          <el-form-item label="节点描述">
            <el-input
              v-model="currentNode.description"
              type="textarea"
              :rows="2"
              placeholder="请输入节点描述"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 参数配置 -->
      <div class="section">
        <h4 class="section-title">参数配置</h4>
        <div v-if="currentNode.params.length === 0" class="no-params">
          <el-icon><InfoFilled /></el-icon>
          <span>该组件没有可配置的参数</span>
        </div>
        
        <el-form v-else label-width="120px">
          <el-form-item
            v-for="param in currentNode.params"
            :key="param.key"
            :label="param.label"
          >
            <!-- 数字输入 -->
            <el-input-number
              v-if="param.type === 'number'"
              v-model="param.value"
              :min="param.min"
              :max="param.max"
              :step="param.step || 1"
              :placeholder="param.placeholder"
              controls-position="right"
              style="width: 100%"
            />
            
            <!-- 滑动条输入 -->
            <div v-else-if="param.type === 'range'" class="range-input">
              <el-slider
                v-model="param.value"
                :min="param.min"
                :max="param.max"
                :step="param.step || 0.01"
                :show-tooltip="true"
                style="flex: 1"
              />
              <div class="slider-value">
                {{ param.value.toFixed(2) }}
              </div>
            </div>
            
            <!-- 文本输入 -->
            <el-input
              v-else-if="param.type === 'string'"
              v-model="param.value"
              :placeholder="param.placeholder"
            />
            
            <!-- 开关 -->
            <el-switch
              v-else-if="param.type === 'boolean'"
              v-model="param.value"
              active-text="开启"
              inactive-text="关闭"
            />
            
            <!-- 下拉选择 -->
            <el-select
              v-else-if="param.type === 'select'"
              v-model="param.value"
              style="width: 100%"
            >
              <el-option
                v-for="option in param.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            
            <!-- 参数说明 -->
            <div v-if="getParamDescription(param)" class="param-description">
              <el-icon size="14"><InfoFilled /></el-icon>
              <span>{{ getParamDescription(param) }}</span>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 预览 -->
      <div class="section">
        <h4 class="section-title">参数预览</h4>
        <div class="code-preview">
          <pre>{{ getParamPreview() }}</pre>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import type { CanvasNode, NodeParam } from '../../types/node'

interface Props {
  node: CanvasNode | null
  modelValue: boolean  // 改为 modelValue
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]  // 改为 update:modelValue
  'save': [node: CanvasNode]
}>()

const currentNode = ref<CanvasNode | null>(null)

// 监听节点变化，深拷贝避免直接修改原对象
watch(() => props.node, (newNode) => {
  if (newNode) {
    currentNode.value = JSON.parse(JSON.stringify(newNode))
  } else {
    currentNode.value = null
  }
}, { immediate: true })

// 获取参数描述
const getParamDescription = (param: NodeParam): string => {
  const descriptions: Record<string, Record<string, string>> = {
    'linear': {
      'in_features': '输入特征的数量',
      'out_features': '输出特征的数量',
      'bias': '是否添加偏置项'
    },
    'conv2d': {
      'in_channels': '输入图像的通道数',
      'out_channels': '卷积产生的通道数',
      'kernel_size': '卷积核的大小',
      'stride': '卷积步长',
      'padding': '输入数据边界填充方式',
      'bias': '是否添加偏置项'
    },
    'dropout': {
      'p': '元素被丢弃的概率',
      'inplace': '是否原地执行操作'
    },
    'lstm': {
      'input_size': '输入特征的维度',
      'hidden_size': '隐藏状态的维度',
      'num_layers': 'LSTM堆叠的层数',
      'batch_first': '输入输出是否以批次为第一维度',
      'bidirectional': '是否使用双向LSTM'
    },
    'relu': {
      'inplace': '是否原地执行操作'
    }
  }
  
  const nodeType = currentNode.value?.id || ''
  return descriptions[nodeType]?.[param.key] || ''
}

// 获取参数预览
const getParamPreview = (): string => {
  if (!currentNode.value) return ''
  
  const params = currentNode.value.params
  const paramStrings = params.map(param => {
    let valueStr = param.value
    
    if (param.type === 'string') {
      valueStr = `"${valueStr}"`
    } else if (param.type === 'boolean') {
      valueStr = valueStr ? 'True' : 'False'
    }
    
    return `  ${param.key}=${valueStr}`
  })
  
  return `${currentNode.value.name}(\n${paramStrings.join(',\n')}\n)`
}

// 关闭对话框
const handleClose = () => {
  emit('update:modelValue', false)
}

// 保存修改
const handleSave = () => {
  if (currentNode.value) {
    emit('save', currentNode.value)
    emit('update:modelValue', false)
  }
}
</script>

<style scoped lang="scss">
/* 样式保持不变 */
.node-editor {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 10px;
  
  .section {
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .section-title {
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e4e7ed;
      color: #303133;
      font-size: 16px;
      font-weight: 600;
    }
  }
  
  .no-params {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 4px;
    color: #909399;
    
    .el-icon {
      margin-right: 8px;
    }
  }
  
  .range-input {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .slider-value {
      min-width: 60px;
      text-align: center;
      padding: 4px 8px;
      background: #f5f7fa;
      border-radius: 4px;
      font-family: monospace;
      font-size: 14px;
    }
  }
  
  .param-description {
    margin-top: 8px;
    padding: 8px 12px;
    background: #f0f9ff;
    border-radius: 4px;
    color: #409eff;
    font-size: 12px;
    
    .el-icon {
      margin-right: 4px;
      vertical-align: middle;
    }
    
    span {
      vertical-align: middle;
    }
  }
  
  .code-preview {
    padding: 12px;
    background: #1e1e1e;
    border-radius: 4px;
    overflow-x: auto;
    
    pre {
      margin: 0;
      color: #d4d4d4;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>