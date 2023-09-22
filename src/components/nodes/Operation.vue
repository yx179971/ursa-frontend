<template>
  <a-form
      ref="formRef"
      :model="formState"
      name="nodeConfig"
      autocomplete="off"
  >
    <!--      注意name和formState中用到的字段必须一致-->
    <div style="display: flex; flex-direction: row; justify-content: space-between">
      <a-form-item
          name="nodeName"
          :rules="[{ required: true, message: '请输入节点名称!' }]"
      >
        <div>名称</div>
        <a-input v-model:value="formState.nodeName" v-on:keyup.enter="$emit('close')"/>
      </a-form-item>
      <a-form-item
          name="rank"
      >
        <div>执行顺序</div>
        <a-input-number
            v-model:value="formState.rank"
            style="width: 100px"
            :min="0"
            :max="50"
            :step="1"
            string-mode
            placeholder=""
        />
      </a-form-item>
      <a-form-item>
        <div>启用</div>
        <a-switch v-model:checked="formState.enable"></a-switch>
      </a-form-item>
    </div>
    <div class="ant-form-item">
      <div>示例图</div>
      <upload-image v-model:filePath="formState.background"></upload-image>
      <a-button @click="editBackground">编辑</a-button>
    </div>

    <a-form-item>
      <div>检测目标</div>
      <div style="display: flex; flex-direction: column; align-items: flex-start">
        <upload-image v-model:filePath="formState.locate"></upload-image>
        或
        <a-button @click="cutLocate">
          从示例图中截取
        </a-button>
        <a-input-number
            v-model:value="formState.locate_accuracy"
            style="width: 200px"
            :min="0.1"
            :max="1"
            :step="0.05"
            string-mode
            placeholder="识别准确率"
        />
        <a-button @click="markLocate">
          在示例图中标注有效区域
        </a-button>
      </div>
    </a-form-item>

    <a-form-item>
      <div>操作</div>
      <div v-if="formState.action !== 'pass'">
        <a-checkbox v-model:checked="formState.click_right">右键</a-checkbox>
      </div>
      <a-radio-group v-model:value="formState.action">
        <a-radio value="pass">仅检测</a-radio>
        <a-radio value="click_locate">点击检测目标</a-radio>
        <a-radio value="click_target">点击图片</a-radio>
        <a-radio value="click_area">移动到区域</a-radio>
      </a-radio-group>
      <div v-show="formState.action === 'click_area'">
        <a-button @click="markImage">
          点击查看点击区域
        </a-button>
        <a-form-item>
          <a-radio-group v-model:value="formState.scrollUp">
            <a-radio value="0">点击</a-radio>
            <a-radio value="1">向上滚动</a-radio>
            <a-radio value="-1">向下滚动</a-radio>
          </a-radio-group>
        </a-form-item>
      </div>
      <div v-if="formState.action === 'click_target'"
           style="display: flex; flex-direction: column; align-items: flex-start">
        <upload-image v-model:filePath="formState.target"></upload-image>
        或
        <a-button @click="cutTarget">
          从示例图中截取
        </a-button>
        <a-input-number
            v-model:value="formState.target_accuracy"
            style="width: 200px"
            :min="0.1"
            :max="1"
            :step="0.05"
            string-mode
            placeholder="识别准确率"
        />
      </div>
    </a-form-item>

    <a-form-item>
      <div>操作后延时</div>
      <a-input v-model:value="formState.delay"/>
    </a-form-item>

    <a-form-item>
      <div>执行次数</div>
      <a-input v-model:value="formState.execCount"/>
    </a-form-item>

  </a-form>
  <div v-if="formState.source_code">
    <div>源码</div>
    <a-typography-paragraph>
      <pre style="white-space: pre">{{ formState.source_code }}</pre>
    </a-typography-paragraph>
  </div>

  <Cut type="mark" v-model:visible="markImageVisible" v-model:rect="formState.rect" :imgUrl="imgUrl"
       @ok="handleMarkImage"></Cut>
  <Cut type="mark" v-model:visible="markLocateVisible" v-model:rect="formState.locateRect" :imgUrl="imgUrl"
       @ok="handleMarkLocate"></Cut>
  <Cut type="cut" v-model:visible="cutTargetVisible" :imgUrl="imgUrl" @ok="handleCutTarget"></Cut>
  <Cut type="cut" v-model:visible="cutLocateVisible" :imgUrl="imgUrl" @ok="handleCutLocate"></Cut>
  <Edit v-model:visible="editVisible" :imgUrl="imgUrl" @ok="handleEdit"></Edit>
