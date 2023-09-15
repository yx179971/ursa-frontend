<template>
  <a-modal :force-render="true" width="100%"
           wrap-class-name="full-modal" v-model:visible="visible" @ok="handleCutImage" @cancel="handleCancel">
    <div style="display: flex;flex-direction: row">
      <a-button @click="blankCanvasCut" style="width: 100px">清空</a-button>
      <div v-if="type==='mark'">
        <a-button @click="resetCanvasCut" style="width: 100px">重置</a-button>
        <i>x:{{ rect.x }} y:{{ rect.y }} w:{{ rect.w }} h:{{ rect.h }}</i>
      </div>
    </div>
    <div style="display: flex; flex-direction: row; align-items: flex-start">
      <canvas ref="canvas" @mousedown="onMouseDown" @mouseup="onMouseUp" @mousemove="onMouseMove"></canvas>
      <div v-if="type==='cut'">
        <div>目标：</div>
        <canvas ref="canvasCut"></canvas>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import axios from "axios";
import utils from "../utils";
import {ref, onMounted, watch} from 'vue'
import conf from "../conf";

const props = defineProps(['visible', 'rect', 'imgUrl', 'type'])
const emit = defineEmits(['update:visible', 'update:rect', 'ok'])

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
const canvasCut = ref(null)

onMounted(() => {
  img.onload = function () {
    canvas.value.width = img.width
    canvas.value.height = img.height
    resetCanvasCut()
  }
})

function blankCanvasCut() {
  canvas.value.getContext('2d').drawImage(img, 0, 0, img.width, img.height)
  rect.value = {}
}

function resetCanvasCut() {
  canvas.value.getContext('2d').drawImage(img, 0, 0, img.width, img.height)
  if (props.type === 'mark') {
    rect.value = props.rect
    mark(rect, canvas.value)
  }
}

let startPoint = {x: 0, y: 0}
let isDragging = false

function mark(rect) {
  // 绘制矩形
  const ctx = canvas.value.getContext('2d');
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  ctx.drawImage(img, 0, 0, img.width, img.height)
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f00';
  ctx.strokeRect(rect.value.x, rect.value.y, rect.value.w, rect.value.h);
}

function cut(rect) {
  const ctx = canvasCut.value.getContext('2d');
  canvasCut.value.width = rect.value.w
  canvasCut.value.height = rect.value.h
  ctx.drawImage(img, rect.value.x, rect.value.y, rect.value.w, rect.value.h, 0, 0, rect.value.w, rect.value.h)
}

function onMouseDown(e) {
  startPoint.x = e.offsetX
  startPoint.y = e.offsetY
  isDragging = true
}

function onMouseMove(e) {
  if (isDragging) {
    rect.value.x = Math.min(startPoint.x, e.offsetX)
    rect.value.w = Math.abs(e.offsetX - startPoint.x)
    rect.value.y = Math.min(startPoint.y, e.offsetY)
    rect.value.h = Math.abs(e.offsetY - startPoint.y)
    mark(rect)
    if (props.type === 'cut') {
      cut(rect)
    }
  }
}

function onMouseUp(e) {
  isDragging = false
}

function handleCancel() {
  emit('update:visible', false)
}

const uploadUrl = conf.host + '/uploadfile'

function handleCutImage() {
  if (props.type === 'mark') {
    emit('ok', rect.value, null)
  } else {
    canvasCut.value.toBlob(function (blob) {
      const formData = new FormData();
      formData.append('file', blob);
      axios.post(uploadUrl, formData)
          .then(function (response) {
            emit('ok', null, response.data.data.file_path)
          })
          .catch(function (error) {
            utils.raiseError(error)
          })
    })
  }
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
