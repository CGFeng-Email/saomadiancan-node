// 路由 实例化new路由
const router = require('koa-router')();

// 引入校验方法
const {
    regCheckout,
    shopInfo,
    addCategoryCheck,
    addCuisineCheck,
    getCuisineListCheck
} = require('../../utils/checkout');

// 引入api
const {
    getToken,
    queryApi,
    addApi,
    uploadApi
} = require('../../api/base_api');

// 引入提示
const result = require('../../config/result');

// 引入加密方法
const {
    jwtFn
} = require('../../jwt/jwt');

// 引入 查询接口是否携带有效的token
const {
    verifyToken
} = require('../../jwt/verify');
const {
    parse
} = require('basic-auth');

// 引入moment日期插件
const moment = require('moment');
// 定义日期插件时区
moment.locale('zh-cn');

// 注册接口
router.post('/register', async ctx => {
    // 获取前端提交的参数 
    // ctx.request.body: 可以获取前端传递过来的参数
    const {
        account,
        password
    } = ctx.request.body;
    // console.log(account);
    // console.log(password);

    // 校验前端传递过来的值是否合法
    new regCheckout(ctx, account, password).start();

    // 查询记录操作语句
    const query = `db.collection("register").where({account:'${account}'}).get()`;
    try {
        // 调用查询记录 api
        const res = await new getToken().publicApi(queryApi, query);
        // console.log('查询记录', res);
        if (res.data.length > 0) {
            // 数据大于0，说明已经注册过了，提示重新登录
            new result(ctx, '用户已注册', 202).answer()
        } else {
            // 没有注册过
            // 准备: 账号，密码，商家唯一标识uid
            const uid = new Date().getTime(); // getTime()方法可以获取到毫秒数
            const obj = {
                uid,
                account,
                password
            }
            // 转化成字符串
            const strObj = JSON.stringify(obj);
            // 插入记录操作语句
            const addQuery = `db.collection('register').add({data:${strObj}})`;
            // 调用插入记录 api
            await new getToken().publicApi(addApi, addQuery)
            new result(ctx, '用户注册成功', 200).answer()
        }
    } catch (error) {
        // console.log('查询记录err', error);
        new result(ctx, '注册失败,服务器发生错误', 500)
    }
})

// 登录接口
router.post('/login', async (ctx, next) => {
    // 获取账号和密码
    // console.log('login',ctx.request.body);
    // console.log('header', ctx.req.headers);

    // 解构账号,密码
    const {
        account,
        password
    } = ctx.request.body;

    try {
        // 查询记录操作语句
        const query = `db.collection("register").where({account: '${account}', password: '${password}'}).get()`;

        // 调用接口
        const res = await new getToken().publicApi(queryApi, query);
        // console.log('res', res);

        // 判断 - 有数据则登录成功，反之则账号密码出错
        if (res.errmsg == 'ok' && res.data.length > 0) {

            const obj = JSON.parse(res.data);

            // 登录成功 - 查询到uid,给uid加密返回给前端
            new result(ctx, '登录成功', 200, {
                token: jwtFn(obj.uid)
            }).answer();

        } else {
            new result(ctx, '账号或密码错误', 202).answer()
        }
    } catch (error) {

    }


})

// 商家信息上传
router.post('/uploadShop', new verifyToken().m, async ctx => {
    const {
        id,
        name,
        address,
        logo
    } = ctx.request.body;
    console.log('商家信息上传', id, name, address, logo);
    // 校验商家信息上传
    new shopInfo(ctx, id, name, address, logo).start();
    // 数据库操作语句 添加
    const query = `db.collection('shopInfoList').add({data: {
        name: '${name}',
        address: '${address}',
        logo: ${logo},
        id: '${id}'
    }})`
    console.log('query', query);
    try {
        await new getToken().publicApi(addApi, query)
        new result(ctx, '提交成功').answer()
    } catch (error) {
        new result(ctx, '提交失败，服务器发生错误', 500).answer()
    }
})

// 获取店铺信息列表
router.get('/getShopInfo', new verifyToken().m, async ctx => {
    const query = `db.collection('shopInfoList').get()`;
    try {
        const res = await new getToken().publicApi(queryApi, query);
        // console.log('res', res);
        const data = res.data.map(item => {
            return JSON.parse(item)
        })
        new result(ctx, 'success', 200, data).answer()
    } catch (err) {
        new result(ctx, '获取数据失败，服务器发生错误', 500).answer()
    }
})

// 获取指定店铺信息
router.post('/getShopInfoId', new verifyToken().m, async ctx => {
    const {
        id
    } = ctx.request.body;
    console.log('id', id);
    // 查询操作语句
    const query = `db.collection("shopInfoList").where({id: '${id}'}).get()`
    try {
        const res = await new getToken().publicApi(queryApi, query);
        console.log('res', res);
        new result(ctx, 'success', 200, JSON.parse(res.data)).answer()
    } catch (error) {
        new result(ctx, '数据获取失败', 202).answer()
    }
})

