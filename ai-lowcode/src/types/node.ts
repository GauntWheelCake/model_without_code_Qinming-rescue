// src/types/node.ts

// 节点参数类型
export interface NodeParam {
  key: string
  label: string
  type: 'number' | 'string' | 'boolean' | 'select' | 'range'
  value: any
  options?: Array<{ label: string; value: any }>
  min?: number
  max?: number
  step?: number
  placeholder?: string
}

// 组件元数据接口
export interface ComponentMetadata {
  framework?: string
  layerType?: string
  defaultInputShape?: number[]
  defaultOutputShape?: number[]
  defaultInputMeaning?: string
  defaultOutputMeaning?: string
  supportedTasks?: string[]
  requiresTorchvision?: boolean
  inputShape?: number[]
  outputShape?: number[]
  [key: string]: any  // 允许其他元数据字段
}

// 组件定义类型
export interface ComponentDefinition {
  id: string
  name: string
  description: string
  icon: string
  type: 'layer' | 'activation' | 'model' | 'utility'
  category: string
  params: NodeParam[]
  usage?: string
  example?: string
  constraints?: string[]
  compatibilityTags?: string[]
  inputs: Array<{
    name: string
    dataType?: string
    shape?: number[]
  }>
  outputs: Array<{
    name: string
    dataType?: string
    shape?: number[]
  }>
  metadata?: ComponentMetadata  // 可选，因为有默认值
}

// 画布节点类型（与组件定义不同）
export interface CanvasNode {
  id: string
  name: string
  type: string
  icon: string
  description?: string
  category: string
  position: { x: number; y: number }
  params: NodeParam[]
  usage?: string
  example?: string
  constraints?: string[]
  compatibilityTags?: string[]
  // 画布节点特有的字段
  inputs: Array<{
    id: string
    name: string
    type: 'input' | 'output'
    dataType?: string
    shape?: number[]
    connectedTo?: string[]
  }>
  outputs: Array<{
    id: string
    name: string
    type: 'input' | 'output'
    dataType?: string
    shape?: number[]
    connectedTo?: string[]
  }>
  metadata?: ComponentMetadata
}

// 连接类型
export interface Connection {
  id: string
  source: {
    nodeId: string
    pointId: string
    x: number
    y: number
  }
  target: {
    nodeId: string
    pointId: string
    x: number
    y: number
  }
  style: {
    color: string
    width: number
    dashed: boolean
    arrowType: 'default' | 'filled' | 'hollow'
  }
  data: {
    dataType?: string
    shape?: number[]
    tensorName?: string
  }
}

// 连接验证结果
export interface ConnectionValidation {
  valid: boolean
  message?: string
  errors: string[]
}

// 模型拓扑结构
export interface ModelTopology {
  nodes: CanvasNode[]
  connections: Connection[]
  layers: string[]
  hasCycles: boolean
  inputNodes: string[]
  outputNodes: string[]
}

// 连接点类型（用于画布节点的输入/输出锚点）
export interface ConnectionPoint {
  id: string
  name: string
  type: 'input' | 'output'
  dataType?: string
  shape?: number[]
}