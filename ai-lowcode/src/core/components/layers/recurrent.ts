// src/core/components/layers/recurrent.ts
import { ComponentBuilder } from '../builder'
import type { ComponentDefinition } from '../../../types/node'

export const RECURRENT_LAYERS: ComponentDefinition[] = [
  ComponentBuilder.createComponent(
    'lstm',
    'LSTM层',
    'Long Short-Term Memory',
    'Connection',
    'layer',
    'recurrent_layers',
    [
      { key: 'input_size', label: '输入大小', type: 'number', value: 128, min: 1, max: 4096, step: 1 },
      { key: 'hidden_size', label: '隐藏大小', type: 'number', value: 256, min: 1, max: 4096, step: 1 },
      { key: 'num_layers', label: '层数', type: 'number', value: 1, min: 1, max: 10, step: 1 },
      { key: 'batch_first', label: '批次优先', type: 'boolean', value: true },
      { key: 'dropout', label: 'Dropout率', type: 'range', value: 0, min: 0, max: 1, step: 0.1 },
      { key: 'bidirectional', label: '双向', type: 'boolean', value: false },
      { key: 'bias', label: '使用偏置', type: 'boolean', value: true }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [32, 100, 128] }],
    [{ name: 'output', dataType: 'tensor', shape: [32, 100, 256] }],
    { layerType: 'lstm' }
  ),

  ComponentBuilder.createComponent(
    'gru',
    'GRU层',
    'Gated Recurrent Unit',
    'Connection',
    'layer',
    'recurrent_layers',
    [
      { key: 'input_size', label: '输入大小', type: 'number', value: 128, min: 1, max: 4096, step: 1 },
      { key: 'hidden_size', label: '隐藏大小', type: 'number', value: 256, min: 1, max: 4096, step: 1 },
      { key: 'num_layers', label: '层数', type: 'number', value: 1, min: 1, max: 10, step: 1 },
      { key: 'batch_first', label: '批次优先', type: 'boolean', value: true },
      { key: 'dropout', label: 'Dropout率', type: 'range', value: 0, min: 0, max: 1, step: 0.1 },
      { key: 'bidirectional', label: '双向', type: 'boolean', value: false },
      { key: 'bias', label: '使用偏置', type: 'boolean', value: true }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [32, 100, 128] }],
    [{ name: 'output', dataType: 'tensor', shape: [32, 100, 256] }],
    { layerType: 'gru' }
  ),

  ComponentBuilder.createComponent(
    'rnn',
    'RNN层',
    'Recurrent Neural Network',
    'Connection',
    'layer',
    'recurrent_layers',
    [
      { key: 'input_size', label: '输入大小', type: 'number', value: 128, min: 1, max: 4096, step: 1 },
      { key: 'hidden_size', label: '隐藏大小', type: 'number', value: 256, min: 1, max: 4096, step: 1 },
      { key: 'num_layers', label: '层数', type: 'number', value: 1, min: 1, max: 10, step: 1 },
      { key: 'nonlinearity', label: '非线性函数', type: 'select', value: 'tanh', options: [
        { label: 'tanh', value: 'tanh' },
        { label: 'relu', value: 'relu' }
      ]},
      { key: 'batch_first', label: '批次优先', type: 'boolean', value: true },
      { key: 'dropout', label: 'Dropout率', type: 'range', value: 0, min: 0, max: 1, step: 0.1 },
      { key: 'bidirectional', label: '双向', type: 'boolean', value: false },
      { key: 'bias', label: '使用偏置', type: 'boolean', value: true }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [32, 100, 128] }],
    [{ name: 'output', dataType: 'tensor', shape: [32, 100, 256] }],
    { layerType: 'rnn' }
  )
]