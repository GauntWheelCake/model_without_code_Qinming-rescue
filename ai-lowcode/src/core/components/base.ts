// src/core/components/base.ts
import type { 
  ComponentDefinition as OriginalComponentDefinition,
  ComponentMetadata 
} from '../../types/node'

// 导出类型
export type { 
  OriginalComponentDefinition as ComponentDefinition,
  ComponentMetadata 
}

// 默认元数据
export const DEFAULT_METADATA: ComponentMetadata = {
  framework: 'pytorch',
  layerType: 'custom',
  defaultInputShape: [null, 64],
  defaultOutputShape: [null, 64],
  defaultInputMeaning: '默认输入形状以 batch 维在前，仅作示例（不强制约束）',
  defaultOutputMeaning: '默认输出形状用于展示期望维度，可结合上下游调整',
  supportedTasks: ['classification', 'regression', 'feature-extraction'],
  requiresTorchvision: false
}
