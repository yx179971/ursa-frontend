<template>
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
</template>
<script lang="ts">
import { message } from 'ant-design-vue';
import { UploadOutlined } from '@ant-design/icons-vue';
import {defineComponent, inject, ref} from 'vue';
import type { UploadChangeParam } from 'ant-design-vue';
import conf from '../../conf.js'

export default defineComponent({
  components: {
    UploadOutlined,
  },
  setup() {
    const uploadUrl = conf.host + '/uploadfile'
    const nodeId = inject('nodeId')
    const updateNodeData = inject('updateNodeData')
    const handleChange = (info: UploadChangeParam) => {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
        console.log(info.file.response)
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
        updateNodeData(nodeId.value, 'a', '123')
      }
    };

    const fileList = ref([]);
    return {
      uploadUrl,
      fileList,
      headers: {
        authorization: 'authorization-text',
      },
      handleChange,
    };
  },
});
</script>

