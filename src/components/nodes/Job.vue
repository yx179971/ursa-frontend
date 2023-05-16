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

    <a-form-item>
      <div>执行作业</div>
      <a-select
          v-model:value="job"
          show-search
          label-in-value
          placeholder="选择一个作业"
          style="width: 200px"
          :options="jobList"
          :filter-option="filterOption"
          @focus="handleFocus"
          @select="handleChange"
      ></a-select>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import {inject, ref} from 'vue';
import conf from '../../conf.js'
import utils from '../../utils.js'
import axios from "axios";

const emit = defineEmits(['close'])

const updateNodeData = inject('updateNodeData')
const nodeData = inject('currentNodeData').value

const formRef = ref(null)
const formState = ref({
  nodeName: nodeData.attrs.text.text,
  job_id: nodeData.data?.job_id ? nodeData.data.job_id : '',
})

function saveConfig() {
  return new Promise(function (resolve, reject) {
    formRef.value.validate()
        .then(function (info) {
          updateNodeData(nodeData.id, {"text/text": formState.value.nodeName}, {
            'job_id': formState.value.job_id,
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

// 执行作业
const job = ref({value:formState.value.job_id})
const jobList = ref([])
getJobList()

function getJobList() {
  axios.get(conf.host + '/jobs').then(function (response) {
    jobList.value = response.data.data.map(function (item) {
      item.label = item.name
      item.value = item.id
      if (item.id == job.value.value) {
        job.value.label = item.label
      }
      return item
    })
  }).catch(function (error) {
    utils.raiseError(error)
  })
}

function handleFocus() {
  getJobList()
}

function filterOption(input, option) {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
}

function handleChange(value) {
  formState.value.job_id = value.value
}

</script>
