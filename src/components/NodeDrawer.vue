<template>
  <a-drawer
      :visible="visible"
      :closable="closable"
      :destroy-on-close="destroyOnClose"
      :mask-closable="maskClosable"
      :title="title"
      :width="width"
      :placement="placement"
      @close="onClose"
  >
    <component ref="nodeConfig" :is="cs[nodeComponent]" @close="onClose"/>
  </a-drawer>
</template>

<script setup lang="ts">
import {getCurrentInstance} from 'vue';
import {message} from "ant-design-vue";
import Start from './nodes/Start.vue'
import Virtual from './nodes/Virtual.vue'
import Operation from './nodes/Operation.vue'
import Job from './nodes/Job.vue'

export interface Props {
  nodeComponent?: string
  visible?: boolean
  closable?: boolean
  destroyOnClose?: boolean
  maskClosable?: boolean
  title?: string
  placement?: 'top' | 'right' | 'bottom' | 'left'
  width?: number
}

withDefaults(defineProps<Props>(), {
  visible: false,
  closable: true,
  destroyOnClose: true,
  maskClosable: true,
  title: '配置',
  placement: 'right',
  width: 512,
})

const cs = {
  Start,
  Operation,
  Job,
  Virtual,
}

const proxy = getCurrentInstance()
const emit = defineEmits(['update:visible'])

function onClose() {
  proxy.refs.nodeConfig.saveConfig()
      .then(function (info) {
        emit('update:visible', false)
      })
      .catch(function (err) {
        console.log(err)
      })
  message.warning("配置已保存")
  // todo: 修改的回退和前进
}

</script>
