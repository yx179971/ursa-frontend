<template>
  <a-form
      ref="formRef"
      :model="formState"
      name="nodeConfig"
      autocomplete="off"
  >
    <!--      注意name和formState中用到的字段必须一致-->
    <a-form-item
        name="nodeName"
        :rules="[{ required: true, message: '请输入节点名称!' }]"
    >
      <div>名称</div>
      <a-input v-model:value="formState.nodeName" v-on:keyup.enter="$emit('close')"/>
    </a-form-item>
  </a-form>
</template>

<script setup>
import {inject, ref} from 'vue';

const emit = defineEmits(['close'])

const updateNodeData = inject('updateNodeData')
const nodeData = inject('currentNodeData').value

const formRef = ref(null)
const formState = ref({
  nodeName: nodeData.attrs.text.text,
})

function saveConfig() {
  return new Promise(function (resolve, reject) {
    formRef.value.validate()
        .then(function (info) {
          updateNodeData(nodeData.id, {"text/text": formState.value.nodeName}, {
            'action': 'pass'
          })
          resolve(info)
        })
        .catch(function (error) {
          reject(error)
        })
  })
}

defineExpose(
    {saveConfig}
)
</script>

<style scoped>

</style>