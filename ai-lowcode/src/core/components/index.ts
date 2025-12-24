// src/core/components/index.ts
import type { ComponentDefinition } from '../../types/node'

// 导入组件分类
import { ALL_LAYERS } from './layers'
import { ALL_ACTIVATIONS } from './activations'
import { ALL_MODELS } from './models'
import { ALL_UTILITIES } from './utilities'

export class ComponentRegistry {
  private static instance: ComponentRegistry
  private components: Map<string, ComponentDefinition> = new Map()
  private categories: Map<string, ComponentDefinition[]> = new Map()

  private constructor() {
    this.initializeComponents()
  }

  static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry()
    }
    return ComponentRegistry.instance
  }

  private initializeComponents() {
    // 注册所有组件
    this.registerLayerComponents()
    this.registerActivationComponents()
    this.registerModelComponents()
    this.registerUtilityComponents()
  }

  /**
   * 注册神经网络层组件
   */
  private registerLayerComponents() {
    ALL_LAYERS.forEach(component => this.registerComponent(component))
  }

  /**
   * 注册激活函数组件
   */
  private registerActivationComponents() {
    ALL_ACTIVATIONS.forEach(component => this.registerComponent(component))
  }

  /**
   * 注册预训练模型组件
   */
  private registerModelComponents() {
    ALL_MODELS.forEach(component => this.registerComponent(component))
  }

  /**
   * 注册工具组件
   */
  private registerUtilityComponents() {
    ALL_UTILITIES.forEach(component => this.registerComponent(component))
  }

  /**
   * 注册单个组件
   */
  registerComponent(component: ComponentDefinition) {
    this.components.set(component.id, component)
    
    if (!this.categories.has(component.category)) {
      this.categories.set(component.category, [])
    }
    this.categories.get(component.category)!.push(component)
  }

  getComponent(id: string): ComponentDefinition | undefined {
    return this.components.get(id)
  }

  getComponentsByCategory(category: string): ComponentDefinition[] {
    return this.categories.get(category) || []
  }

  getAllCategories(): string[] {
    return Array.from(this.categories.keys())
  }

  getAllComponents(): ComponentDefinition[] {
    return Array.from(this.components.values())
  }
}