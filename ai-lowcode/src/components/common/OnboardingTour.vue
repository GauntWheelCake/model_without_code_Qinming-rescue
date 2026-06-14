<template>
  <teleport to="body">
    <div v-if="onboarding.visible" class="tour-layer" aria-live="polite">
      <div v-if="!targetRect" class="tour-backdrop"></div>
      <div
        v-else
        class="tour-highlight"
        :style="highlightStyle"
      ></div>

      <section ref="cardRef" class="tour-card" :style="cardStyle">
        <div class="tour-card__header" @mousedown="startDrag">
          <span class="tour-card__step">新手引导 {{ onboarding.currentStep + 1 }}/{{ steps.length }}</span>
          <button class="tour-card__ghost" type="button" @click="handleSkip">跳过</button>
        </div>

        <h3 class="tour-card__title">{{ currentStep.title }}</h3>
        <p class="tour-card__body">{{ currentStep.body }}</p>

        <ul v-if="currentStep.tips?.length" class="tour-card__tips">
          <li v-for="tip in currentStep.tips" :key="tip">{{ tip }}</li>
        </ul>

        <div class="tour-card__footer">
          <button
            class="tour-card__secondary"
            type="button"
            :disabled="onboarding.currentStep === 0"
            @click="goPrevious"
          >
            上一步
          </button>
          <button class="tour-card__primary" type="button" @click="goNext">
            {{ isLastStep ? '完成' : '下一步' }}
          </button>
        </div>
      </section>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useOnboardingStore } from '../../stores/onboarding'

interface TourStep {
  title: string
  body: string
  selector?: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'top-right' | 'bottom-right'
  safeBottom?: number
  tips?: string[]
}

const onboarding = useOnboardingStore()
const cardRef = ref<HTMLElement | null>(null)
const manualPosition = ref<{ left: number; top: number } | null>(null)
const dragState = ref<{ offsetX: number; offsetY: number } | null>(null)

const steps: TourStep[] = [
  {
    title: '欢迎使用可视化建模平台',
    body: '本平台支持通过拖拽组件构建深度学习模型与强化学习模型，并在右侧实时生成对应的 PyTorch 代码。本引导将带你完成一次最小闭环：从组件库拖拽节点、按执行顺序连线、配置关键参数，最终生成可运行的代码。',
    placement: 'center',
    tips: [
      '平台左侧组件库分为“深度学习组件库”与“强化学习组件库”两部分，请根据建模目标选择对应组件。',
      '同一画布内只允许使用同一类组件（深度学习或强化学习），二者不可混连。',
      '可随时跳过本引导，稍后通过顶部“新手引导”重新打开。'
    ]
  },
  {
    title: '从组件库选择并拖拽节点',
    body: '左侧组件库按功能分类展示可用节点。以图像分类为例，请依次拖入：二维卷积（Conv2d）、ReLU、展平层（Flatten）和全连接层（Linear）。若构建强化学习模型，可使用“状态输入 → 策略网络 → 动作输出”这一最小链路。',
    selector: '[data-tour="toolbox"]',
    placement: 'right',
    tips: [
      '建议按最终执行顺序从左至右拖入，便于后续连线与阅读。',
      '当前项目不强制使用独立的 Input 节点，数据维度由第一层组件定义。',
      '可利用搜索框快速定位所需组件。'
    ]
  },
  {
    title: '在画布上完成节点连线',
    body: '中间画布用于组织模型结构。将节点按执行顺序排列后，从前一节点的输出点拖拽连线至后一节点的输入点，形成完整数据流。平台会自动校验连接顺序与维度匹配情况。',
    selector: '[data-tour="canvas"]',
    placement: 'top-right',
    tips: [
      '连线方向为从源节点输出点至目标节点输入点。',
      '深度学习组件与强化学习组件不可跨类连接；强化学习组件需遵循“状态输入 → 策略网络 → 动作输出”的顺序。',
      '若连线失败，请检查节点顺序、目标输入点是否已被占用，或维度与类别规则是否满足。'
    ]
  },
  {
    title: '配置节点参数以保证维度衔接',
    body: '代码能否正确生成，取决于相邻节点之间的输入输出维度是否匹配。以 CIFAR-10 为例：输入可视为 3×32×32 的彩色图像。首次建模时，仅修改必要参数，其余保持默认即可。',
    selector: '[data-tour="canvas"]',
    placement: 'bottom-right',
    safeBottom: 56,
    tips: [
      '二维卷积层：将 `in_channels` 设为 `3`，`out_channels` 可设为 `16`。',
      '展平层：保持默认，用于将多维特征图转换为一维向量。',
      '全连接层：本示例中 `in_features` 设为 `16384`（16 × 32 × 32），`out_features` 设为 `10`，对应 CIFAR-10 的 10 个类别。',
      '核心原则：前一层的输出维度必须等于后一层的输入维度。'
    ]
  },
  {
    title: '生成 PyTorch 代码',
    body: '节点与连线配置完成后，点击生成代码按钮，平台将把当前画布结构转换为可读的 PyTorch 代码。若右侧自动刷新保持开启，后续修改画布将实时同步更新代码。',
    selector: '[data-tour="generate-code"]',
    placement: 'bottom',
    tips: [
      '此步骤是“图形化搭建”与“真实代码”之间的关键桥梁。',
      '若生成失败，请优先检查节点顺序、连线完整性以及关键参数设置。',
      '右侧代码区为画布结构的程序化表达。'
    ]
  },
  {
    title: '区分单文件导出与完整项目导出',
    body: '代码确认无误后，可选择导出方式。“下载当前文件”仅导出当前标签页显示的代码；“下载完整项目”则会将模型、训练、推理及依赖文件一并打包，便于本地直接运行。',
    selector: '[data-tour="download-code"]',
    placement: 'left',
    tips: [
      '下载当前文件：适合单独查看 `model.py`、训练脚本或推理脚本。',
      '下载完整项目：适合将工程整体带走并继续开发。',
      '建议新手优先选择“下载完整项目”，以获得可直接运行的工程结构。'
    ]
  },
  {
    title: '配置完整项目导出选项',
    body: '点击“下载完整项目”后，可根据后续目标选择是否附带示例资源。如需继续运行 CIFAR-10 示例训练流程，可勾选数据集；如需测试推理脚本，可勾选示例图片；若仅需查看工程结构，可全部不选。',
    selector: '[data-tour="download-project"]',
    placement: 'left',
    tips: [
      '包含离线 CIFAR-10 数据集包：适合直接运行默认训练示例。',
      '包含推理示例图片：适合直接验证推理脚本。',
      '若画布中仅包含强化学习组件，导出选项会相应提供 UDP/TCP 环境配置资源。',
      '之后可随时通过顶部“新手引导”重新查看本流程。'
    ]
  }
]

