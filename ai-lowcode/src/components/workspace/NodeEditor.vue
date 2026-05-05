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
        <div class="section-title-row">
          <h4 class="section-title">参数配置</h4>
          <el-button
            v-if="isReinforcementLearningNode()"
            size="small"
            plain
            @click="resetParamsToDefault"
          >
            恢复默认配置
          </el-button>
        </div>
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
              :precision="getParamPrecision(param)"
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
                :format-tooltip="() => formatParamValue(param)"
                class="range-slider"
              />
              <el-input-number
                v-model="param.value"
                :min="param.min"
                :max="param.max"
                :step="param.step || 0.01"
                :precision="getParamPrecision(param)"
                controls-position="right"
                class="range-number"
              />
              <div class="slider-value">
                {{ formatParamValue(param) }}
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

const RL_DEFAULT_PARAMS: Record<string, Record<string, any>> = {
  ppo: {
    state_dim: 4,
    action_dim: 2,
    hidden_dim: 64,
    lr_actor: 0.0003,
    lr_critic: 0.001,
    gamma: 0.99,
    clip_epsilon: 0.2,
    epochs: 10,
    continuous: false
  },
  qmix: {
    n_agents: 3,
    state_dim: 48,
    obs_dim: 16,
    action_dim: 5,
    hidden_dim: 64,
    mixing_hidden_dim: 32,
    gamma: 0.99,
    lr: 0.0005
  }
}

const getNodeType = (): string => currentNode.value?.type || currentNode.value?.id || ''

const getDefaultParamValue = (param: NodeParam): any => {
  const nodeType = getNodeType()
  if (param.defaultValue !== undefined) return param.defaultValue
  if (RL_DEFAULT_PARAMS[nodeType]?.[param.key] !== undefined) {
    return RL_DEFAULT_PARAMS[nodeType][param.key]
  }
  return param.value
}

const normalizeNodeParams = (node: CanvasNode): CanvasNode => ({
  ...node,
  params: node.params.map(param => {
    const defaultValue = getDefaultParamValueForNode(node, param)
    return {
      ...param,
      defaultValue,
      value: param.value ?? defaultValue
    }
  })
})

const getDefaultParamValueForNode = (node: CanvasNode, param: NodeParam): any => {
  const nodeType = node.type || node.id
  if (param.defaultValue !== undefined) return param.defaultValue
  if (RL_DEFAULT_PARAMS[nodeType]?.[param.key] !== undefined) {
    return RL_DEFAULT_PARAMS[nodeType][param.key]
  }
  return param.value
}

// 监听节点变化，深拷贝避免直接修改原对象
watch(() => props.node, (newNode) => {
  if (newNode) {
    currentNode.value = normalizeNodeParams(JSON.parse(JSON.stringify(newNode)))
  } else {
    currentNode.value = null
  }
}, { immediate: true })

const isReinforcementLearningNode = (): boolean => {
  const nodeType = getNodeType()
  return nodeType === 'ppo' || nodeType === 'qmix' || currentNode.value?.category === 'reinforcement_learning'
}

const getParamPrecision = (param: NodeParam): number | undefined => {
  if (param.precision !== undefined) return param.precision
  const step = Number(param.step)
  if (!Number.isFinite(step) || Number.isInteger(step)) return 0
  const decimalPart = step.toString().split('.')[1]
  return decimalPart ? decimalPart.length : 0
}

const formatParamValue = (param: NodeParam): string => {
  const value = Number(param.value)
  if (!Number.isFinite(value)) return String(param.value ?? '')
  const precision = getParamPrecision(param)
  if (precision === undefined) return String(value)
  return value.toFixed(precision)
}

const resetParamsToDefault = () => {
  if (!currentNode.value) return
  currentNode.value.params.forEach(param => {
    param.value = getDefaultParamValue(param)
  })
}

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
    },
    'ppo': {
      'state_dim': '环境状态向量的维度，例如 CartPole 默认为 4',
      'action_dim': '动作空间维度，离散动作表示动作数量，连续动作表示动作向量维度',
      'hidden_dim': 'Actor 和 Critic 网络的隐藏层宽度',
      'lr_actor': 'Actor 网络学习率，通常保持在 0.0001 到 0.001 之间',
      'lr_critic': 'Critic 网络学习率，通常可略高于 Actor 学习率',
      'gamma': '未来奖励折扣因子，常用 0.95 到 0.99',
      'clip_epsilon': 'PPO 策略裁剪范围，常用 0.1 到 0.3',
      'epochs': '每批采样数据重复更新的轮数',
      'continuous': '开启后按连续动作空间生成 Actor 输出'
    },
    'qmix': {
      'n_agents': '多智能体数量',
      'state_dim': '全局状态向量维度，用于混合网络',
      'obs_dim': '单个智能体的局部观测维度',
      'action_dim': '每个智能体可选动作数量',
      'hidden_dim': '单智能体 Q 网络隐藏层宽度',
      'mixing_hidden_dim': 'QMIX 混合网络隐藏层宽度',
      'gamma': '未来奖励折扣因子，常用 0.95 到 0.99',
      'lr': 'QMIX 优化器学习率，默认 0.0005'
    }
  }
  
  const nodeType = getNodeType()
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

    .section-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e4e7ed;

      .section-title {
        margin: 0;
        padding-bottom: 0;
        border-bottom: 0;
      }
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
    flex-wrap: wrap;
    gap: 12px;

    .range-slider {
      flex: 1 1 240px;
      min-width: 240px;
    }
    
    .range-number {
      width: 150px;
      flex: 0 0 150px;
    }

    .slider-value {
      min-width: 72px;
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
