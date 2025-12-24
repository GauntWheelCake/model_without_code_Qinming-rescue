// src/core/components/activations/advanced.ts
import { ComponentBuilder } from '../builder'
import type { ComponentDefinition } from '../../../types/node'

export const ADVANCED_ACTIVATIONS: ComponentDefinition[] = [
  ComponentBuilder.createComponent(
    'leaky_relu',
    'Leaky ReLU',
    '带泄漏的ReLU激活函数',
    'Histogram',
    'activation',
    'activations',
    [
      { key: 'negative_slope', label: '负斜率', type: 'number', value: 0.01, min: 0, max: 1, step: 0.01 }
    ],
    [{ name: 'input', dataType: 'tensor' }],
    [{ name: 'output', dataType: 'tensor' }],
    { layerType: 'leaky_relu' }
  ),

  ComponentBuilder.createComponent(
    'elu',
    'ELU',
    '指数线性单元激活函数',
    'TrendCharts',
    'activation',
    'activations',
    [
      { key: 'alpha', label: 'alpha值', type: 'number', value: 1.0, min: 0.1, max: 10, step: 0.1 },
      { key: 'inplace', label: '原地操作', type: 'boolean', value: false }
    ],
    [{ name: 'input', dataType: 'tensor' }],
    [{ name: 'output', dataType: 'tensor' }],
    { layerType: 'elu' }
  ),

  ComponentBuilder.createComponent(
    'selu',
    'SELU',
    '缩放指数线性单元激活函数',
    'TrendCharts',
    'activation',
    'activations',
    [
      { key: 'inplace', label: '原地操作', type: 'boolean', value: false }
    ],
    [{ name: 'input', dataType: 'tensor' }],
    [{ name: 'output', dataType: 'tensor' }],
    { layerType: 'selu' }
  ),

  ComponentBuilder.createComponent(
    'prelu',
    'PReLU',
    '参数化ReLU激活函数',
    'Histogram',
    'activation',
    'activations',
    [
      { key: 'num_parameters', label: '参数数量', type: 'number', value: 1, min: 1, max: 100, step: 1 },
      { key: 'init', label: '初始值', type: 'number', value: 0.25, min: 0, max: 1, step: 0.01 }
    ],
    [{ name: 'input', dataType: 'tensor' }],
    [{ name: 'output', dataType: 'tensor' }],
    { layerType: 'prelu' }
  ),

  ComponentBuilder.createComponent(
    'mish',
    'Mish',
    'Mish激活函数',
    'TrendCharts',
    'activation',
    'activations',
    [],
    [{ name: 'input', dataType: 'tensor' }],
    [{ name: 'output', dataType: 'tensor' }],
    { layerType: 'mish' }
  ),

  ComponentBuilder.createComponent(
    'swish',
    'Swish',
    'Swish激活函数',
    'TrendCharts',
    'activation',
    'activations',
    [
      { key: 'beta', label: 'beta值', type: 'number', value: 1.0, min: 0.1, max: 10, step: 0.1 }
    ],
    [{ name: 'input', dataType: 'tensor' }],
    [{ name: 'output', dataType: 'tensor' }],
    { layerType: 'swish' }
  )
]