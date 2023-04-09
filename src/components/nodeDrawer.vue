<template>
  <a-drawer
      :visible="visible"
      :closable="closable"
      :destroy-on-close="destroyOnClose"
      :mask-closable="maskClosable"
      :title="title"
      :width="width"
      :placement="placement"
      @close="setVisibleFalse"
  >
    <component :is="nodeComponent" />
  </a-drawer>
</template>

<script lang="ts">
import { defineComponent, PropType, VueConstructor, inject } from 'vue';

export default defineComponent({
  name: 'MyDrawer',
  inject: ['setVisibleFalse'],
  props: {
    nodeComponent: {
      type: Object as PropType<VueConstructor>,
      required: false,
    },
    visible: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
    closable: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
    destroyOnClose: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
    maskClosable: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
    title: {
      type: String as PropType<string>,
      default: '123',
    },
    width: {
      type: Number as PropType<number>,
      default: 256,
    },
    placement: {
      type: String as PropType<'top' | 'right' | 'bottom' | 'left'>,
      default: 'right',
    },
  },
});
</script>
