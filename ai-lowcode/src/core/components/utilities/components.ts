// src/core/components/utilities/components.ts
import { ComponentBuilder } from '../builder'
import type { ComponentDefinition } from '../../../types/node'

export const UTILITY_COMPONENTS: ComponentDefinition[] = [
  ComponentBuilder.createComponent(
    'dropout',
    'Dropout层',
    '防止过拟合的Dropout层',
    'MagicStick',
    'utility',
    'utilities',
    [
      { key: 'p', label: '丢弃概率', type: 'range', value: 0.5, min: 0, max: 1, step: 0.05 },
      { key: 'inplace', label: '原地操作', type: 'boolean', value: false }
    ],
    [{ name: 'input', dataType: 'tensor' }],
    [{ name: 'output', dataType: 'tensor' }],
    { layerType: 'dropout' }
  ),

  ComponentBuilder.createComponent(
    'reshape',
    '重塑层',
    '改变张量形状',
    'Refresh',
    'utility',
    'utilities',
    [
      { key: 'shape', label: '目标形状', type: 'string', value: '-1, 128', placeholder: '例如: -1, 128, 128' }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [32, 64, 32, 32] }],
    [{ name: 'output', dataType: 'tensor', shape: [32, -1] }],
    { layerType: 'reshape' }
  ),

  ComponentBuilder.createComponent(
    'concatenate',
    '拼接层',
    '在指定维度拼接张量',
    'Connection',
    'utility',
    'utilities',
    [
      { key: 'dim', label: '拼接维度', type: 'number', value: 1, min: 0, max: 10, step: 1 }
    ],
    [
      { name: 'input1', dataType: 'tensor', shape: [32, 64, 32, 32] },
      { name: 'input2', dataType: 'tensor', shape: [32, 64, 32, 32] }
    ],
    [{ name: 'output', dataType: 'tensor', shape: [32, 128, 32, 32] }],
    { layerType: 'concatenate' }
  ),

  ComponentBuilder.createComponent(
    'add',
    '相加层',
    '逐元素相加',
    'Plus',
    'utility',
    'utilities',
    [],
    [
      { name: 'input1', dataType: 'tensor', shape: [32, 64, 32, 32] },
      { name: 'input2', dataType: 'tensor', shape: [32, 64, 32, 32] }
    ],
    [{ name: 'output', dataType: 'tensor', shape: [32, 64, 32, 32] }],
    { layerType: 'add' }
  ),

  ComponentBuilder.createComponent(
    'multiply',
    '相乘层',
    '逐元素相乘',
    'Close',
    'utility',
    'utilities',
    [],
    [
      { name: 'input1', dataType: 'tensor', shape: [32, 64, 32, 32] },
      { name: 'input2', dataType: 'tensor', shape: [32, 64, 32, 32] }
    ],
    [{ name: 'output', dataType: 'tensor', shape: [32, 64, 32, 32] }],
    { layerType: 'multiply' }
  ),

  ComponentBuilder.createComponent(
    'identity',
    '恒等层',
    '直接返回输入',
    'CopyDocument',
    'utility',
    'utilities',
    [],
    [{ name: 'input', dataType: 'tensor' }],
    [{ name: 'output', dataType: 'tensor' }],
    { layerType: 'identity' }
  ),

  ComponentBuilder.createComponent(
    'zero_padding2d',
    '零填充层',
    '2D零填充',
    'Expand',
    'utility',
    'utilities',
    [
      { key: 'padding', label: '填充大小', type: 'number', value: 1, min: 0, max: 10, step: 1 }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [32, 64, 32, 32] }],
    [{ name: 'output', dataType: 'tensor', shape: [32, 64, 34, 34] }],
    { layerType: 'zero_padding2d' }
  ),

  ComponentBuilder.createComponent(
    'lambda',
    'Lambda层',
    '自定义函数层',
    'SetUp',
    'utility',
    'utilities',
    [
      { key: 'function', label: '函数表达式', type: 'string', value: 'lambda x: x * 2', placeholder: 'Python lambda表达式' }
    ],
    [{ name: 'input', dataType: 'tensor' }],
    [{ name: 'output', dataType: 'tensor' }],
    { layerType: 'lambda' }
  )
]