// src/core/components/layers/pooling.ts
import { ComponentBuilder } from '../builder'
import type { ComponentDefinition } from '../../../types/node'

export const POOLING_LAYERS: ComponentDefinition[] = [
  ComponentBuilder.createComponent(
    'maxpool1d',
    '一维最大池化',
    '1D max pooling',
    'Sort',
    'layer',
    'pooling_layers',
    [
      { key: 'kernel_size', label: '池化核大小', type: 'number', value: 2, min: 2, max: 16, step: 1 },
      { key: 'stride', label: '步长', type: 'number', value: 2, min: 1, max: 8, step: 1 },
      { key: 'padding', label: '填充', type: 'number', value: 0, min: 0, max: 8, step: 1 },
      { key: 'dilation', label: '空洞率', type: 'number', value: 1, min: 1, max: 5, step: 1 },
      { key: 'ceil_mode', label: '向上取整', type: 'boolean', value: false }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 64, 128] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 64, 64] }],
    { layerType: 'maxpool1d' }
  ),

  ComponentBuilder.createComponent(
    'avgpool1d',
    '一维平均池化',
    '1D average pooling',
    'Sort',
    'layer',
    'pooling_layers',
    [
      { key: 'kernel_size', label: '池化核大小', type: 'number', value: 2, min: 2, max: 16, step: 1 },
      { key: 'stride', label: '步长', type: 'number', value: 2, min: 1, max: 8, step: 1 },
      { key: 'padding', label: '填充', type: 'number', value: 0, min: 0, max: 8, step: 1 },
      { key: 'ceil_mode', label: '向上取整', type: 'boolean', value: false }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 64, 128] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 64, 64] }],
    { layerType: 'avgpool1d' }
  ),

  ComponentBuilder.createComponent(
    'maxpool2d',
    '二维最大池化',
    '2D max pooling',
    'FullScreen',
    'layer',
    'pooling_layers',
    [
      { key: 'kernel_size', label: '池化核大小', type: 'number', value: 2, min: 2, max: 8, step: 1 },
      { key: 'stride', label: '步长', type: 'number', value: 2, min: 1, max: 4, step: 1 },
      { key: 'padding', label: '填充', type: 'number', value: 0, min: 0, max: 2, step: 1 },
      { key: 'dilation', label: '空洞率', type: 'number', value: 1, min: 1, max: 5, step: 1 },
      { key: 'ceil_mode', label: '向上取整', type: 'boolean', value: false }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 64, 32, 32] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 64, 16, 16] }],
    { layerType: 'maxpool2d' }
  ),

  ComponentBuilder.createComponent(
    'avgpool2d',
    '二维平均池化',
    '2D average pooling',
    'DataAnalysis',
    'layer',
    'pooling_layers',
    [
      { key: 'kernel_size', label: '池化核大小', type: 'number', value: 2, min: 2, max: 8, step: 1 },
      { key: 'stride', label: '步长', type: 'number', value: 2, min: 1, max: 4, step: 1 },
      { key: 'padding', label: '填充', type: 'number', value: 0, min: 0, max: 2, step: 1 },
      { key: 'ceil_mode', label: '向上取整', type: 'boolean', value: false }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 64, 32, 32] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 64, 16, 16] }],
    { layerType: 'avgpool2d' }
  ),

  ComponentBuilder.createComponent(
    'adaptive_maxpool2d',
    '自适应最大池化',
    'Adaptive 2D max pooling',
    'FullScreen',
    'layer',
    'pooling_layers',
    [
      { key: 'output_size', label: '输出尺寸', type: 'number', value: 1, min: 1, max: 100, step: 1 }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 64, 32, 32] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 64, 1, 1] }],
    { layerType: 'adaptive_maxpool2d' }
  ),

  ComponentBuilder.createComponent(
    'global_avgpool',
    '全局平均池化',
    'Global average pooling',
    'DataAnalysis',
    'layer',
    'pooling_layers',
    [],
    [{ name: 'input', dataType: 'tensor', shape: [null, 64, 32, 32] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 64, 1, 1] }],
    { layerType: 'global_avgpool' }
  )
]