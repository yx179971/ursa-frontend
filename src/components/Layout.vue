<template>
  <a-layout style="height: 100%">
    <a-layout-sider width="200" style="background: #fff;overflow: hidden; overflow-y: scroll;">
      <a-menu
          v-model:selectedKeys="selectedKeys"
          v-model:openKeys="openKeys"
          mode="inline"
          :style="{ height: '100%', borderRight: 0}"
      >
        <a-sub-menu key="jobList">
          <template #title>
              <span>
                <laptop-outlined/>
                作业列表
              </span>
          </template>
          <div style="">
            <draggable
                v-model="jobList"
                @start="drag=true"
                @end="onDragEnd"
                item-key="id"
                handle=".handle"
                animation="300"
            >
              <template #item="{element}">
                <div :key="element.id">
                  <a-menu-item :key="element.id">
                    <i class="fa fa-align-justify handle"></i>
                    <span>{{ element.name }}</span>
                  </a-menu-item>
                </div>
              </template>
            </draggable>
          </div>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>
    <a-layout style="padding: 0 24px 0; height: 100%">
      <p style="flex-direction: row;display: flex;align-items: end">
        <a-breadcrumb style="margin: 16px auto 0 0">
          <a-breadcrumb-item>{{ currentJobName }}</a-breadcrumb-item>
        </a-breadcrumb>
        <a-button @click="createJob" type="primary" style="width: 100px">新建</a-button>
        <a-button @click="updateJob" style="width: 100px">重命名</a-button>
        <a-button @click="deleteJob" type="primary" danger style="width: 100px">删除</a-button>
      </p>
      <p style="height: calc(100% - 74px)" v-if="currentJob">
        <a-layout-content
            :style="{ background: '#fff', padding: '24px', margin: 0, height: '100%' }"
        >
          <Graph ref="graph" :job="currentJob" @display-job="displayJob"/>
        </a-layout-content>
      </p>
    </a-layout>
  </a-layout>

  <a-modal v-model:visible="modelVisible" title="新建作业" @ok="handleCreateJob">
    <a-form
        ref="formRef"
        :model="formState"
        autocomplete="off"
        name="createJob"
    >
      <a-form-item
          label="作业名称"
          name="jobName"
          :rules="[{ required: true, message: '请输入作业名称!' }]"
      >
        <a-input v-model:value="formState.jobName" v-on:keyup.enter="handleCreateJob"/>
      </a-form-item>
    </a-form>
  </a-modal>

  <a-modal v-model:visible="updateVisible" title="重命名作业" @ok="handleUpdateJob">
    <a-form
        ref="formRef"
        :model="formState"
        autocomplete="off"
        name="updateJob"
    >
      <a-form-item
          label="作业名称"
          name="jobName"
          :rules="[{ required: true, message: '请输入作业名称!' }]"
      >
        <a-input v-model:value="formState.jobName"/>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import draggable from 'vuedraggable'
import {LaptopOutlined} from '@ant-design/icons-vue';
import {watch, ref, computed} from 'vue';
import Graph from './Graph.vue'
import axios from "axios";
import conf from '../conf.js'
import utils from '../utils.js'

const graph = ref(null)

// 左侧菜单列表
const selectedKeys = ref([])
const openKeys = ref(['jobList'])

// 获取作业列表
const jobList = ref([])

function getJobList() {
  axios.get(conf.host + '/jobs').then(function (response) {
    jobList.value = response.data.data
    if (!currentJob.value && jobList.value.length > 0) {
      displayJob(jobList.value[0])
    }
  }).catch(function (error) {
    utils.raiseError(error)
  })
}

getJobList()

// 当前作业
const currentJob = ref(null)

function displayJob(job) {
  selectedKeys.value = [job.id]
  currentJob.value = job
}

const currentJobName = computed(() => {
  return currentJob.value ? currentJob.value.name : ''
})

watch(selectedKeys, async () => {
  if (selectedKeys.value.length > 0) {
    axios.get(conf.host + '/job/' + selectedKeys.value[0])
        .then(function (response) {
          currentJob.value = response.data.data
        })
        .catch(function (error) {
          utils.raiseError(error)
        })
  }
}, {immediate: true})

// 新建
const modelVisible = ref(false)

function createJob() {
  modelVisible.value = true
  formState.value.jobName = ''
}

const formRef = ref(null)
const formState = ref({
  jobName: '',
});

function handleCreateJob() {
  formRef.value.validate().then(function (res) {
    axios.post(conf.host + '/job', {"name": res.jobName})
        .then(function (response) {
          getJobList()
          displayJob(response.data.data)
          modelVisible.value = false
        })
        .catch(function (error) {
          utils.raiseError(error)
        })
  }).catch(function (res) {
    console.log(res)
  })
}

// 重命名
const updateVisible = ref(false)

function updateJob() {
  updateVisible.value = true
  formState.value.jobName = currentJob.value.name
}

function handleUpdateJob() {
  formRef.value.validate().then(function (res) {
    currentJob.value.name = formState.value.jobName
    graph.value.updateJob().finally(() => {
      getJobList()
      updateVisible.value = false
    })
  }).catch(function (res) {
    console.log(res)
  })
}

// 删除
function deleteJob() {
  axios.delete(conf.host + '/job/' + currentJob.value.id)
      .then(function (response) {
        currentJob.value = null
        getJobList()
      })
      .catch(function (error) {
        utils.raiseError(error)
      })
}

// 排序
function onDragEnd() {
  axios.post(conf.host + '/jobs/sort', {
    data: jobList.value
  })
      .then(function (response) {
        getJobList()
      })
      .catch(function (error) {
        utils.raiseError(error)
      })
}
</script>

<style>
.handle {
  cursor: move;
  padding: 8px 8px 8px 0;
}
::-webkit-scrollbar-thumb {
  background-image: linear-gradient(180deg, #F2BAE8 0%, #0C7BB3 99%);
  box-shadow: inset 2px 2px 5px 0 rgba(#fff, 0.5);
  border-radius: 100px;
}
::-webkit-scrollbar-track {
  background-color: #e4e4e4;
  border-radius: 100px;
}
::-webkit-scrollbar {
  width: 14px;
}
</style>
