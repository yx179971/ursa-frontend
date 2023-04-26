<template>
  <a-layout>
    <a-layout-header class="header">
      <div class="logo"/>
      <a-menu
          v-model:selectedKeys="selectedKeys1"
          theme="dark"
          mode="horizontal"
          :style="{ lineHeight: '64px' }"
      >
        <a-menu-item key="1">nav 1</a-menu-item>
        <a-menu-item key="2">nav 2</a-menu-item>
        <a-menu-item key="3">nav 3</a-menu-item>
      </a-menu>
    </a-layout-header>
    <a-layout>
      <a-layout-sider width="200" style="background: #fff">
        <a-menu
            v-model:selectedKeys="selectedKeys2"
            v-model:openKeys="openKeys"
            mode="inline"
            :style="{ height: '100%', borderRight: 0 }"
        >
          <a-sub-menu key="jobList">
            <template #title>
              <span>
                <laptop-outlined/>
                作业列表
              </span>
            </template>
            <a-menu-item v-for="job in jobList" :key="job.id">{{ job.name }}</a-menu-item>
          </a-sub-menu>
        </a-menu>
      </a-layout-sider>
      <a-layout style="padding: 0 24px 0">
        <p style="flex-direction: row">
          <a-breadcrumb style="margin: 16px 0">
            <a-breadcrumb-item>{{ currentJobName }}</a-breadcrumb-item>
          </a-breadcrumb>
          <a-button @click="creatJob" type="primary" style="width: 100px">新建</a-button>
          <a-modal v-model:visible="modelVisible" title="新建作业" @ok="handleCreatJob">
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
                <a-input v-model:value="formState.jobName"/>
              </a-form-item>
            </a-form>
          </a-modal>
          <a-button @click="deleteJob" type="primary" danger style="width: 100px">删除</a-button>
        </p>
        <p>
          <a-layout-content
              :style="{ background: '#fff', padding: '24px', margin: 0, height: '100%' }"
          >
            <Graph :job="currentJob" @display-job="displayJob"/>
          </a-layout-content>
        </p>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script setup>
import {UserOutlined, LaptopOutlined, NotificationOutlined} from '@ant-design/icons-vue';
import {defineComponent, watch, ref, computed, provide} from 'vue';
import Graph from './Graph.vue'
import axios from "axios";
import conf from '../conf.js'
import utils from '../utils.js'
import {message} from "ant-design-vue";

const selectedKeys1 = ref(['2'])
const selectedKeys2 = ref([])
const openKeys = ref(['jobList'])

// 获取作业列表
const jobList = ref([])

function getJobList() {
  axios.get(conf.host + '/jobs').then(function (response) {
    jobList.value = response.data.data
    if (!currentJob.value) {
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
  selectedKeys2.value = [job.id]
  currentJob.value = job
}

const currentJobName = computed(() => {
  return currentJob.value ? currentJob.value.name : ''
})

watch(selectedKeys2, async () => {
  if (selectedKeys2.value.length > 0) {
    axios.get(conf.host + '/job/' + selectedKeys2.value[0])
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

function creatJob() {
  modelVisible.value = true
}

const formRef = ref(null)
const formState = ref({
  jobName: '',
});

function handleCreatJob() {
  formRef.value.validate().then(function (res) {
    axios.post(conf.host + '/job', {"name": jobName})
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
</script>

<style>
</style>
