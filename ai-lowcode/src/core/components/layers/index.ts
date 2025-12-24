// src/core/components/layers/index.ts
import type { ComponentDefinition } from '../base'

// 导入各个层组件
import { BASIC_LAYERS } from './basic'
import { CONV_LAYERS } from './convolutional'
import { POOLING_LAYERS } from './pooling'
import { NORMALIZATION_LAYERS } from './normalization'
import { RECURRENT_LAYERS } from './recurrent'
import { ATTENTION_LAYERS } from './attention'

// 导出所有层组件
export {
  BASIC_LAYERS,
  CONV_LAYERS,
  POOLING_LAYERS,
  NORMALIZATION_LAYERS,
  RECURRENT_LAYERS,
  ATTENTION_LAYERS
}

// 所有层组件的数组
export const ALL_LAYERS = [
  ...BASIC_LAYERS,
  ...CONV_LAYERS,
  ...POOLING_LAYERS,
  ...NORMALIZATION_LAYERS,
  ...RECURRENT_LAYERS,
  ...ATTENTION_LAYERS
]

// 按类型获取层组件
export const getLayersByType = (type: string): ComponentDefinition[] => {
  const typeMap: Record<string, ComponentDefinition[]> = {
    'basic': BASIC_LAYERS,
    'conv': CONV_LAYERS,
    'pooling': POOLING_LAYERS,
    'normalization': NORMALIZATION_LAYERS,
    'recurrent': RECURRENT_LAYERS,
    'attention': ATTENTION_LAYERS
  }
  return typeMap[type] || []
}