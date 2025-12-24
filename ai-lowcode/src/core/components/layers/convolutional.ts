// src/core/components/layers/convolutional.ts
import { ComponentBuilder } from '../builder'
import type { ComponentDefinition } from '../../../types/node'

export const CONV_LAYERS: ComponentDefinition[] = [
  ComponentBuilder.createComponent(
    'conv1d',
    '一维卷积',
    '1D convolution for sequences',
    'TrendCharts',
    'layer',
    'conv_layers',
    [
      { key: 'in_channels', label: '输入通道', type: 'number', value: 1, min: 1, max: 1024, step: 1 },
      { key: 'out_channels', label: '输出通道', type: 'number', value: 64, min: 1, max: 1024, step: 1 },
      { key: 'kernel_size', label: '卷积核大小', type: 'number', value: 3, min: 1, max: 32, step: 1 },
      { key: 'stride', label: '步长', type: 'number', value: 1, min: 1, max: 10, step: 1 },
      { key: 'padding', label: '填充', type: 'select', value: 'valid', options: [
        { label: '有效填充', value: 'valid' },
        { label: '相同填充', value: 'same' },
        { label: '自定义填充', value: 'custom' }
      ]},
      { key: 'dilation', label: '空洞率', type: 'number', value: 1, min: 1, max: 10, step: 1 },
      { key: 'groups', label: '组数', type: 'number', value: 1, min: 1, max: 1024, step: 1 },
      { key: 'bias', label: '使用偏置', type: 'boolean', value: true }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 1, 128] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 64, 126] }],
    { layerType: 'conv1d' }
  ),

  ComponentBuilder.createComponent(
    'conv2d',
    '二维卷积',
    '2D convolution for images',
    'Picture',
    'layer',
    'conv_layers',
    [
      { key: 'in_channels', label: '输入通道', type: 'number', value: 3, min: 1, max: 1024, step: 1 },
      { key: 'out_channels', label: '输出通道', type: 'number', value: 64, min: 1, max: 1024, step: 1 },
      { key: 'kernel_size', label: '卷积核大小', type: 'number', value: 3, min: 1, max: 11, step: 2 },
      { key: 'stride', label: '步长', type: 'number', value: 1, min: 1, max: 10, step: 1 },
      { key: 'padding', label: '填充', type: 'select', value: 'same', options: [
        { label: '相同填充', value: 'same' },
        { label: '有效填充', value: 'valid' }
      ]},
      { key: 'dilation', label: '空洞率', type: 'number', value: 1, min: 1, max: 10, step: 1 },
      { key: 'groups', label: '组数', type: 'number', value: 1, min: 1, max: 1024, step: 1 },
      { key: 'bias', label: '使用偏置', type: 'boolean', value: true }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 3, 32, 32] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 64, 32, 32] }],
    { layerType: 'conv2d' },
    {
      usage: '图像或特征图的局部特征提取核心层，适合视觉任务的主干网络。',
      example: '处理 3x32x32 的图像输入，输出 64 通道特征图。',
      constraints: ['输入必须是 4D 张量 [N, C, H, W]。', 'padding 与 stride 组合需确保输出尺寸合理。'],
      compatibilityTags: ['vision', 'cnn', 'feature-extraction']
    }
  ),

  ComponentBuilder.createComponent(
    'conv3d',
    '三维卷积',
    '3D convolution for volumes',
    'Box',
    'layer',
    'conv_layers',
    [
      { key: 'in_channels', label: '输入通道', type: 'number', value: 1, min: 1, max: 512, step: 1 },
      { key: 'out_channels', label: '输出通道', type: 'number', value: 32, min: 1, max: 512, step: 1 },
      { key: 'kernel_size', label: '卷积核大小', type: 'number', value: 3, min: 1, max: 7, step: 1 },
      { key: 'stride', label: '步长', type: 'number', value: 1, min: 1, max: 5, step: 1 },
      { key: 'padding', label: '填充', type: 'number', value: 1, min: 0, max: 5, step: 1 },
      { key: 'dilation', label: '空洞率', type: 'number', value: 1, min: 1, max: 5, step: 1 },
      { key: 'bias', label: '使用偏置', type: 'boolean', value: true }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 1, 32, 32, 32] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 32, 32, 32, 32] }],
    { layerType: 'conv3d' }
  ),

  ComponentBuilder.createComponent(
    'depthwise_conv2d',
    '深度可分离卷积',
    'Depthwise separable convolution',
    'Filter',
    'layer',
    'conv_layers',
    [
      { key: 'in_channels', label: '输入通道', type: 'number', value: 32, min: 1, max: 1024, step: 1 },
      { key: 'out_channels', label: '输出通道', type: 'number', value: 64, min: 1, max: 1024, step: 1 },
      { key: 'kernel_size', label: '卷积核大小', type: 'number', value: 3, min: 1, max: 7, step: 1 },
      { key: 'stride', label: '步长', type: 'number', value: 1, min: 1, max: 4, step: 1 },
      { key: 'padding', label: '填充', type: 'number', value: 1, min: 0, max: 3, step: 1 },
      { key: 'depth_multiplier', label: '深度乘数', type: 'number', value: 1, min: 1, max: 32, step: 1 }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 32, 32, 32] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 64, 32, 32] }],
    { layerType: 'depthwise_conv2d' }
  ),

  ComponentBuilder.createComponent(
    'transposed_conv2d',
    '转置卷积',
    'Transposed convolution for upsampling',
    'SortUp',
    'layer',
    'conv_layers',
    [
      { key: 'in_channels', label: '输入通道', type: 'number', value: 64, min: 1, max: 1024, step: 1 },
      { key: 'out_channels', label: '输出通道', type: 'number', value: 32, min: 1, max: 1024, step: 1 },
      { key: 'kernel_size', label: '卷积核大小', type: 'number', value: 4, min: 1, max: 11, step: 1 },
      { key: 'stride', label: '步长', type: 'number', value: 2, min: 1, max: 4, step: 1 },
      { key: 'padding', label: '填充', type: 'number', value: 1, min: 0, max: 5, step: 1 },
      { key: 'output_padding', label: '输出填充', type: 'number', value: 0, min: 0, max: 3, step: 1 },
      { key: 'dilation', label: '空洞率', type: 'number', value: 1, min: 1, max: 5, step: 1 },
      { key: 'bias', label: '使用偏置', type: 'boolean', value: true }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 64, 16, 16] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 32, 32, 32] }],
    { layerType: 'transposed_conv2d' }
  )
]
