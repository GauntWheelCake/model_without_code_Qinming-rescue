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
    { layerType: 'relu' },
    {
      usage: '通用激活层，缓解梯度消失并提升模型非线性表达。',
      example: '卷积或全连接层之后添加 ReLU 作为默认激活。',
      constraints: ['对输入形状无硬性限制，保持与输入相同的输出形状。'],
      compatibilityTags: ['activation', 'cnn', 'mlp']
    }
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
    { layerType: 'sigmoid' },
    {
      usage: '常用于二分类输出层，将 logits 映射为 0~1 概率。',
      example: '二分类任务的最后一层输出概率分数。',
      constraints: ['输出范围固定为 (0, 1)。', '多类别任务更适合 Softmax。'],
      compatibilityTags: ['output', 'binary-classification', 'probability']
    }
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
