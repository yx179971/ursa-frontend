import axios from "axios";
import {message} from "ant-design-vue";

function raiseError(error) {
    if (error.name === axios.AxiosError.name) {
        message.error(error.message)
    } else {
        message.error(error.response.data.detail)
    }
}


export default {
    raiseError
}
