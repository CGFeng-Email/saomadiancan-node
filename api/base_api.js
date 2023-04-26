// 引入axios请求插件
const axios = require('axios');

// 引入请求异常返回的统一处理
const handle = require('../config/handle');

// 引入node自带qs转化参数模块
const qs = require('querystring');

// qs拼接参数
const params = qs.stringify({
    grant_type: 'client_credential',
    appid: 'wxb81dc480cbe6c823',
    secret: 'a76ad380ffb198eb970443ba906b1f34'
})

// 获取token的api·
const url = 'https://api.weixin.qq.com/cgi-bin/token?' + params;

// 云服务器id
const env = 'diancan-1gbnagvw311f423e';

// 插入语句url
const addApi = 'https://api.weixin.qq.com/tcb/databaseadd?access_token=';

// 查询记录url
const queryApi = 'https://api.weixin.qq.com/tcb/databasequery?access_token=';

// 更新记录url
const uploadApi = 'https://api.weixin.qq.com/tcb/databaseupdate?access_token=';

// 获取接口调用凭据 - 小程序 - 服务端
class getToken {
    constructor() {}

    // 获取token
    async getTokenFn() {
        try {
            // 发起请求 获取token
            const res = await axios.get(url);
            // 判断请求
            if (res.status == 200) {
                // 返回结果
                return res.data.access_token
            } else {
                // throw: 会默认进入catch， 并且throw给的值会默认成为catch的参数值
                throw '获取token失败'
            }
        } catch (err) {
            // 抛出异常
            new handle(err, 500)
        }
    }

    // 面向对象：类与类之间不需要逗号隔开

    // 公共调用云开发接口api
    // url: 云开发api
    // query: 操作语句
    async publicApi(url, query) {
        try {
            // 获取token
            const token = await this.getTokenFn();
            // 发送请求
            const res = await axios.post(url + token, {
                env,
                query
            });
            if (res.data.errcode == 0) {
                return res.data
            } else {
                throw '请求出错'
            }
        } catch (error) {
            throw new handle(error, 500)
        }
    }
}

// 导出
module.exports = {
    getToken,
    addApi,
    queryApi,
    uploadApi
}