</template>

<script setup lang="ts">
import {inject, ref, watch} from 'vue';
import conf from '../../conf.js'
import Cut from '../Cut.vue'
import UploadImage from '../UploadImage.vue'
import Edit from "@/components/Edit.vue";

const emit = defineEmits(['close'])

const updateNodeData = inject('updateNodeData')
const nodeData = inject('currentNodeData').value

const targetFileList = ref([]);
const bgFileList = ref([]);
const locateFileList = ref([]);

const formRef = ref(null)
const formState = ref({
  nodeName: nodeData.attrs.text.text,
  action: nodeData.data?.action ? nodeData.data.action : 'pass',
  click_right: nodeData.data?.click_right ? nodeData.data.click_right : false,
  background: nodeData.data?.background ? nodeData.data.background : '',
  locate: nodeData.data?.locate ? nodeData.data.locate : '',
  locateRect: nodeData.data?.locate_rect ? nodeData.data.locate_rect : {},
  locate_accuracy: nodeData.data?.locate_accuracy ? nodeData.data.locate_accuracy : '',
  target: nodeData.data?.target ? nodeData.data.target : '',
  target_accuracy: nodeData.data?.target_accuracy ? nodeData.data.target_accuracy : '',
  rect: nodeData.data?.rect ? nodeData.data.rect : {},
  scrollUp: nodeData.data?.scroll_up ? nodeData.data.scroll_up + '' : '0',
  delay: nodeData.data?.delay ? nodeData.data.delay : '',
  type: nodeData.data?.type ? nodeData.data.type : 'operation',
  execCount: nodeData.data?.exec_count ? nodeData.data.exec_count : '',
  source_code: nodeData.data?.source_code ? nodeData.data.source_code : '',
  rank: nodeData.data?.rank ? nodeData.data.rank : '',
  enable: nodeData.data?.enable === undefined ? true : nodeData.data.enable,
})

function saveConfig() {
  return new Promise(function (resolve, reject) {
    formRef.value.validate()
        .then(function (info) {
          updateNodeData(nodeData.id,
              {
                "text/text": formState.value.nodeName,
              },
              {
                'action': formState.value.action,
                'click_right': formState.value.click_right,
                'background': formState.value.background,
                'locate': formState.value.locate,
                'locate_rect': formState.value.locateRect,
                'locate_accuracy': formState.value.locate_accuracy,
                'target': formState.value.target,
                'target_accuracy': formState.value.target_accuracy,
                'rect': formState.value.rect,
                'scroll_up': formState.value.scrollUp,
                'delay': formState.value.delay,
                'type': formState.value.type,
                'exec_count': formState.value.execCount,
                'source_code': formState.value.source_code,
                'rank': formState.value.rank,
                'enable': formState.value.enable,
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

const markImageVisible = ref(false)
const markLocateVisible = ref(false)
const cutLocateVisible = ref(false)
const cutTargetVisible = ref(false)
const editVisible = ref(false)
const imgUrl = ref('')
watch(
    () => formState.value.background,
    (v) => {
      imgUrl.value = conf.host + '/img/' + formState.value.background
    }, {immediate: true}
)

function markLocate() {
  markLocateVisible.value = true
}

function markImage() {
  markImageVisible.value = true
}

function cutLocate() {
  cutLocateVisible.value = true
}

function cutTarget() {
  cutTargetVisible.value = true
}

function editBackground() {
  editVisible.value = true
}

function handleMarkImage(rect, imgUrl) {
  formState.value.rect = rect
}

function handleMarkLocate(rect, imgUrl) {
  formState.value.locateRect = rect
}

function handleCutLocate(rect, imgUrl) {
  formState.value.locate = imgUrl
}

function handleCutTarget(rect, imgUrl) {
  formState.value.target = imgUrl
}

function handleEdit(imgUrl) {
  formState.value.background = imgUrl
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
