// 引入加密插件
const jwt = require('jsonwebtoken');

// 引入加密规则 - reue在哪里是一个对象需要再.rule才可以拿到
const rule = require('./rule').rule;

// console.log('rule', rule);

// 生成加密
// uid: 传递进来加密的数据
function jwtFn(uid) {
    // privateKey：字段需要使用这个
    // expiresIn：需要使用指定的字段
    const privateKey = rule.ruleText; // 参与加密字符
    const expiresIn = rule.ruleTime; // 加密过期时间
    // 开始加密
    const jwtUid = jwt.sign({
        uid
    }, privateKey, {
        expiresIn
    })
    // 返回加密的uid
    return jwtUid
}

//解析jwt
function verifyToken(token) {
    const privateKey = rule.ruleText; // 参与加密字符
    return jwt.verify(token, privateKey)
}

module.exports = {
    jwtFn
}