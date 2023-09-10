<template>
  <div style="display: flex; align-items: center">
    <i class="fa fa-cog fa-2x" @click="jobConfVisible = true"></i>
    <a-button @click="updateJob" style="width: 100px">保存</a-button>
    <a-button @click="runJob" style="width: 100px;background-color: #66FF33">运行</a-button>
    <a-button @click="continueJob" v-show="mqStatus==='pause'" style="width: 100px;background-color: #66FF33">继续</a-button>
    <a-button @click="pauseJob" v-show="mqStatus==='running'" style="width: 100px;background-color: yellow">暂停</a-button>
    <a-button @click="stopJob" danger style="width: 100px">停止</a-button>
    <a-button @click="reLayout" style="width: 100px">对齐</a-button>
    <a-button @click="backCenter" style="min-width: 100px">回到画布中央</a-button>
    <a-button @click="recordStart" style="width: 100px">开始录制</a-button>
    <a-button @click="recordStop" style="width: 100px">停止录制</a-button>
    <a-typography-text type="success" v-if="execMessage">正在执行：{{ execMessage }}</a-typography-text>
    <a-input-search style="margin-left: auto; width: 220px"
                    v-model:value="searchNodeName"
                    placeholder="搜索节点名称"
                    enter-button
                    @search="searchNode"
    />
  </div>
  <div id="container">
    <div id="stencil"></div>
    <div id="graph-container"></div>
  </div>
  <NodeDrawer v-model:visible="nodeDrawerVisible" :nodeComponent="nodeComponent"></NodeDrawer>

  <a-menu v-if="nodeMenuVisible" class="node-menu" id="nodeMenu" @mouseleave="nodeMenuVisible = false">
    <a-menu-item @click="runJobNode">从该节点开始运行</a-menu-item>
  </a-menu>

  <a-modal v-model:visible="jobConfVisible" title="运行配置" @ok="updateJob">
    <a-form
        ref="formRef"
        :model="formState"
        autocomplete="off"
        name="updateJobConf"
    >
      <a-form-item
          label="窗口名称"
          name="windowName"
      >
        <a-dropdown @click="getWindows" :trigger="['click']">
          <template #overlay>
            <a-menu @click="handleMenuClick">
              <!--              <a-menu-item key="">整个屏幕</a-menu-item>-->
              <a-menu-item v-for="window in windows" :key="window">
                <i class="fa fa-window-maximize"></i>
                {{ window }}
              </a-menu-item>
            </a-menu>
          </template>
          <a-button>
            {{ formState.windowName }}
            <DownOutlined/>
          </a-button>
        </a-dropdown>
      </a-form-item>
      <a-form-item
          label="窗口初始位置"
          name="windowStart"
      >
        <a-input v-model:value="formState.windowStart"/>
      </a-form-item>
      <a-form-item
          label="窗口宽高"
          name="windowWidthHeight"
      >
        <a-input v-model:value="formState.windowWidthHeight"/>
      </a-form-item>
    </a-form>
  </a-modal>

</template>

<script setup lang="ts">
import axios from "axios";
import {DagreLayout} from '@antv/layout'
import {Graph, Shape} from '@antv/x6'
import {Stencil} from '@antv/x6-plugin-stencil'
import {Transform} from '@antv/x6-plugin-transform'
import {Selection} from '@antv/x6-plugin-selection'
import {Snapline} from '@antv/x6-plugin-snapline'
import {Keyboard} from '@antv/x6-plugin-keyboard'
import {Clipboard} from '@antv/x6-plugin-clipboard'
import {History} from '@antv/x6-plugin-history'
import {onMounted, ref, provide, watch, createVNode, onBeforeUnmount, nextTick} from 'vue'
import {ExclamationCircleOutlined, DownOutlined} from '@ant-design/icons-vue';

import NodeDrawer from './NodeDrawer.vue'
import conf from "../conf.js"
import utils from "../utils.js"
import {Scroller} from "@antv/x6-plugin-scroller";
import {message, Modal} from "ant-design-vue";

