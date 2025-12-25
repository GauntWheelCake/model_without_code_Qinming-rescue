import type { CanvasNode, Connection } from '../../types/node'
import { TemplateLoader } from './template-loader'

export interface GeneratedCode {
  modelCode: string
  trainingCode: string
  inferenceCode: string
  requirements: string[]
  modelSummary: string
}

export class PyTorchCodeGenerator {
  private nodes: CanvasNode[]
  private connections: Connection[]

  constructor(nodes: CanvasNode[], connections: Connection[]) {
    this.nodes = nodes
    this.connections = connections
  }

  /**
   * 生成完整的PyTorch代码
   */
  generate(): GeneratedCode {
    if (this.nodes.length === 0) {
      return this.getEmptyCode()
    }

    // 1. 生成模型类代码
    const modelCode = this.generateModelClass()

    // 2. 生成训练代码
    const trainingCode = this.generateTrainingCode()

    // 3. 生成推理代码
    const inferenceCode = this.generateInferenceCode()

    // 4. 生成模型摘要
    const modelSummary = this.generateModelSummary()

    // 5. 生成依赖项
    const requirements = this.generateRequirements()

    return {
      modelCode,
      trainingCode,
      inferenceCode,
      requirements,
      modelSummary
    }
  }

  /**
   * 生成模型类代码
   */
  private generateModelClass(): string {
    const modelName = 'AIModel'
    const layers = this.generateLayers()
    const forwardCode = this.generateForwardCode()
    const modelSummaryCode = this.generateModelSummaryForCode()
    const torchvisionImport = this.shouldImportTorchVision()
      ? 'import torchvision.models as models'
      : ''

    // 使用模板生成代码，为每个占位符添加正确的缩进
    return TemplateLoader.loadAndProcess('model', {
      MODEL_NAME: modelName,
      LAYERS: this.indent(layers, 8),           // __init__ 方法内需要 8 个空格
      FORWARD_CODE: this.indent(forwardCode, 8), // forward 方法内需要 8 个空格
      MODEL_SUMMARY: this.indent(modelSummaryCode, 8), // summary 方法内需要 8 个空格
      TORCHVISION_IMPORT: torchvisionImport
    })
  }

  /**
   * 生成层定义代码
   */
  private generateLayers(): string {
    const layers: string[] = []

    // 按拓扑顺序生成层（只包含已连接的节点）
    const topoSortedNodes = this.getTopologicalSortedNodes()

    topoSortedNodes.forEach((node, index) => {
      const layerCode = this.generateLayerCode(node, index + 1)
      if (layerCode) {
        layers.push(layerCode)
      }
    })

    // 添加孤立节点的注释（未连接的节点）
    const isolatedNodes = this.getIsolatedNodes()
    if (isolatedNodes.length > 0) {
      layers.push('')
      layers.push('# ===== 以下是未连接的组件（不参与forward计算）=====')
      isolatedNodes.forEach((node, index) => {
        const layerCode = this.generateLayerCode(node, topoSortedNodes.length + index + 1)
        if (layerCode) {
          layers.push(`# ${layerCode}`)
        }
      })
    }

    return layers.join('\n')
  }

  /**
   * 获取拓扑排序的节点
   */
  private getTopologicalSortedNodes(): CanvasNode[] {
    // 简化版的拓扑排序（基于连接关系）
    const visited = new Set<string>()
    const result: CanvasNode[] = []

    // 找到所有有连接的节点ID
    const connectedNodeIds = new Set<string>()
    this.connections.forEach(conn => {
      connectedNodeIds.add(conn.source.nodeId)
      connectedNodeIds.add(conn.target.nodeId)
    })

    // 只处理有连接的节点
    const connectedNodes = this.nodes.filter(node => connectedNodeIds.has(node.id))

    // 找到输入节点（没有上游连接的节点）
    const inputNodes = connectedNodes.filter(node => {
      const upstreamConnections = this.connections.filter(conn => conn.target.nodeId === node.id)
      return upstreamConnections.length === 0
    })

    // 从输入节点开始深度优先搜索
    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      const node = this.nodes.find(n => n.id === nodeId)
      if (!node) return

      // 先处理所有上游节点
      const upstreamConnections = this.connections.filter(conn => conn.target.nodeId === nodeId)
      upstreamConnections.forEach(conn => {
        dfs(conn.source.nodeId)
      })

      result.push(node)
    }

    inputNodes.forEach(node => dfs(node.id))

    // 处理剩余的有连接但未访问的节点（可能是环的一部分）
    connectedNodes.forEach(node => {
      if (!visited.has(node.id)) {
        result.push(node)
      }
    })

    // 注意：孤立节点（没有连接的节点）不包含在结果中
    // 它们会被单独处理或忽略

