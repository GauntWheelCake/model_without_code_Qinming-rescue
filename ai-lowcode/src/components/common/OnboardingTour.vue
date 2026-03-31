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
    title: '先完成第一次完整建模',
    body: '这套引导的目标不是带你认识按钮，而是带你完成一次真正可见的建模闭环。你会用 3 到 5 分钟搭出“二维卷积 -> ReLU -> 展平层 -> 全连接层”这条最小链路，并在右侧看到自动生成的 PyTorch 代码。',
    placement: 'center',
    tips: [
      '第一版只覆盖最核心的主路径：拖节点、连线、改参数、生成代码。',
      '先学会最短闭环，再去看训练配置、导出和更复杂的模型结构。',
      '你可以随时跳过，之后从顶部“新手引导”重新打开。'
    ]
  },
  {
    title: '先从组件库把需要的节点拖出来',
    body: '左侧是组件库，所有建模动作都从这里开始。请依次找到并拖入 4 个节点：二维卷积（Conv2d）、ReLU、展平层（Flatten）和全连接层（Linear）。',
    selector: '[data-tour="toolbox"]',
    placement: 'right',
    tips: [
      '建议按最终执行顺序拖入，这样后面连线和阅读都会更直观。',
      '当前项目没有单独的 Input 节点，所以教程从 Conv2d 起步。',
      '如果一时找不到组件，先看左侧分类，再用搜索框筛选。'
    ]
  },
  {
    title: '在画布上按执行顺序完成连线',
    body: '中间是模型画布。把四个节点从左到右排开后，按顺序连成一条链：“二维卷积 -> ReLU -> 展平层 -> 全连接层”。这条链已经足够代表一个最小可运行的图像分类流程。',
    selector: '[data-tour="canvas"]',
    placement: 'top-right',
    tips: [
      '连线方式是从前一个节点右侧输出点，拖到后一个节点左侧输入点。',
      '二维卷积负责提取图像特征，ReLU 负责非线性激活，展平层负责把特征图展平成向量，全连接层负责输出分类结果。',
      '如果连线失败，通常是顺序不合理、目标输入点已被占用，或当前结构不满足规则。'
    ]
  },
  {
    title: '先把每层的输入输出尺寸算清楚',
    body: '代码能不能跑，先看前后层的尺寸能不能接上。这里直接按 CIFAR-10 来理解：输入先看成一张 3×32×32 的彩色图像。第一次只改必须改的参数，其余先保持默认。',
    selector: '[data-tour="canvas"]',
    placement: 'bottom-right',
    safeBottom: 56,
    tips: [
      '二维卷积层：把 `in_channels` 设为 `3`，`out_channels` 可先设为 `16`。',
      '展平层：保持默认，它的作用只是把前面的特征图变成一维向量。',
      '全连接层：在这套默认示例里，把 `in_features` 直接设为 `16384`，因为 `16 × 32 × 32 = 16384`；把 `out_features` 设为 `10`，对应 CIFAR-10 的 10 个类别。',
      '其他参数先保持默认，不用改。先记住一句话：前一层的输出，必须正好等于后一层的输入。'
    ]
  },
  {
    title: '确认结构后，生成对应代码',
    body: '当节点和连线都准备好后，就可以从这里生成代码。这个按钮会把当前画布结构转换成可读的 PyTorch 代码；如果自动生成保持开启，后续你继续改图，右侧结果也会跟着刷新。',
    selector: '[data-tour="generate-code"]',
    placement: 'bottom',
    tips: [
      '这一步是整条引导里最重要的结果点，因为它把“图形化搭建”和“真实代码”连起来了。',
      '如果生成失败，优先回到画布检查节点顺序、连线完整性和关键参数。',
      '你可以把它理解为：画布是模型结构的可视化编辑器，代码区是这个结构的程序化表达。'
    ]
  },
  {
    title: '先分清“下载单文件”和“下载完整项目”',
    body: '右侧生成结果确认无误后，下一步就是选导出方式。这里有两个常用入口：下载当前文件，和下载完整项目。新手最容易在这里选错，所以先把用途分清楚。',
    selector: '[data-tour="download-code"]',
    placement: 'left',
    tips: [
      '下载当前文件：只下载你当前标签页看到的这一份代码，适合先单独查看 `model.py`、训练脚本或推理脚本。',
      '下载完整项目：会把模型、训练、推理、依赖等文件一起打包，更适合你后面拿到本地直接运行。',
      '如果你现在还拿不准，新手默认优先选“下载完整项目”，因为它更接近可直接运行的工程。'
    ]
  },
  {
    title: '导出完整项目时，再决定要不要附带示例资源',
    body: '点击“下载完整项目”后，会弹出导出选项。这里不是都要勾，而是按你的下一步目标来选：想继续跟着教程跑 CIFAR-10，就勾数据集；想顺手测试推理脚本，就再勾推理图片；暂时只想看工程结构，就都不勾。',
    selector: '[data-tour="download-project"]',
    placement: 'left',
    tips: [
      '勾选“包含离线 CIFAR-10 数据集包”：适合你后面准备直接跑这套默认示例训练流程。',
      '勾选“包含 3 张推理示例图片”：适合你后面想直接测试推理脚本，看看图片分类结果是否能跑通。',
      '只想先看代码，不急着训练和推理：单文件下载就够了；想把工程带走继续跑：优先选完整项目。',
      '以后忘了流程，可以从顶部“新手引导”重新打开。'
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