const props = defineProps(['job'])
const emit = defineEmits(['displayJob'])

const currentNodeData = ref(null)
provide('currentNodeData', currentNodeData)

let graph = null
watch(
    () => props.job,
    (job) => {
      formState.value.windowName = job.config.window ? job.config.window : ''
      formState.value.windowStart = job.config.window_start ? job.config.window_start : ''
      formState.value.windowWidthHeight = job.config.window_width_height ? job.config.window_width_height : ''
      graph.fromJSON(job.config.cells ? job.config.cells : [])
    }
)

const nodeDrawerVisible = ref(false)
let nodeComponent = null

const jobConfVisible = ref(false)

const formRef = ref(null)
const formState = ref({
  windowName: '',
  windowStart: '',
  windowWidthHeight: '',
});
const handleMenuClick = (e) => {
  formState.value.windowName = e.key
};

let windows = [];

function getWindows() {
  axios.get(conf.host + '/windows',)
      .then(function (response) {
        const data = response.data.data.windows
        const tmp = []
        for (const k in data) {
          tmp.push(data[k])
        }
        windows = tmp
      })
      .catch(function (error) {
        utils.raiseError(error)
      })
}

// 更新节点
function updateNodeData(nodeId, attrs, data) {
  const node = graph.findViewByCell(nodeId).cell
  for (const k in attrs) {
    node.setAttrByPath(k, attrs[k])
  }
  for (const k in data) {
    node.setData({[k]: data[k]}, {deep: false})
    switch (k) {
      case 'rank':
        node.setAttrByPath('rank/text', data[k])
        if (data[k]) {
          node.setAttrs({
            circle: {
              cy: 5,
              r: 10,
              fill: "green",
              strokeWidth: 0,
              stroke: '',
            }
          })
        } else {
          node.removeAttrByPath('circle')
        }
        break
      case 'exec_count':
        node.setAttrByPath('execCount/text', data[k])
        if (data[k]) {
          node.setAttrs({
            circleExecCount: {
              cy: 25,
              r: 10,
              fill: "bluetooth",
              strokeWidth: 0,
              stroke: '',
            }
          })
        } else {
          node.removeAttrByPath('circleExecCount')
        }
        break
      case 'enable':
        let text = ''
        if (!data[k]) {
          text = ''
        }
        node.setAttrByPath('status/text', text)
        break
    }
  }
  updateJob()
}

provide('updateNodeData', updateNodeData)

// 保存
function updateJob() {
  return new Promise((resolve, reject) => {
    const config = graph.toJSON()
    config.window = formState.value.windowName
    config.window_start = formState.value.windowStart
    config.window_width_height = formState.value.windowWidthHeight
    axios.put(conf.host + '/job/' + props.job.id, {
      "id": props.job.id,
      "name": props.job.name,
      "config": config,
    })
        .then(function (response) {
          jobConfVisible.value = false
          emit('displayJob', response.data.data)
          resolve()
        })
        .catch(function (error) {
          utils.raiseError(error)
          reject()
        })
  })
}

defineExpose({
  updateJob
})

// 运行作业
function runJob(e, force, nodeId) {
  updateJob()
  axios.post(conf.host + '/job/run/' + props.job.id, {force: force, node_id: nodeId})
      .then(function (response) {
        message.success('请求成功')
        timer = setInterval(getMqStatus, 3000)
      })
      .catch(function (error) {
        if (error.response?.status && error.response.data.code == 50002) {
          Modal.confirm({
            title: '强制运行当前作业?',
            icon: createVNode(ExclamationCircleOutlined),
            content: '',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk() {
              runJob(null, true, nodeId)
            },
            onCancel() {
              console.log('Cancel');
            },
          })
        } else {
          utils.raiseError(error)
        }
      })
}

// 继续作业
function continueJob() {
  axios.post(conf.host + '/job/continue/' + props.job.id,)
      .then(function (response) {
        message.success('请求成功')
      })
      .catch(function (error) {
        utils.raiseError(error)
      })
}

const mqStatus = ref('')

