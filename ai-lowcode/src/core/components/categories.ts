// src/core/components/categories.ts
import type { ComponentDefinition } from './base'

export interface ComponentCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  order: number
}

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  {
    id: 'basic_layers',
    name: '基础层',
    description: '线性层、展平层等基础神经网络层',
    icon: 'Grid',
    color: '#409eff',
    order: 1
  },
  {
    id: 'conv_layers',
    name: '卷积层',
    description: '一维、二维、三维卷积层',
    icon: 'Picture',
    color: '#67c23a',
    order: 2
  },
  {
    id: 'pooling_layers',
    name: '池化层',
    description: '最大池化、平均池化等池化层',
    icon: 'FullScreen',
    color: '#e6a23c',
    order: 3
  },
  {
    id: 'normalization_layers',
    name: '归一化层',
    description: '批归一化、层归一化等归一化层',
    icon: 'Operation',
    color: '#f56c6c',
    order: 4
  },
  {
    id: 'recurrent_layers',
    name: '循环层',
    description: 'LSTM、GRU等循环神经网络层',
    icon: 'Connection',
    color: '#909399',
    order: 5
  },
  {
    id: 'attention_layers',
    name: '注意力层',
    description: '多头注意力等注意力机制层',
    icon: 'Aim',
    color: '#8e44ad',
    order: 6
  },
  {
    id: 'activations',
    name: '激活函数',
    description: 'ReLU、Sigmoid、Tanh等激活函数',
    icon: 'Histogram',
    color: '#16a085',
    order: 7
  },
  {
    id: 'models',
    name: '预训练模型',
    description: 'ResNet、VGG等预训练模型',
    icon: 'Tickets',
    color: '#f39c12',
    order: 8
  },
  {
    id: 'utilities',
    name: '工具层',
    description: 'Dropout、重塑、拼接等工具层',
    icon: 'MagicStick',
    color: '#3498db',
    order: 9
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