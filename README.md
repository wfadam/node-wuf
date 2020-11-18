# node-wuf
an ATE program invoke tool

## No pains to run SSD MT program (under tXXXXXX/)
```bash
$ wuf  fh  ECOTS_SD_DEVICENUMBER=55-88-99   ECOTS_SD_LOTNUMBER=LL52227373.99
```

## Pass any variable who’s name starts with ECOTS_  (under tXXXXXX/)
```bash
$ wuf  sh  fh  ECOTS_SD_ABC=0
```

## Run from a binary MT program
```bash
$ wuf  sh  fh  abc_tp.zip
```

## Run multiple flows in sequence (under tXXXXXX/) 
```bash
$ wuf  debug  sh  fh
```


wuf - ADV execution tool
=================
<p align="center">
	<a href="https://connect.wdc.com/people/Feng.Wu%40wdc.com"> <img src="C:\Users\50772\Box\TCR\CST\2.png" alt="N|Solid" style="zoom:20%;" > </a>
</p>
<p align="center">
    <a><img src="https://img.shields.io/appveyor/build/gruntjs/grunt" alt="Downloads"></a>
    <a ><img src="https://img.shields.io/azure-devops/coverage/swellaby/opensource/25" alt="Coverage"></a>
    <a><img src="https://awesome.re/badge-flat2.svg" alt="Awesome"></a>
    <a><img src="https://img.shields.io/node/v/package" alt="Nodejs"></a>
</p>
## Prerequisites: Javascript's asynchronous programming concepts

#### Asynchronous?

Normally, a given program's code runs straight along, with only one thing happening at once. If a function relies on the result of another function, it has to wait for the other function to finish and return, and until that happens, the entire program is essentially stopped from the perspective of the user.

For example, sometimes you may experience the busy circle cursor, when Windows says "the current program you're using has had to stop and wait for something to finish up, and it's taking so long that I was worried you'd wonder what was going on."

This is a frustrating experience and isn't a good use of computer processing power — especially in an era in which computers have multiple processor cores available. There's no sense sitting there waiting for something when you could let the other task chug along on another processor core and let you know when it's done. This lets you get other work done in the meantime, which is the basis of **asynchronous programming**. It is up to the programming environment you are using (web browsers, in the case of web development) to provide you with APIs that allow you to run such tasks asynchronously.



#### Blocking code

Asynchronous techniques are very useful, particularly in web programming. When a web app runs in a browser and it executes an intensive chunk of code without returning control to the browser, the browser can appear to be frozen. This is called **blocking**; the browser is blocked from continuing to handle user input and perform other tasks until the web app returns control of the processor.



#### Threads

A **thread** is basically a single process that a program can use to complete tasks. Each thread can only do a single task at once:

```reStructuredText
Task A --> Task B --> Task C
```

Each task will be run sequentially; a task has to complete before the next one can be started.

As we said earlier, many computers now have multiple cores, so can do multiple things at once. Programming languages that can support multiple threads can use multiple cores to complete multiple tasks simultaneously:

```tex
Thread 1: Task A --> Task B
Thread 2: Task C --> Task D
```

<span style="color:red">**JavaScript is single-threaded. **</span> Even with multiple cores, you could only get it to run tasks on a single thread, called the **main thread**. 

After some time, JavaScript gained some tools to help with such problems.<span style="color:red"> [Web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) </span>allow you to send some of the JavaScript processing off to a separate thread, called a worker so that you can <span style="color:red">**run multiple JavaScript chunks simultaneously**</span>. You'd generally use a worker to run expensive processes off the main thread so that user interaction is not blocked.

``` tex
Main thread: Task A --> Task C
Worker thread: Expensive task B
```