const targetRect = ref<DOMRect | null>(null)

const currentStep = computed(() => steps[onboarding.currentStep] ?? steps[0])
const isLastStep = computed(() => onboarding.currentStep >= steps.length - 1)
const cardMetrics = computed(() => ({
  width: cardRef.value?.offsetWidth ?? Math.min(360, window.innerWidth - 40),
  height: cardRef.value?.offsetHeight ?? 360
}))

const updateTargetRect = () => {
  const selector = currentStep.value.selector
  if (!selector) {
    targetRect.value = null
    return
  }

  const element = document.querySelector(selector)
  targetRect.value = element ? element.getBoundingClientRect() : null
}

const highlightStyle = computed(() => {
  if (!targetRect.value) {
    return {}
  }

  const padding = 10
  return {
    left: `${targetRect.value.left - padding}px`,
    top: `${targetRect.value.top - padding}px`,
    width: `${targetRect.value.width + padding * 2}px`,
    height: `${targetRect.value.height + padding * 2}px`
  }
})

const cardStyle = computed(() => {
  if (manualPosition.value) {
    return {
      left: `${manualPosition.value.left}px`,
      top: `${manualPosition.value.top}px`
    }
  }

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const cardWidth = cardMetrics.value.width
  const cardHeight = cardMetrics.value.height
  const gutter = 20

  if (!targetRect.value || currentStep.value.placement === 'center') {
    return {
      left: `${Math.max(gutter, (viewportWidth - cardWidth) / 2)}px`,
      top: `${Math.max(40, (viewportHeight - cardHeight) / 2)}px`
    }
  }

  const rect = targetRect.value
  const placement = currentStep.value.placement ?? 'bottom'
  let left = rect.left
  let top = rect.bottom + gutter

  if (placement === 'top') {
    top = rect.top - cardHeight - gutter
  } else if (placement === 'left') {
    left = rect.left - cardWidth - gutter
    top = rect.top
  } else if (placement === 'right') {
    left = rect.right + gutter
    top = rect.top
  } else if (placement === 'top-right') {
    left = rect.right - cardWidth - gutter
    top = rect.top + gutter
  } else if (placement === 'bottom-right') {
    left = rect.right - cardWidth - gutter
    top = rect.bottom - cardHeight - (currentStep.value.safeBottom ?? 0)
  }

  left = Math.min(Math.max(gutter, left), viewportWidth - cardWidth - gutter)
  top = Math.min(Math.max(gutter, top), viewportHeight - cardHeight - gutter)

  return {
    left: `${left}px`,
    top: `${top}px`
  }
})

