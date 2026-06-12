<template>
  <div class="toolbox">
    <div class="toolbox-header">
      <h3>
        <el-icon><Menu /></el-icon>
        AI组件库 ({{ totalComponents }}个组件)
      </h3>
      <div class="header-controls">
        <el-input
          v-model="searchText"
          placeholder="搜索组件..."
          size="small"
          clearable
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button-group size="small">
          <el-tooltip content="紧凑视图" placement="bottom">
            <el-button 
              :type="viewMode === 'compact' ? 'primary' : 'default'"
              @click="viewMode = 'compact'"
            >
              <el-icon><Grid /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="详细视图" placement="bottom">
            <el-button 
              :type="viewMode === 'detailed' ? 'primary' : 'default'"
              @click="viewMode = 'detailed'"
            >
              <el-icon><List /></el-icon>
            </el-button>
          </el-tooltip>
        </el-button-group>
      </div>
    </div>
    
    <div class="toolbox-content custom-scrollbar">
      <!-- 深度学习组件库（上半部分） -->
      <div class="toolbox-section dl-section">
        <div class="section-header">
          <el-icon><Grid /></el-icon>
          <span>深度学习组件库</span>
          <el-tag size="small" type="info">{{ dlTotalComponents }}个</el-tag>
        </div>
        <el-tabs v-model="activeDLCategory" class="category-tabs">
          <el-tab-pane
            v-for="category in filteredSections.dl"
            :key="category.id"
            :label="`${category.name} (${category.components.length})`"
            :name="category.id"
          >
            <!-- 紧凑视图 -->
            <div v-if="viewMode === 'compact'" class="compact-view">
              <div
                v-for="component in category.components"
                :key="component.id"
                class="compact-component"
                draggable="true"
                @dragstart="handleDragStart($event, component)"
                :title="component.description"
              >
                <div class="compact-icon">
                  <el-icon>
                    <component :is="component.icon" />
                  </el-icon>
                </div>
                <div class="compact-name">{{ component.name }}</div>
              </div>
            </div>

            <!-- 详细视图 -->
            <div v-else class="detailed-view">
              <el-collapse v-model="activeSections[category.id]">
                <div
                  v-for="component in category.components"
                  :key="component.id"
                  class="detailed-component"
                  draggable="true"
                  @dragstart="handleDragStart($event, component)"
                >
                  <div class="component-main" @click="toggleComponentDetails(component.id)">
                    <div class="component-icon">
                      <el-icon>
                        <component :is="component.icon" />
                      </el-icon>
                    </div>
                    <div class="component-info">
                      <div class="component-name">{{ component.name }}</div>
                      <div class="component-desc">{{ component.description }}</div>
                      <div class="component-meta">
                        <el-tag size="small" type="info">{{ component.type }}</el-tag>
                        <span class="param-count">{{ component.params.length }}个参数</span>
                      </div>
                    </div>
                    <div class="component-arrow">
                      <el-icon v-if="expandedComponent === component.id">
                        <ArrowDown />
                      </el-icon>
                      <el-icon v-else>
                        <ArrowRight />
                      </el-icon>
                    </div>
                  </div>

                  <!-- 参数预览 -->
                  <el-collapse-transition>
                    <div v-if="expandedComponent === component.id" class="component-params-preview">
                      <div class="params-title">参数配置</div>
                      <div class="params-list">
                        <div
                          v-for="param in component.params.slice(0, 3)"
                          :key="param.key"
                          class="param-preview"
                        >
                          <span class="param-label">{{ param.label }}:</span>
                          <span class="param-value">{{ formatParamPreview(param) }}</span>
                        </div>
                        <div v-if="component.params.length > 3" class="more-params">
                          还有 {{ component.params.length - 3 }} 个参数...
                        </div>
                      </div>
                    </div>
                  </el-collapse-transition>
                </div>
              </el-collapse>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 分割线 -->
      <div class="section-divider" />

      <!-- 强化学习组件库（下半部分） -->
      <div class="toolbox-section rl-section">
        <div class="section-header">
          <el-icon><Trophy /></el-icon>
          <span>强化学习组件库</span>
          <el-tag size="small" type="danger">{{ rlTotalComponents }}个</el-tag>
        </div>
        <el-tabs v-model="activeRLCategory" class="category-tabs">
          <el-tab-pane
            v-for="category in filteredSections.rl"
            :key="category.id"
            :label="`${category.name} (${category.components.length})`"
            :name="category.id"
          >
            <!-- 紧凑视图 -->
            <div v-if="viewMode === 'compact'" class="compact-view">
              <div
                v-for="component in category.components"
                :key="component.id"
                class="compact-component"
                draggable="true"
                @dragstart="handleDragStart($event, component)"
                :title="component.description"
              >
                <div class="compact-icon rl-icon">
                  <el-icon>
                    <component :is="component.icon" />
                  </el-icon>
                </div>
                <div class="compact-name">{{ component.name }}</div>
              </div>
            </div>

            <!-- 详细视图 -->
            <div v-else class="detailed-view">
              <el-collapse v-model="activeSections[category.id]">
                <div
                  v-for="component in category.components"
                  :key="component.id"
                  class="detailed-component"
                  draggable="true"
                  @dragstart="handleDragStart($event, component)"
                >
                  <div class="component-main" @click="toggleComponentDetails(component.id)">
                    <div class="component-icon rl-icon">
                      <el-icon>
                        <component :is="component.icon" />
                      </el-icon>
                    </div>
                    <div class="component-info">
                      <div class="component-name">{{ component.name }}</div>
                      <div class="component-desc">{{ component.description }}</div>
                      <div class="component-meta">
                        <el-tag size="small" type="info">{{ component.type }}</el-tag>
                        <span class="param-count">{{ component.params.length }}个参数</span>
                      </div>
                    </div>
                    <div class="component-arrow">
                      <el-icon v-if="expandedComponent === component.id">
                        <ArrowDown />
                      </el-icon>
                      <el-icon v-else>
                        <ArrowRight />
                      </el-icon>
                    </div>
                  </div>

                  <!-- 参数预览 -->
                  <el-collapse-transition>
                    <div v-if="expandedComponent === component.id" class="component-params-preview">
                      <div class="params-title">参数配置</div>
                      <div class="params-list">
                        <div
                          v-for="param in component.params.slice(0, 3)"
                          :key="param.key"
                          class="param-preview"
                        >
                          <span class="param-label">{{ param.label }}:</span>
                          <span class="param-value">{{ formatParamPreview(param) }}</span>
                        </div>
                        <div v-if="component.params.length > 3" class="more-params">
                          还有 {{ component.params.length - 3 }} 个参数...
                        </div>
                      </div>
                    </div>
                  </el-collapse-transition>
                </div>
              </el-collapse>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ComponentRegistry } from '../../core/components'
