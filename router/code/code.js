// 实例化路由
const router = require('koa-router')();

const {
	log
} = require('console');

// api
const {
	getToken,
	queryApi,
	addApi,
	uploadApi,
	produceCode
} = require('../../api/base_api');

// 提示
const result = require('../../config/result');

// 验证接口是否携带有效token
const {
	verifyToken
} = require('../../jwt/verify');

// 引入moment日期插件
const moment = require('moment');
// 定义日期插件时区
moment.locale('zh-cn');

// 校验
const {
	empty
} = require('../../utils/checkout');

// 二维码二进制存储桶信息，命名
const {
	bufferFn,
	bufferImgName,
} = require('../../jwt/buffer');

// 生成小程序码
router.post('/produceCode', new verifyToken().m, async ctx => {
	const {
		table_number
	} = ctx.request.body;

	// 校验参数不能为空
	new empty(ctx, table_number).start('桌号不能为空');

	try {

		// 查询当前桌号是否已经存在
		const tableNumberListApi = `db.collection('tableNumberList').where({table_number: '${table_number}'}).get()`;
		
		const getTablenumber = await new getToken().publicApi(queryApi, tableNumberListApi)
		console.log('getTablenumber', getTablenumber);
		
		if (getTablenumber.data.length > 0) {
			new result(ctx, '该桌号已添加', 202).answer();
		} else {

			// 返回二维码二进制流
			const res = await new getToken().produceCode(table_number);
			
			// 随机命名
			const imgName = await bufferImgName(table_number);
			console.log(imgName);

			// 存储进存储桶
			const resimg = await bufferFn(imgName, res.data);
			console.log('resimg', resimg);

			// 拼接https
			const imgcover = 'https://' + resimg;

			// 生成上架时间
			const time = moment().utcOffset(8).format('YYYY-MM-DD  HH:mm:ss')

			const OBJ = {
				time: time,
				table_number: table_number,
				code: imgcover,
			}

			// 新增桌号api
			const tableNumberListAddApi = `db.collection('tableNumberList').add({data: {
				time: '${time}',
				table_number: '${table_number}',
				code: '${imgcover}',
			}})`

			// 调用接口
			const addData = await new getToken().publicApi(addApi, tableNumberListAddApi);
			console.log('addData', addData);

			new result(ctx, '桌号添加成功', 200, OBJ).answer()
		}

	} catch (e) {
		new result(ctx, '生成二维码出错', 500).answer()
	}
})

// 请求所有桌号
router.get('/getTableNumberList', new verifyToken().m, async ctx => {
	const {
		page
	} = ctx.query;
	console.log('page', page);
	const sk = Number(page) * 10;
	const query = `db.collection('tableNumberList').orderBy('time', 'desc').limit(10).skip(${sk}).get()`;
	try {
		const res = await new getToken().publicApi(queryApi, query);
		console.log('res', res);
		const data = res.data.map(item => {
			return JSON.parse(item)
		})
		console.log('data', data);
		new result(ctx, 'SUCCESS', 200, data).answer()
	} catch (error) {
		new result(ctx, '服务器发生错误', 500).answer()
	}
})

module.exports = router.routes();