const result = require('./handle');

const abnormal = async (ctx, next) => {
    // try catch: 如果代码没异常就走try, 如果try里面的代码有异常或者报错就直接从catch抛出异常
    try {
        await next();
    } catch (err) {
        // const isresult = err instanceof result
        // if (isresult) {
        //     // 已知错误
            ctx.body = {
                msg: err.msg,
                status: err.code
            }
            ctx.status = err.code
        // } else {
        //     // 未知错误
        //     ctx.body = {
        //         msg: '服务器发生错误',
        //         status: 500
        //     }
        //     ctx.status = 500
        // }

    }
}

module.exports = abnormal