// 修改店铺信息
router.post('/editShopInfo', new verifyToken().m, async ctx => {
    const {
        id,
        name,
        address,
        logo
    } = ctx.request.body;
    // console.log('id', id);
    // console.log('name', name);
    // console.log('address', address);
    // console.log('logo', logo);

    // 校验
    new shopInfo(ctx, id, name, address, logo).start();

    // 操作语句
    const query = `db.collection("shopInfoList").where({id: '${id}'}).update({data: {name: '${name}', address: '${address}', logo: ${logo}}})`;
    try {
        const res = await new getToken().publicApi(uploadApi, query);
        console.log('res', res);
        new result(ctx, '修改成功').answer()
    } catch (error) {
        new result(ctx, '修改失败，服务器发生错误', 500).answer()
    }
})

// 添加菜品类目
router.post('/addCategory', async ctx => {
    const {
        name
    } = ctx.request.body;
    // console.log('name', name);
    // 校验
    new addCategoryCheck(ctx, name).start();
    // 生成id 
    // a: 为了实现类目滚动时能自动选中当前分类
    const cid = 'a' + new Date().getTime();
    // 生成上架时间
    const time = moment().utcOffset(8).format('YYYY-MM-DD  HH:mm:ss')
    console.log('生成上架时间', time);
    // 查询数据库是否已存在该类目
    const query = `db.collection('cuisineCategory').where({label: '${name}'}).get()`;
    try {
        const res = await new getToken().publicApi(queryApi, query);
        // console.log('res', res);
        if (res.data.length > 0) {
            // 类目已存在
            new result(ctx, '该类目已存在', 202).answer();
        } else {
            // 类目不存在
            const addQuery = `db.collection('cuisineCategory').add({data: {
                cid: '${cid}',
                count: 0,
                value: '${name}',
                label: '${name}',
                sele_quantity: 0,
                time: '${time}'
            }})`

            const a = await new getToken().publicApi(addApi, addQuery)
            // console.log('a', a);
            new result(ctx, '添加成功').answer()
        }
    } catch (error) {
        // console.log('error', error);
        new result(ctx, '添加失败，服务器发生错误', 500).answer()
    }
})

// 获取菜品类目列表
router.get('/getCuisineCategoryList', async ctx => {
    // ctx.query: 获取get方法传递过来的参数
    const {
        page
    } = ctx.query;
    console.log('page', page);
    // skip: 乘于10 等于从那里开始取10条
    const skipPage = page * 10;
    const query = `db.collection('cuisineCategory').orderBy('cid','desc').limit(10).skip('${skipPage}').get()`;
    try {
        const res = await new getToken().publicApi(queryApi, query);
        // console.log('res', res);
        const data = res.data.map(item => {
            return item = JSON.parse(item)
        })
        // console.log('data',data);
        const total = {
            total: res.pager.Total
        }
        const obj = {
            ...{
                list: data
            },
            ...total
        }
        console.log('obj', obj);
        new result(ctx, 'success', 200, obj).answer()
    } catch (error) {
        new result(ctx, '获取失败,服务器发生错误', 500).answer()
    }
})

// 获取菜品单位列表
router.get('/getCuisineUnitList', async ctx => {
    const query = `db.collection('cuisineUnitList').get()`;
    try {
        const res = await new getToken().publicApi(queryApi, query);
        console.log('res', res);
        const data = res.data.map(item => {
            return item = JSON.parse(item)
        })
        new result(ctx, 'success', 200, data).answer()
    } catch (error) {
        console.log('error', error);
        new result(ctx, '获取失败，服务器发生错误', 500).answer()
    }
})

// 添加菜品单位
router.post('/addCuisineUnit', async ctx => {
    const {
        unit
    } = ctx.request.body;
    console.log('unit', unit);
    // 查询操作语句
    const query = `db.collection('cuisineUnitList').where({label: '${unit}'}).get()`;
    console.log('query', query);
    try {
        const res = await new getToken().publicApi(queryApi, query);
        // console.log('res', res);
        if (res.data.length > 0) {
            new result(ctx, '该单位已经存在', 202).answer();
        } else {
            // 添加单位
            const cid = new Date().getTime();
            const addQuery = `db.collection('cuisineUnitList').add({data: {label: '${unit}', value: '${unit}', cid: '${cid}'}})`;
            // console.log('add', addQuery);
            await new getToken().publicApi(addApi, addQuery);
            new result(ctx, '添加成功').answer()
        }
    } catch (error) {
        new result(ctx, '添加失败，服务器发生错误', 500).answer()
    }
})

