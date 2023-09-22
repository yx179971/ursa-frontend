<template>
  <a-modal :force-render="true" width="100%"
           wrap-class-name="full-modal" v-model:visible="visible" @ok="handleUploadImage" @cancel="handleCancel">
    <div style="display: flex;flex-direction: row">
      <a-button @click="resetCanvas" style="width: 100px">撤销</a-button>
    </div>
    <div style="display: flex; flex-direction: row; align-items: flex-start">
      <canvas ref="canvas" @mousedown="onMouseDown" @mouseup="onMouseUp" @mousemove="onMouseMove"></canvas>
    </div>
  </a-modal>
</template>

<script setup>
import axios from "axios";
import utils from "../utils";
import {ref, onMounted, watch} from 'vue'
import conf from "../conf";

const props = defineProps(['visible', 'imgUrl'])
const emit = defineEmits(['update:visible',  'ok'])

const visible = ref(props.visible)
watch(
    () => props.visible,
    (v) => {
      visible.value = v
    }
)

const rect = ref(props.rect ? props.rect : {})
const img = new Image()
img.crossOrigin = "*"
img.src = props.imgUrl
watch(
    () => props.imgUrl,
    (v) => {
      img.src = v
    }
)

const canvas = ref(null)

onMounted(() => {
  img.onload = function () {
    canvas.value.width = img.width
    canvas.value.height = img.height
    resetCanvas()
  }
})

function resetCanvas() {
  canvas.value.getContext('2d').drawImage(img, 0, 0, img.width, img.height)
}


let isDragging = false



function onMouseDown(e) {
  isDragging = true
}

function onMouseMove(e) {
  if (isDragging) {
    const ctx = canvas.value.getContext('2d');
    ctx.fillRect(e.offsetX, e.offsetY, 10, 10);
  }
}

function onMouseUp(e) {
  isDragging = false
}

function handleCancel() {
  emit('update:visible', false)
}

const uploadUrl = conf.host + '/uploadfile'

function handleUploadImage() {
  canvas.value.toBlob(function (blob) {
    const formData = new FormData();
    formData.append('file', blob);
    axios.post(uploadUrl, formData)
        .then(function (response) {
          emit('ok', response.data.data.file_path)
        })
        .catch(function (error) {
          utils.raiseError(error)
        })
  })
  handleCancel()
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
    overflow-y: scroll;
  }
}
</style>