// 暂停作业
function pauseJob() {
  axios.post(conf.host + '/job/pause/' + props.job.id,)
      .then(function (response) {
        message.success('请求成功')
      })
      .catch(function (error) {
        utils.raiseError(error)
      })
}

// 停止作业
function stopJob() {
  axios.post(conf.host + '/job/stop/' + props.job.id,)
      .then(function (response) {
        message.success('请求成功')
      })
      .catch(function (error) {
        utils.raiseError(error)
      })
}

// 对齐
function reLayout() {
  const graphJson = graph.toJSON()
  const model = {
    nodes: graphJson.cells.filter((view) => {
      return view.shape != 'edge'
    }),
    edges: graphJson.cells.filter((view) => {
      return view.shape == 'edge'
    })
  }
  const dagreLayout = new DagreLayout({
    type: "dagre",
    rankdir: "LR",
    align: "UL",
    ranksep: 30,
    nodesep: 15,
    controlPoints: true,
  });
  const newModel = dagreLayout.layout(model);
  graph.fromJSON(newModel);
}

// 回到画布中央
function backCenter() {
  graph.center()
}

// 开始录制
function recordStart() {
  axios.post(conf.host + '/record/start/' + props.job.id,)
      .then(function (response) {
        message.success('请求成功')
      })
      .catch(function (error) {
        utils.raiseError(error)
      })
}

// 停止录制
function recordStop() {
  axios.post(conf.host + '/record/stop/' + props.job.id,)
      .then(function (response) {
        const model = {nodes: [], edges: []}
        for (const k in response.data.nodes) {
          model.nodes.push(graph.addNode({
            shape: 'custom-rect',
            id: response.data.nodes[k].id,
            label: response.data.nodes[k].name,
            data: response.data.nodes[k],
          }))
        }
        for (const k in response.data.edges) {
          model.edges.push(graph.addEdge({
            shape: "edge",
            source: {
              cell: response.data.edges[k].source,
              anchor: 'midSide'
            },
            target: {
              cell: response.data.edges[k].target,
              anchor: 'midSide'
            },
            attrs: {
              line: {
                stroke: '#A2B1C3',
                strokeWidth: 2,
                targetMarker: {
                  name: 'block',
                  width: 12,
                  height: 8,
                },
              },
            },
          }))
        }
      })
      .catch(function (error) {
        utils.raiseError(error)
      })
}

const searchNodeName = ref('')

function searchNode() {
  for (let node of graph.getNodes()) {
    if (node.attrs.text.text.includes(searchNodeName.value)) {
      graph.select(node)
      const {x, y} = node.position()
      graph.centerPoint(x, y)
      break
    }
  }
}

const execMessage = ref('')
let timer = null

function getMqStatus() {
  axios.get(conf.host + '/mq/status')
      .then((response) => {
        mqStatus.value = response.data.data.status
        switch (mqStatus.value) {
          case 'running':
          case 'pause':
            execMessage.value = response.data.data.node_track
            break
          case 'stopped':
          case 'failure':
          case 'finish':
            execMessage.value = ''
            clearInterval(timer)
            break
          default:
            execMessage.value = ''
        }
      })
      .catch(function (error) {
        utils.raiseError(error)
      })
}

onBeforeUnmount(() => {
  clearInterval(timer)
})

const nodeMenuVisible = ref(false)

function runJobNode(e) {
  runJob(e, false, currentNodeData.value.id)
  nodeMenuVisible.value = false
}

