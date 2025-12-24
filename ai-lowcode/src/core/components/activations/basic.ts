// src/core/components/activations/basic.ts
import { ComponentBuilder } from '../builder'
import type { ComponentDefinition } from '../../../types/node'

export const BASIC_ACTIVATIONS: ComponentDefinition[] = [
  ComponentBuilder.createComponent(
    'relu',
    'ReLU',
    '整流线性单元激活函数',
    'Histogram',
    'activation',
    'activations',
    [
      { key: 'inplace', label: '原地操作', type: 'boolean', value: false }
    ],
    [{ name: 'input', dataType: 'tensor' }],
    [{ name: 'output', dataType: 'tensor' }],
    { layerType: 'relu' }
  ),
  
  ComponentBuilder.createComponent(
    'sigmoid',
    'Sigmoid',
    'S型激活函数',
    'SetUp',
    'activation',
    'activations',
    [],
    [{ name: 'input', dataType: 'tensor' }],
    [{ name: 'output', dataType: 'tensor' }],
    { layerType: 'sigmoid' }
  ),
  
  ComponentBuilder.createComponent(
    'tanh',
    'Tanh',
    '双曲正切激活函数',
    'DataLine',
    'activation',
    'activations',
    [],
    [{ name: 'input', dataType: 'tensor' }],
    [{ name: 'output', dataType: 'tensor' }],
    { layerType: 'tanh' }
  )
]