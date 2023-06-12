 // 引入腾讯云插件
 var COS = require('cos-nodejs-sdk-v5');

 var cos = new COS({
 	SecretId: 'AKIDkNrEaomqiS1Vq58yiLn1LVTDl8Pex7ED',
 	SecretKey: 'sa6ORHtHSQF792iBRhkpnY6WoxxnT2Sl',
 	SimpleUploadMethod: 'putObject',
 });

 let Bucket = 'diancan-1317202885'; // 存储桶名称
 let Region = 'ap-guangzhou'; // 存储桶所在地区ip

 // 二进制流文件 生成二维码图片 存储进腾讯云存储桶 返回https 在线文件
 function bufferFn(keyName, path) {

 	return new Promise((resolve, reject) => {
 		cos.putObject({
 			Bucket,
 			Region,
 			Key: 'diancan/code/' + keyName,
 			Body: Buffer.from(path),
 		}, function (err, data) {
 			// console.log('999', data);
 			resolve(data.Location)
 		});
 	})
 }

 // 给二进制图片 随机命名
 function bufferImgName(num) {
 	return new Date().getTime() + '-' + num + '.jpg';
 }

 module.exports = {
 	bufferFn,
 	bufferImgName
 }