process.on('unhandledRejection', (reason, p) => console.log(reason));
process.on('uncaughtException', (reason, p) => console.log(reason));

const path = require('path');
const tester = require('./tester.js');
const logDir = 'datalogs/';
const lastLine = msg => msg ? `${msg.trim().split('\n').splice(-1)}` : '';
const { back } = require('./log.js');

const banner = `

██████╗ ██╗   ██╗███╗   ██╗███╗   ██╗██╗███╗   ██╗ ██████╗              
██╔══██╗██║   ██║████╗  ██║████╗  ██║██║████╗  ██║██╔════╝              
██████╔╝██║   ██║██╔██╗ ██║██╔██╗ ██║██║██╔██╗ ██║██║  ███╗             
██╔══██╗██║   ██║██║╚██╗██║██║╚██╗██║██║██║╚██╗██║██║   ██║             
██║  ██║╚██████╔╝██║ ╚████║██║ ╚████║██║██║ ╚████║╚██████╔╝    ██╗██╗██╗
╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚═════╝     ╚═╝╚═╝╚═╝
`;

function checkTesterAvail() {
  const msg = tester.isTesting() ? `Tester is already running ${lastLine(tester.pwd())}` :
              tester.isOff()     ? `Please ${tester.model() === 'T5831' ? 'startfs' : 'startk'}` : '';
	if(! msg) return;
	console.log(`${msg}\nQuit`);
	process.exit(1);
}

function parseArgs() {
	const cmL = process.argv;
	const toUpper = flow => flow.match(/^debug$/i) ? 'Debug' : flow.toUpperCase();
	const isFlow = flow => flow.match(/^[\w]{2,3}$/) || flow.match(/^debug$/i);
	const flows = cmL.filter(opt => isFlow(opt)).map(flow => toUpper(flow));
	const [tpZip] = cmL.filter(opt => opt.match(/^.*_tp.zip$/));
	const keyVals = cmL.filter(opt => opt.match(/^ECOTS_.*=\w*$/)).map(kv => kv.split('='));
	return {flows, tpZip, keyVals};
}

function setupCPNL(tXXXXXX, tpFullName) {
  const classFileName = tester.model() === 'T5831' 
                      ? `javaapi/${tpFullName}.class` 
                      : `javaapi.${tpFullName}.class`;
  const socFileName = `${tXXXXXX}/${tpFullName}.soc`;
  //console.log({tXXXXXX, classFileName, socFileName});
  tester.cd(tXXXXXX);
  tester.proset(classFileName);
  tester.socket(socFileName);
}

function enableLog(dir, flow, tpFullName) {
	tester.callSync('mkdir', '-p', dir);
	const timeStr = new Date().toString().replace(/ (20\d\d) /, '_').replace(/ GMT.*$/, '').replace(/[ :]/g, '');
	tester.logstart(dir, `${flow}_${tpFullName}_${timeStr}`);
	tester.errlogstart(dir, `.${flow}_${tpFullName}_${timeStr}`);
}

function setFlow(flow) {
	tester.sysvar([['ECOTS_SD_STEP', flow], ['ECOTS_SD_RESCREEN', 0], ['ECOTS_SD_DATALOGDISP', 'ON']]);
}

function tpName(dir) {
	const fs = require('fs');
	const socFiles = fs.readdirSync(dir).filter(file => file.endsWith('.soc'));
	let err;
	switch(socFiles.length) {
		case 1: return socFiles[0].replace(/.soc$/g, '');
		case 0: err = new Error(`Can not find .soc file under ${dir}`); break;
		default: err = new Error(`More than one .soc file found under ${dir}`); break;
	}
	back(err.stack);
	throw err;
}

function sync() {
	const srcDir = process.env.PWD;
	const dstDir = srcDir.replace('/nfsusers/', '/sandbox/');
	if(srcDir === dstDir) return dstDir;

	console.log(`Syncing to ${dstDir}`);
	tester.callSync('mkdir', '-p', dstDir);
	tester.callSync('rsync', '-az', '--delete', '--force', '--exclude=*.5831', '--exclude=*.5773', '--exclude=*.t5831', '--exclude=*.t5773', '--exclude=saveflows/', '--exclude=datalogs/', '--exclude=*.java', '--exclude=*.asc', '--exclude=*.prep', '--exclude=.svn/', srcDir, path.dirname(dstDir));
	return dstDir;
}

async function extract(tpZip) {
	const unzip = require('./unzip.js');
	const tDir = unzip.tpNameSync(tpZip).slice(0, 7);
	const srcDir = `${process.env.PWD}/${tDir}`;
	const dstDir = srcDir.replace('/nfsusers/', '/sandbox/');
	await unzip.untgz(tpZip, path.dirname(dstDir));
	return dstDir;
}

async function run() {
	await back();
	const {flows, tpZip, keyVals} = parseArgs();
	const dstDir = tpZip ? await extract(tpZip) : sync();
	const tpFullName = tpName(dstDir);

	console.log(banner);
	setupCPNL(dstDir, tpFullName);
	console.log(tester.sysvar(keyVals));
	for(let flow of flows) {
		tester.proreset();
		tester.clear();
		setFlow(flow);
		enableLog(logDir, flow, tpFullName);
		tester.prostart();
	}
}

/************************** Execution starts here *****************************/
checkTesterAvail();
run();

