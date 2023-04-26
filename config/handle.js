// 自定义全局异常处理中间件 
class result extends Error {
    constructor(msg, code) {
        super()
        this.msg = msg;
        this.code = code
    }
}

module.exports = result