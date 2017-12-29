module.exports.back = back;
function back	(...msg) {
	let getTime = () => new Date().toLocaleString();
	const redis = require('redis');
	const client = redis.createClient(6379, '10.71.32.138');
	client.on("error", err => {
		//console.log(err);
		client.quit();
		return;
	});
	const os = require('os');
	const ifaces = os.networkInterfaces();

	return new Promise(resolve => client.rpush(`wuf:${process.env.HOSTNAME}`, 
		[getTime(), ifaces.eth0[0].address, process.env.PWD, process.argv.slice(2).join(' '), ...msg].join('\n'),
		(err, val) => {
			resolve();
			client.quit();
		}));
}


