// src/core/components/categories.ts
import type { ComponentDefinition } from './base'
import type { CanvasNode } from '../../types/node'

export interface ComponentCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  order: number
  family: 'dl' | 'rl'
}

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  {
    id: 'basic_layers',
    name: '基础层',
    description: '线性层、展平层等基础神经网络层',
    icon: 'Grid',
    color: '#409eff',
    order: 1,
    family: 'dl'
  },
  {
    id: 'conv_layers',
    name: '卷积层',
    description: '一维、二维、三维卷积层',
    icon: 'Picture',
    color: '#67c23a',
    order: 2,
    family: 'dl'
  },
  {
    id: 'pooling_layers',
    name: '池化层',
    description: '最大池化、平均池化等池化层',
    icon: 'FullScreen',
    color: '#e6a23c',
    order: 3,
    family: 'dl'
  },
  {
    id: 'normalization_layers',
    name: '归一化层',
    description: '批归一化、层归一化等归一化层',
    icon: 'Operation',
    color: '#f56c6c',
    order: 4,
    family: 'dl'
  },
  {
    id: 'recurrent_layers',
    name: '循环层',
    description: 'LSTM、GRU等循环神经网络层',
    icon: 'Connection',
    color: '#909399',
    order: 5,
    family: 'dl'
  },
  {
    id: 'attention_layers',
    name: '注意力层',
    description: '多头注意力等注意力机制层',
    icon: 'Aim',
    color: '#8e44ad',
    order: 6,
    family: 'dl'
  },
  {
    id: 'activations',
    name: '激活函数',
    description: 'ReLU、Sigmoid、Tanh等激活函数',
    icon: 'Histogram',
    color: '#16a085',
    order: 7,
    family: 'dl'
  },
  {
    id: 'utilities',
    name: '工具层',
    description: 'Dropout、重塑、拼接等工具层',
    icon: 'MagicStick',
    color: '#3498db',
    order: 8,
    family: 'dl'
  },
  {
    id: 'models',
    name: '深度学习模型',
    description: 'ResNet、VGG等深度学习模型',
    icon: 'Tickets',
    color: '#f39c12',
    order: 9,
    family: 'dl'
  },
  {
    id: 'rl_components',
    name: '强化学习组件',
    description: '状态输入、策略网络、值网络、动作输出等可组合组件',
    icon: 'Grid',
    color: '#e74c3c',
    order: 10,
    family: 'rl'
  },
  {
    id: 'rl_agents',
    name: '强化学习智能体',
    description: 'PPO 等可组合智能体训练循环',
    icon: 'Trophy',
    color: '#f39c12',
    order: 11,
    family: 'rl'
  },
  {
    id: 'rl_models',
    name: '强化学习模型',
    description: 'PPO、QMIX 等完整强化学习模型',
    icon: 'Aim',
    color: '#c0392b',
    order: 12,
    family: 'rl'
  }
]

// 获取分类信息
export const getCategoryInfo = (categoryId: string): ComponentCategory | undefined => {
  return COMPONENT_CATEGORIES.find(cat => cat.id === categoryId)
}

// 获取分类图标
export const getCategoryIcon = (categoryId: string): string => {
  return getCategoryInfo(categoryId)?.icon || 'Grid'
}

// 获取分类颜色
export const getCategoryColor = (categoryId: string): string => {
  return getCategoryInfo(categoryId)?.color || '#409eff'
}

// 深度学习分类ID列表
export const DL_CATEGORIES = COMPONENT_CATEGORIES
  .filter(cat => cat.family === 'dl')
  .map(cat => cat.id)

// 强化学习分类ID列表（隐藏“强化学习智能体”分类）
export const RL_CATEGORIES = COMPONENT_CATEGORIES
  .filter(cat => cat.family === 'rl' && cat.id !== 'rl_agents')
  .map(cat => cat.id)

// 根据分类ID获取所属阵营
export const getCategoryFamily = (categoryId: string): 'dl' | 'rl' | null => {
  // 兼容旧数据：旧的 reinforcement_learning 统一归为 rl
  if (categoryId === 'reinforcement_learning') return 'rl'
  return getCategoryInfo(categoryId)?.family || null
}

// 获取节点所属阵营（优先读取组件元数据，回退到分类推导，未知时默认归为深度学习）
export const getNodeFamily = (node: CanvasNode): 'dl' | 'rl' => {
  return node.metadata?.family || getCategoryFamily(node.category) || 'dl'
}