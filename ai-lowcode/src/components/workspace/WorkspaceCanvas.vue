<template>
  <div class="workspace-canvas">
    <!-- 画布头部 -->
    <div class="canvas-header">
      <div class="canvas-title">
        <h3>模型构建画布</h3>
        <div class="canvas-meta">
          <el-tooltip content="节点数量" placement="bottom">
            <el-tag size="small" type="info" class="node-count">
              <el-icon><Collection /></el-icon>
              <span>{{ nodes.length }}</span>
            </el-tag>
          </el-tooltip>
        </div>
      </div>
      <div class="canvas-actions">
        <!-- 代码生成相关按钮 -->
        <el-button-group>
          <el-tooltip content="生成代码" placement="bottom">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleManualGenerate"
              :loading="isGeneratingCode"
              data-tour="generate-code"
            >
              <el-icon><MagicStick /></el-icon>
              生成代码
            </el-button>
          </el-tooltip>
          <el-tooltip content="代码设置" placement="bottom">
            <el-button 
              size="small"
              @click="showCodeSettings = !showCodeSettings"
            >
              <el-icon><Setting /></el-icon>
            </el-button>
          </el-tooltip>
        </el-button-group>
        
        <el-divider direction="vertical" style="margin: 0 8px" />
        
        <el-button-group>
          <el-button size="small" @click="clearCanvas">
            <el-icon><Refresh /></el-icon>
            清空画布
          </el-button>
          <el-button size="small" @click="resetStorage" type="warning">
            <el-icon><Delete /></el-icon>
            重置数据
          </el-button>
        </el-button-group>
      </div>
    </div>
    
    <!-- 代码设置面板 -->
    <el-collapse-transition>
      <div v-if="showCodeSettings" class="code-settings-panel">
        <el-form label-width="120px" size="small">
          <el-form-item label="自动生成代码">
            <el-switch
              v-model="codeStore.autoGenerate"
              @change="codeStore.updateAutoGenerate"
            />
          </el-form-item>
          <el-form-item label="代码历史">
            <div class="generation-history">
              <div 
                v-for="(record, index) in codeStore.generationHistory" 
                :key="index"
                class="history-item"
              >
                <el-icon><Clock /></el-icon>
                <span>{{ record }}</span>
              </div>
              <div v-if="codeStore.generationHistory.length === 0" class="no-history">
                暂无生成历史
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </el-collapse-transition>
    
    <!-- 画布区域 -->
    <div
      ref="canvasRef"
      class="canvas-area"
      :class="{ 'is-panning': isPanning }"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @mousedown="handleCanvasMouseDown"
      @contextmenu.prevent="handleCanvasContextMenu"
      @wheel="handleWheel"
    >
      <!-- 视口层：随缩放平移 -->
      <div
        class="viewport-layer"
        :style="{
          transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.scale})`
        }"
      >
      <!-- 空状态提示 -->
      <div v-if="nodes.length === 0" class="empty-state">
        <el-icon :size="60" color="#c0c4cc"><Promotion /></el-icon>
        <p class="title">拖拽组件到此处开始构建</p>
        <p class="subtitle">从左侧组件库拖拽模块到画布，拖动连接点创建连接</p>
      </div>
      
      <!-- 节点容器 -->
      <div 
        v-for="node in nodes" 
        :key="node.id"
        class="canvas-node"
        :class="{ 'selected': selectedNodeId === node.id, 'dragging': draggingNodeId === node.id }"
        :style="{
          transform: `translate3d(${node.position.x}px, ${node.position.y}px, 0)`
        }"
        @mousedown.stop="startNodeDrag($event, node)"
        @dblclick.stop="handleNodeDoubleClick(node)"
        @click.stop="selectNode(node)"
        @contextmenu.prevent="handleNodeContextMenu($event, node)"
      >
        <!-- 节点头部 -->
        <div class="node-header">
          <div class="node-icon">
            <el-icon>
              <component :is="node.icon" />
            </el-icon>
          </div>
          <div class="node-info">
            <div class="node-title">{{ node.name }}</div>
            <div class="node-type">{{ getNodeTypeLabel(node.category) }}</div>
          </div>
          <div class="node-badges">
            <el-badge
              v-if="connectionManager.getUpstreamCount(node.id) > 0"
              :value="connectionManager.getUpstreamCount(node.id)"
              type="info"
              size="small"
            />
            <el-badge
              v-if="connectionManager.getDownstreamCount(node.id) > 0"
              :value="connectionManager.getDownstreamCount(node.id)"
              type="success"
              size="small"
              style="margin-left: 4px"
            />
          </div>
          <el-dropdown trigger="click" @command="handleNodeCommand">
            <el-button class="node-menu" type="text" size="small">
              <el-icon><More /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="{ type: 'edit', node }">
                  <el-icon><Edit /></el-icon>
                  编辑参数
                </el-dropdown-item>
                <el-dropdown-item :command="{ type: 'duplicate', node }">
                  <el-icon><CopyDocument /></el-icon>
                  复制节点
                </el-dropdown-item>
                <el-dropdown-item :command="{ type: 'disconnect-all', node }">
                  <el-icon><Disconnect /></el-icon>
                  断开所有连接
                </el-dropdown-item>
                <el-dropdown-item divided :command="{ type: 'delete', node }">
                  <el-icon><Delete /></el-icon>
                  <span style="color: #f56c6c">删除节点</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        
        <!-- 节点内容 -->
        <div class="node-content">
          <div class="node-params">
            <div v-for="param in getDisplayParams(node.params)" :key="param.key" class="param-item">
              <div class="param-label">{{ param.label }}:</div>
              <div class="param-value">{{ formatParamValue(param) }}</div>
            </div>
            <div v-if="hasMoreParams(node.params)" class="param-more">
              <el-icon><MoreFilled /></el-icon>
              更多参数...
            </div>
          </div>
        </div>
        
        <!-- 输入连接点 -->
        <div class="input-points">
          <div
            v-for="input in node.inputs"
            :key="input.id"
            class="connection-point input-point"
            :class="{ 'connected': input.connectedTo && input.connectedTo.length > 0 }"
            :title="input.name"
            @mousedown.stop="startConnectionDrag($event, node, input, 'input')"
          >
            <!-- 定位容器：确保圆形位置固定 -->
            <div class="point-indicator-wrapper">
              <div class="point-indicator"></div>
            </div>
            <!-- 标签独立出来 -->
            <div class="point-label">{{ input.name }}</div>
          </div>
        </div>
        
        <!-- 输出连接点 (镜像调整) -->
        <div class="output-points">
          <div
            v-for="output in node.outputs"
            :key="output.id"
            class="connection-point output-point"
            :class="{ 'connected': output.connectedTo && output.connectedTo.length > 0 }"
            :title="output.name"
            @mousedown.stop="startConnectionDrag($event, node, output, 'output')"
          >
            <!-- 标签独立出来（输出点标签在左） -->
            <div class="point-label">{{ output.name }}</div>
            <!-- 定位容器：确保圆形位置固定 -->
            <div class="point-indicator-wrapper">
              <div class="point-indicator"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 连接线图层 -->
      <svg class="connections-layer">
        <!-- 箭头定义 -->
        <defs>
          <marker 
            id="arrowhead-default" 
            markerWidth="10" 
            markerHeight="7" 
            refX="9" 
            refY="3.5" 
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#409eff" />
          </marker>
          <marker 
            id="arrowhead-filled" 
            markerWidth="10" 
            markerHeight="7" 
            refX="9" 
            refY="3.5" 
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#409eff" />
          </marker>
          <marker 
            id="arrowhead-hollow" 
            markerWidth="10" 
            markerHeight="7" 
            refX="9" 
            refY="3.5" 
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="white" stroke="#409eff" stroke-width="1" />
          </marker>
        </defs>
        
        <!-- 现有连接 -->
        <g
          v-for="connection in connections"
          :key="connection.id"
          :class="['connection-line', { 'selected': selectedConnectionId === connection.id }]"
          @click.stop="selectConnection(connection.id)"
          @dblclick.stop="deleteConnection(connection.id)"
          @contextmenu.prevent.stop="handleConnectionContextMenu($event, connection)"
        >
          <!-- 连接路径 -->
          <path
            :d="connection.path"
            :stroke="connection.style.color"
            :stroke-width="connection.style.width"
            :stroke-dasharray="connection.style.dashed ? '5,5' : 'none'"
            fill="none"
            marker-end="url(#arrowhead-default)"
            class="connection-path"
          />

          <!-- 交互区域（更宽的透明路径） -->
          <path
            :d="connection.path"
            stroke="transparent"
            stroke-width="12"
            fill="none"
            class="connection-interactive"
          />
        </g>
        
        <!-- 临时连接线 -->
        <line
          v-if="tempConnection"
          :x1="tempConnection.source.x"
          :y1="tempConnection.source.y"
          :x2="tempConnection.target.x"
          :y2="tempConnection.target.y"
          :stroke="tempConnection.isValid ? '#67c23a' : '#f56c6c'"
          stroke-width="2"
          stroke-dasharray="5,5"
          marker-end="url(#arrowhead-default)"
        />
      </svg>
      </div> <!-- /viewport-layer -->

      <!-- 连接验证提示（屏幕坐标，不随视口缩放） -->
      <div
        v-if="tempConnection && !tempConnection.isValid"
        class="connection-validation-hint"
        :style="{
          left: `${worldToScreen(tempConnection.target.x, tempConnection.target.y).x + 10}px`,
          top: `${worldToScreen(tempConnection.target.x, tempConnection.target.y).y}px`
        }"
      >
        <el-alert
          :title="tempConnection.validationMessage"
          type="error"
          :closable="false"
          show-icon
          size="small"
          style="width: 200px"
        />
      </div>
      
      <!-- 右键菜单 -->
      <div
        v-if="contextMenu.visible"
        class="context-menu"
        :style="{
          left: `${contextMenu.x}px`,
          top: `${contextMenu.y}px`
        }"
        @click.stop
      >
        <div class="menu-header">
          <span v-if="contextMenu.node">{{ contextMenu.node.name }}</span>
          <span v-else-if="contextMenu.connection">连接线</span>
          <span v-else>画布</span>
        </div>
        <div class="menu-items">
          <div v-if="contextMenu.node" class="menu-item" @click="handleMenuAction('edit')">
            <el-icon><Edit /></el-icon>
            <span>编辑节点</span>
          </div>
          <div v-if="contextMenu.node" class="menu-item" @click="handleMenuAction('duplicate')">
            <el-icon><CopyDocument /></el-icon>
            <span>复制节点</span>
          </div>
          <div v-if="contextMenu.connection" class="menu-item" @click="handleMenuAction('delete-connection')">
            <el-icon><Delete /></el-icon>
            <span style="color: #f56c6c">删除连接</span>
          </div>
          <div v-if="contextMenu.node" class="menu-item" @click="handleMenuAction('disconnect-all')">
            <el-icon><Disconnect /></el-icon>
            <span>断开所有连接</span>
          </div>
          <div class="menu-divider" v-if="contextMenu.node"></div>
          <div class="menu-item" @click="handleMenuAction('arrange-nodes')">
            <el-icon><Grid /></el-icon>
            <span>自动排列节点</span>
          </div>
          <div class="menu-item" @click="handleMenuAction('validate-model')">
            <el-icon><Check /></el-icon>
            <span>验证模型</span>
          </div>
        </div>
      </div>

      <!-- 视口控制 -->
      <div class="viewport-controls">
        <el-button size="small" plain @click="resetViewport">
          <el-icon><Refresh /></el-icon>
        </el-button>
        <span class="scale-text">{{ Math.round(viewport.scale * 100) }}%</span>
      </div>
    </div>

    <!-- 画布底部 -->
    <div class="canvas-footer">
      <div class="canvas-info">
        节点数: {{ nodes.length }} | 连接数: {{ connections.length }}
        <span v-if="hasCycles" class="cycle-warning">
          <el-icon><Warning /></el-icon>
          模型存在循环
        </span>
      </div>
      <div class="canvas-hint">
        <el-icon><InfoFilled /></el-icon>
        提示: 代码已自动生成，在右侧面板查看
        <el-button 
          v-if="codeStore.generatedCode" 
          type="text" 
          size="small"
          @click="handleManualGenerate"
        >
          重新生成
        </el-button>
      </div>
    </div>
    
    <!-- 节点编辑对话框 -->
    <NodeEditor
      v-model="showNodeEditor"
      :node="editingNode"
      @save="handleNodeSave"
    />
    
    <!-- 模型验证对话框 -->
    <el-dialog
      v-model="showValidationDialog"
      title="模型验证"
      width="500px"
    >
      <div v-if="validationResult" class="validation-result">
        <div v-if="validationResult.valid" class="validation-success">
          <el-icon color="#67c23a" :size="40"><CircleCheckFilled /></el-icon>
          <h3>模型验证通过</h3>
          <p>模型结构完整，可以进行代码生成。</p>
        </div>
        <div v-else class="validation-error">
          <el-icon color="#f56c6c" :size="40"><CircleCloseFilled /></el-icon>
          <h3>模型验证失败</h3>
          <div class="error-list">
            <div v-for="(error, index) in validationResult.errors" :key="index" class="error-item">
              <el-icon color="#f56c6c"><Warning /></el-icon>
              <span>{{ error }}</span>
            </div>
          </div>
        </div>
        
        <div class="topology-info">
          <h4>拓扑信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">节点总数:</span>
              <span class="value">{{ nodes.length }}</span>
            </div>
            <div class="info-item">
              <span class="label">连接总数:</span>
              <span class="value">{{ connections.length }}</span>
            </div>
            <div class="info-item">
              <span class="label">输入节点:</span>
              <span class="value">{{ topology.inputNodes.length }}</span>
            </div>
            <div class="info-item">
              <span class="label">输出节点:</span>
              <span class="value">{{ topology.outputNodes.length }}</span>
            </div>
            <div class="info-item">
              <span class="label">存在循环:</span>
              <span class="value" :class="{ 'error': topology.hasCycles }">
                {{ topology.hasCycles ? '是' : '否' }}
              </span>
            </div>
          </div>
          
          <div v-if="topology.layers.length > 0" class="layers-list">
            <h4>拓扑顺序</h4>
            <div class="layers-container">
              <div
                v-for="(layerId, index) in topology.layers"
                :key="layerId"
                class="layer-item"
              >
                <span class="layer-index">{{ index + 1 }}</span>
                <span class="layer-name">{{ getNodeName(layerId) }}</span>
                <span class="layer-type">{{ getNodeType(layerId) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showValidationDialog = false">关闭</el-button>
          <el-button v-if="!validationResult?.valid" type="primary" @click="autoFixModel">
            自动修复
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Refresh, 
  Promotion, 
  More,
  Edit,
  CopyDocument,
  Delete,
  MoreFilled,
  InfoFilled,
  Check,
  Warning,
  Link,
  CircleCheckFilled,
  CircleCloseFilled,
  Grid
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import NodeEditor from './NodeEditor.vue'
import type { CanvasNode, Connection } from '../../types/node'
import { ConnectionManager } from '../../utils/connection-manager'
import { useCodeStore } from '../../stores/code'

// 节点和连接数据
const nodes = reactive<CanvasNode[]>([])
const connections = reactive<Connection[]>([])

// 节点创建编号计数器
let creationIdCounter = 0

// UI状态
const canvasRef = ref<HTMLElement>()
const selectedNodeId = ref<string>('')
const selectedConnectionId = ref<string>('')
const showNodeEditor = ref(false)
const editingNode = ref<CanvasNode | null>(null)
const showValidationDialog = ref(false)
const draggingNodeId = ref<string>('')

// 视口状态（缩放与平移）
const viewport = reactive({
  scale: 1,
  offsetX: 0,
  offsetY: 0
})
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

// 坐标转换：屏幕坐标 → 世界坐标
const screenToWorld = (sx: number, sy: number) => ({
  x: (sx - viewport.offsetX) / viewport.scale,
  y: (sy - viewport.offsetY) / viewport.scale
})

// 坐标转换：世界坐标 → 屏幕坐标
const worldToScreen = (wx: number, wy: number) => ({
  x: wx * viewport.scale + viewport.offsetX,
  y: wy * viewport.scale + viewport.offsetY
})

// 重置视口
const resetViewport = () => {
  viewport.scale = 1
  viewport.offsetX = 0
  viewport.offsetY = 0
}

// 滚轮缩放
const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return

  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  const zoomIntensity = 0.1
  const delta = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity
  const newScale = Math.min(Math.max(viewport.scale * delta, 0.6), 1)

  // 以鼠标位置为缩放中心
  viewport.offsetX = mouseX - (mouseX - viewport.offsetX) * (newScale / viewport.scale)
  viewport.offsetY = mouseY - (mouseY - viewport.offsetY) * (newScale / viewport.scale)
  viewport.scale = newScale
}

// 画布鼠标按下（处理右键平移、左键取消选中）
const handleCanvasMouseDown = (e: MouseEvent) => {
  if (e.button === 1) {
    // 中键：开始平移
    isPanning.value = true
    panStart.value = {
      x: e.clientX,
      y: e.clientY,
      offsetX: viewport.offsetX,
      offsetY: viewport.offsetY
    }
    e.preventDefault()
  } else if (e.button === 0) {
    // 左键：取消选中
    selectedNodeId.value = ''
    selectedConnectionId.value = ''
  }
}

// 全局鼠标移动（处理平移）
const handleGlobalMouseMove = (e: MouseEvent) => {
  if (isPanning.value) {
    viewport.offsetX = panStart.value.offsetX + (e.clientX - panStart.value.x)
    viewport.offsetY = panStart.value.offsetY + (e.clientY - panStart.value.y)
  }
}

// 全局鼠标抬起（结束平移）
const handleGlobalMouseUp = (e: MouseEvent) => {
  if (e.button === 1 && isPanning.value) {
    isPanning.value = false
  }
}

// 连接管理
const connectionManager = new ConnectionManager(nodes, connections)

// 临时连接状态
interface TempConnection {
  source: {
    nodeId: string
    pointId: string
    x: number
    y: number
    type: 'input' | 'output'
  }
  target: {
    x: number
    y: number
    nodeId?: string
    pointId?: string
  }
  isValid: boolean
  validationMessage?: string
}

const tempConnection = ref<TempConnection | null>(null)

// 右键菜单状态
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  node: null as CanvasNode | null,
  connection: null as Connection | null
})

// 验证结果
const validationResult = ref<{
  valid: boolean
  errors: string[]
} | null>(null)

// 拓扑信息
const topology = computed(() => {
  return connectionManager.generateTopology()
})

// 检查是否存在循环
const hasCycles = computed(() => {
  return topology.value.hasCycles
})

// 获取节点名称
const getNodeName = (nodeId: string): string => {
  const node = nodes.find(n => n.id === nodeId)
  return node?.name || nodeId
}

// 获取节点类型
const getNodeType = (nodeId: string): string => {
  const node = nodes.find(n => n.id === nodeId)
  return node ? getNodeTypeLabel(node.category) : ''
}

// 获取节点类型标签
const getNodeTypeLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'layer': '层',
    'activation': '激活函数',
    'model': '模型',
    'loss': '损失函数',
    'optimizer': '优化器'
  }
  return labels[category] || category
}

// 获取显示的参数（最多显示2个）
const getDisplayParams = (params: any[]) => {
  return params.slice(0, 2)
}


// 检查是否有更多参数
const hasMoreParams = (params: any[]) => {
  return params.length > 2
}

// 格式化参数值显示
const formatParamValue = (param: any): string => {
  if (param.type === 'boolean') {
    return param.value ? '是' : '否'
  }
  if (param.type === 'select') {
    const option = param.options?.find((opt: any) => opt.value === param.value)
    return option?.label || param.value
  }
  return String(param.value)
}

// 计算连接路径
const getConnectionPath = (connection: Connection): string => {
  const { source, target } = connection
  
  // 控制点偏移量，使连接线更平滑
  const offsetX = Math.abs(target.x - source.x) * 0.3
  
  return `
    M ${source.x} ${source.y}
    C ${source.x + offsetX} ${source.y},
      ${target.x - offsetX} ${target.y},
      ${target.x} ${target.y}
  `
}

// 拖拽放置
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'copy'
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  
  const data = e.dataTransfer?.getData('component')
  if (!data) return
  
  const component = JSON.parse(data)
  const canvasRect = canvasRef.value?.getBoundingClientRect()
  
  if (canvasRect) {
    // 创建连接点
    const inputs = component.inputs?.map((input: any, index: number) => ({
      id: `${component.id}-input-${index}`,
      name: input.name,
      type: 'input' as const,
      dataType: input.dataType,
      shape: input.shape,
      connectedTo: []
    })) || []
    
    const outputs = component.outputs?.map((output: any, index: number) => ({
      id: `${component.id}-output-${index}`,
      name: output.name,
      type: 'output' as const,
      dataType: output.dataType,
      shape: output.shape,
      connectedTo: []
    })) || []
    
    const worldPos = screenToWorld(e.clientX - canvasRect.left, e.clientY - canvasRect.top)

    const newNode: CanvasNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: component.name,
      type: component.id,
      icon: component.icon,
      description: component.description,
      category: component.category,
      position: {
        x: worldPos.x - 100,
        y: worldPos.y - 30
      },
      params: component.params ? component.params.map((param: any) => ({
        ...param,
        value: param.value
      })) : [],
      creationId: ++creationIdCounter,
      inputs,
      outputs,
      metadata: {
        layerType: component.id,
        inputShape: inputs[0]?.shape,
        outputShape: outputs[0]?.shape,
        framework: 'pytorch'
      }
    }
    
    nodes.push(newNode)
    saveCanvasState()
    
    ElMessage.success({
      message: `已添加 ${component.name} 节点`
    })
  }
}

// 画布点击
const handleCanvasClick = () => {
  selectedNodeId.value = ''
  selectedConnectionId.value = ''
}

// 选择节点
const selectNode = (node: CanvasNode) => {
  selectedNodeId.value = node.id
  selectedConnectionId.value = ''
}

// 节点双击 - 打开编辑器
const handleNodeDoubleClick = (node: CanvasNode) => {
  // 例如，在控制台检查第一个节点
  nodes.length > 0 && connectionManager.debugConnectionPoints(nodes[0]);
  editingNode.value = node
  showNodeEditor.value = true
}

// 节点命令处理
const handleNodeCommand = async (command: any) => {
  switch (command.type) {
    case 'edit':
      editingNode.value = command.node
      showNodeEditor.value = true
      break
    case 'duplicate':
      duplicateNode(command.node)
      break
    case 'disconnect-all':
      await disconnectAllNodeConnections(command.node.id)
      break
    case 'delete':
      removeNode(command.node)
      break
  }
}

// 复制节点
const duplicateNode = (node: CanvasNode) => {
  const newNode: CanvasNode = {
    ...JSON.parse(JSON.stringify(node)),
    id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    creationId: ++creationIdCounter,
    position: {
      x: node.position.x + 50,
      y: node.position.y + 50
    }
  }
  
  nodes.push(newNode)
  saveCanvasState()
  
  ElMessage.success('节点已复制')
}

// 节点保存
const handleNodeSave = (updatedNode: CanvasNode) => {
  const index = nodes.findIndex(n => n.id === updatedNode.id)
  if (index > -1) {
    nodes[index] = updatedNode
    saveCanvasState()
    
    ElMessage.success('节点参数已更新')
  }
}

// 移除节点
const removeNode = async (node: CanvasNode) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个节点吗？所有相关连接也会被删除。',
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = nodes.findIndex(n => n.id === node.id)
    if (index > -1) {
      nodes.splice(index, 1)
      
      // 删除所有与该节点相关的连接
      const connIndices: number[] = []
      connections.forEach((conn, idx) => {
        if (conn.source.nodeId === node.id || conn.target.nodeId === node.id) {
          connIndices.push(idx)
        }
      })
      
      // 从后往前删除
      connIndices.reverse().forEach(i => {
        connections.splice(i, 1)
      })
      
      saveCanvasState()
      
      ElMessage.success('节点已删除')
    }
  } catch {
    // 用户取消
  }
}

// 开始创建连接
const startConnectionDrag = (
  event: MouseEvent,
  node: CanvasNode,
  point: any,
  type: 'input' | 'output'
) => {
  event.stopPropagation()
  
  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect) return
  
  // 计算起点位置（世界坐标）
  const mouseWorld = screenToWorld(event.clientX - canvasRect.left, event.clientY - canvasRect.top)
  const startX = mouseWorld.x
  const startY = mouseWorld.y

  tempConnection.value = {
    source: {
      nodeId: node.id,
      pointId: point.id,
      x: startX,
      y: startY,
      type
    },
    target: {
      x: startX,
      y: startY
    },
    isValid: true
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (tempConnection.value) {
      const mouseWorld = screenToWorld(e.clientX - canvasRect.left, e.clientY - canvasRect.top)
      tempConnection.value.target.x = mouseWorld.x
      tempConnection.value.target.y = mouseWorld.y
      
      // 检查是否悬停在目标节点上
      const targetNode = findNodeAtPosition(e.clientX, e.clientY)
      if (targetNode && targetNode.id !== node.id) {
        // 查找最近的连接点
        const targetPoint = findNearestConnectionPoint(targetNode, e)
        
        if (targetPoint) {
          tempConnection.value.target.nodeId = targetNode.id
          tempConnection.value.target.pointId = targetPoint.id
          
          // 验证连接
          const source = tempConnection.value.source
          const validation = connectionManager.validateConnection(
            source.nodeId,
            source.pointId,
            targetNode.id,
            targetPoint.id
          )
          
          tempConnection.value.isValid = validation.valid
          tempConnection.value.validationMessage = validation.message
        } else {
          tempConnection.value.target.nodeId = undefined
          tempConnection.value.target.pointId = undefined
          tempConnection.value.isValid = false
          tempConnection.value.validationMessage = '请拖拽到有效的连接点'
        }
      } else {
        tempConnection.value.target.nodeId = undefined
        tempConnection.value.target.pointId = undefined
        tempConnection.value.isValid = true
        tempConnection.value.validationMessage = undefined
      }
    }
  }
  
  const handleMouseUp = (e: MouseEvent) => {
    if (tempConnection.value) {
      const source = tempConnection.value.source
      const targetNodeId = tempConnection.value.target.nodeId
      const targetPointId = tempConnection.value.target.pointId
      
      if (targetNodeId && targetPointId) {
        // 创建连接
        const validation = connectionManager.createConnection(
          source.nodeId,
          source.pointId,
          targetNodeId,
          targetPointId
        )
        
        if (validation.valid) {
          ElMessage.success('连接创建成功')
          saveCanvasState()
        } else {
          ElMessage.error(`连接失败: ${validation.message}`)
        }
      }
      
      tempConnection.value = null
    }
    
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 查找位置上的节点
const findNodeAtPosition = (clientX: number, clientY: number): CanvasNode | null => {
  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect) return null

  const mouseWorld = screenToWorld(clientX - canvasRect.left, clientY - canvasRect.top)

  // 连接点（左右小球）在节点外侧渲染：
  // CSS: .input-points { left: -60px }, .output-points { right: -60px }
  // 为了让“拖到小球上”也算命中节点，这里扩展节点的可命中区域。
  const NODE_WIDTH = 200
  const NODE_HEIGHT = 170
  const HIT_EXTEND_X = 50

  for (const node of nodes) {
    const nodeLeft = node.position.x
    const nodeRight = nodeLeft + NODE_WIDTH
    const nodeTop = node.position.y
    const nodeBottom = nodeTop + NODE_HEIGHT

    if (
      mouseWorld.x >= nodeLeft - HIT_EXTEND_X &&
      mouseWorld.x <= nodeRight + HIT_EXTEND_X &&
      mouseWorld.y >= nodeTop &&
      mouseWorld.y <= nodeBottom
    ) {
      return node
    }
  }

  return null
}

// 查找最近的连接点（增强容错版）
const findNearestConnectionPoint = (node: CanvasNode, event: MouseEvent): any => {
  const canvasRect = canvasRef.value?.getBoundingClientRect();
  if (!canvasRect) return null;

  const mouseWorld = screenToWorld(event.clientX - canvasRect.left, event.clientY - canvasRect.top);
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 170;
  // 合并所有点进行检测
  const allPoints: Array<any & { pointType: 'input' | 'output' }> = [
    ...node.inputs.map(p => ({ ...p, pointType: 'input' as const })),
    ...node.outputs.map(p => ({ ...p, pointType: 'output' as const }))
  ];

  let nearestPoint = null;
  let minDistance = Infinity;
  // 增大命中半径，让连接更容易建立
  const HIT_RADIUS = 40;

  for (const point of allPoints) {
    // 使用修正后的方法获取精确坐标
    const position = connectionManager.calculateConnectionPointPosition(
      node,
      point.id,
      point.pointType
    );

    const distance = Math.sqrt(
      Math.pow(mouseWorld.x - position.x, 2) +
      Math.pow(mouseWorld.y - position.y, 2)
    );

    // 寻找最近点，优先考虑距离更近的
    if (distance < HIT_RADIUS && distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
    }
  }

  // 可选：如果没有点在命中半径内，但鼠标在节点边缘附近，可以返回一个默认点
  // 这可以进一步提升连接建立的便捷性
  if (!nearestPoint && allPoints.length > 0) {
    const isNearLeftEdge = mouseWorld.x >= node.position.x - 20 && mouseWorld.x <= node.position.x + 10;
    const isNearRightEdge = mouseWorld.x >= node.position.x + NODE_WIDTH - 10 && mouseWorld.x <= node.position.x + NODE_WIDTH + 20;
    const isVerticallyInside = mouseY >= node.position.y && mouseY <= node.position.y + NODE_HEIGHT;
    
    if ((isNearLeftEdge || isNearRightEdge) && isVerticallyInside) {
      // 返回第一个输入或输出点作为备选
      nearestPoint = isNearLeftEdge ? allPoints.find(p => p.pointType === 'input') : allPoints.find(p => p.pointType === 'output');
    }
  }

  return nearestPoint;
};
// 选择连接
const selectConnection = (connectionId: string) => {
  selectedConnectionId.value = connectionId
  selectedNodeId.value = ''
}

// 删除连接
const deleteConnection = async (connectionId: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个连接吗？',
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const success = connectionManager.deleteConnection(connectionId)
    if (success) {
      ElMessage.success('连接已删除')
      saveCanvasState()
    }
  } catch {
    // 用户取消
  }
}

// 断开节点的所有连接
const disconnectAllNodeConnections = async (nodeId: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要断开该节点的所有连接吗？',
      '断开连接',
      {
        confirmButtonText: '断开',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const nodeConnections = connectionManager.getNodeConnections(nodeId)
    nodeConnections.forEach(conn => {
      connectionManager.deleteConnection(conn.id)
    })
    
    ElMessage.success('已断开所有连接')
    saveCanvasState()
  } catch {
    // 用户取消
  }
}

// 右键菜单
const handleCanvasContextMenu = (event: MouseEvent) => {
  event.preventDefault()

  // 如果右键拖拽超过 5px，视为平移操作，不显示菜单
  if (panStart.value) {
    const dx = event.clientX - panStart.value.x
    const dy = event.clientY - panStart.value.y
    if (Math.sqrt(dx * dx + dy * dy) > 5) {
      return
    }
  }

  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect) return

  contextMenu.visible = true
  contextMenu.x = event.clientX - canvasRect.left
  contextMenu.y = event.clientY - canvasRect.top
  contextMenu.node = null
  contextMenu.connection = null
  
  // 点击其他地方关闭菜单
  const closeMenu = () => {
    contextMenu.visible = false
    document.removeEventListener('click', closeMenu)
  }
  
  setTimeout(() => {
    document.addEventListener('click', closeMenu)
  }, 100)
}

const handleNodeContextMenu = (event: MouseEvent, node: CanvasNode) => {
  event.preventDefault()
  event.stopPropagation()  // 阻止事件冒泡到画布
  
  // 选中该节点
  selectedNodeId.value = node.id
  selectedConnectionId.value = ''
  
  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect) return
  
  contextMenu.visible = true
  contextMenu.x = event.clientX - canvasRect.left
  contextMenu.y = event.clientY - canvasRect.top
  contextMenu.node = node
  contextMenu.connection = null
  
  // 点击其他地方关闭菜单
  const closeMenu = () => {
    contextMenu.visible = false
    document.removeEventListener('click', closeMenu)
  }
  
  setTimeout(() => {
    document.addEventListener('click', closeMenu)
  }, 100)
}

const handleConnectionContextMenu = (event: MouseEvent, connection: Connection) => {
  event.preventDefault()
  event.stopPropagation()  // 阻止事件冒泡到画布
  
  // 选中该连接
  selectedConnectionId.value = connection.id
  selectedNodeId.value = ''
  
  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect) return
  
  contextMenu.visible = true
  contextMenu.x = event.clientX - canvasRect.left
  contextMenu.y = event.clientY - canvasRect.top
  contextMenu.connection = connection
  contextMenu.node = null
  
  // 点击其他地方关闭菜单
  const closeMenu = () => {
    contextMenu.visible = false
    document.removeEventListener('click', closeMenu)
  }
  
  setTimeout(() => {
    document.addEventListener('click', closeMenu)
  }, 100)
}

// 右键菜单操作
const handleMenuAction = (action: string) => {
  switch (action) {
    case 'edit':
      if (contextMenu.node) {
        editingNode.value = contextMenu.node
        showNodeEditor.value = true
      }
      break
    case 'duplicate':
      if (contextMenu.node) {
        duplicateNode(contextMenu.node)
      }
      break
    case 'delete-connection':
      if (contextMenu.connection) {
        deleteConnection(contextMenu.connection.id)
      }
      break
    case 'disconnect-all':
      if (contextMenu.node) {
        disconnectAllNodeConnections(contextMenu.node.id)
      }
      break
    case 'arrange-nodes':
      arrangeNodes()
      break
    case 'validate-model':
      validateModel()
      break
  }
  
  contextMenu.visible = false
}

// 自动排列节点
const arrangeNodes = () => {
  if (nodes.length === 0) {
    ElMessage.info('没有需要排列的节点')
    return
  }
  
  // 使用拓扑排序获取有序节点列表
  const result = connectionManager.getOrderedNodesByTopology()
  
  // 检查是否有环路
  if (result.hasCycle) {
    ElMessage.error(`检测到循环依赖，涉及节点：${result.cycleNodes?.join(', ')}。请先断开循环连接。`)
    return
  }
  
  // 按拓扑顺序排列节点
  const orderedNodes = result.ordered
  const cols = Math.ceil(Math.sqrt(orderedNodes.length))
  const nodeWidth = 220
  const nodeHeight = 140
  const padding = 40
  
  orderedNodes.forEach((node, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    
    node.position = {
      x: padding + col * (nodeWidth + padding),
      y: padding + row * (nodeHeight + padding)
    }
    
    // 更新连接位置
    connectionManager.updateConnectionPositions(node.id)
  })
  
  ElMessage.success('节点已自动排列')
  saveCanvasState()
}

// 验证模型
const validateModel = () => {
  const errors: string[] = []
  
  // 检查是否有未连接的节点
  const unconnectedNodes = nodes.filter(node => {
    const upstream = connectionManager.getUpstreamNodes(node.id)
    const downstream = connectionManager.getDownstreamNodes(node.id)
    return upstream.length === 0 && downstream.length === 0
  })
  
  if (unconnectedNodes.length > 0) {
    errors.push(`有 ${unconnectedNodes.length} 个节点未连接`)
  }
  
  // 检查是否存在循环
  if (hasCycles.value) {
    errors.push('模型存在循环依赖')
  }
  
  // 检查是否有多个输入节点连接到同一个输入点
  nodes.forEach(node => {
    node.inputs.forEach(input => {
      if (input.connectedTo && input.connectedTo.length > 1) {
        errors.push(`节点 "${node.name}" 的输入点 "${input.name}" 有多个连接`)
      }
    })
  })
  
  validationResult.value = {
    valid: errors.length === 0,
    errors
  }
  
  showValidationDialog.value = true
}

// 自动修复模型
const autoFixModel = () => {
  // 这里可以添加自动修复逻辑
  // 例如：移除循环连接、合并重复连接等
  
  ElMessage.info('自动修复功能开发中...')
}

// 保存画布状态的防抖定时器
let saveStateTimer: ReturnType<typeof setTimeout> | null = null

// 自动保存画布状态到 localStorage（带防抖，避免连续操作频繁序列化）
const saveCanvasState = () => {
  if (saveStateTimer) {
    clearTimeout(saveStateTimer)
  }

  saveStateTimer = setTimeout(() => {
    const projectData = {
      nodes: nodes,
      connections: connections,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('ai-model-project', JSON.stringify(projectData))
    saveStateTimer = null
  }, 300)
}

// 重置画布 UI 状态（清空节点、连接、选中状态并自动保存）
const resetCanvasUI = () => {
  nodes.length = 0
  connections.length = 0
  connectionManager.updateNodes(nodes)
  selectedNodeId.value = ''
  selectedConnectionId.value = ''
  saveCanvasState()
}

// 清空画布
const clearCanvas = async () => {
  if (nodes.length === 0 && connections.length === 0) {
    ElMessage.info('画布已经是空的')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要清空画布吗？所有节点和连接都会被删除。',
      '清空确认',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    resetCanvasUI()
    ElMessage.success('画布已清空')
  } catch {
    // 用户取消
  }
}

// 重置所有存储数据
const resetStorage = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有数据吗？\n\n将删除：\n- 项目数据\n- 最近使用的组件\n- 所有本地存储',
      '重置数据',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    localStorage.clear()
    resetCanvasUI()
    ElMessage.success('数据已重置')
  } catch {
    // 用户取消
  }
}

// 节点拖拽
let dragData: { node: CanvasNode; offsetX: number; offsetY: number } | null = null

const startNodeDrag = (e: MouseEvent, node: CanvasNode) => {
  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect) return

  const mouseWorld = screenToWorld(e.clientX - canvasRect.left, e.clientY - canvasRect.top)

  dragData = {
    node,
    offsetX: mouseWorld.x - node.position.x,
    offsetY: mouseWorld.y - node.position.y
  }

  draggingNodeId.value = node.id

  let connectionUpdateQueued = false

  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (dragData && canvasRect) {
      const mouseWorld = screenToWorld(moveEvent.clientX - canvasRect.left, moveEvent.clientY - canvasRect.top)
      dragData.node.position.x = mouseWorld.x - dragData.offsetX
      dragData.node.position.y = mouseWorld.y - dragData.offsetY

      // 用 requestAnimationFrame 批量更新连接线，避免阻塞拖拽
      if (!connectionUpdateQueued) {
        connectionUpdateQueued = true
        requestAnimationFrame(() => {
          if (dragData) {
            connectionManager.updateConnectionPositions(dragData.node.id)
          }
          connectionUpdateQueued = false
        })
      }
    }
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    dragData = null
    draggingNodeId.value = ''
    
    // 标记为未保存
    saveCanvasState()
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 加载保存的项目
onMounted(() => {
  const savedData = localStorage.getItem('ai-model-project')
  if (savedData) {
    try {
      const projectData = JSON.parse(savedData)
      nodes.push(...projectData.nodes)
      connections.push(...projectData.connections)
      
      // 恢复 creationIdCounter（取最大的 creationId）
      if (nodes.length > 0) {
        creationIdCounter = Math.max(...nodes.map(n => n.creationId || 0))
        
        // 为缺失 creationId 的节点分配新的 ID
        nodes.forEach(node => {
          if (!node.creationId || node.creationId === 0) {
            node.creationId = ++creationIdCounter
          }
        })
      }
      
      // 初始化连接管理器
      nodes.forEach(node => {
        connectionManager.updateConnectionPositions(node.id)
      })

      // 重建连接数缓存（加载的数据可能包含大量连接）
      connectionManager.updateNodes(nodes)

      ElMessage.success('已加载上次保存的项目')
    } catch (error) {
      console.error('加载项目失败:', error)
    }
  }

  // 注册全局鼠标事件（用于画布右键平移）
  document.addEventListener('mousemove', handleGlobalMouseMove)
  document.addEventListener('mouseup', handleGlobalMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleGlobalMouseMove)
  document.removeEventListener('mouseup', handleGlobalMouseUp)
})

const codeStore = useCodeStore()
const isGeneratingCode = ref(false)

// 代码生成防抖定时器
let codeGenerationTimer: ReturnType<typeof setTimeout> | null = null

// 监听节点和连接变化，自动生成代码（带防抖）
watch(
  () => [nodes, connections],
  () => {
    if (codeStore.autoGenerate && nodes.length > 0) {
      // 清除之前的定时器
      if (codeGenerationTimer) {
        clearTimeout(codeGenerationTimer)
      }
      // 防抖：500ms 后触发
      codeGenerationTimer = setTimeout(() => {
        generateCode(false) // 静默生成，不显示提示
      }, 500)
    }
  },
  { deep: true, immediate: true }
)

// 代码生成方法
const generateCode = async (showMessage: boolean = true) => {
  if (nodes.length === 0) return
  
  isGeneratingCode.value = true
  try {
    await codeStore.generatePyTorchCode(nodes, connections)
    if (showMessage) {
      ElMessage.success('代码已生成')
    }
  } catch (error) {
    ElMessage.error('代码生成失败')
    console.error(error)
  } finally {
    isGeneratingCode.value = false
  }
}

// 手动触发代码生成
const handleManualGenerate = () => {
  if (nodes.length === 0) {
    ElMessage.warning('请先添加节点到画布')
    return
  }
  
  codeStore.manualGenerateCode(nodes, connections)
  ElMessage.success('代码已重新生成')
}

// 在工具栏添加代码生成按钮
// 在canvas-header中添加：
const showCodeSettings = ref(false)
</script>

<style scoped lang="scss">
.workspace-canvas {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  
  .canvas-header {
    padding: 12px 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #ffffff;
    
    .canvas-title {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      overflow: hidden;

      h3 {
        margin: 0;
        color: #303133;
        font-size: 16px;
        font-weight: 600;
        line-height: 24px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .canvas-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 24px;
      }

      .status-tag,
      .node-count {
        height: 24px;
        display: inline-flex;
        align-items: center;
      }

      .node-count {
        min-width: 48px;
        line-height: 1;
        justify-content: center;
        padding: 0 8px;
        vertical-align: middle;

        :deep(.el-tag__content) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          line-height: 1;
        }

        :deep(.el-icon) {
          margin-right: 0;
          line-height: 1;
          transform: translateY(0);
        }
      }
    }
    
    .canvas-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
  }
  
  .canvas-area {
    flex: 1;
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(90deg, #f5f7fa 1px, transparent 1px) 0 0 / 20px 20px,
      linear-gradient(#f5f7fa 1px, transparent 1px) 0 0 / 20px 20px;
    cursor: default;

    &.is-panning {
      cursor: grabbing;
    }

    .viewport-layer {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      transform-origin: 0 0;
    }

    .viewport-controls {
      position: absolute;
      bottom: 12px;
      right: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      z-index: 50;

      .scale-text {
        font-size: 12px;
        color: #606266;
        min-width: 36px;
        text-align: center;
        font-variant-numeric: tabular-nums;
      }
    }

    .empty-state {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #c0c4cc;
      
      .title {
        margin: 16px 0 8px;
        font-size: 16px;
        font-weight: 500;
      }
      
      .subtitle {
        font-size: 14px;
        color: #909399;
      }
    }
    
    .canvas-node {
      position: absolute;
      left: 0;
      top: 0;
      width: 200px;
      height: 170px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #0c52f4;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      cursor: move;
      transition: box-shadow 0.2s, border-color 0.2s;
      will-change: transform;
      user-select: none;
      z-index: 10;
      
      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        border-color: #409eff;
        
        .node-menu {
          opacity: 1;
        }
      }
      
      &.selected {
        border-color: #409eff;
        box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
      }
      
      &.dragging {
        opacity: 0.8;
        z-index: 100;
        transition: none;
        will-change: transform;
      }
      
      .node-header {
        display: flex;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid #f0f0f0;
        background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
        border-radius: 8px 8px 0 0;
        
        .node-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #409eff, #67c23a);
          color: white;
          border-radius: 6px;
          margin-right: 8px;
          flex-shrink: 0;
        }
        
        .node-info {
          flex: 1;
          min-width: 0;
          
          .node-title {
            font-weight: 600;
            color: #303133;
            font-size: 14px;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .node-type {
            font-size: 11px;
            color: #909399;
            background: #f5f7fa;
            padding: 1px 6px;
            border-radius: 10px;
            display: inline-block;
          }
        }
        
        .node-badges {
          margin-right: 8px;
          display: flex;
          gap: 2px;
        }
        
        .node-menu {
          opacity: 0.6;
          transition: opacity 0.2s;
          flex-shrink: 0;
          color: #606266;
          
          &:hover {
            opacity: 1;
            color: #409eff;
          }
        }
      }
      
      .node-content {
        padding: 12px;
        min-height: 60px;
        
        .node-params {
          .param-item {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            
            .param-label {
              color: #606266;
              font-size: 12px;
            }
            
            .param-value {
              color: #303133;
              font-size: 12px;
              font-weight: 500;
              max-width: 100px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
          
          .param-more {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            margin-top: 4px;
            color: #909399;
            font-size: 11px;
            background: #f5f7fa;
            border-radius: 4px;
            
            .el-icon {
              margin-right: 4px;
              font-size: 12px;
            }
          }
        }
      }
      
      // 1. 修改容器定位：现在只需要垂直居中容器，水平定位由内部元素决定
      .input-points,
      .output-points {
        position: absolute;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 20;
        // 关键修改：容器不再设置 left/right，仅提供垂直居中参考
        top: 50%;
        transform: translateY(-50%);
      }

      // 2. 连接点项使用相对定位作为标签和圆形的容器
      .connection-point {
        display: flex;
        align-items: center;
        cursor: crosshair;
        user-select: none;
        position: relative; // 为绝对定位的指示器容器提供参考
        height: 12px; // 减小选中范围，只有圆形大小
        padding: 4px 0; // 增加点击的舒适度但保持视觉紧凑
        
        &.input-point {
          // 输入点：整体从右向左布局（圆形在左，标签在右）
          flex-direction: row;
          justify-content: flex-start;
        }
        
        &.output-point {
          // 输出点：整体从左向右布局（标签在左，圆形在右）
          flex-direction: row;
          justify-content: flex-end;
        }
        
        // 3. 指示器包装器：绝对定位固定在节点边缘
        .point-indicator-wrapper {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 21; // 确保在标签上层
          
          // 指示器圆形样式保持不变
          .point-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: white;
            border: 2px solid #dcdfe6;
            transition: all 0.2s;
            display: block; // 确保是块级元素
          }
        }
        
        // 4. 标签样式：绝对定位到圆形上方，避免遮挡连接线
        .point-label {
          position: absolute;
          top: -20px; // 显示在圆形上方
          font-size: 10px;
          color: #909399;
          opacity: 0;
          transition: opacity 0.2s;
          white-space: nowrap;
          background: white;
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid #f0f0f0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          z-index: 22; // 确保在最上层
          pointer-events: none; // 不影响鼠标事件
          
          // 根据连接点类型设置标签位置
          .input-point & {
            left: 0; // 左上角对齐圆形
          }
          .output-point & {
            right: 0; // 右上角对齐圆形
          }
        }
        
        &:hover {
          .point-indicator {
            border-color: #409eff;
            transform: scale(1.2);
          }
          .point-label {
            opacity: 1;
          }
        }
        
        &.connected {
          .point-indicator {
            border-color: #67c23a;
            background: #67c23a;
          }
        }
      }

      // 5. 为输入/输出点容器设置精确的水平偏移
      //    现在偏移只影响容器，圆形通过绝对定位固定
      .input-points {
        left: -60px; // 容器整体左移，为标签留出空间
        .point-indicator-wrapper {
          left: 48px; // 圆形相对于容器左定位 (60-12=48)
        }
      }

      .output-points {
        right: -60px; // 容器整体右移
        .point-indicator-wrapper {
          right: 48px; // 圆形相对于容器右定位
        }
      }
    }
    
    .connections-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      
      .connection-line {
        cursor: pointer;
        
        .connection-path {
          transition: all 0.2s;
          pointer-events: none;
        }
        
        .connection-interactive {
          pointer-events: all;
          cursor: pointer;
          
          &:hover {
            cursor: pointer;
          }
        }
        
        &:hover .connection-path {
          stroke-width: 3;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }
        
        &.selected .connection-path {
          stroke-width: 3;
          stroke-dasharray: none !important;
          filter: drop-shadow(0 2px 8px rgba(64, 158, 255, 0.3));
        }
      }
    }
    
    .connection-validation-hint {
      position: absolute;
      pointer-events: none;
      z-index: 1000;
      transform: translateY(-50%);
    }
    
    .context-menu {
      position: absolute;
      background: white;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      z-index: 2000;
      min-width: 160px;
      overflow: hidden;
      
      .menu-header {
        padding: 8px 12px;
        background: #f5f7fa;
        border-bottom: 1px solid #e4e7ed;
        font-size: 12px;
        font-weight: 500;
        color: #606266;
      }
      
      .menu-items {
        padding: 4px 0;
        
        .menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          cursor: pointer;
          transition: background 0.2s;
          font-size: 13px;
          
          &:hover {
            background: #f5f7fa;
          }
          
          .el-icon {
            font-size: 14px;
            color: #606266;
          }
        }
        
        .menu-divider {
          height: 1px;
          background: #e4e7ed;
          margin: 4px 0;
        }
      }
    }
  }
  
  .canvas-footer {
    padding: 8px 20px;
    border-top: 1px solid var(--border-color);
    background: #ffffff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .canvas-info {
      font-size: 12px;
      color: #909399;
      
      .cycle-warning {
        margin-left: 12px;
        color: #f56c6c;
        font-weight: 500;
        
        .el-icon {
          margin-right: 4px;
        }
      }
    }
    
    .canvas-hint {
      font-size: 12px;
      color: #909399;
      display: flex;
      align-items: center;
      
      .el-icon {
        margin-right: 4px;
      }
      .el-button {
        margin-left: 8px;
        font-size: 12px;
      }
    }
  }
}

.validation-result {
  .validation-success,
  .validation-error {
    text-align: center;
    padding: 20px 0;
    
    h3 {
      margin: 12px 0 8px;
      color: #303133;
    }
    
    p {
      color: #606266;
      margin: 0;
    }
  }
  
  .error-list {
    text-align: left;
    margin-top: 16px;
    
    .error-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      color: #f56c6c;
      
      .el-icon {
        flex-shrink: 0;
      }
    }
  }
  
  .topology-info {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e4e7ed;
    
    h4 {
      margin: 0 0 12px;
      color: #303133;
      font-size: 14px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 16px;
      
      .info-item {
        display: flex;
        justify-content: space-between;
        padding: 6px 8px;
        background: #f5f7fa;
        border-radius: 4px;
        
        .label {
          color: #606266;
          font-size: 13px;
        }
        
        .value {
          color: #303133;
          font-weight: 500;
          font-size: 13px;
          
          &.error {
            color: #f56c6c;
          }
        }
      }
    }
    
    .layers-list {
      .layers-container {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #e4e7ed;
        border-radius: 4px;
        
        .layer-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid #f0f0f0;
          
          &:last-child {
            border-bottom: none;
          }
          
          &:hover {
            background: #f5f7fa;
          }
          
          .layer-index {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            background: #409eff;
            color: white;
            border-radius: 50%;
            font-size: 11px;
            margin-right: 12px;
            flex-shrink: 0;
          }
          
          .layer-name {
            flex: 1;
            color: #303133;
            font-size: 13px;
          }
          
          .layer-type {
            color: #909399;
            font-size: 11px;
            background: #f5f7fa;
            padding: 2px 6px;
            border-radius: 10px;
          }
        }
      }
    }
  }
}
// 添加代码设置面板样式
.code-settings-panel {
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  padding: 16px 20px;
  
  :deep(.el-form-item) {
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .generation-history {
    max-height: 100px;
    overflow-y: auto;
    background: white;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 8px;
    
    .history-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      font-size: 12px;
      color: #606266;
      
      .el-icon {
        color: #909399;
      }
    }
    
    .no-history {
      text-align: center;
      color: #c0c4cc;
      font-size: 12px;
      padding: 8px;
    }
  }
}

// 添加节点计数标签样式
.node-count {
  :deep(.el-icon) {
    margin-right: 0;
  }
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