Web workers are pretty useful, but they do have their limitations. A major one is they are not able to access the [DOM](https://developer.mozilla.org/en-US/docs/Glossary/DOM) — you can't get a worker to directly do anything to update the UI. 

The second problem is that although code run in a worker is not blocking, it is still basically synchronous. This becomes a problem when a function relies on the results of multiple previous processes to function. Consider the following thread diagrams:

```tex
Main thread: Task A --> Task B
```

In this case, let's say Task A is doing something like opening an image file and Task B then does something to the image like applying a filter to it.

 **If you start Task A running and then immediately try to run Task B, you'll get an error, because the image won't be available yet.**



#### Asynchronous code

Here is another example:

```tex
Main thread: Task A --> Task B --> |Task D|
Worker thread: Task C ---------->|   |
```

In this case, let's say Task D makes use of the results of both Task B and Task C. If we can guarantee that these results will both be available at the same time, then we might be OK, but this is unlikely. If Task D tries to run when one of its inputs is not yet available, it will throw an error.

To fix such problems, browsers allow us to run certain operations asynchronously. JavaScript has features like [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) allow you to set an operation running (e.g. the opening an image file), and then **wait until the result has returned before running another operation**:

```tex
Main thread: Task A                   Task B
    Promise:      |__async operation__|
```

Since the operation is happening somewhere else, the main thread is not blocking. **It will wait while the async operation is being processed.**



Getting start
------------------------------

Let's first look at the location of wuf :
```bash
$ which wuf
~/nfsusers/users/script/wuf
```

Go to that folder, you will found wuf  is a just link point to bash script wuf1:

```bash
#!/bin/bash
fname=`which $0`
dname=`dirname $fname`
jspath=$dname"/node-wuf/wuf.js"

#node ~/nfsusers/script/node-wuf/wuf.js $*
node $jspath $*
```

Which points out the entrance of wuf is the javascript file under */node-wuf/wuf.js* and also the source codes are under /node-wuf. They are:

- **wuf.js** : the main program 
- **tester.js** : help functions to call ADV k-commands
- **socket.js** : the program for **wudut**
- **unzip.js** : help function to unzip the released MT program 
- **log.js** and **cnt.js** : working with redis on mtte, no longer used



## wuf.js

### Related Modules: tester.js

```javascript
process.on('unhandledRejection', (reason, p) => console.log(reason));
process.on('uncaughtException', (reason, p) => console.log(reason));

const path = require('path');
const tester = require('./tester.js');
const logDir = 'datalogs/';

const log = require('./log.js');
```

### main function

Execution code of wuf is at the very end of wuf.js:

```javascript
const usage = `
Usage:

	# Pass any variable whose name starts with ECOTS_ (under tXXXXXX/)
	$ wuf fh ECOTS_SD_RESCREEN=0 ECOTS_SD_DEVICENUMBER=54-82-05131-064GRE ECOTS_SD_LOTNUMBER=M1522M73F3.01

	# Run multiple flows in sequence (under tXXXXXX/) 
	$ wuf debug sh fh

	# Run from a binary MT program
	$ wuf sh fh abc_tp.zip

`;

if(process.argv.length === 2) {
	console.log(usage);
	process.exit(0);
}
checkDir();
checkTesterAvail();
run();
```

If there is no arguments followed by wuf, the usage will be print. 

It has 3 steps when running:

1. checkDir() check if there is space in the directory or not
2. checkTesterAvail() check if the tester is running or not
3. when directory and tester are ok, setup tester with k-commands and run it



#### checkDir()

```javascript
async function checkDir() {
	const srcDir = process.env.PWD;
	if(srcDir.indexOf(" ") != -1) {
		console.log(`ERROR!! Directory: ${srcDir} contains SPACE!`);
		process.exit(1);
	}
}
```

Pay attention the <span style="color:red">**async**</span> keyword makes the function asynchronized. The checkDir() must return a promise (though the return is not showed out), and the main thread must wait the checkDir() to finish then back to execute next function.



#### checkTesterAvail()

```javascript
1function checkTesterAvail() {
2	const lastLine = msg => msg ? `${msg.trim().split('\n').splice(-1)}` : '';
3	const msg = tester.isOff()     ? `Please ${tester.model() === 'T5831' ? 'startfs' : 'startk'}` :
4							tester.isTesting() ? `Tester is already running ${lastLine(tester.pwd())}` : '';
5	if(! msg) return;
6	console.log(`${msg}\nQuit`);
7	process.exit(1);
8}
```

The arrow "=>" in line 2 is JavaScript (ES6 standard) arrow function, which allow us to write shorter function syntax. Here is an example:

```javascript
var hello = function(val) {
    return "Hello " + val;
}
```

We can rewrite it using arrow function:

```javascript
var hello = (var) => "Hello" + var;
```

so line 2 is like to define a function called LastLine(msg), and remove the white space in msg and split the msg string, and then return the split string.

The main check logic is in line 3:

```tex
if (tester is off) {
	return "please stark" or "please startfs"
} else {
	if (tester is testing){
	 	return "tester is already running LastLine(pwd path)""
	}
	else 
	 	return ""
}
```



#### run()

```javascript
1async function run() {
2	const {flows, tpZip, keyVals, logName} = parseArgs();
3	const dstDir = tpZip ? await extract(tpZip) : sync();
4	const tpFullName = tpName(dstDir);
5	checkTpName(tpFullName);
6
7	console.log(banner);
8	setupCPNL(dstDir, tpFullName);
9	//console.log(tester.sysvar(keyVals));
10	for(let flow of flows) {
11		console.log(`Running ${flow}`);
12		tester.proreset();
13		tester.userproreset();
14		tester.clear();
15		setFlow(flow);
16		console.log(tester.sysvar(keyVals));
17		enableLog(logDir, flow, tpFullName, logName);
18		tester.prostart();
19	}
20
21	console.log('TESTEND');
22	process.exit(0);
23}
```

Pay attention run() is also **async** function.

First in line 2 the parseArgs() will return the value of each argument in the wuf command.

```javascript
function parseArgs() {
	const cmL = process.argv;
	const toUpper = flow => flow.match(/^debug$/i) ? 'Debug' : flow.toUpperCase();
	const isFlow = flow => flow.match(/^[a-z]{2,3}$/i) || flow.match(/^debug$/i);
	const flows = cmL.filter(opt => isFlow(opt)).map(flow => toUpper(flow));
	const [tpZip] = cmL.filter(opt => opt.match(/^.*_tp.zip$/));
	const keyVals = cmL.filter(opt => opt.match(/^ECOTS_.*=/)).map(kv => kv.split('='));
	const logName = cmL.filter(opt => ! opt.match(/^debug$/i) && opt.match(/^[_\w]{4,}$/i));
	return {flows, tpZip, keyVals, logName};
}
```

For example, you send out:

```bash
$ wuf fh cfh fh_1st_test T5773_BiCs4_8192Gb_X3_BGA170_ESS_16D4CE_tea4234af0581_768d_tp.zip ECOTS_SD_RESCREEN=0 ECOTS_SD_DEVICENUMBER=54-82-05131-064GRE ECOTS_SD_LOTNUMBER=M1522M73F3.01
```

Then 

```tex
flow = [FH, CFH]
tp = T5773_BiCs4_8192Gb_X3_BGA170_ESS_16D4CE_tea4234af0581_768d_tp.zip
keyVals = [{ECOTS_SD_RESCREEN,0}, {ECOTS_SD_DEVICENUMBER, 54-82-05131-064GRE}, {ECOTS_SD_LOTNUMBER, M1522M73F3.01}]
logName = fh_1st_test
```

The item not found will return as empty.

From line 3 to line 5, if a *_tp.zip is given, wuf will unzip it and get the executable path in the unzipped folder. Pay attention to the **"await"** keywords in line 3, which means line 3 will be execute asynchronized. The main thread won't go the line 4 until line 3 is over.

Line 8 setupCPNL(dstDir, tpFullName); will set up the directory, the socket file and main java class to ADV:

```javascript
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
```

Then from line 10 to line 19, it will in sequence execute each test flow detected. In our example, it will first execute FH flow, then execute CFH flow.

The contents of remaining two key functions setFlow(flow); and  enableLog(logDir, flow, tpFullName, logName); are as follows:

```javascript
function enableLog(dir, flow, tpFullName, logName) {
	tester.callSync('mkdir', '-p', dir);
	const timeStr = new Date().toString().replace(/ (20\d\d) /, '_').replace(/ GMT.*$/, '').replace(/[ :]/g, '');
	tester.log();
	if(logName.length === 0){
		tester.logstart(dir, `${flow}_${tpFullName}_${timeStr}`);//for unique if same log name used
	}else {
		tester.logstart(dir, `${logName}`);
	}
	tester.errlogstart(dir, `.${flow}_${tpFullName}_${timeStr}`);
	const baseName = `${process.env.PWD}/${dir}/.${flow}_${tpFullName}_${timeStr}`;
}

function setFlow(flow) {
	tester.sysvar([['ECOTS_SD_STEP', flow], ['ECOTS_SD_RESCREEN', 0], ['ECOTS_SD_DATALOGDISP', 'ON']]);
}
```



## tester.js

tester.js is a help module designed for tester communication. 

First of all, the basic idea is to create two dictionary with the same keys to map the k-command in T5773 and fs-command in T5831

```javascript
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
	log         : ['fslog', '--dc', 'on', '--func', 'off'],
	socket      : ['fsconf', '--socket-file'],
	prostart    : ['fsprostart'],
	sysvar      : ['fssymbol'],
	userproreset: ['fssetuserpro', '--clear'],
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
	log         : ['klog', '--dc', 'on', '--func', 'off'],
	socket      : ['kselectsocket'],
	prostart    : ['kprostart'],
	sysvar      : ['ksystemvariable'],
	userproreset: ['ksetuserpro', '--clear'],
};
```

then by search the key environment values on the tester, we can decide the tester is T5773 or T5831. And then decide to use the k-command or fs-command:

```javascript
const tapi = model() === 'T5831' ? t31api : t73api;
```

 Then all the elements are used to generate a set of synchronized function calls (the set is called **"openAPI"**) one by one:

```javascript
const openAPI = {};
Object.keys(tapi).forEach(key => {
	switch(key) {
		case 'sysvar':
			openAPI[key] = (keyVals) => __setSysVar(...tapi[key], ...keyVals);
			break;
		case 'socket':
			openAPI[key] = (...vals) => {
				const socVal = (model() === 'T5773' && isAsciiSoc(...vals))
					? [callSync('cat', ...vals).trim()]
					: vals;
				callSync(...tapi[key], ...socVal);
			};
			break;
		default:
			openAPI[key] = (...vals) => callSync(...tapi[key], ...vals);
			break;
	}
});
openAPI['sysid'] = () => model() === 'T5773' ? getSysIdT73() : getSysIdT31();
```

To be clear, we can represent this function map in another style (use T5773 as example):

```tex
openAPI['sysvar'] ---> __setSysvar('ksystemvariable', keyVals)
openAPI['socket'] ---> callSync('kselectsocket', vals)
openAPI['pwd'] ---> callSync('kpwd', vals)
openAPI['cd'] ---> callSync('kcd', vals)
.....
```

Then use **Object.assign**  to export this map:

```javascript
Object.assign(module.exports, openAPI);
```

You can understand this export like export a set of static functions to outside, each function is named by the key. 

For example, in the wuf.js, in the setupCPNL (setup control panel) function, we called 

```tex
  tester.cd(tXXXXXX);    -----> assigned to ----> openAPI['cd']
  tester.proset(classFileName);  -----> assigned to ----> openAPI['proset']
  tester.socket(socFileName); -----> assigned to ----> openAPI['socket']
```

 At last, the callSync and __setSysvar functions are used to start different process for the main thread:

```javascript
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
	throw new Error(proc.status);
}

function __setSysVar (cmd, ...keyVals) {
	let flat = [];
	keyVals.forEach(kv => flat.push('--add', ...kv));
	if(flat.length === 0) return '';
	return callSync(cmd, ...flat);
}
```



## socket.js

socket.js is the source code for wudut, here is the content for wudut:

```bash
#!/bin/bash
fname=`which $0`
dname=`dirname $fname`
jspath=$dname"/node-wuf/socket.js"

node $jspath $*
```

Again the main function of socket.js is located at the very end:

```javascript
if(process.argv.length <= 2) {
	help();
	process.exit(1);
}

const [,,...duts]  = process.argv;

const [allOrNone] = duts;

if(allOrNone.match(/^(all|none)$/i)) {
	const opt = allOrNone.match(/^all$/i) ? '--enable-all' : '--disable-all';
	execSync(`${getDutCmd()} ${opt}`);
	process.exit(0);
}

const keys = toSiteDutString(duts);
const [socFile] = getSocFiles();	console.log(socFile);
const dict = parse(fs.readFileSync(socFile).toString()); //console.log(dict);
const sysd = keys.map(s => {
	if(! dict[s]) throw new Error(`Can not map "${s}" to SYSTEMDUT#`);
	return dict[s];
});
enableDuts(sysd);
console.log(keys);
```

Step by step, first socket.js will check the argument of wudut command must larger than 2:

```javascript
if(process.argv.length <= 2) {
	help();
	process.exit(1);
}
```

Then start from the second argument (the args expect wudut), name them as duts:

```javascript
const [,,...duts]  = process.argv;
```

Then process two special cases: wudut all, wudut none

```javascript
const [allOrNone] = duts;

