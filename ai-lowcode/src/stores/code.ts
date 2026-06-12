import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { PyTorchCodeGenerator, type GeneratedCode } from '../core/code-generation/pytorch-code-generator'
import { TemplateLoader } from '../core/code-generation/template-loader'
import type { CanvasNode, Connection } from '../types/node'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useUIStore } from './ui'

interface DownloadProjectOptions {
  includeCifar10?: boolean
  includeInferenceImages?: boolean
}

export const useCodeStore = defineStore('code', () => {
  // 生成的代码
  const generatedCode = ref<GeneratedCode | null>(null)

  // 代码选项卡
  const activeTab = ref('model')

  // 是否自动生成代码
  const autoGenerate = ref(true)

  // 代码生成历史
  const generationHistory = ref<string[]>([])

  // 缓存最后一次生成代码时的画布数据
  const lastNodes = ref<CanvasNode[]>([])
  const lastConnections = ref<Connection[]>([])

  /**
   * 生成PyTorch代码
   */
  const generatePyTorchCode = (nodes: CanvasNode[], connections: Connection[]) => {
    if (!autoGenerate.value) return

    try {
      const uiStore = useUIStore()
      const rlConfig = uiStore.generationMode === 'reinforcement_learning'
        ? {
            httpUrl: uiStore.rlConfig.httpUrl,
            tcpPort: uiStore.rlConfig.tcpPort,
            udpPort: uiStore.rlConfig.udpPort,
            savePath: uiStore.rlConfig.savePath,
            interval: uiStore.rlConfig.interval
          }
        : null
      const generator = new PyTorchCodeGenerator(nodes, connections, uiStore.generationMode, rlConfig)
      const code = generator.generate()
      generatedCode.value = code
      lastNodes.value = nodes
      lastConnections.value = connections

      // 保存到历史记录
      const timestamp = new Date().toLocaleTimeString()
      generationHistory.value.unshift(`Generated at ${timestamp}`)

      // 限制历史记录长度
      if (generationHistory.value.length > 10) {
        generationHistory.value.pop()
      }

      return code
    } catch (error) {
      console.error('Code generation failed:', error)
      throw error
    }
  }

  /**
   * 手动触发代码生成
   */
  const manualGenerateCode = (nodes: CanvasNode[], connections: Connection[]) => {
    return generatePyTorchCode(nodes, connections)
  }

  /**
   * 更新自动生成设置
   */
  const updateAutoGenerate = (value: boolean) => {
    autoGenerate.value = value
  }

  /**
   * 切换代码选项卡
   */
  const setActiveTab = (tab: string) => {
    activeTab.value = tab
  }

  /**
   * 获取当前显示的代码
   */
  const currentCode = computed(() => {
    if (!generatedCode.value) return ''

    switch (activeTab.value) {
      case 'model':
        return generatedCode.value.modelCode
      case 'training':
        return generatedCode.value.trainingCode
      case 'inference':
        return generatedCode.value.inferenceCode
      case 'summary':
        return generatedCode.value.modelSummary
      default:
        return generatedCode.value.modelCode
    }
  })

  /**
   * 获取当前选项卡标题
   */
  const currentTabTitle = computed(() => {
    const titles: Record<string, string> = {
      'model': '模型定义',
      'training': '训练代码',
      'inference': '推理代码',
      'summary': '模型摘要'
    }
    return titles[activeTab.value] || '代码'
  })

  /**
   * 复制代码到剪贴板
   */
  const copyCode = async () => {
    if (!currentCode.value) return false

    try {
      await navigator.clipboard.writeText(currentCode.value)
      return true
    } catch (error) {
      console.error('Copy failed:', error)
      return false
    }
  }

  /**
   * 下载代码文件
   */
  const downloadCode = () => {
    if (!generatedCode.value) return false

    try {
      // 根据当前选项卡决定文件名
      const extensions: Record<string, string> = {
        'model': 'model.py',
        'training': 'train.py',
        'inference': 'inference.py',
        'summary': 'model_summary.txt'
      }

      const extension = extensions[activeTab.value] || 'code.py'
      const filename = `ai_model_${extension}`

      // 创建Blob并下载
      const blob = new Blob([currentCode.value], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      return true
    } catch (error) {
      console.error('Download failed:', error)
      return false
    }
  }

  /**
   * 下载完整项目
   */
  const downloadFullProject = async (options: DownloadProjectOptions = {}) => {
    if (!generatedCode.value) {
      ElMessage.warning('没有可下载的项目')
      return false
    }

    try {
      const uiStore = useUIStore()

      // 如果有缓存的画布数据，先用当前 mode 重新生成代码，确保下载的是最新模式
      if (lastNodes.value.length > 0) {
        try {
          const rlConfig = uiStore.generationMode === 'reinforcement_learning'
            ? {
                httpUrl: uiStore.rlConfig.httpUrl,
                tcpPort: uiStore.rlConfig.tcpPort,
                udpPort: uiStore.rlConfig.udpPort,
                savePath: uiStore.rlConfig.savePath,
                interval: uiStore.rlConfig.interval
              }
            : null
          const generator = new PyTorchCodeGenerator(
            lastNodes.value,
            lastConnections.value,
            uiStore.generationMode,
            rlConfig
          )
          const freshCode = generator.generate()
          generatedCode.value = freshCode
        } catch (genError) {
          console.error('重新生成代码失败，使用缓存代码:', genError)
          ElMessage.warning('代码重新生成失败，将使用缓存版本下载')
        }
      }

      const files = [
        { name: 'model.py', content: generatedCode.value!.modelCode },
        { name: 'train.py', content: generatedCode.value!.trainingCode },
        { name: 'inference.py', content: generatedCode.value!.inferenceCode },
        { name: 'README.md', content: generateReadme() }
      ]

      // 强化学习模式下额外打包网络环境模块
      if (uiStore.generationMode === 'reinforcement_learning') {
        try {
          const networkEnvCode = TemplateLoader.getTemplate('network_env')
          files.push({ name: 'network_env.py', content: networkEnvCode })
        } catch (e) {
          console.warn('network_env template not found')
        }
      }

      // 创建ZIP文件
      const zip = new JSZip()
      files.forEach(file => {
        zip.file(file.name, file.content)
      })

      // 可选：打包离线 CIFAR-10 数据集压缩包
      if (options.includeCifar10) {
        try {
          const response = await fetch('/datasets/cifar-10-python.tar.gz')
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          const cifar10Buffer = await response.arrayBuffer()
          zip.file('data/cifar-10-python.tar.gz', cifar10Buffer)
          zip.file(
            'data/README_OFFLINE_DATASET.md',
            `# 离线数据集说明\n\n` +
            `已包含 CIFAR-10 离线压缩包：\`data/cifar-10-python.tar.gz\`。\n\n` +
            `使用方式：\n` +
            `1. 进入项目根目录\n` +
            `2. 解压：\`tar -xzf data/cifar-10-python.tar.gz -C data\`\n` +
            `3. 运行训练脚本：\`python train.py\`\n\n` +
            `注意：若在 Windows 无 tar 命令，可用 7-Zip 或 WinRAR 解压。\n`
          )
        } catch (error) {
          console.warn('CIFAR-10 offline package not found or unreadable:', error)
          ElMessage.warning('未找到离线 CIFAR-10 包（public/datasets/cifar-10-python.tar.gz），已导出不含数据集的项目')
        }
      }

      // 可选：打包推理示例图片（3张）
      if (options.includeInferenceImages) {
        const sampleImageNames = ['inference-1.png', 'inference-2.jpg', 'inference-3.png']
        const loadedSamples: Array<{ name: string; buffer: ArrayBuffer }> = []

        for (const imageName of sampleImageNames) {
          try {
            const response = await fetch(`/inference-samples/${imageName}`)
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`)
            }

            const imageBuffer = await response.arrayBuffer()
            loadedSamples.push({ name: imageName, buffer: imageBuffer })
            zip.file(`inference-samples/${imageName}`, imageBuffer)
          } catch (error) {
            console.warn(`Inference sample image not found: ${imageName}`, error)
          }
        }

        if (loadedSamples.length > 0) {
          // 兼容 inference.py 默认读取的 example.png
          // 即使源图是 jpg，PIL 也可按文件头识别格式
          zip.file('example.png', loadedSamples[0].buffer)

          zip.file(
            'inference-samples/README_INFERENCE_IMAGES.md',
            `# 推理示例图片说明\n\n` +
            `已打包 ${loadedSamples.length} 张推理示例图片到 \`inference-samples/\` 目录。\n\n` +
            `同时已自动生成根目录 \`example.png\`（取第一张示例图），可直接运行 \`python inference.py\`。\n\n` +
            `如需测试其他图片，请修改 \`inference.py\` 中的 \`image_path\`。\n`
          )
        } else {
          ElMessage.warning('未找到推理示例图片（public/inference-samples/inference-1.jpg~inference-3.jpg），已导出不含示例图的项目')
        }
      }

      // 生成ZIP并下载
      const content = await zip.generateAsync({ type: 'blob' })

      // 创建下载链接
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ai_model_project.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error('Project download failed:', error)
      ElMessage.error('项目下载失败')
      return false
    }
  }

  /**
   * 生成README文件（根据深度学习/强化学习模式区分内容）
   */
  const generateReadme = (): string => {
    if (!generatedCode.value) return ''

    const uiStore = useUIStore()
    const isRL = uiStore.generationMode === 'reinforcement_learning'
    const modelName = 'AIModel'
    const modelSummary = generatedCode.value.modelSummary

    if (isRL) {
      const cfg = uiStore.rlConfig
      return `# AI Model Project（强化学习模式）

由 AI 拖拉拽开发平台自动生成的强化学习训练项目。

## 文件说明
- \`model.py\`: 策略/值网络模型定义
- \`train.py\`: 训练入口，启动 TCP/UDP 服务器并等待环境数据
- \`network_env.py\`: 网络环境交互模块（TCP 想定、UDP 数据）
- \`inference.py\`: 推理脚本

## 快速开始

\`\`\`bash
pip install -r requirements.txt
python train.py
\`\`\`

## 环境交互说明

1. **TCP 端口 ${cfg.tcpPort}**：接收想定文件触发消息，程序会自动 HTTP 下载并解析想定
2. **UDP 端口 ${cfg.udpPort}**：接收环境实时观测数据
3. 收到想定文件后，主线程才会进入训练循环
4. \`train.py\` 中的 PPO/QMIX 训练循环目前为 TODO 框架，需要按实际算法实现

## 关键配置

| 配置项 | 说明 |
|--------|------|
| \`HTTP_URL\` | 想定文件下载地址：\`${cfg.httpUrl}\` |
| \`TCP_PORT\` | TCP 监听端口：\`${cfg.tcpPort}\` |
| \`UDP_PORT\` | UDP 监听端口：\`${cfg.udpPort}\` |
| \`SAVE_PATH\` | 想定文件保存路径：\`${cfg.savePath}\` |
| \`INTERVAL\` | UDP 数据处理时间间隔（秒）：\`${cfg.interval}\` |
| \`MAX_BUFFER_SIZE\` | 环境数据缓冲区最大数量：\`1000\` |
| \`MAX_DATA_AGE_SECONDS\` | 环境数据最大存活时间（秒）：\`30.0\` |

## 模型摘要
\`\`\`
${modelSummary}
\`\`\`

---
*生成时间：${new Date().toLocaleString()}*
`
    }

    return `# AI Model Project

由 AI 拖拉拽开发平台自动生成的 PyTorch 项目。

## 文件说明
- \`model.py\`: 模型定义
- \`train.py\`: 训练脚本
- \`inference.py\`: 推理脚本

## 快速开始

\`\`\`bash
pip install -r requirements.txt
python train.py
python inference.py
\`\`\`

## 模型摘要
\`\`\`
${modelSummary}
\`\`\`

---
*生成时间：${new Date().toLocaleString()}*
`
  }

  return {
    // 状态
    generatedCode,
    activeTab,
    autoGenerate,
    generationHistory,

    // 计算属性
    currentCode,
    currentTabTitle,

    // 方法
    generatePyTorchCode,
    manualGenerateCode,
    updateAutoGenerate,
    setActiveTab,
    copyCode,
    downloadCode,
    downloadFullProject
  }
})
