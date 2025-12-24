// src/core/components/layers/basic.ts
import { ComponentBuilder } from '../builder'
import type { ComponentDefinition } from '../../../types/node'

export const BASIC_LAYERS: ComponentDefinition[] = [
  ComponentBuilder.createComponent(
    'linear',
    '全连接层',
    '线性变换层，用于特征变换',
    'Grid',
    'layer',
    'basic_layers',
    [
      { key: 'in_features', label: '输入特征数', type: 'number', value: 512, min: 1, max: 65536, step: 1 },
      { key: 'out_features', label: '输出特征数', type: 'number', value: 256, min: 1, max: 65536, step: 1 },
      { key: 'bias', label: '使用偏置', type: 'boolean', value: true }
    ],
    [{ name: 'input', dataType: 'tensor', shape: [null, 512] }],
    [{ name: 'output', dataType: 'tensor', shape: [null, 256] }],
    { layerType: 'linear' },
    {
      usage: '常用作输入层或特征投影层，将原始特征映射到统一的隐藏维度。',
      example: '将长度为 512 的向量映射到 256 维，用于后续分类或编码。',
      constraints: ['输入张量最后一维需等于 in_features。', '若前序为卷积层需先展平。'],
      compatibilityTags: ['tabular', 'nlp', 'feature-projection']
    }
  ),
  
  ComponentBuilder.createComponent(
    'flatten',
    '展平层',
    'Flatten input tensor',
    'Expand',
    'layer',
    'basic_layers',
    [
      { key: 'start_dim', label: '起始维度', type: 'number', value: 1, min: 0, max: 10, step: 1 },
      { key: 'end_dim', label: '结束维度', type: 'number', value: -1, min: -1, max: 10, step: 1 }
    ],
    [{ name: 'input', dataType: 'tensor' }],
    [{ name: 'output', dataType: 'tensor' }],
    { layerType: 'flatten' }
  ),
  
  ComponentBuilder.createComponent(
    'embedding',
    '嵌入层',
    'Embedding layer for NLP',
    'Connection',
    'layer',
    'basic_layers',
    [
      { key: 'num_embeddings', label: '词汇表大小', type: 'number', value: 10000, min: 1, max: 1000000, step: 1 },
      { key: 'embedding_dim', label: '嵌入维度', type: 'number', value: 300, min: 1, max: 2048, step: 1 },
      { key: 'padding_idx', label: '填充索引', type: 'number', value: null, min: 0, max: 1000000, step: 1, placeholder: '可选' },
      { key: 'sparse', label: '稀疏梯度', type: 'boolean', value: false }
    ],
    [{ name: 'input', dataType: 'tensor' }],
    [{ name: 'output', dataType: 'tensor' }],
    { layerType: 'embedding' }
  )
]
