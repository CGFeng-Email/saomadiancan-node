// 统一给前端返回的body响应
class result {
    constructor(ctx, msg = 'success', code = 200, data = {}, extra = null) {
        this.ctx = ctx;
        this.msg = msg;
        this.code = code;
        this.data = data;
        this.extra = extra;
    }

    // 统一返回json格式
    answer() {
        this.ctx.body = {
            msg: this.msg,
            code: this.code,
            data: this.data,
            extra: this.extra
        }
        // 改变请求状态
        this.ctx.status = this.code
    }
}

module.exports = result