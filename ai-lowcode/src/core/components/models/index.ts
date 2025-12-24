// src/core/components/models/index.ts
import type { ComponentDefinition } from '../base'

import { VISION_MODELS } from './vision'
import { TRANSFORMER_MODELS } from './transformers'

export {
  VISION_MODELS,
  TRANSFORMER_MODELS
}

export const ALL_MODELS = [
  ...VISION_MODELS,
  ...TRANSFORMER_MODELS
]