onMounted(() => {
// #region 初始化画布
  graph = new Graph({
    container: document.getElementById('graph-container')!,
    grid: true,
    background: {
      color: '#F2F7FA',
    },
    height: 600,
    autoResize: true,
    // mousewheel: {
    //   enabled: true,
    //   zoomAtMousePosition: true,
    //   modifiers: 'ctrl',
    //   minScale: 0.5,
    //   maxScale: 3,
    // },
    connecting: {
      router: 'manhattan',
      connector: {
        name: 'rounded',
        args: {
          radius: 8,
        },
      },
      anchor: 'center',
      connectionPoint: 'anchor',
      allowBlank: false,
      snap: {
        radius: 20,
      },
      createEdge() {
        return new Shape.Edge({
          attrs: {
            line: {
              stroke: '#A2B1C3',
              strokeWidth: 2,
              targetMarker: {
                name: 'block',
                width: 12,
                height: 8,
              },
            },
          },
          zIndex: 0,
        })
      },
      validateConnection({targetMagnet}) {
        return !!targetMagnet
      },
    },
    highlighting: {
      magnetAdsorbed: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#5F95FF',
            stroke: '#5F95FF',
          },
        },
      },
    },
  })
// #endregion

// 控制连接桩显示/隐藏
  const showPorts = (ports: NodeListOf<SVGElement>, show: boolean) => {
    for (let i = 0, len = ports.length; i < len; i += 1) {
      ports[i].style.visibility = show ? 'visible' : 'hidden'
    }
  }
  graph.on('node:mouseenter', ({e, node, view}) => {
    const container = document.getElementById('graph-container')!
    const ports = container.querySelectorAll(
        '.x6-port-body',
    ) as NodeListOf<SVGElement>
    showPorts(ports, true)
    node.toFront()
  })
  graph.on('node:mouseleave', () => {
    const container = document.getElementById('graph-container')!
    const ports = container.querySelectorAll(
        '.x6-port-body',
    ) as NodeListOf<SVGElement>
    showPorts(ports, false)
  })
  graph.on("node:click", ({e, x, y, node, view}) => {
    currentNodeData.value = node
    switch (node.store.data.data.type) {
      case 'start':
        nodeComponent = 'Start'
        break
      case 'job':
        nodeComponent = 'Job'
        break
      case 'virtual':
        nodeComponent = 'Virtual'
        break
      default:
        nodeComponent = 'Operation'
    }
    nodeDrawerVisible.value = true
  });
  graph.on("node:contextmenu", ({e, x, y, node, view}) => {
    nodeMenuVisible.value = true
    currentNodeData.value = node
    nextTick(() => {
      const c = document.getElementsByClassName('x6-graph-background')
      const view = document.getElementsByClassName('x6-graph-svg-viewport')
      const menu = document.getElementById('nodeMenu')
      menu.style.top = `${y}px`
      menu.style.left = `${x}px`
      // 重要，菜单和节点对齐，不知道为什么要平移
      menu.style.transform = view[1].getAttribute('transform')
      c[1].appendChild(menu)
    })
  });
  graph.on("edge:mouseenter", ({e, edge, view}) => {
    edge.setAttrByPath('line/stroke', '#ffff00')
    edge.toFront()
  });
  graph.on("edge:mouseleave", ({e, edge, view}) => {
    edge.setAttrByPath('line/stroke', '#A2B1C3')
  });
// #endregion

// #region 使用插件
  graph
      .use(
          new Transform({
            resizing: true,
            rotating: true,
          }),
      )
      .use(
          new Selection({
            enabled: true,
            rubberband: true,
            showNodeSelectionBox: true,
            modifiers: "ctrl"
          }),
      )
      .use(
          new Snapline({
            enabled: true,
          }),
      )
      .use(
          new Keyboard({
            enabled: true,
          }),
      )
      .use(
          new Clipboard({
            enabled: true,
          }),
      )
      .use(
          new History({
            enabled: true,
          }),
      )
      .use(
          new Scroller({
            enabled: true,
            pannable: true,
          })
      )
// #endregion

// #region 初始化 stencil
  const stencil = new Stencil({
    title: '节点',
    target: graph,
    stencilGraphWidth: 200,
    stencilGraphHeight: 0,
    collapsable: false,
    layoutOptions: {
      columns: 1,
      columnWidth: 80,
      rowHeight: 70,
    },
  })
  document.getElementById('stencil')!.appendChild(stencil.container)
// #endregion

