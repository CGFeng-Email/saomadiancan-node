// 引入报错异常
const result = require('../config/handle');
const handle = require('../config/handle');

// 综合校验
class checkout {
    // 接收传递过来的参数
    // ...obj传递过来几个值就接收几个值=接收不固定的值
    constructor(ctx, ...obj) {
        this.ctx = ctx;
        this.obj = obj;
        console.log('参数', obj);
    }
    // 校验值不能为空
    isUndefiend(msg, code) {
        // msg: 提示语
        // code: 错误码
        // indexOf方法查询数组中的每一项，如果找到对应则返回对应的索引，没找到返回-1
        const reg = this.obj.indexOf(undefined);
        if (reg != -1) {
            // throw 不会返回 也不会继续往下执行
            throw new handle(msg, code)
        }
    }
    // 校验手机
    phone(msg, code, num) {
        // num: 手机号处于...obj数组中的第几个
        const reg = /^1[3456789]\d{9}$/;
        if (!reg.test(this.obj[num])) {
            throw new handle(msg, code)
        }
    }
    // 校验密码
    password(msg, code, num) {
        // 密码必须是数字与英文组合且大于6位小于等于20位
        const reg = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,20}$/;
        if (!reg.test(this.obj[num])) {
            throw new handle(msg, code)
        }
    }

    // 校验参数值是否有空
    isObjNull(list) {
        const index = this.obj.indexOf('');
        if (index != -1) {
            throw new handle(list[index], 202)
        }
    }

    // 校验数组是否有空
    // msg: 提示语
    // num：第几项的值
    isArrayNull(msg, num) {
        if (JSON.parse(this.obj[num].length == 0)) {
            throw new handle(msg, 202)
        }
    }

    // 空格字符串验证
    emptyString(list) {
        const item = this.obj.filter(item => {
            // console.log('空字符',item.split(' '));
            // console.log('空字符2',item.split(' ').join('').length);
            return item.split(' ').join('').length === 0
        })
        // console.log('item', item);
        // console.log('item2', item.length);
        const i = this.obj.indexOf(item[0])
        // console.log('i', i);
        if (i != -1) {
            throw new handle(list[i], 202)
        }
    }
}

// 继承checkout 生成 regCheckout对象
class regCheckout extends checkout {
    start() {
        super.isUndefiend('参数出错', 500);
        super.phone('请填写正确的手机号', 500, 0);
        super.password('请填写符合要求的密码格式', 500, 1)
    }
}

// 校验商家信息上传
class shopInfo extends checkout {
    start() {
        super.isUndefiend('参数出错', 202);
        const msg = ['账号id不能为空', '请输入店铺名称', '请输入店铺店址', '请上传店铺logo'];
        super.emptyString(msg)
        super.isObjNull(msg)
        super.isArrayNull('请上传店铺logo', 3)
    }
}

// 校验添加菜品类目
class addCategoryCheck extends checkout {
    start() {
        super.isUndefiend('参数出错', 202);
        const msg = ['添加类目不能为空']
        super.emptyString(msg);
        super.isObjNull(msg);
    }
}

// 校验获取菜品列表
class getCuisineListCheck extends checkout {
    start() {
        super.isUndefiend('参数出错', 202);
        const msg = ['参数不能为空']
        super.emptyString(msg);
        super.isObjNull(msg);
    }
}

// 校验上架/添加菜品
class addCuisineCheck extends checkout {
    start() {
        const msg = ['cid为空', '请选择分类', '请上传商品图片', '请输入商品名称', '请输入商品金额', '请选择商品单位', '请输入商品库存数量', '请选择商品是否上下架'];
        super.isUndefiend('参数不能为空', 202);
        super.isObjNull(msg);
        super.emptyString(msg);
    }
}

// 校验不能为空
class empty extends checkout {
	start(text) {
		const msg = [`${text}`];
		super.isUndefiend(`${text}`, 202);
		super.isObjNull(msg);
		super.emptyString(msg);
	}
}

// 抛出
module.exports = {
    regCheckout,
    shopInfo,
    addCategoryCheck,
    getCuisineListCheck,
    addCuisineCheck,
	empty
}