if(allOrNone.match(/^(all|none)$/i)) {
	const opt = allOrNone.match(/^all$/i) ? '--enable-all' : '--disable-all';
	execSync(`${getDutCmd()} ${opt}`);
	process.exit(0);
}
```

 For the rest case, parse the (dut, site) information from the argument:

```javascript
// const keys = toSiteDutString(duts);

function toSiteDutString(duts = []) {
	const keys = [];
	duts.forEach(msg => {
		const [dutExp, site = 1] = msg.split(':');
		if(! isNaN(dutExp)) {
			keys.push(`SITE${site},DUT${dutExp}`);
			return;
		}
		const [dutLow, dutHigh] = dutExp.split('-');
		if(dutLow && dutHigh) {
			const low = Math.min(dutLow, dutHigh);
			const high = Math.max(dutLow, dutHigh);
			for(let dut = low; dut <= high; dut++) {
				keys.push(`SITE${site},DUT${dut}`);
			}
			return;
		} 
		throw new Error(`${msg} is wrong`);
	});
	return keys;
}
```

Here is some example :

```tex
  wudut 2 7:5   ---> keys = ["SITE5,DUT2", "SITE5,DUT7"]
  wudut 1-3     ---> keys = ["SITE1,DUT1", "SITE1,DUT2", "SITE1,DUT3"]
  wudut 2-3:5   ---> keys = ["SITE5,DUT2", "SITE5,DUT3"]
