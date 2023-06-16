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


// 生成小程序码 等到发布小程序之后 可以在后台自己生成二维码
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

// 柱状图 7天销售额
router.get('/sales', new verifyToken().m, async ctx => {
	// 最终得到的数据类型 [{time: '2023-6-15', account: 146}, {time: '2023-6-14', account: 178}]
	try {
		// 1~7天的数组
		const dateList = [1, 2, 3, 4, 5, 6, 7];
		// 返回1～7天的日期
		const dataList = dateList.map(item => {
			// 利用moment插件返回当前参数的上一天日期
			return moment().utcOffset(8).subtract(item, 'days').format('YYYY-MM-DD')
		})
		console.log('dataList', dataList);
		// 转化字符串数据
		const strinDataList = JSON.stringify(dataList);
		console.log('strinDataList', strinDataList);
		// 把dataList数组里面的每一项作为参数，发起请求，有就返回参数的数据
		const query = `db.collection('saleTimeList').where({time: db.command.in(${strinDataList})}).orderBy('time', 'asc').get()`;
		const res = await new getToken().publicApi(queryApi, query);
		console.log('res', res);
		// 转化parse数据
		const dataParse = res.data.map(item => {
			return {
				time: JSON.parse(item).time, // 日期
				total_account: JSON.parse(item).total_account, // 总金额
				unix: moment(JSON.parse(item).time).unix() // 时间戳，生成当前日期的时间戳，后面的柱状图会根据时间戳进行排序
			}
		})
		console.log('dataParse', dataParse);

		// 生成1～7天的数组
		const list_data = dataList.map(item => {
			return {
				time: item,
				total_account: 0,
				unix: moment(item).unix() // 时间戳，后面的柱状图会根据时间戳进行排序
			}
		})
		console.log('list_data', list_data);
		// 合并两个数组, 方便利用对象重复数据过滤替换，这样就可生成一个1～7天的数据数组
		const obj = {};
		const list = [...dataParse, ...list_data].reduce((prev, item) => {
			// prev: 初始值，第一次遍历接受上一次的值[]。可以存储上一次遍历的结果，会一直存储到结束
			// []: 决定返回的数据格式，{}：返回对象

			console.log('prev', prev);
			// prev[]
			// prev undefined
			// prev undefined
			// prev undefined
			// prev undefined
			// prev undefined
			// prev undefined
			// prev undefined

			// prev[]
			// prev['2023-06-12']
			// prev['2023-06-12', '2023-06-14']
			// prev['2023-06-12', '2023-06-14', '2023-06-13']
			// prev['2023-06-12', '2023-06-14', '2023-06-13', '2023-06-12']

			console.log('item', item);
			// item { time: '2023-06-12', total_account: 256, unix: 1686499200 }
			// item { time: '2023-06-14', total_account: 0, unix: 1686672000 }
			// item { time: '2023-06-13', total_account: 0, unix: 1686585600 }
			// item { time: '2023-06-12', total_account: 0, unix: 1686499200 }
			// item { time: '2023-06-11', total_account: 0, unix: 1686412800 }
			// item { time: '2023-06-10', total_account: 0, unix: 1686326400 }
			// item { time: '2023-06-09', total_account: 0, unix: 1686240000 }
			// item { time: '2023-06-08', total_account: 0, unix: 1686153600 }

			if(!obj[item.time]) {
				prev.push(item)
				obj[item.time] = true
			}
			return prev
		}, [])
		console.log('list', list);

		// 根据unix时间戳排序
		const sort_list = list.sort((A,B) => {
			return (A.unix - B.unix) // - 降序，+升序
		})

		console.log('sort_list', sort_list);
		new result(ctx, 'SUCCESS', 200, sort_list).answer();
	} catch (e) {
		new result(ctx, '服务器发生错误', 500).answer();
	}
})

module.exports = router.routes();