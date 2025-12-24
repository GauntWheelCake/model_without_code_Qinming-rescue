// src/core/components/activations/index.ts
import type { ComponentDefinition } from '../base'

import { BASIC_ACTIVATIONS } from './basic'
import { ADVANCED_ACTIVATIONS } from './advanced'

export {
  BASIC_ACTIVATIONS,
  ADVANCED_ACTIVATIONS
}

export const ALL_ACTIVATIONS = [
  ...BASIC_ACTIVATIONS,
  ...ADVANCED_ACTIVATIONS
]