import { ComponentBuilder } from '../../core/components/builder'
import { DL_CATEGORIES, RL_CATEGORIES, getCategoryInfo } from '../../core/components/categories'
import type { ComponentDefinition } from '../../types/node'
import {
  Menu, Search, Grid, List, ArrowRight, ArrowDown, Trophy,
  // 导入更多图标
  Picture, Connection, Operation, ScaleToOriginal,
  TrendCharts, Box, Filter, SortUp, Sort, FullScreen,
  DataAnalysis, Aim
} from '@element-plus/icons-vue'

// 组件注册中心
const componentRegistry = ComponentRegistry.getInstance()

// 响应式数据
const searchText = ref('')
const activeDLCategory = ref('basic_layers')
const activeRLCategory = ref('rl_components')
const viewMode = ref<'compact' | 'detailed'>('compact')
const expandedComponent = ref<string>('')
const activeSections = ref<Record<string, string[]>>({})

// 将组件注册中心的分类列表按 family 分组并渲染
const buildCategories = (familyIds: string[]) => {
  return familyIds.map(catId => {
    const components = componentRegistry.getComponentsByCategory(catId)
      .filter(comp => ComponentBuilder.validate(comp))

    const categoryInfo = getCategoryInfo(catId)

    return {
      id: catId,
      name: categoryInfo?.name || catId,
      components
    }
  }).filter(cat => cat.components.length > 0)
}

const dlCategories = computed(() => buildCategories(DL_CATEGORIES))
const rlCategories = computed(() => buildCategories(RL_CATEGORIES))

// 搜索过滤：一次性处理 DL / RL，避免重复 lowercase 和遍历
const filteredSections = computed(() => {
  const raw = searchText.value.trim()
  const searchLower = raw.toLowerCase()

  const filter = (categories: ReturnType<typeof buildCategories>) => {
    if (!raw) return categories

    return categories.map(category => ({
      ...category,
      components: category.components.filter(component =>
        component.name.toLowerCase().includes(searchLower) ||
        component.description.toLowerCase().includes(searchLower) ||
        component.type.toLowerCase().includes(searchLower) ||
        component.params.some(param =>
          param.label.toLowerCase().includes(searchLower) ||
          param.key.toLowerCase().includes(searchLower)
        )
      )
    })).filter(category => category.components.length > 0)
  }

  return {
    dl: filter(dlCategories.value),
    rl: filter(rlCategories.value)
  }
})

// 总组件数
const dlTotalComponents = computed(() =>
  filteredSections.value.dl.reduce((sum, cat) => sum + cat.components.length, 0)
)

const rlTotalComponents = computed(() =>
  filteredSections.value.rl.reduce((sum, cat) => sum + cat.components.length, 0)
)

const totalComponents = computed(() => dlTotalComponents.value + rlTotalComponents.value)

// 格式化参数预览
const formatParamPreview = (param: any): string => {
  if (param.type === 'boolean') {
    return param.value ? '是' : '否'
  }
  if (param.type === 'select') {
    const option = param.options?.find((opt: any) => opt.value === param.value)
    return option?.label || String(param.value)
  }
  if (param.type === 'range') {
    return param.value.toFixed(2)
  }
  return String(param.value)
}