// #region 快捷键与事件
  graph.bindKey(['meta+c', 'ctrl+c'], () => {
    const cells = graph.getSelectedCells()
    if (cells.length) {
      graph.copy(cells)
    }
    return false
  })
  graph.bindKey(['meta+x', 'ctrl+x'], () => {
    const cells = graph.getSelectedCells()
    if (cells.length) {
      graph.cut(cells)
    }
    return false
  })
  graph.bindKey(['meta+v', 'ctrl+v'], () => {
    if (!graph.isClipboardEmpty()) {
      const cells = graph.paste({offset: 32})
      graph.cleanSelection()
      graph.select(cells)
    }
    return false
  })

// undo redo
  graph.bindKey(['meta+z', 'ctrl+z'], () => {
    if (graph.canUndo()) {
      graph.undo()
    }
    return false
  })
  graph.bindKey(['meta+shift+z', 'ctrl+shift+z'], () => {
    if (graph.canRedo()) {
      graph.redo()
    }
    return false
  })

// select all
  graph.bindKey(['meta+a', 'ctrl+a'], () => {
    const nodes = graph.getNodes()
    if (nodes) {
      graph.select(nodes)
    }
  })

// delete
  graph.bindKey('backspace', () => {
    const cells = graph.getSelectedCells()
    if (cells.length) {
      graph.removeCells(cells)
    }
  })

// zoom
  graph.bindKey(['ctrl+1', 'meta+1'], () => {
    const zoom = graph.zoom()
    if (zoom < 1.5) {
      graph.zoom(0.1)
    }
  })
  graph.bindKey(['ctrl+2', 'meta+2'], () => {
    const zoom = graph.zoom()
    if (zoom > 0.5) {
      graph.zoom(-0.1)
    }
  })

