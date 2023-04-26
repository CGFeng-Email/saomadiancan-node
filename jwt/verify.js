// 解析加密的token
const basicAuth = require('basic-auth');

// 引入异常暴露
const handle = require('../config/handle');

// 引入jwt
const jwt = require('jsonwebtoken');

// 引入参与加密字符
const rule = require('./rule').rule;

// 查询接口是否携带有效的token
class verifyToken {
    constructor() {}
    // 设置函数 set xxx() {}
    // 取值函数 get xxx() {}
    // get m() 函数操作之后 外部调用的时候不需要再m()进行调用了 只需要.m就可以
    get m() {
        // 返回一个中间件
        return async (ctx, next) => {
            // console.log('验证token', ctx.req);
            // 接收token
            const token = basicAuth(ctx.req);
            // console.log('token', token);

            if (!token || !token.name) {
                throw new handle('没有访问权限', 500)
            } else {
                try {
                    // 解密
                    var verifyTokenData = jwt.verify(token.name, rule.ruleText);
                } catch (error) {
                    // 过期了
                    if(error.name == 'TokenExpiredError') {
                        throw new handle('账号过期,请重新登录', 401)
                    }
                    throw new handle('没有访问权限', 401)
                }
            }

            // 赋值
            ctx.auth = {
                uid: verifyTokenData.uid
            }

            // 如果不写next(), 则会阻断数据的运行，代码执行到这一步就不会再继续往下走了
            await next()
        }
    }
}

module.exports = {
    verifyToken
}