const handleWindowChange = () => {
  if (onboarding.visible) {
    if (manualPosition.value && cardRef.value) {
      const rect = cardRef.value.getBoundingClientRect()
      manualPosition.value = {
        left: clampLeft(manualPosition.value.left, rect.width),
        top: clampTop(manualPosition.value.top, rect.height)
      }
    }
    updateTargetRect()
  }
}

const clampLeft = (left: number, width: number) => {
  const gutter = 20
  return Math.min(Math.max(gutter, left), window.innerWidth - width - gutter)
}

const clampTop = (top: number, height: number) => {
  const gutter = 20
  return Math.min(Math.max(gutter, top), window.innerHeight - height - gutter)
}

const stopDrag = () => {
  dragState.value = null
  window.removeEventListener('mousemove', handleDragMove)
  window.removeEventListener('mouseup', stopDrag)
}

const handleDragMove = (event: MouseEvent) => {
  if (!dragState.value || !cardRef.value) {
    return
  }

  const rect = cardRef.value.getBoundingClientRect()
  manualPosition.value = {
    left: clampLeft(event.clientX - dragState.value.offsetX, rect.width),
    top: clampTop(event.clientY - dragState.value.offsetY, rect.height)
  }
}

const startDrag = (event: MouseEvent) => {
  if ((event.target as HTMLElement)?.closest('button')) {
    return
  }

  if (!cardRef.value) {
    return
  }

  const rect = cardRef.value.getBoundingClientRect()
  manualPosition.value = {
    left: rect.left,
    top: rect.top
  }
  dragState.value = {
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top
  }

  window.addEventListener('mousemove', handleDragMove)
  window.addEventListener('mouseup', stopDrag)
}

const attachListeners = () => {
  window.addEventListener('resize', handleWindowChange)
  window.addEventListener('scroll', handleWindowChange, true)
}

const detachListeners = () => {
  window.removeEventListener('resize', handleWindowChange)
  window.removeEventListener('scroll', handleWindowChange, true)
}

const goPrevious = () => {
  onboarding.goToStep(onboarding.currentStep - 1)
}

const goNext = () => {
  if (isLastStep.value) {
    onboarding.complete()
    return
  }

  onboarding.goToStep(onboarding.currentStep + 1)
}

const handleSkip = () => {
  onboarding.dismiss()
}

watch(
  () => [onboarding.visible, onboarding.currentStep],
  async ([visible]) => {
    if (!visible) {
      manualPosition.value = null
      stopDrag()
      detachListeners()
      return
    }

    await nextTick()
    updateTargetRect()
    manualPosition.value = null
    detachListeners()
    attachListeners()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  stopDrag()
  detachListeners()
})
</script>

<style scoped lang="scss">
.tour-layer {
  position: fixed;
  inset: 0;
  z-index: 4000;
  pointer-events: none;
}

.tour-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.58);
}

.tour-highlight {
  position: fixed;
  border-radius: 14px;
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.58);
  border: 2px solid #60a5fa;
  background: transparent;
  transition: all 0.2s ease;
}

.tour-card {
  position: fixed;
  width: min(360px, calc(100vw - 40px));
  padding: 18px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
  pointer-events: auto;
}

.tour-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  cursor: grab;
  user-select: none;
}

.tour-card__header:active {
  cursor: grabbing;
}

.tour-card__step {
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
}

.tour-card__ghost,
.tour-card__secondary,
.tour-card__primary {
  border: none;
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tour-card__ghost {
  background: transparent;
  color: #64748b;
  padding: 0;
}

.tour-card__ghost:hover {
  color: #0f172a;
}

.tour-card__title {
  margin: 0 0 10px;
  font-size: 18px;
  line-height: 1.35;
  color: #0f172a;
}

.tour-card__body {
  margin: 0;
  font-size: 14px;
  line-height: 1.65;
  color: #334155;
}

.tour-card__tips {
  margin: 14px 0 0;
  padding-left: 18px;
  color: #475569;
  font-size: 13px;
  line-height: 1.6;
}

.tour-card__tips li + li {
  margin-top: 6px;
}

.tour-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
}

.tour-card__secondary {
  background: #e2e8f0;
  color: #0f172a;
}

.tour-card__secondary:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.tour-card__secondary:not(:disabled):hover {
  background: #cbd5e1;
}

.tour-card__primary {
  margin-left: auto;
  background: #2563eb;
  color: #ffffff;
}

.tour-card__primary:hover {
  background: #1d4ed8;
}
</style>