// 获取菜品列表
router.get('/getCuisineList', async ctx => {
    // 获取分页参数
    const {
        page
    } = ctx.query;
    console.log('page', page);
    // 校验
    new getCuisineListCheck(ctx, page).start()
    // 指定查询的数目
    const skip = page * 10;

    const query = `db.collection('cuisineList').orderBy('time', 'desc').limit(10).skip('${skip}').get()`;
    try {
        const res = await new getToken().publicApi(queryApi, query);
        console.log('res', res);
        const data = res.data.map(item => {
            return item = JSON.parse(item)
        })
        const total = {
            total: res.pager.Total
        }
        const obj = {
            ...{
                list: data,
                ...total
            }
        }
        new result(ctx, 'success', 200, obj).answer();
    } catch (error) {
        console.log('err', error);
        new result(ctx, '服务器发生错误', 500).answer()
    }
})

// 上架/添加菜品
router.post('/addCuisine', async ctx => {
    // 参数
    const {
        cid,
        category,
        image,
        name,
        price,
        unit,
        quantity,
        isOpen
    } = ctx.request.body;
    // 校验
    new addCuisineCheck(ctx, cid, category, image, name, price, unit, quantity, isOpen).start()
    console.log('通过');
    // 生成上架时间
    const time = moment().utcOffset(8).format('YYYY-MM-DD  HH:mm:ss')
    console.log('time', time);
    // 查询操作语句
    const whereQuery = `db.collection('cuisineList').where({name: '${name}'}).get()`;

    try {
        const queryData = await new getToken().publicApi(queryApi, whereQuery);
        console.log('查询是否有重复添加', queryData);
        if (queryData.data.length > 0) {
            new result(ctx, '请不要添加重复的商品').answer()
        } else {
            // 添加操作语句
            const addQuery = `db.collection('cuisineList').add({data: {
                cid: '${cid}',
                category: '${category}',
                image: '${image}',
                name: '${name}',
                price: '${price}',
                unit: '${unit}',
                quantity: '${quantity}',
                isOpen: '${isOpen}',
                time: '${time}',
                salesVolume: 0,
            }})`;
            // 添加商品进cuisineList菜品列表
            const addData = await new getToken().publicApi(addApi, addQuery);
            console.log('addData', addData);
            // cuisineCategory：菜品类目列表 该分类下count：有多少商品，加一
            const updateQuery = `db.collection('cuisineCategory').where({cid: '${cid}'}).update({data: {
                count: db.command.inc(1)
            }})`
            // 更新cuisineCategory菜品类目列表中的count
            const updateData = await new getToken().publicApi(uploadApi, updateQuery);
            // console.log('updateData',updateData);
            new result(ctx, '商品添加成功').answer();
        }

    } catch (error) {
        new result(ctx, '服务器发生错误', 500).answer()
    }
})

// 下架菜品
router.get('/soldoutCuisine', async ctx => {
    const {
        cid,
        _id
    } = ctx.query;
    // console.log('cid',  cid);
    // console.log('_id', _id);
    // 下架当前_id的菜品
    const soldoutQuerry = `db.collection('cuisineList').where({_id: '${_id}'}).update({data: {
        isOpen: false
    }})`;

    try {
        const res = await new getToken().publicApi(uploadApi, soldoutQuerry)
        // console.log('res', res);
        if (res.errmsg == 'ok') {
            // 当前菜品所属类目列表count减一
            const cuisineUpdateQuery = `db.collection('cuisineCategory').where({cid: '${cid}'}).update({data: {count: db.command.inc(-1)}})`
            const upData = await new getToken().publicApi(uploadApi, cuisineUpdateQuery)
            // console.log('upData', upData);
            new result(ctx, '已下架').answer()
        }
    } catch (error) {
        new result(ctx, '服务器发生错误', 500).answer()
    }
})

// 修改编辑菜品
router.post('/editCuisine', async ctx => {
    const {
        _id,
        image,
        name,
        price,
        unit,
        quantity,
        isOpen
    } = ctx.request.body;
    // 校验
    new addCuisineCheck(ctx, _id, image, name, price, unit, quantity, isOpen).start();
    // 生成上架时间
    const time = moment().utcOffset(8).format('YYYY-MM-DD  HH:mm:ss')
    // console.log('通过');
    const query = `db.collection('cuisineList').doc('${_id}').update({data: {time: '${time}', image: '${image}', name: '${name}', price: '${price}', unit: '${unit}', quantity: '${quantity}', isOpen: '${isOpen}'}})`
    try {
        const res = await new getToken().publicApi(uploadApi, query);
        // console.log('res', res);
        new result(ctx, '修改成功').answer()
    } catch (error) {
        new result(ctx, '修改失败,服务器发生错误', 500).answer()
    }
})

// 抛出
module.exports = router.routes()