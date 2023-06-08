// 实例化路由
const router = require('koa-router')();

const { log } = require('console');

// api
const {
	getToken,
	queryApi,
	uploadApi,
	produceCode
} = require('../../api/base_api');

// 提示
const result = require('../../config/result');

// 验证接口是否携带有效token
const {verifyToken} = require('../../jwt/verify');

// 引入moment日期插件
const moment = require('moment');
// 定义日期插件时区
moment.locale('zh-cn');

// 校验
const {empty} = require('../../utils/checkout');

// 二维码二进制存储桶信息，命名
const {buffer,bufferImgName} = require('../../jwt/buffer');

// 生成小程序码
router.post('/produceCode', new verifyToken().m, async ctx => {
	const {table_number} = ctx.request.body;
	console.log(table_number);
	
	// 校验参数不能为空
	new empty(ctx, table_number).start('桌号不能为空');
	
	try{
		const res = await new getToken().produceCode(table_number);
		// console.log('res', res);
		
		const resimg = await buffer(bufferImgName(), res.data);
		console.log('resimg', resimg);
	}catch(e){
		new result(ctx, '生成二维码出错', 500).answer()
	}
})

module.exports = router.routes();