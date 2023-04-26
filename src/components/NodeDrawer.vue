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
    <component ref="nodeConfig" :is="nodeComponent" :nodeData="nodeData"/>
  </a-drawer>
</template>

<script setup lang="ts">
import {VueConstructor, inject, getCurrentInstance, onMounted} from 'vue';

export interface Props {
  nodeComponent?: VueConstructor
  nodeData?: any
  visible?: boolean
  closable?: boolean
  destroyOnClose?: boolean
  maskClosable?: boolean
  title?: string
  placement?: 'top' | 'right' | 'bottom' | 'left'
  width?: number
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  closable: true,
  destroyOnClose: false,
  maskClosable: true,
  title: '配置',
  placement: 'right',
  width: 256,
})


const proxy = getCurrentInstance()
const setVisibleFalse = inject('setVisibleFalse')

function onClose() {
  proxy.refs.nodeConfig.saveConfig()
      .then(function (info) {
        console.log(info)
        setVisibleFalse()
      })
      .catch(function (err) {
        console.log(err)
      })
}


</script>
