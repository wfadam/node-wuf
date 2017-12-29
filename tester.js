const { spawnSync } = require('child_process');
const { back } = require('./log.js');
const model = () => process.env['ATFSTMODEL'] || process.env['ATKEITMODEL'];
const t31api = {
	pwd         : ['fspwd'],
	cd          : ['fscd'],
	stat        : ['fsstat', '--system'],
	who         : ['fswho'],
	proset      : ['fsproset'],
	proreset    : ['fsproreset'],
	clear       : ['fsclear'],
	logstart    : ['fssplogstart'],
	errlogstart : ['fserrlogstart'],
	log         : ['fslog', '--dc', 'on'],
	socket      : ['fsconf', '--socket-file'],
	prostart    : ['fsprostart'],
	sysvar      : ['fssymbol'],
};
const t73api = {
	pwd         : ['kpwd'],
	cd          : ['kcd'],
	stat        : ['kstat', '--system'],
	who         : ['kwho'],
	proset      : ['kproset'],
	proreset    : ['kproreset'],
	clear       : ['kclear'],
	logstart    : ['ksplogstart'],
	errlogstart : ['kerrlogstart'],
	log         : ['klog', '--dc', 'on'],
	socket      : ['kselectsocket'],
	prostart    : ['kprostart'],
	sysvar      : ['ksystemvariable'],
};
const tapi = model() === 'T5831' ? t31api : t73api;
const openAPI = {};
Object.keys(tapi).forEach(key => {
	switch(key) {
		case 'sysvar':
			openAPI[key] = (keyVals) => __setSysVar(...tapi[key], ...keyVals);
			break;
		default:
			openAPI[key] = (...vals) => callSync(...tapi[key], ...vals);
			break;
	}
});

function callSync(cmd, ...args) {
	const proc = spawnSync(cmd, args);
	//console.log(proc.args.join(' '));
	if(proc.status === 0) return proc.stdout.toString();
	const msg = [
		proc.status,
		proc.error,
		proc.stderr.toString(),
		proc.stdout.toString()].join('\n');
	const err = new Error(msg);
	back(err.stack);
	throw err;
}

function __setSysVar (cmd, ...keyVals) {
	let flat = [];
	keyVals.forEach(kv => flat.push('--add', ...kv));
	if(flat.length === 0) return '';
	return callSync(cmd, ...flat);
}

Object.assign(module.exports, openAPI);
module.exports.model = model;
module.exports.callSync = callSync;
module.exports.isTesting = () => module.exports.stat().includes('TESTING');
module.exports.isOff = () => module.exports.who().includes('not used');
