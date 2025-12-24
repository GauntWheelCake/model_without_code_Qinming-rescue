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
  requiresTorchvision: false
}