// src/core/components/layers/normalization.ts
import { ComponentBuilder } from '../builder'
import type { ComponentDefinition } from '../../../types/node'

export const NORMALIZATION_LAYERS: ComponentDefinition[] = [
  ComponentBuilder.createComponent(
    'batchnorm1d',
    '一维批归一化',
    '1D batch normalization',
    'Operation',
    'layer',
    'normalization_layers',
    [
      { key: 'num_features', label: '特征数', type: 'number', value: 64, min: 1, max: 4096, step: 1 },
      { key: 'eps', label: 'eps值', type: 'number', value: 1e-5, min: 1e-8, max: 1e-1, step: 1e-8 },
      { key: 'momentum', label: '动量', type: 'number', value: 0.1, min: 0, max: 1, step: 0.01 },
      { key: 'affine', label: '可学习参数', type: 'boolean', value: true },
      { key: 'track_running_stats', label: '跟踪统计', type: 'boolean', value: true }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 64, 128] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 64, 128] }],
    { layerType: 'batchnorm1d' }
  ),

  ComponentBuilder.createComponent(
    'batchnorm2d',
    '二维批归一化',
    '2D batch normalization',
    'Picture',
    'layer',
    'normalization_layers',
    [
      { key: 'num_features', label: '特征数', type: 'number', value: 64, min: 1, max: 4096, step: 1 },
      { key: 'eps', label: 'eps值', type: 'number', value: 1e-5, min: 1e-8, max: 1e-1, step: 1e-8 },
      { key: 'momentum', label: '动量', type: 'number', value: 0.1, min: 0, max: 1, step: 0.01 },
      { key: 'affine', label: '可学习参数', type: 'boolean', value: true },
      { key: 'track_running_stats', label: '跟踪统计', type: 'boolean', value: true }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 64, 32, 32] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 64, 32, 32] }],
    { layerType: 'batchnorm2d' }
  ),

  ComponentBuilder.createComponent(
    'layernorm',
    '层归一化',
    'Layer normalization',
    'ScaleToOriginal',
    'layer',
    'normalization_layers',
    [
      { key: 'normalized_shape', label: '归一化形状', type: 'number', value: 512, min: 1, max: 65536, step: 1 },
      { key: 'eps', label: 'eps值', type: 'number', value: 1e-5, min: 1e-8, max: 1e-1, step: 1e-8 },
      { key: 'elementwise_affine', label: '逐元素仿射', type: 'boolean', value: true }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 32, 512] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 32, 512] }],
    { layerType: 'layernorm' }
  ),

  ComponentBuilder.createComponent(
    'instancenorm2d',
    '实例归一化',
    '2D instance normalization',
    'Picture',
    'layer',
    'normalization_layers',
    [
      { key: 'num_features', label: '特征数', type: 'number', value: 64, min: 1, max: 1024, step: 1 },
      { key: 'eps', label: 'eps值', type: 'number', value: 1e-5, min: 1e-8, max: 1e-1, step: 1e-8 },
      { key: 'momentum', label: '动量', type: 'number', value: 0.1, min: 0, max: 1, step: 0.01 },
      { key: 'affine', label: '可学习参数', type: 'boolean', value: true },
      { key: 'track_running_stats', label: '跟踪统计', type: 'boolean', value: true }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 64, 32, 32] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 64, 32, 32] }],
    { layerType: 'instancenorm2d' }
  ),

  ComponentBuilder.createComponent(
    'groupnorm',
    '组归一化',
    'Group normalization',
    'Grid',
    'layer',
    'normalization_layers',
    [
      { key: 'num_groups', label: '组数', type: 'number', value: 32, min: 1, max: 1024, step: 1 },
      { key: 'num_channels', label: '通道数', type: 'number', value: 64, min: 1, max: 4096, step: 1 },
      { key: 'eps', label: 'eps值', type: 'number', value: 1e-5, min: 1e-8, max: 1e-1, step: 1e-8 },
      { key: 'affine', label: '可学习参数', type: 'boolean', value: true }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 64, 32, 32] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 64, 32, 32] }],
    { layerType: 'groupnorm' }
  )
]