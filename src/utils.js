import {message} from "ant-design-vue";

function raiseError(error) {
    if (error.response.status !== 417) {
        message.error(error.message)
    } else {
        message.error(error.response.data.detail)
    }
}


export default {
    raiseError
}