```

The system dut map is get by parsing the sockect file:

```javascript
//const dict = parse(fs.readFileSync(socFile).toString()); //console.log(dict);
function parse(msg = '') {
	const lineExp = /SYSTEMDUT[0-9]+\s*=\s*SITE[0-9]+\s*,\s*DUT[0-9]+/;
	const obj = {};
	msg.split('\n')
		.filter(line => line.match(lineExp))
		.forEach(line => {
			const trimmed = line.match(lineExp)[0];
			const [sysd, sited] = trimmed.split('=');
			obj[sited.replace(/[ \t]+/g, '')] = sysd.replace('SYSTEMDUT', '').trim();
		})
	if(Object.keys(obj).length === 0) {
		console.error('Please check socket file content');
		process.exit(1);
	}
	return obj;
}

```

The returned obj is a dictionary, the key is the site & dut, the value is system dut number.

For example if in socket file, it writes: SYSTEMDUT1 = SITE1 , DUT9 then parser() will return {["SITE1 , DUT9", 1]}

At last call (T5773 case): 

```tex
kdut --disable-all;
kdut --enable 1
```

Corresponding source code is:

```javascript
// enableDuts(sysd);
const getTesterModel = () => process.env['ATKEITMODEL'] || process.env['ATFSTMODEL'];
const getDutCmd = () => (getTesterModel() === 'T5773') ? 'ksdut' : 'fssdut';

function enableDuts(sysd) {
	const dutCmd = getDutCmd();
	const cmds = `${dutCmd} --disable-all; ${dutCmd} --enable ${sysd}`;
	execSync(cmds);
	console.log(cmds);
}
```

