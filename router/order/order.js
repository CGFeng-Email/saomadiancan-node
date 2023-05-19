// 实例化路由
const router = require('koa-router')();

const { log } = require('console');

// api
const {
	getToken,
	queryApi,
	uploadApi
} = require('../../api/base_api');

// 提示
const result = require('../../config/result');

// 验证接口是否携带有效token
const {verifyToken} = require('../../jwt/verify');

// 引入moment日期插件
const moment = require('moment');
// 定义日期插件时区
moment.locale('zh-cn');

// 价格补0
const commerce_price = require('e-commerce_price');

// 获取订单
router.get('/getOrder', new verifyToken().m, async ctx => {
	// page: 分页
	// order_status： 订单状态
	const {page, order_status} = ctx.query;
	// 每次返回10条
	const pageNum = page * 10;
	console.log('page', page);
	console.log('order_status', order_status);
	// order_status：yes:只返回已接单的, no: 只返回未接单的, '': 返回全部
	// 生成order_status格式
	const orderStatus = {};
	if(order_status) {
		orderStatus['order_status'] = order_status
	} else {
		delete orderStatus.order_status
	}
	console.log('orderStatus', orderStatus);
	// 不转化成字符串格式  直接放where使用会报错
	const stringObj = JSON.stringify(orderStatus);
	// 获取订单api
	// where: 查询条件 里面的值要求是字符串格式
	// orderBy: 指定排序条件 desc:倒序, asc:升序
	// field: 指定返回的数据 ieLd({place_an_order: false }) false:就是不返回该字段 其他的都返回 可以同时指定多个字段
	const query = `db.collection('orderData').where(${stringObj}).orderBy('order_time','desc').field({place_an_order: false }).limit(${pageNum}).get()`;
	try {
		const res = await new getToken().publicApi(queryApi, query);
		// 处理成json格式
		const data = res.data.map(item => {
			return JSON.parse(item)
		})
		new result(ctx, 'success', 200, data).answer();
	} catch (err) {
		new result(ctx, '获取数据失败,服务器发生错误', 500).answer();
	}
})

// 查看订单详情, 菜品列表
router.get('/viewOrderDetails', new verifyToken().m, async ctx => {
	const {id} = ctx.query;
	const query = `db.collection('orderData').doc('${id}').field({place_an_order: true}).get()`;
	try {
		const res = await new getToken().publicApi(queryApi, query);
		console.log('res', res);
		const data = res.data.map(item => {
			return JSON.parse(item)
		})
		console.log('data', data);
		new result(ctx, 'success', 200, data).answer();
	} catch (err) {
		new result(ctx, '查看订单详情发生错误', 500).answer()
	}
})

// 订单接单 
router.post('/editOrderStatus', new verifyToken().m, async ctx => {
	// 根据当前的订单id去修改接单信息
	const {id, order_an, total_account, openid, miniprogram_state} = ctx.request.body;
	
	// api
	const query = `db.collection('orderData').doc('${id}').update({data: {order_status: 'yes'}})`;
	
	// 订阅消息模板id
	const template_id = 'uDf_R5R4uQ8jsyEhPojMIdOE3FwRq7IIWXNj0sb1m5I';
	
	// 订单金额补0，处理成数字格式
	const total_account_number = commerce_price(Number(total_account));
	
	// 订阅消息模板内容
	const data = {
		'character_string1': {'value': order_an},
		'time2': {'value': moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss')},
		'amount8': {'value': total_account_number}
	}
	
	
	try{
		await new getToken().publicApi(uploadApi, query);
		
		await new getToken().subscribeMessageApiFn(openid, data, miniprogram_state, template_id);
		
		new result(ctx, '已接单，请等待片刻').answer();
	} catch(err) {
		new result(ctx, '接单失败，服务器发生错误', 500).answer()
	}
})

// 结账，并且发送结账订单订阅消息
router.post('/checkout', new verifyToken().m, async ctx => {
	const {openid, miniprogram_state, message, order_an, total_account, order_center, id} = ctx.request.body;
	const total_account_number = commerce_price(Number(total_account));
	// 模板id
	const template_id = 'bJPBBHnt8ibU-jTQZp7xhma4mPw8vIp0stZNW7ScgAY';
	
	// data: 模板内容
	// 订单内容
	// 备注
	// 订购日期
	// 订单编号
	// 订单金额
	const data = {
		'thing2': {'value': order_center},
		'thing4': {'value': message},
		'time7': {'value': moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss')},
		'character_string6': {'value': order_an},
		'amount8': {'value': total_account_number}
	}
	
	try {
		// 订阅消息
		await new getToken().subscribeMessageApiFn(openid, data, miniprogram_state, template_id);
		
		// 修改订单结账状态
		// 更新订单API
		const query = `db.collection('orderData').doc('${id}').update({data: {order_status: 'no', order_settle_account: 'no'}})`;
		
		// 更新订单状态
		await new getToken().publicApi(uploadApi, query);
		
		new result(ctx, '已成功结账，祝你用餐愉快').answer()
	} catch(err) {
		new result(ctx, '结账失败，服务器发生错误', 500).answer()
	}
})

// 默认导出
module.exports = router.routes();