// 切换组件详情
const toggleComponentDetails = (componentId: string) => {
  expandedComponent.value = expandedComponent.value === componentId ? '' : componentId
}

// 拖拽开始
const handleDragStart = (event: DragEvent, component: ComponentDefinition) => {
  if (event.dataTransfer) {
    // 深拷贝组件定义
    const componentCopy = JSON.parse(JSON.stringify(component))
    event.dataTransfer.setData('component', JSON.stringify(componentCopy))
    event.dataTransfer.effectAllowed = 'copy'
  }
}

</script>

<style scoped lang="scss">
.toolbox {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  border-right: 1px solid var(--border-color);
  
  .toolbox-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    
    h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #303133;
      font-size: 16px;
      font-weight: 600;
      
      .el-icon {
        color: #409eff;
      }
    }
    
    .header-controls {
      display: flex;
      gap: 8px;
      
      .search-input {
        flex: 1;
        
        :deep(.el-input__wrapper) {
          border-radius: 16px;
        }
      }
    }
  }

  .toolbox-content {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    display: flex;
    flex-direction: column;

    .toolbox-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: #f5f7fa;
        border-bottom: 1px solid var(--border-color);
        font-size: 14px;
        font-weight: 600;
        color: #303133;

        .el-icon {
          color: #409eff;
        }
      }

      &.rl-section .section-header {
        .el-icon {
          color: #e74c3c;
        }
      }
    }

    .section-divider {
      height: 8px;
      background: #e4e7ed;
      border-top: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
    }

    :deep(.category-tabs) {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;

      .el-tabs__header {
        margin: 0;
        padding: 0 16px;
        background: #f5f7fa;
        flex-shrink: 0;

        .el-tabs__nav-wrap::after {
          height: 1px;
          background-color: var(--border-color);
        }

        .el-tabs__item {
          padding: 0 16px;
          height: 40px;
          line-height: 40px;
          font-size: 13px;

          &.is-active {
            color: #409eff;
            font-weight: 500;
          }
        }

        .el-tabs__active-bar {
          background-color: #409eff;
        }
      }

      .el-tabs__content {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 16px;
      }
    }

    .compact-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 12px;

      .compact-component {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 8px;
        border-radius: 6px;
        cursor: move;
        transition: all 0.2s;
        border: 1px solid transparent;
        text-align: center;

        &:hover {
          background: #f0f7ff;
          border-color: #c6e2ff;
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .compact-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #409eff, #67c23a);
          border-radius: 8px;
          color: white;
          margin-bottom: 8px;

          &.rl-icon {
            background: linear-gradient(135deg, #e74c3c, #f39c12);
          }
        }

        .compact-name {
          font-size: 12px;
          color: #303133;
          line-height: 1.2;
          font-weight: 500;
        }
      }
    }

    .detailed-view {
      .detailed-component {
        margin-bottom: 8px;
        border: 1px solid #e4e7ed;
        border-radius: 6px;
        overflow: hidden;
        cursor: move;
        transition: all 0.2s;

        &:hover {
          border-color: #409eff;
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
        }

        .component-main {
          display: flex;
          align-items: center;
          padding: 12px;
          background: #ffffff;
          cursor: pointer;

          .component-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #409eff, #67c23a);
            color: white;
            border-radius: 6px;
            margin-right: 12px;
            flex-shrink: 0;

            &.rl-icon {
              background: linear-gradient(135deg, #e74c3c, #f39c12);
            }
          }

          .component-info {
            flex: 1;
            min-width: 0;

            .component-name {
              font-weight: 500;
              color: #303133;
              margin-bottom: 2px;
              font-size: 14px;
            }

            .component-desc {
              font-size: 12px;
              color: #909399;
              margin-bottom: 4px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .component-meta {
              display: flex;
              align-items: center;
              gap: 8px;

              .el-tag {
                height: 20px;
                line-height: 18px;
                font-size: 11px;
              }

              .param-count {
                font-size: 11px;
                color: #909399;
              }
            }
          }

          .component-arrow {
            color: #c0c4cc;
            flex-shrink: 0;
          }
        }

        .component-params-preview {
          padding: 12px;
          background: #f8f9fa;
          border-top: 1px solid #e4e7ed;

          .params-title {
            font-size: 12px;
            font-weight: 500;
            color: #606266;
            margin-bottom: 8px;
          }

          .params-list {
            .param-preview {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 12px;

              .param-label {
                color: #606266;
              }

              .param-value {
                color: #303133;
                font-weight: 500;
                max-width: 60px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }

            .more-params {
              font-size: 11px;
              color: #909399;
              text-align: center;
              padding: 4px;
              background: #f5f7fa;
              border-radius: 4px;
              margin-top: 4px;
            }
          }
        }
      }
    }
  }
}
</style>