// #region 初始化图形
  const ports = {
    groups: {
      top: {
        position: 'top',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff',
            style: {
              visibility: 'hidden',
            },
          },
        },
      },
      right: {
        position: 'right',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff',
            style: {
              visibility: 'hidden',
            },
          },
        },
      },
      bottom: {
        position: 'bottom',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff',
            style: {
              visibility: 'hidden',
            },
          },
        },
      },
      left: {
        position: 'left',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff',
            style: {
              visibility: 'hidden',
            },
          },
        },
      },
    },
    items: [
      {
        group: 'top',
      },
      {
        group: 'right',
      },
      {
        group: 'bottom',
      },
      {
        group: 'left',
      },
    ],
  }

  Graph.registerNode(
      'custom-rect',
      {
        inherit: 'rect',
        width: 66,
        height: 36,
        markup: [
          {
            tagName: 'rect',
            selector: 'body',
          },
          {
            tagName: 'text',
            selector: 'text',
          },
          {
            tagName: 'circle',
            selector: 'circle',
          },
          {
            tagName: 'text',
            selector: 'rank',
          },
          {
            tagName: 'circle',
            selector: 'circleExecCount',
          },
          {
            tagName: 'text',
            selector: 'execCount',
          },
          {
            tagName: 'text',
            selector: 'status',
          },
        ],
        attrs: {
          body: {
            strokeWidth: 1,
            stroke: '#5F95FF',
            fill: '#EFF4FF',
          },
          text: {
            fontSize: 12,
            fill: '#262626',
          },
          rank: {
            fontSize: 12,
            fill: 'white',
            'text-anchor': 'middle',
          },
          execCount: {
            fontSize: 12,
            fill: 'white',
            'text-anchor': 'middle',
            y: 30,
          },
          status: {
            fontSize: 14,
            fontFamily: 'FontAwesome',
            text: '',
            fill: 'red',
            x: 60
          }
        },
        ports: {...ports},
      },
      true,
  )

  Graph.registerNode(
      'custom-polygon',
      {
        inherit: 'polygon',
        width: 66,
        height: 36,
        attrs: {
          body: {
            strokeWidth: 1,
            stroke: '#5F95FF',
            fill: '#EFF4FF',
          },
          text: {
            fontSize: 12,
            fill: '#262626',
          },
        },
        ports: {
          ...ports,
          items: [
            {
              group: 'top',
            },
            {
              group: 'bottom',
            },
          ],
        },
      },
      true,
  )

  Graph.registerNode(
      'custom-circle',
      {
        inherit: 'circle',
        width: 45,
        height: 45,
        markup: [
          {
            tagName: 'circle',
            selector: 'body',
          },
          {
            tagName: 'text',
            selector: 'text',
          },
          {
            tagName: 'circle',
            selector: 'circle',
          },
          {
            tagName: 'text',
            selector: 'rank',
          },
          {
            tagName: 'circle',
            selector: 'circleExecCount',
          },
          {
            tagName: 'text',
            selector: 'execCount',
          },
          {
            tagName: 'text',
            selector: 'status',
          },
        ],
        attrs: {
          body: {
            strokeWidth: 1,
            stroke: '#5F95FF',
            fill: '#EFF4FF',
          },
          text: {
            fontSize: 12,
            fill: '#262626',
          },
          rank: {
            fontSize: 12,
            fill: 'white',
            'text-anchor': 'middle',
          },
          execCount: {
            fontSize: 12,
            fill: 'white',
            'text-anchor': 'middle',
            y: 30,
          },
          status: {
            fontSize: 14,
            fontFamily: 'FontAwesome',
            text: '',
            fill: 'red',
            x: 40
          }
        },
        ports: {...ports},
      },
      true,
  )

  const r1 = graph.createNode({
    shape: 'custom-rect',
    label: '开始',
    attrs: {
      body: {
        rx: 20,
        ry: 26,
      },
      rank: {
        text: ''
      }
    },
    data: {
      type: 'start',
      action: 'pass'
    }
  })
  const r2 = graph.createNode({
    shape: 'custom-rect',
    label: '操作',
    data: {
      type: 'operation'
    }
  })
  // const r3 = graph.createNode({
  //   shape: 'custom-rect',
  //   attrs: {
  //     body: {
  //       rx: 6,
  //       ry: 6,
  //     },
  //   },
  //   label: '可选过程',
  //   data: {}
  // })
  // const r4 = graph.createNode({
  //   shape: 'custom-polygon',
  //   attrs: {
  //     body: {
  //       refPoints: '0,10 10,0 20,10 10,20',
  //     },
  //   },
  //   label: '决策',
  //   data: {}
  // })
  const r5 = graph.createNode({
    shape: 'custom-polygon',
    attrs: {
      body: {
        refPoints: '10,0 40,0 30,20 0,20',
      },
    },
    label: '作业',
    data: {
      type: 'job'
    }
  })
  const r6 = graph.createNode({
    shape: 'custom-circle',
    label: '连接',
    attrs: {
      rank: {
        text: ''
      }
    },
    data: {
      type: 'virtual'
    }
  })
  stencil.load([r1, r2, r5, r6])

// #endregion
})

</script>

<style scoped>
#container {
  display: flex;
  border: 1px solid #dfe3e8;
  width: 100%;
  height: calc(99% - 24px);
}

#stencil {
  width: 100px;
  height: 100%;
  position: relative;
  border-right: 1px solid #dfe3e8;
}

#graph-container {
  width: calc(100% - 180px);
  height: 100%;
}

.x6-widget-stencil {
  background-color: #fff;
}

.x6-widget-stencil-title {
  background-color: #fff;
}

.x6-widget-stencil-group-title {
  background-color: #fff !important;
}

.x6-widget-transform {
  margin: -1px 0 0 -1px;
  padding: 0px;
  border: 1px solid #239edd;
}

.x6-widget-transform > div {
  border: 1px solid #239edd;
}

.x6-widget-transform > div:hover {
  background-color: #3dafe4;
}

.x6-widget-transform-active-handle {
  background-color: #3dafe4;
}

.x6-widget-transform-resize {
  border-radius: 0;
}

.x6-widget-selection-inner {
  border: 1px solid #239edd;
}

.x6-widget-selection-box {
  opacity: 0;
}

.node-menu {
  position: absolute;
  z-index: 999;
}
</style>