    return result
  }

  /**
   * 获取孤立节点（没有连接的节点）
   */
  private getIsolatedNodes(): CanvasNode[] {
    const connectedNodeIds = new Set<string>()
    this.connections.forEach(conn => {
      connectedNodeIds.add(conn.source.nodeId)
      connectedNodeIds.add(conn.target.nodeId)
    })

    return this.nodes.filter(node => !connectedNodeIds.has(node.id))
  }

  /**
   * 生成单个层的代码
   */
  private generateLayerCode(node: CanvasNode, index: number): string | null {
    const layerName = this.getLayerName(node, index)

    switch (node.name) {
      // ===== 基础层 =====
      case '全连接层':
        return this.generateLinearLayer(node, layerName)
      case '展平层':
        return this.generateFlattenLayer(node, layerName)
      case '嵌入层':
        return this.generateEmbeddingLayer(node, layerName)

      // ===== 卷积层 =====
      case '一维卷积':
        return this.generateConv1dLayer(node, layerName)
      case '二维卷积':
        return this.generateConv2dLayer(node, layerName)
      case '三维卷积':
        return this.generateConv3dLayer(node, layerName)
      case '深度可分离卷积':
        return this.generateDepthwiseConv2dLayer(node, layerName)
      case '转置卷积':
        return this.generateTransposedConv2dLayer(node, layerName)

      // ===== 池化层 =====
      case '一维最大池化':
        return this.generateMaxPool1dLayer(node, layerName)
      case '一维平均池化':
        return this.generateAvgPool1dLayer(node, layerName)
      case '二维最大池化':
        return this.generateMaxPool2dLayer(node, layerName)
      case '二维平均池化':
        return this.generateAvgPool2dLayer(node, layerName)
      case '自适应最大池化':
        return this.generateAdaptiveMaxPool2dLayer(node, layerName)
      case '全局平均池化':
        return this.generateGlobalAvgPoolLayer(node, layerName)

      // ===== 归一化层 =====
      case '一维批归一化':
        return this.generateBatchNorm1dLayer(node, layerName)
      case '二维批归一化':
        return this.generateBatchNorm2dLayer(node, layerName)
      case '层归一化':
        return this.generateLayerNormLayer(node, layerName)
      case '实例归一化':
        return this.generateInstanceNorm2dLayer(node, layerName)
      case '组归一化':
        return this.generateGroupNormLayer(node, layerName)

      // ===== 循环层 =====
      case 'LSTM层':
        return this.generateLSTMLayer(node, layerName)
      case 'GRU层':
        return this.generateGRULayer(node, layerName)
      case 'RNN层':
        return this.generateRNNLayer(node, layerName)

      // ===== 注意力层 =====
      case '多头注意力':
        return this.generateMultiHeadAttentionLayer(node, layerName)
      case '自注意力':
        return this.generateSelfAttentionLayer(node, layerName)
      case '缩放点积注意力':
        return this.generateScaledDotProductAttentionLayer(node, layerName)
      // ===== 激活函数 =====
      case 'ReLU':
        return this.generateReLULayer(node, layerName)
      case 'Sigmoid':
        return this.generateSigmoidLayer(node, layerName)
      case 'Tanh':
        return this.generateTanhLayer(node, layerName)
      case 'Leaky ReLU':
        return this.generateLeakyReLULayer(node, layerName)
      case 'ELU':
        return this.generateELULayer(node, layerName)
      case 'SELU':
        return this.generateSELULayer(node, layerName)
      case 'PReLU':
        return this.generatePReLULayer(node, layerName)
      case 'Mish':
        return this.generateMishLayer(node, layerName)
      case 'Swish':
        return this.generateSwishLayer(node, layerName)
      // ===== 预训练模型 =====
      case 'ResNet':
        return this.generateResNetLayer(node, layerName)
      case 'VGGNet':
        return this.generateVGGLayer(node, layerName)
      case 'MobileNet V2':
        return this.generateMobileNetV2Layer(node, layerName)
      case 'EfficientNet':
        return this.generateEfficientNetLayer(node, layerName)
      case 'DenseNet':
        return this.generateDenseNetLayer(node, layerName)
      case 'BERT':
        return this.generateBERTLayer(node, layerName)
      case 'GPT-2':
        return this.generateGPT2Layer(node, layerName)
      case 'Transformer':
        return this.generateTransformerLayer(node, layerName)
      // ===== 工具层 =====
      case 'Dropout层':
        return this.generateDropoutLayer(node, layerName)
      case '重塑层':
        return this.generateReshapeLayer(node, layerName)
      case '拼接层':
        return this.generateConcatenateLayer(node, layerName)
      case '相加层':
        return this.generateAddLayer(node, layerName)
      case '相乘层':
        return this.generateMultiplyLayer(node, layerName)
      case '恒等层':
        return this.generateIdentityLayer(node, layerName)
      case '零填充层':
        return this.generateZeroPadding2dLayer(node, layerName)
      case 'Lambda层':
        return this.generateLambdaLayer(node, layerName)

      default:
        return this.generateCustomLayer(node, layerName)
    }
  }

  // ==================== 工具函数 ====================

  /**
   * 转换布尔值为 Python 格式
   */
  private toPythonBool(value: any): string {
    return value ? 'True' : 'False'
  }

  /**
   * 处理 padding 参数（可能是字符串或数字）
   */
  private formatPadding(padding: any): string {
    if (typeof padding === 'string') {
      return `'${padding}'`
    }
    return String(padding)
  }

  // ==================== 基础层 ====================

  /**
   * 生成线性层代码 (全连接层)
   */
  private generateLinearLayer(node: CanvasNode, layerName: string): string {
    const inFeatures = this.getParamValue(node, 'in_features', 512)
    const outFeatures = this.getParamValue(node, 'out_features', 256)
    const bias = this.toPythonBool(this.getParamValue(node, 'bias', true))

    return `self.${layerName} = nn.Linear(${inFeatures}, ${outFeatures}, bias=${bias})`
  }

  /**
   * 生成展平层代码
   */
  private generateFlattenLayer(node: CanvasNode, layerName: string): string {
    const startDim = this.getParamValue(node, 'start_dim', 1)
    const endDim = this.getParamValue(node, 'end_dim', -1)

    return `self.${layerName} = nn.Flatten(start_dim=${startDim}, end_dim=${endDim})`
  }

  /**
   * 生成嵌入层代码
   */
  private generateEmbeddingLayer(node: CanvasNode, layerName: string): string {
    const numEmbeddings = this.getParamValue(node, 'num_embeddings', 10000)
    const embeddingDim = this.getParamValue(node, 'embedding_dim', 300)
    const paddingIdx = this.getParamValue(node, 'padding_idx', null)
    const sparse = this.toPythonBool(this.getParamValue(node, 'sparse', false))

    let code = `self.${layerName} = nn.Embedding(${numEmbeddings}, ${embeddingDim}`
    if (paddingIdx !== null) {
      code += `, padding_idx=${paddingIdx}`
    }
    code += `, sparse=${sparse})`

    return code
  }

  // ==================== 卷积层 ====================

  /**
   * 生成一维卷积层代码
   */
  private generateConv1dLayer(node: CanvasNode, layerName: string): string {
    const inChannels = this.getParamValue(node, 'in_channels', 1)
    const outChannels = this.getParamValue(node, 'out_channels', 64)
    const kernelSize = this.getParamValue(node, 'kernel_size', 3)
    const stride = this.getParamValue(node, 'stride', 1)
    const padding = this.formatPadding(this.getParamValue(node, 'padding', 'valid'))
    const dilation = this.getParamValue(node, 'dilation', 1)
    const groups = this.getParamValue(node, 'groups', 1)
    const bias = this.toPythonBool(this.getParamValue(node, 'bias', true))

    return `self.${layerName} = nn.Conv1d(${inChannels}, ${outChannels}, kernel_size=${kernelSize}, stride=${stride}, padding=${padding}, dilation=${dilation}, groups=${groups}, bias=${bias})`
  }

  /**
   * 生成二维卷积层代码
   */
  private generateConv2dLayer(node: CanvasNode, layerName: string): string {
    const inChannels = this.getParamValue(node, 'in_channels', 3)
    const outChannels = this.getParamValue(node, 'out_channels', 64)
    const kernelSize = this.getParamValue(node, 'kernel_size', 3)
    const stride = this.getParamValue(node, 'stride', 1)
    const padding = this.formatPadding(this.getParamValue(node, 'padding', 'same'))
    const dilation = this.getParamValue(node, 'dilation', 1)
    const groups = this.getParamValue(node, 'groups', 1)
    const bias = this.toPythonBool(this.getParamValue(node, 'bias', true))

    return `self.${layerName} = nn.Conv2d(${inChannels}, ${outChannels}, kernel_size=${kernelSize}, stride=${stride}, padding=${padding}, dilation=${dilation}, groups=${groups}, bias=${bias})`
  }

  /**
   * 生成三维卷积层代码
   */
  private generateConv3dLayer(node: CanvasNode, layerName: string): string {
    const inChannels = this.getParamValue(node, 'in_channels', 1)
    const outChannels = this.getParamValue(node, 'out_channels', 32)
    const kernelSize = this.getParamValue(node, 'kernel_size', 3)
    const stride = this.getParamValue(node, 'stride', 1)
    const padding = this.getParamValue(node, 'padding', 1)
    const dilation = this.getParamValue(node, 'dilation', 1)
    const bias = this.toPythonBool(this.getParamValue(node, 'bias', true))

    return `self.${layerName} = nn.Conv3d(${inChannels}, ${outChannels}, kernel_size=${kernelSize}, stride=${stride}, padding=${padding}, dilation=${dilation}, bias=${bias})`
  }

  /**
   * 生成深度可分离卷积层代码
   */
  private generateDepthwiseConv2dLayer(node: CanvasNode, layerName: string): string {
    const inChannels = this.getParamValue(node, 'in_channels', 32)
    const outChannels = this.getParamValue(node, 'out_channels', 64)
    const kernelSize = this.getParamValue(node, 'kernel_size', 3)
    const stride = this.getParamValue(node, 'stride', 1)
    const padding = this.getParamValue(node, 'padding', 1)
    const depthMultiplier = this.getParamValue(node, 'depth_multiplier', 1)

    // 深度可分离卷积 = 深度卷积 + 逐点卷积
    return `# 深度可分离卷积：深度卷积 + 逐点卷积
self.${layerName}_depthwise = nn.Conv2d(${inChannels}, ${inChannels} * ${depthMultiplier}, kernel_size=${kernelSize}, stride=${stride}, padding=${padding}, groups=${inChannels})
self.${layerName}_pointwise = nn.Conv2d(${inChannels} * ${depthMultiplier}, ${outChannels}, kernel_size=1)`
  }

  /**
   * 生成转置卷积层代码
   */
  private generateTransposedConv2dLayer(node: CanvasNode, layerName: string): string {
    const inChannels = this.getParamValue(node, 'in_channels', 64)
    const outChannels = this.getParamValue(node, 'out_channels', 32)
    const kernelSize = this.getParamValue(node, 'kernel_size', 4)
    const stride = this.getParamValue(node, 'stride', 2)
    const padding = this.getParamValue(node, 'padding', 1)
    const outputPadding = this.getParamValue(node, 'output_padding', 0)
    const dilation = this.getParamValue(node, 'dilation', 1)
    const bias = this.toPythonBool(this.getParamValue(node, 'bias', true))

    return `self.${layerName} = nn.ConvTranspose2d(${inChannels}, ${outChannels}, kernel_size=${kernelSize}, stride=${stride}, padding=${padding}, output_padding=${outputPadding}, dilation=${dilation}, bias=${bias})`
  }

  // ==================== 池化层 ====================

  /**
   * 生成一维最大池化层代码
   */
  private generateMaxPool1dLayer(node: CanvasNode, layerName: string): string {
    const kernelSize = this.getParamValue(node, 'kernel_size', 2)
    const stride = this.getParamValue(node, 'stride', 2)
    const padding = this.getParamValue(node, 'padding', 0)
    const dilation = this.getParamValue(node, 'dilation', 1)
    const ceilMode = this.toPythonBool(this.getParamValue(node, 'ceil_mode', false))

    return `self.${layerName} = nn.MaxPool1d(kernel_size=${kernelSize}, stride=${stride}, padding=${padding}, dilation=${dilation}, ceil_mode=${ceilMode})`
  }

  /**
   * 生成一维平均池化层代码
   */
  private generateAvgPool1dLayer(node: CanvasNode, layerName: string): string {
    const kernelSize = this.getParamValue(node, 'kernel_size', 2)
    const stride = this.getParamValue(node, 'stride', 2)
    const padding = this.getParamValue(node, 'padding', 0)
    const ceilMode = this.toPythonBool(this.getParamValue(node, 'ceil_mode', false))

    return `self.${layerName} = nn.AvgPool1d(kernel_size=${kernelSize}, stride=${stride}, padding=${padding}, ceil_mode=${ceilMode})`
  }

  /**
   * 生成二维最大池化层代码
   */
  private generateMaxPool2dLayer(node: CanvasNode, layerName: string): string {
    const kernelSize = this.getParamValue(node, 'kernel_size', 2)
    const stride = this.getParamValue(node, 'stride', 2)
    const padding = this.getParamValue(node, 'padding', 0)
    const dilation = this.getParamValue(node, 'dilation', 1)
    const ceilMode = this.toPythonBool(this.getParamValue(node, 'ceil_mode', false))

    return `self.${layerName} = nn.MaxPool2d(kernel_size=${kernelSize}, stride=${stride}, padding=${padding}, dilation=${dilation}, ceil_mode=${ceilMode})`
  }

  /**
   * 生成二维平均池化层代码
   */
  private generateAvgPool2dLayer(node: CanvasNode, layerName: string): string {
    const kernelSize = this.getParamValue(node, 'kernel_size', 2)
    const stride = this.getParamValue(node, 'stride', 2)
    const padding = this.getParamValue(node, 'padding', 0)
    const ceilMode = this.toPythonBool(this.getParamValue(node, 'ceil_mode', false))

    return `self.${layerName} = nn.AvgPool2d(kernel_size=${kernelSize}, stride=${stride}, padding=${padding}, ceil_mode=${ceilMode})`
  }

  /**
   * 生成自适应最大池化层代码
   */
  private generateAdaptiveMaxPool2dLayer(node: CanvasNode, layerName: string): string {
    const outputSize = this.getParamValue(node, 'output_size', 1)

    return `self.${layerName} = nn.AdaptiveMaxPool2d(output_size=(${outputSize}, ${outputSize}))`
  }

  /**
   * 生成全局平均池化层代码
   */
  private generateGlobalAvgPoolLayer(node: CanvasNode, layerName: string): string {
    return `self.${layerName} = nn.AdaptiveAvgPool2d(output_size=(1, 1))`
  }

  // ==================== 归一化层 ====================

  /**
   * 生成一维批归一化层代码
   */
  private generateBatchNorm1dLayer(node: CanvasNode, layerName: string): string {
    const numFeatures = this.getParamValue(node, 'num_features', 64)
    const eps = this.getParamValue(node, 'eps', 1e-5)
    const momentum = this.getParamValue(node, 'momentum', 0.1)
    const affine = this.toPythonBool(this.getParamValue(node, 'affine', true))
    const trackRunningStats = this.toPythonBool(this.getParamValue(node, 'track_running_stats', true))

    return `self.${layerName} = nn.BatchNorm1d(${numFeatures}, eps=${eps}, momentum=${momentum}, affine=${affine}, track_running_stats=${trackRunningStats})`
  }

  /**
   * 生成二维批归一化层代码
   */
  private generateBatchNorm2dLayer(node: CanvasNode, layerName: string): string {
    const numFeatures = this.getParamValue(node, 'num_features', 64)
    const eps = this.getParamValue(node, 'eps', 1e-5)
    const momentum = this.getParamValue(node, 'momentum', 0.1)
    const affine = this.toPythonBool(this.getParamValue(node, 'affine', true))
    const trackRunningStats = this.toPythonBool(this.getParamValue(node, 'track_running_stats', true))

    return `self.${layerName} = nn.BatchNorm2d(${numFeatures}, eps=${eps}, momentum=${momentum}, affine=${affine}, track_running_stats=${trackRunningStats})`
  }

  /**
   * 生成层归一化代码
   */
  private generateLayerNormLayer(node: CanvasNode, layerName: string): string {
    const normalizedShape = this.getParamValue(node, 'normalized_shape', 512)
    const eps = this.getParamValue(node, 'eps', 1e-5)
    const elementwiseAffine = this.toPythonBool(this.getParamValue(node, 'elementwise_affine', true))

    return `self.${layerName} = nn.LayerNorm(${normalizedShape}, eps=${eps}, elementwise_affine=${elementwiseAffine})`
  }

  /**
   * 生成实例归一化层代码
   */
  private generateInstanceNorm2dLayer(node: CanvasNode, layerName: string): string {
    const numFeatures = this.getParamValue(node, 'num_features', 64)
    const eps = this.getParamValue(node, 'eps', 1e-5)
    const momentum = this.getParamValue(node, 'momentum', 0.1)
    const affine = this.toPythonBool(this.getParamValue(node, 'affine', true))
    const trackRunningStats = this.toPythonBool(this.getParamValue(node, 'track_running_stats', true))

    return `self.${layerName} = nn.InstanceNorm2d(${numFeatures}, eps=${eps}, momentum=${momentum}, affine=${affine}, track_running_stats=${trackRunningStats})`
  }

  /**
   * 生成组归一化层代码
   */
  private generateGroupNormLayer(node: CanvasNode, layerName: string): string {
    const numGroups = this.getParamValue(node, 'num_groups', 32)
    const numChannels = this.getParamValue(node, 'num_channels', 64)
    const eps = this.getParamValue(node, 'eps', 1e-5)
    const affine = this.toPythonBool(this.getParamValue(node, 'affine', true))

    return `self.${layerName} = nn.GroupNorm(${numGroups}, ${numChannels}, eps=${eps}, affine=${affine})`
  }

  // ==================== 循环层 ====================

  /**
   * 生成LSTM层代码
   */
  private generateLSTMLayer(node: CanvasNode, layerName: string): string {
    const inputSize = this.getParamValue(node, 'input_size', 128)
    const hiddenSize = this.getParamValue(node, 'hidden_size', 256)
    const numLayers = this.getParamValue(node, 'num_layers', 1)
    const batchFirst = this.toPythonBool(this.getParamValue(node, 'batch_first', true))
    const dropout = this.getParamValue(node, 'dropout', 0)
    const bidirectional = this.toPythonBool(this.getParamValue(node, 'bidirectional', false))
    const bias = this.toPythonBool(this.getParamValue(node, 'bias', true))

    return `self.${layerName} = nn.LSTM(${inputSize}, ${hiddenSize}, num_layers=${numLayers}, batch_first=${batchFirst}, dropout=${dropout}, bidirectional=${bidirectional}, bias=${bias})`
  }

  /**
   * 生成GRU层代码
   */
  private generateGRULayer(node: CanvasNode, layerName: string): string {
    const inputSize = this.getParamValue(node, 'input_size', 128)
    const hiddenSize = this.getParamValue(node, 'hidden_size', 256)
    const numLayers = this.getParamValue(node, 'num_layers', 1)
    const batchFirst = this.toPythonBool(this.getParamValue(node, 'batch_first', true))
    const dropout = this.getParamValue(node, 'dropout', 0)
    const bidirectional = this.toPythonBool(this.getParamValue(node, 'bidirectional', false))
    const bias = this.toPythonBool(this.getParamValue(node, 'bias', true))

    return `self.${layerName} = nn.GRU(${inputSize}, ${hiddenSize}, num_layers=${numLayers}, batch_first=${batchFirst}, dropout=${dropout}, bidirectional=${bidirectional}, bias=${bias})`
  }

  /**
   * 生成RNN层代码
   */
  private generateRNNLayer(node: CanvasNode, layerName: string): string {
    const inputSize = this.getParamValue(node, 'input_size', 128)
    const hiddenSize = this.getParamValue(node, 'hidden_size', 256)
    const numLayers = this.getParamValue(node, 'num_layers', 1)
    const nonlinearity = this.getParamValue(node, 'nonlinearity', 'tanh')
    const batchFirst = this.toPythonBool(this.getParamValue(node, 'batch_first', true))
    const dropout = this.getParamValue(node, 'dropout', 0)
    const bidirectional = this.toPythonBool(this.getParamValue(node, 'bidirectional', false))
    const bias = this.toPythonBool(this.getParamValue(node, 'bias', true))

    return `self.${layerName} = nn.RNN(${inputSize}, ${hiddenSize}, num_layers=${numLayers}, nonlinearity='${nonlinearity}', batch_first=${batchFirst}, dropout=${dropout}, bidirectional=${bidirectional}, bias=${bias})`
  }

  // ==================== 注意力层 ====================

  /**
   * 生成多头注意力层代码
   */
  private generateMultiHeadAttentionLayer(node: CanvasNode, layerName: string): string {
    const embedDim = this.getParamValue(node, 'embed_dim', 512)
    const numHeads = this.getParamValue(node, 'num_heads', 8)
    const dropout = this.getParamValue(node, 'dropout', 0.1)
    const bias = this.toPythonBool(this.getParamValue(node, 'bias', true))
    const addBiasKv = this.toPythonBool(this.getParamValue(node, 'add_bias_kv', false))
    const addZeroAttn = this.toPythonBool(this.getParamValue(node, 'add_zero_attn', false))
    const kdim = this.getParamValue(node, 'kdim', null)
    const vdim = this.getParamValue(node, 'vdim', null)

    let code = `self.${layerName} = nn.MultiheadAttention(${embedDim}, ${numHeads}, dropout=${dropout}, bias=${bias}, add_bias_kv=${addBiasKv}, add_zero_attn=${addZeroAttn}`
    if (kdim !== null) {
      code += `, kdim=${kdim}`
    }
    if (vdim !== null) {
      code += `, vdim=${vdim}`
    }
    code += `, batch_first=True)`

    return code
  }

  /**
   * 生成自注意力层代码（自定义实现）
   */
  private generateSelfAttentionLayer(node: CanvasNode, layerName: string): string {
    const hiddenSize = this.getParamValue(node, 'hidden_size', 512)
    const numAttentionHeads = this.getParamValue(node, 'num_attention_heads', 8)
    const attentionDropout = this.getParamValue(node, 'attention_dropout', 0.1)
    const hiddenDropout = this.getParamValue(node, 'hidden_dropout', 0.1)

    // 自注意力层通常需要自定义实现，这里使用 MultiheadAttention 作为基础
    return `# 自注意力层
self.${layerName} = nn.MultiheadAttention(${hiddenSize}, ${numAttentionHeads}, dropout=${attentionDropout}, batch_first=True)
self.${layerName}_dropout = nn.Dropout(${hiddenDropout})
self.${layerName}_norm = nn.LayerNorm(${hiddenSize})`
  }

  /**
   * 生成缩放点积注意力层代码
   */
  private generateScaledDotProductAttentionLayer(node: CanvasNode, layerName: string): string {
    const dropout = this.getParamValue(node, 'dropout', 0.1)
    const scale = this.getParamValue(node, 'scale', null)

    // PyTorch 2.0+ 支持 scaled_dot_product_attention，这里提供兼容实现
    let scaleStr = scale !== null ? String(scale) : 'None'

    return `# 缩放点积注意力 (PyTorch 2.0+ 可直接使用 F.scaled_dot_product_attention)
self.${layerName}_dropout = nn.Dropout(${dropout})
self.${layerName}_scale = ${scaleStr}  # 如果为 None，将使用 1/sqrt(d_k)`
  }

  // ==================== 预训练模型 ====================

  /**
   * 生成ResNet层代码
   */
  private generateResNetLayer(node: CanvasNode, layerName: string): string {
    const numLayers = this.getParamValue(node, 'num_layers', '18');
    const pretrained = this.getParamValue(node, 'pretrained', false);
    const numClasses = this.getParamValue(node, 'num_classes', 1000);

    // PyTorch 1.13+ 使用 weights 参数而不是 pretrained
    const weightsStr = pretrained ? `weights='IMAGENET1K_V1'` : `weights=None`;

    return `self.${layerName} = models.resnet${numLayers}(${weightsStr})
# 修改最后的全连接层以适应分类数
if ${numClasses} != 1000:
    self.${layerName}.fc = nn.Linear(self.${layerName}.fc.in_features, ${numClasses})`;
  }

  /**
   * 生成VGG层代码
   */
  private generateVGGLayer(node: CanvasNode, layerName: string): string {
    const version = this.getParamValue(node, 'version', '16');
    const batchNorm = this.getParamValue(node, 'batch_norm', false);
    const pretrained = this.getParamValue(node, 'pretrained', false);
    const numClasses = this.getParamValue(node, 'num_classes', 1000);

    const modelName = batchNorm ? `vgg${version}_bn` : `vgg${version}`;
    const weightsStr = pretrained ? `weights='IMAGENET1K_V1'` : `weights=None`;

    return `self.${layerName} = models.${modelName}(${weightsStr})
# 修改最后的分类器以适应分类数
if ${numClasses} != 1000:
    self.${layerName}.classifier[-1] = nn.Linear(4096, ${numClasses})`;
  }

  /**
   * 生成MobileNet V2层代码
   */
  private generateMobileNetV2Layer(node: CanvasNode, layerName: string): string {
    const pretrained = this.getParamValue(node, 'pretrained', false);
    const numClasses = this.getParamValue(node, 'num_classes', 1000);
    const widthMult = this.getParamValue(node, 'width_mult', 1.0);

    const weightsStr = pretrained ? `weights='IMAGENET1K_V2'` : `weights=None`;

    return `self.${layerName} = models.mobilenet_v2(${weightsStr})
# 修改最后的分类器以适应分类数
if ${numClasses} != 1000:
    self.${layerName}.classifier[-1] = nn.Linear(self.${layerName}.classifier[-1].in_features, ${numClasses})`;
  }

  /**
   * 生成EfficientNet层代码
   */
  private generateEfficientNetLayer(node: CanvasNode, layerName: string): string {
    const version = this.getParamValue(node, 'version', 'b0');
    const pretrained = this.getParamValue(node, 'pretrained', false);
    const numClasses = this.getParamValue(node, 'num_classes', 1000);

    const weightsStr = pretrained ? `weights='IMAGENET1K_V1'` : `weights=None`;

    return `self.${layerName} = models.efficientnet_${version}(${weightsStr})
# 修改最后的分类器以适应分类数
if ${numClasses} != 1000:
    self.${layerName}.classifier[-1] = nn.Linear(self.${layerName}.classifier[-1].in_features, ${numClasses})`;
  }

  /**
   * 生成DenseNet层代码
   */
  private generateDenseNetLayer(node: CanvasNode, layerName: string): string {
    const numLayers = this.getParamValue(node, 'num_layers', '121');
    const pretrained = this.getParamValue(node, 'pretrained', false);
    const numClasses = this.getParamValue(node, 'num_classes', 1000);

    const weightsStr = pretrained ? `weights='IMAGENET1K_V1'` : `weights=None`;

    return `self.${layerName} = models.densenet${numLayers}(${weightsStr})
# 修改最后的分类器以适应分类数
if ${numClasses} != 1000:
    self.${layerName}.classifier = nn.Linear(self.${layerName}.classifier.in_features, ${numClasses})`;
  }

  /**
   * 生成BERT层代码
   */
  private generateBERTLayer(node: CanvasNode, layerName: string): string {
    const modelName = this.getParamValue(node, 'model_name', 'bert-base-uncased');
    const numLabels = this.getParamValue(node, 'num_labels', 2);
    const fromPretrained = this.getParamValue(node, 'from_pretrained', true);

    return `# BERT 模型需要安装 transformers 库: pip install transformers
from transformers import BertModel, BertForSequenceClassification

if ${fromPretrained}:
    self.${layerName} = BertForSequenceClassification.from_pretrained('${modelName}', num_labels=${numLabels})
else:
    from transformers import BertConfig
    config = BertConfig(num_labels=${numLabels})
    self.${layerName} = BertForSequenceClassification(config)`;
  }

  /**
   * 生成GPT-2层代码
   */
  private generateGPT2Layer(node: CanvasNode, layerName: string): string {
    const modelName = this.getParamValue(node, 'model_name', 'gpt2');
    const fromPretrained = this.getParamValue(node, 'from_pretrained', true);
    const taskType = this.getParamValue(node, 'task_type', 'language_modeling');

    let modelClass = 'GPT2LMHeadModel';
    if (taskType === 'sequence_classification') {
      modelClass = 'GPT2ForSequenceClassification';
    }

    return `# GPT-2 模型需要安装 transformers 库: pip install transformers
from transformers import ${modelClass}

if ${fromPretrained}:
    self.${layerName} = ${modelClass}.from_pretrained('${modelName}')
else:
    from transformers import GPT2Config
    config = GPT2Config()
    self.${layerName} = ${modelClass}(config)`;
  }

  /**
   * 生成Transformer层代码
   */
  private generateTransformerLayer(node: CanvasNode, layerName: string): string {
    const dModel = this.getParamValue(node, 'd_model', 512);
    const nhead = this.getParamValue(node, 'nhead', 8);
    const numEncoderLayers = this.getParamValue(node, 'num_encoder_layers', 6);
    const numDecoderLayers = this.getParamValue(node, 'num_decoder_layers', 6);
    const dimFeedforward = this.getParamValue(node, 'dim_feedforward', 2048);
    const dropout = this.getParamValue(node, 'dropout', 0.1);
    const activation = this.getParamValue(node, 'activation', 'relu');
    const batchFirst = this.toPythonBool(this.getParamValue(node, 'batch_first', true));

    return `self.${layerName} = nn.Transformer(
    d_model=${dModel},
    nhead=${nhead},
    num_encoder_layers=${numEncoderLayers},
    num_decoder_layers=${numDecoderLayers},
    dim_feedforward=${dimFeedforward},
    dropout=${dropout},
    activation='${activation}',
    batch_first=${batchFirst}
)`;
  }

  /**
   * 生成ReLU激活层代码
   */
  private generateReLULayer(node: CanvasNode, layerName: string): string {
    const inplace = this.toPythonBool(this.getParamValue(node, 'inplace', false));

    return `self.${layerName} = nn.ReLU(inplace=${inplace})`;
  }

  /**
   * 生成Sigmoid激活层代码
   */
  private generateSigmoidLayer(node: CanvasNode, layerName: string): string {
    return `self.${layerName} = nn.Sigmoid()`;
  }

  /**
   * 生成Tanh激活层代码
   */
  private generateTanhLayer(node: CanvasNode, layerName: string): string {
    return `self.${layerName} = nn.Tanh()`;
  }

  /**
   * 生成Leaky ReLU激活层代码
   */
  private generateLeakyReLULayer(node: CanvasNode, layerName: string): string {
    const negativeSlope = this.getParamValue(node, 'negative_slope', 0.01);
    const inplace = this.toPythonBool(this.getParamValue(node, 'inplace', false));

    return `self.${layerName} = nn.LeakyReLU(negative_slope=${negativeSlope}, inplace=${inplace})`;
  }

  /**
   * 生成ELU激活层代码
   */
  private generateELULayer(node: CanvasNode, layerName: string): string {
    const alpha = this.getParamValue(node, 'alpha', 1.0);
    const inplace = this.toPythonBool(this.getParamValue(node, 'inplace', false));

    return `self.${layerName} = nn.ELU(alpha=${alpha}, inplace=${inplace})`;
  }

  /**
   * 生成SELU激活层代码
   */
  private generateSELULayer(node: CanvasNode, layerName: string): string {
    const inplace = this.toPythonBool(this.getParamValue(node, 'inplace', false));

    return `self.${layerName} = nn.SELU(inplace=${inplace})`;
  }

  /**
   * 生成PReLU激活层代码
   */
  private generatePReLULayer(node: CanvasNode, layerName: string): string {
    const numParameters = this.getParamValue(node, 'num_parameters', 1);
    const init = this.getParamValue(node, 'init', 0.25);

    return `self.${layerName} = nn.PReLU(num_parameters=${numParameters}, init=${init})`;
  }

  /**
   * 生成Mish激活层代码
   */
  private generateMishLayer(node: CanvasNode, layerName: string): string {
    const inplace = this.toPythonBool(this.getParamValue(node, 'inplace', false));

    return `self.${layerName} = nn.Mish(inplace=${inplace})`;
  }

  /**
   * 生成Swish激活层代码（也称为SiLU）
   */
  private generateSwishLayer(node: CanvasNode, layerName: string): string {
    const inplace = this.toPythonBool(this.getParamValue(node, 'inplace', false));

    return `self.${layerName} = nn.SiLU(inplace=${inplace})  # Swish activation`;
  }

  // ==================== 工具层 ====================

  /**
   * 生成Dropout层代码
   */
  private generateDropoutLayer(node: CanvasNode, layerName: string): string {
    const p = this.getParamValue(node, 'p', 0.5);
    const inplace = this.toPythonBool(this.getParamValue(node, 'inplace', false));

    return `self.${layerName} = nn.Dropout(p=${p}, inplace=${inplace})`;
  }

  /**
   * 生成重塑层代码
   */
  private generateReshapeLayer(node: CanvasNode, layerName: string): string {
    const shape = this.getParamValue(node, 'shape', '-1, 128');

    // Reshape不需要定义层，在forward中直接使用view或reshape
    return `# Reshape layer - will be applied in forward() method
# Target shape: (${shape})`;
  }

  /**
   * 生成拼接层代码
   */
  private generateConcatenateLayer(node: CanvasNode, layerName: string): string {
    const dim = this.getParamValue(node, 'dim', 1);

    // Concatenate不需要定义层，在forward中使用torch.cat
    return `# Concatenate layer - will use torch.cat() in forward() method
# Concatenation dimension: ${dim}`;
  }

  /**
   * 生成相加层代码
   */
  private generateAddLayer(node: CanvasNode, layerName: string): string {
    // Add不需要定义层，在forward中直接相加
    return `# Add layer - will use element-wise addition in forward() method`;
  }

  /**
   * 生成相乘层代码
   */
  private generateMultiplyLayer(node: CanvasNode, layerName: string): string {
    // Multiply不需要定义层，在forward中直接相乘
    return `# Multiply layer - will use element-wise multiplication in forward() method`;
  }

  /**
   * 生成恒等层代码
   */
  private generateIdentityLayer(node: CanvasNode, layerName: string): string {
    return `self.${layerName} = nn.Identity()`;
  }

  /**
   * 生成零填充层代码
   */
  private generateZeroPadding2dLayer(node: CanvasNode, layerName: string): string {
    const padding = this.getParamValue(node, 'padding', 1);

    return `self.${layerName} = nn.ZeroPad2d(${padding})`;
  }

  /**
   * 生成Lambda层代码
   */
  private generateLambdaLayer(node: CanvasNode, layerName: string): string {
    const func = this.getParamValue(node, 'function', 'lambda x: x * 2');

    return `# Lambda layer - Custom function
# Note: PyTorch doesn't have a built-in Lambda layer
# You can implement this in forward() method or create a custom module
# Function: ${func}
self.${layerName} = nn.Identity()  # Placeholder - implement custom logic in forward()`;
  }

  /**
   * 生成自定义层代码
   */
  private generateCustomLayer(node: CanvasNode, layerName: string): string {
    return `# ${node.name} layer
self.${layerName} = nn.Identity()  # 占位符，请替换为实际实现`
  }

  /**
   * 生成forward方法代码
   */
  private generateForwardCode(): string {
    const topoSortedNodes = this.getTopologicalSortedNodes()
    const forwardSteps: string[] = []

    // 跟踪每个节点的输出变量名
    const nodeOutputVar = new Map<string, string>()

    // 添加输入注释
    forwardSteps.push('# 输入处理')
    forwardSteps.push('# x shape: [batch_size, channels, height, width] 或 [batch_size, features]')
    forwardSteps.push('')

    topoSortedNodes.forEach((node, index) => {
      const layerName = this.getLayerName(node, index + 1)

      // 获取当前节点的上游连接
      const upstreamConnections = this.connections.filter(conn => conn.target.nodeId === node.id)

      let inputVar = 'x' // 默认输入
      let outputVar = 'x' // 默认输出

      if (upstreamConnections.length > 1) {
        // 多个输入的情况（Add, Concat等）
        const inputVars = upstreamConnections.map(conn => {
          const sourceNode = this.nodes.find(n => n.id === conn.source.nodeId)
          return nodeOutputVar.get(conn.source.nodeId) || 'x'
        })

        forwardSteps.push(`# ${node.name} - 合并多个输入`)

        if (node.type === 'add' || node.name === '加法层') {
          // Add 操作
          outputVar = `x${index + 1}`
          forwardSteps.push(`${outputVar} = ${inputVars.join(' + ')}`)
        } else if (node.type === 'concat' || node.name === '连接层') {
          // Concat 操作
          outputVar = `x${index + 1}`
          forwardSteps.push(`${outputVar} = torch.cat([${inputVars.join(', ')}], dim=1)`)
        } else {
          // 其他多输入节点
          outputVar = `x${index + 1}`
          forwardSteps.push(`${outputVar} = self.${layerName}(${inputVars.join(', ')})`)
        }

      } else if (upstreamConnections.length === 1) {
        // 单个输入的情况 - 使用上游节点的输出
        const sourceNodeId = upstreamConnections[0].source.nodeId
        inputVar = nodeOutputVar.get(sourceNodeId) || 'x'
        outputVar = `x${index + 1}`

        forwardSteps.push(`# ${node.name}`)

        // 特殊处理：LSTM返回两个值
        if (node.type === 'lstm') {
          forwardSteps.push(`${outputVar}, _ = self.${layerName}(${inputVar})`)
        } else {
          forwardSteps.push(`${outputVar} = self.${layerName}(${inputVar})`)
        }

      } else {
        // 输入层（没有上游连接）
        outputVar = `x${index + 1}`
        forwardSteps.push(`# ${node.name} - 输入层`)

        // 特殊处理：LSTM返回两个值
        if (node.type === 'lstm') {
          forwardSteps.push(`${outputVar}, _ = self.${layerName}(x)`)
        } else {
          forwardSteps.push(`${outputVar} = self.${layerName}(x)`)
        }
      }

      // 记录当前节点的输出变量
      nodeOutputVar.set(node.id, outputVar)

      // 添加形状注释
      const outputShape = this.estimateOutputShape(node)
      if (outputShape) {
        forwardSteps.push(`# Output shape: ${outputShape}`)
      }
      forwardSteps.push('')
    })

    // 找到所有输出端点（没有下游连接的节点）
    const outputNodes = topoSortedNodes.filter(node => {
      const downstreamConnections = this.connections.filter(conn => conn.source.nodeId === node.id)
      return downstreamConnections.length === 0
    })

    // 根据输出节点数量决定返回值
    if (outputNodes.length === 0) {
      // 没有输出节点（可能是循环），返回最后一个节点
      const lastNode = topoSortedNodes[topoSortedNodes.length - 1]
      const finalOutput = lastNode ? nodeOutputVar.get(lastNode.id) || 'x' : 'x'
      forwardSteps.push(`return ${finalOutput}`)
    } else if (outputNodes.length === 1) {
      // 单个输出节点
      const finalOutput = nodeOutputVar.get(outputNodes[0].id) || 'x'
      forwardSteps.push(`return ${finalOutput}`)
    } else {
      // 多个输出节点 - 返回元组
      const outputs = outputNodes.map(node => nodeOutputVar.get(node.id) || 'x')
      forwardSteps.push(`# 多个输出端点`)
      forwardSteps.push(`return ${outputs.join(', ')}  # 返回多个输出`)
    }

    return forwardSteps.join('\n')
  }

  /**
   * 生成单个输入的处理代码
   */
  private generateSingleInputCode(node: CanvasNode, layerName: string, inputVarName: string): string {
    if (node.type === 'conv2d' || node.type === 'pooling') {
      return `# ${node.name} layer`
    } else if (node.type === 'linear') {
      return `# ${node.name} layer (flatten if needed)`
    }
    return `# ${node.name} layer`
  }

  /**
   * 生成输入层的处理代码
   */
  private generateInputLayerCode(node: CanvasNode, layerName: string, inputVarName: string): string {
    if (node.type === 'linear') {
      return `# ${node.name} - Input layer
# Flatten input if needed: x = x.view(x.size(0), -1)`
    }
    return `# ${node.name} - Input layer`
  }

  /**
   * 生成多个输入的处理代码
   */
  private generateMultipleInputsCode(node: CanvasNode, layerName: string, connections: Connection[]): string {
    const inputVars = connections.map((conn, idx) => `x${idx + 1}`)
    return `# ${node.name} - Multiple inputs
# Combine inputs from: ${inputVars.join(', ')}
# Example: x = torch.cat([${inputVars.join(', ')}], dim=1)`
  }

  /**
   * 估计输出形状
   */
  private estimateOutputShape(node: CanvasNode): string | null {
    switch (node.type) {
      case 'conv2d':
        return '[batch_size, channels_out, height_out, width_out]'
      case 'linear':
        return '[batch_size, features_out]'
      case 'pooling':
        return '[batch_size, channels, height/2, width/2]'
      case 'lstm':
        return '[seq_len, batch_size, hidden_size]'
      default:
        return null
    }
  }

  /**
   * 生成训练代码
   */
  /**
   * 生成训练代码
   */
  private generateTrainingCode(): string {
    const modelName = 'AIModel'

    // 使用模板生成代码
    return TemplateLoader.loadAndProcess('train', {
      MODEL_NAME: modelName
    })
  }

  /**
   * 生成推理代码
   */
  private generateInferenceCode(): string {
    const modelName = 'AIModel'

    // 使用模板生成代码
    return TemplateLoader.loadAndProcess('inference', {
      MODEL_NAME: modelName
    })
  }

  /**
   * 生成模型摘要
   */
  private generateModelSummary(): string {
    const topoSortedNodes = this.getTopologicalSortedNodes()

    let summary = `Model Structure Summary:\n`
    summary += `Total Layers: ${topoSortedNodes.length}\n`
    summary += `Total Connections: ${this.connections.length}\n\n`

    summary += `Layer Sequence:\n`
    summary += `┌──────────────────────────────────────┬─────────────────┐\n`
    summary += `│ Layer Name                           │ Type            │\n`
    summary += `├──────────────────────────────────────┼─────────────────┤\n`

    topoSortedNodes.forEach((node, index) => {
      const layerName = this.getLayerName(node, index + 1)
      const nodeType = this.getNodeTypeDisplayName(node)
      summary += `│ ${layerName.padEnd(36)} │ ${nodeType.padEnd(15)} │\n`
    })

    summary += `└──────────────────────────────────────┴─────────────────┘\n\n`

    // 参数估计
    const paramEstimate = this.estimateParameters()
    summary += `Parameter Estimation:\n`
    summary += `  • Total Parameters: ~${paramEstimate.toLocaleString()}\n`
    summary += `  • Model Size: ~${(paramEstimate * 4 / 1024 / 1024).toFixed(2)} MB (FP32)\n\n`

    // 输入输出信息
    summary += `Input/Output Information:\n`
    const inputNodes = this.nodes.filter(node =>
      this.connections.filter(conn => conn.target.nodeId === node.id).length === 0
    )
    const outputNodes = this.nodes.filter(node =>
      this.connections.filter(conn => conn.source.nodeId === node.id).length === 0
    )

    if (inputNodes.length > 0) {
      summary += `  • Input Layers: ${inputNodes.map(n => n.name).join(', ')}\n`
    }
    if (outputNodes.length > 0) {
      summary += `  • Output Layers: ${outputNodes.map(n => n.name).join(', ')}\n`
    }

    return summary
  }

  /**
   * 生成代码中的模型摘要
   */
  private generateModelSummaryForCode(): string {
    const topoSortedNodes = this.getTopologicalSortedNodes()
    let summary = ''

    topoSortedNodes.forEach((node, index) => {
      const layerName = this.getLayerName(node, index + 1)
      const nodeType = this.getNodeTypeDisplayName(node)
      summary += `print(f"${layerName}: ${nodeType}")\n`
    })

    return summary
  }

  /**
   * 估计参数数量
   */
  private estimateParameters(): number {
    let totalParams = 0

    this.nodes.forEach(node => {
      switch (node.type) {
        case 'linear':
          const inFeatures = this.getParamValue(node, 'in_features', 64)
          const outFeatures = this.getParamValue(node, 'out_features', 128)
          const hasBias = this.getParamValue(node, 'bias', true)
          totalParams += inFeatures * outFeatures + (hasBias ? outFeatures : 0)
          break
        case 'conv2d':
          const inChannels = this.getParamValue(node, 'in_channels', 3)
          const outChannels = this.getParamValue(node, 'out_channels', 64)
          const kernelSize = this.getParamValue(node, 'kernel_size', 3)
          const hasConvBias = this.getParamValue(node, 'bias', true)
          totalParams += inChannels * outChannels * kernelSize * kernelSize + (hasConvBias ? outChannels : 0)
          break
        case 'batchnorm':
          const numFeatures = this.getParamValue(node, 'num_features', 64)
          totalParams += numFeatures * 2 // gamma and beta
          break
        case 'lstm':
          const inputSize = this.getParamValue(node, 'input_size', 128)
          const hiddenSize = this.getParamValue(node, 'hidden_size', 256)
          const numLayers = this.getParamValue(node, 'num_layers', 1)
          const bidirectional = this.getParamValue(node, 'bidirectional', false)
          const directions = bidirectional ? 2 : 1
          // LSTM参数计算公式：4 * (input_size + hidden_size) * hidden_size * num_layers * directions
          totalParams += 4 * (inputSize + hiddenSize) * hiddenSize * numLayers * directions
          break
        default:
          // 对于其他层，使用默认估计
          totalParams += 1000
      }
    })

    return totalParams
  }

  /**
   * 生成依赖项
   */
  private generateRequirements(): string[] {
    const requirements = [
      'torch>=1.9.0',
      'torchvision>=0.10.0'
    ]

    // 根据使用的模型添加额外依赖
    if (this.nodes.some(node => node.type === 'resnet' || node.type === 'vgg')) {
      requirements.push('torchvision>=0.10.0')
    }

    return requirements
  }

  /**
   * 获取空代码模板
   */
  private getEmptyCode(): GeneratedCode {
    return {
      modelCode: `import torch
import torch.nn as nn

class AIModel(nn.Module):
    def __init__(self):
        super(AIModel, self).__init__()
        # 添加你的层定义在这里
    
    def forward(self, x):
        # 添加你的前向传播逻辑在这里
        return x
    
    def summary(self):
        print("Model is empty. Add layers from the toolbox.")`,
      trainingCode: '# 添加层到画布后，训练代码将自动生成',
      inferenceCode: '# 添加层到画布后，推理代码将自动生成',
      requirements: ['torch>=1.9.0'],
      modelSummary: 'Model is empty. Drag and drop layers from the toolbox to build your model.'
    }
  }

  /**
   * 是否需要导入torchvision
   */
  private shouldImportTorchVision(): boolean {
    return this.nodes.some(node => node.type === 'resnet' || node.type === 'vgg')
  }

  /**
   * 获取层名称
   */
  private getLayerName(node: CanvasNode, index: number): string {
    const prefix = this.getLayerPrefix(node.type)
    return `${prefix}${index}`
  }

  /**
   * 获取层前缀
   */
  private getLayerPrefix(layerType: string): string {
    const prefixes: Record<string, string> = {
      // 基础层
      'layer': 'linear',
      'linear': 'linear',
      'flatten': 'flatten',
      'embedding': 'embed',
      // 卷积层
      'conv1d': 'conv1d',
      'conv2d': 'conv2d',
      'conv3d': 'conv3d',
      'depthwise_conv2d': 'dwconv',
      'transposed_conv2d': 'convT',
      // 池化层
      'maxpool1d': 'maxpool1d',
      'avgpool1d': 'avgpool1d',
      'maxpool2d': 'maxpool2d',
      'avgpool2d': 'avgpool2d',
      'adaptive_maxpool2d': 'adaptmax',
      'global_avgpool': 'gap',
      // 归一化层
      'batchnorm1d': 'bn1d',
      'batchnorm2d': 'bn2d',
      'layernorm': 'ln',
      'instancenorm2d': 'in2d',
      'groupnorm': 'gn',
      // 循环层
      'lstm': 'lstm',
      'gru': 'gru',
      'rnn': 'rnn',
      // 注意力层
      'multihead_attention': 'mha',
      'self_attention': 'self_attn',
      'scaled_dot_product_attention': 'sdpa',
      // 预训练模型
      'resnet': 'resnet',
      'vgg': 'vgg',
      'model': 'model'
    }
    return prefixes[layerType] || 'layer'
  }

  /**
   * 获取节点类型显示名称
   */
  private getNodeTypeDisplayName(node: CanvasNode): string {
    // 使用 node.name（中文名称）作为键，返回对应的英文显示名称
    const names: Record<string, string> = {
      // 基础层
      '全连接层': 'Linear',
      '展平层': 'Flatten',
      '嵌入层': 'Embedding',

      // 卷积层
      '一维卷积': 'Conv1d',
      '二维卷积': 'Conv2d',
      '三维卷积': 'Conv3d',
      '深度可分离卷积': 'DepthwiseSeparableConv2d',
      '转置卷积': 'ConvTranspose2d',

      // 池化层
      '一维最大池化': 'MaxPool1d',
      '一维平均池化': 'AvgPool1d',
      '二维最大池化': 'MaxPool2d',
      '二维平均池化': 'AvgPool2d',
      '自适应最大池化': 'AdaptiveMaxPool2d',
      '全局平均池化': 'AdaptiveAvgPool2d',

      // 归一化层
      '一维批归一化': 'BatchNorm1d',
      '二维批归一化': 'BatchNorm2d',
      '层归一化': 'LayerNorm',
      '实例归一化': 'InstanceNorm2d',
      '组归一化': 'GroupNorm',

      // 循环层
      'LSTM层': 'LSTM',
      'GRU层': 'GRU',
      'RNN层': 'RNN',

      // 注意力层
      '多头注意力': 'MultiheadAttention',
      '自注意力': 'SelfAttention',
      '缩放点积注意力': 'ScaledDotProductAttention',

      // 激活函数层
      'ReLU': 'ReLU',
      'Sigmoid': 'Sigmoid',
      'Tanh': 'Tanh',
      'Leaky ReLU': 'LeakyReLU',
      'ELU': 'ELU',
      'SELU': 'SELU',
      'PReLU': 'PReLU',
      'Mish': 'Mish',
      'Swish': 'SiLU',

      // 预训练模型
      'ResNet': 'ResNet',
      'VGGNet': 'VGG',
      'MobileNet V2': 'MobileNetV2',
      'EfficientNet': 'EfficientNet',
      'DenseNet': 'DenseNet',
      'BERT': 'BERT',
      'GPT-2': 'GPT2',
      'Transformer': 'Transformer',

      // 工具层
      'Dropout层': 'Dropout',
      '重塑层': 'Reshape',
      '拼接层': 'Concatenate',
      '相加层': 'Add',
      '相乘层': 'Multiply',
      '恒等层': 'Identity',
      '零填充层': 'ZeroPad2d',
      'Lambda层': 'Lambda'
    }

    return names[node.name] || node.name || 'Unknown'
  }

  /**
   * 获取参数值
   */
  private getParamValue(node: CanvasNode, key: string, defaultValue: any): any {
    const param = node.params.find(p => p.key === key)
    return param ? param.value : defaultValue
  }

  /**
   * 缩进代码
   */
  private indent(code: string, spaces: number): string {
    const indent = ' '.repeat(spaces)
    return code.split('\n').map(line => indent + line).join('\n')
  }
}

// 注意：布尔值转换现在通过 toPythonBool 方法处理