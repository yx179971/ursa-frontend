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
      <a-input v-model:value="formState.nodeName"/>
    </a-form-item>

    <a-form-item>
      <div>操作</div>
      <a-radio-group v-model:value="formState.action">
        <a-radio value="pass">无行为</a-radio>
        <a-radio value="click_target">点击图片</a-radio>
        <a-radio value="click_area">点击区域</a-radio>
      </a-radio-group>
    </a-form-item>

    <a-form-item>
      <div>操作后延时</div>
      <a-input v-model:value="formState.delay"/>
    </a-form-item>

  </a-form>
  <a-upload
      v-model:file-list="fileList"
      name="file"
      :action="uploadUrl"
      :headers="headers"
      @change="handleChange"
  >
    <a-button>
      <upload-outlined></upload-outlined>
      Click to Upload
    </a-button>
  </a-upload>
  <a-image :preview="false" v-if="nodeData.store.data.data" @click="markImage"
           :src="conf.host + '/img/' + nodeData.store.data.data.img_url"
           fallback="data:image/png;base64,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"
  />
  <div v-if="formState.source_code">
    <div>源码</div>
    <a-typography-paragraph>
      <pre style="white-space: pre">{{ formState.source_code }}</pre>
    </a-typography-paragraph>
  </div>

  <a-modal :force-render="true" width="100%"
           wrap-class-name="full-modal" v-model:visible="visible" @ok="handleOk">
    <div>
      <a-button @click="resetCanvas" style="width: 100px">重置</a-button>
      <i>x:{{ rect.x }} y:{{ rect.y }} w:{{ rect.w }} h:{{ rect.h }}</i>
    </div>
    <canvas ref="canvas" @mousedown="onMouseDown" @mouseup="onMouseUp" @mousemove="onMouseMove"
    ></canvas>
  </a-modal>
</template>

<script setup lang="ts">
import {message} from 'ant-design-vue';
import {UploadOutlined} from '@ant-design/icons-vue';
import {inject, ref} from 'vue';
import type {UploadChangeParam} from 'ant-design-vue';
import conf from '../../conf.js'

const props = defineProps<{
  nodeData: any
}>()
const uploadUrl = conf.host + '/uploadfile'
const headers = {
  authorization: 'authorization-text',
}
const nodeId = inject('nodeId')
const updateNodeData = inject('updateNodeData')

const fileList = ref([]);
const nodeData = ref(props.nodeData)
const formRef = ref(null)
const formState = ref({
  nodeName: nodeData.value.store.data.attrs.text.text,
  action: nodeData.value.store.data.data?.action ? nodeData.value.store.data.data.action : 'pass',
  delay: nodeData.value.store.data.data?.delay ? nodeData.value.store.data.data.delay : '',
  source_code: nodeData.value.store.data.data?.source_code ? nodeData.value.store.data.data.source_code : ''
})

function saveConfig() {
  return new Promise(function (resolve, reject) {
    formRef.value.validate()
        .then(function (info) {
          updateNodeData(nodeId.value, {"text/text": formState.value.nodeName}, {
            'action': formState.value.action,
            'delay': formState.value.delay,
            'source_code': formState.value.source_code,
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

function handleChange(info: UploadChangeParam) {
  if (info.file.status !== 'uploading') {
    console.log(info.file, info.fileList);
  }
  if (info.file.status === 'done') {
    message.success(`${info.file.name} file uploaded successfully`);
    console.log(info.file.response)
    updateNodeData(nodeId.value, {}, {img_url: info.file.response.data.file_path})
  } else if (info.file.status === 'error') {
    message.error(`${info.file.name} file upload failed.`);
  }
}

const visible = ref(false)
const canvas = ref(null)
const img = new Image();

function markImage() {
  visible.value = true
  const ctx = canvas.value.getContext('2d');
  img.onload = function () {
    canvas.value.width = img.width
    canvas.value.height = img.height
    ctx.drawImage(img, 0, 0, img.width, img.height);
  }
  img.src = conf.host + '/img/' + nodeData.value.store.data.data.img_url;
}

function handleOk() {
  visible.value = false
}

const rect = ref({}) // 矩形对象
let startPoint = {}
let isDragging = false

function draw(rect) {
  // 绘制矩形
  const ctx = canvas.value.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, img.width, img.height)
  ctx.strokeStyle = '#f00';
  ctx.strokeRect(rect.value.x, rect.value.y, rect.value.w, rect.value.h);
}

function onMouseDown(e) {
  startPoint.x = e.offsetX
  startPoint.y = e.offsetY
  isDragging = true
}

function onMouseMove(e) {
  if (isDragging) {
    rect.value.x = startPoint.x
    rect.value.y = startPoint.y
    rect.value.w = e.offsetX - rect.value.x
    rect.value.h = e.offsetY - rect.value.y
    draw(rect)
  }
}

function resetCanvas() {
  canvas.value.getContext('2d').drawImage(img, 0, 0, img.width, img.height)
  rect.value = formState.value.rect
}

function onMouseUp(e) {
  isDragging = false
}

</script>
<style lang="less">
.full-modal {
  .ant-modal {
    max-width: 100%;
    top: 0;
    padding-bottom: 0;
    margin: 0;
  }

  .ant-modal-content {
    display: flex;
    flex-direction: column;
    height: calc(100vh);
  }

  .ant-modal-body {
    flex: 1;
  }
}
</style>
