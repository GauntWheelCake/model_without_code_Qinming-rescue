<template>
  <el-dialog
    v-model="visible"
    title="强化学习环境配置"
    width="480px"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      label-width="120px"
      label-position="left"
    >
      <el-form-item label="想定文件URL">
        <el-input
          v-model="form.httpUrl"
          placeholder="http://..."
          clearable
        />
      </el-form-item>

      <el-form-item label="TCP端口">
        <el-input-number
          v-model="form.tcpPort"
          :min="1"
          :max="65535"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="UDP端口">
        <el-input-number
          v-model="form.udpPort"
          :min="1"
          :max="65535"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="保存路径">
        <el-input
          v-model="form.savePath"
          placeholder="./received_data"
          clearable
        />
      </el-form-item>

      <el-form-item label="处理间隔(秒)">
        <el-input-number
          v-model="form.interval"
          :min="1"
          :max="300"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUIStore, type RLConfig } from '../../stores/ui'
import { ElMessage } from 'element-plus'

const visible = defineModel<boolean>('visible', { default: false })
const emit = defineEmits<{
  'config-updated': []
}>()

const uiStore = useUIStore()

const form = ref<RLConfig>({
  httpUrl: '',
  tcpPort: 3331,
  udpPort: 4444,
  savePath: './received_data',
  interval: 5
})

// 打开弹窗时同步当前配置
watch(visible, (val) => {
  if (val) {
    form.value = { ...uiStore.rlConfig }
  }
})

const handleConfirm = () => {
  if (!form.value.httpUrl.trim()) {
    ElMessage.warning('请填写想定文件URL')
    return
  }
  uiStore.updateRLConfig({ ...form.value })
  ElMessage.success('配置已保存')
  visible.value = false
  emit('config-updated')
}
</script>
