//constants section

var traverseTime=40; //seconds
var smoothFrames=true;
var postX = 300;
var gapX = 30;
var pathForPics = "/cgi-bin/getPic.sh";
var maxQueue = 10;

var canvas = null;
var ctx = null;
var canW = null;
var canH = null;
var startX = null;
var lastRun = null;
var dx = null;
var approxH = null;

var arrObjs=[];

var imgQueue=[];
var imgLoading = null;
var imgQueueFull = null;

function getMoreFrames() {
	if (imgQueue.length < 2) {
		return;
	}
	var rnd = Math.floor((Math.random() * 10) + 1);
	var x,y,w,h;
	var ratio = null;

	//we can have either 1 larger, or 2 smaller next to each-other
	if (rnd % 2 === 0) { //one larger img
		generatePlaceholder(1);
	} else {
		generatePlaceholder(2);
		generatePlaceholder(3);
	}

}

function imageLoaded() {
	var img = this;
	imgLoading--;	
	imgQueue.push(img);
	
	if (!imgQueueFull) {
		updateProgressDialog();
	}
	if (!imgQueueFull && imgQueue.length === maxQueue) {
		imgQueueFull = true;
		closeProgressDialog();
	}
}

function downloadImage() {
	if (imgQueue.length + imgLoading < maxQueue) {
		var downloadingImage = new Image();
		downloadingImage.onload = imageLoaded;
		var noCache = Math.floor((Math.random() * 100000000)) % 9999999;
		imgLoading++;
		downloadingImage.src = pathForPics+"?"+approxH+":"+noCache;
	}
}

function startWall() {
	canvas = document.getElementById("myCanvas");
	ctx = canvas.getContext('2d');

	canvas.width  = window.innerWidth;
  	canvas.height = window.innerHeight;
	ctx.fillStyle = 'rgba(0,0,0,1)';

	canW = canvas.width;
	canH = canvas.height;
	startX = canW + postX;
	dx = (canW + 0.0) / (traverseTime * 1000);
	approxH = Math.floor(4 * canH / 5 + 10);
	imgLoading = 0;
	imgQueueFull = false;
	downloadImage();
	
//	getMoreFrames();
	
	window.requestAnimationFrame(runner);
}

function runner(timestamp) {
	window.requestAnimationFrame(runner);
	if (!imgQueueFull) {
		downloadImage();
		openProgressDialog();
		return; //Do nothing till the buffer is full;
	}
	if (lastRun) {
		var delta = timestamp - lastRun;
		if (delta < 30 && !smoothFrames) {
			return; //we don't need this more often than 1000 / 30 = 33fps
		}
		drawer(delta);
		//console.log(delta);
	} 
	lastRun = timestamp;
}

function drawer(delta) {
	var aObj = null;
	var last = arrObjs.length;
	if (isFreeRoomForNewFrame()) {
		getMoreFrames();
	}
	if (last === 0) {
		return;
	}
	for (var i=0;i<last;i++) {
		aObj = arrObjs[i];
//		ctx.clearRect(aObj.x-1,aObj.y-1,aObj.w+2,aObj.h+2); // clear old position
		ctx.clearRect(aObj.x - 1 - delta*dx + aObj.w ,aObj.y-1,delta*dx+6,aObj.h+6); // clear old position
		var newX = aObj.x - delta*dx;
		aObj.x = newX;
		ctx.shadowOffsetX = 4;
  		ctx.shadowOffsetY = 4;
  		ctx.shadowColor = 'DimGray';
		ctx.drawImage(aObj.i,aObj.x,aObj.y,aObj.w,aObj.h);
	}
	removeFrames();
}

function isFreeRoomForNewFrame() {
	var aObj = null;
	var arrObjsSize = arrObjs.length;
	var val = null;
	if (arrObjsSize === 0) {
		return true;
	} else if (arrObjsSize === 1) {
		aObj = arrObjs[0];
		val = aObj.x + aObj.w + gapX;
	} else {
		aObj = arrObjs[arrObjsSize-1];
		var val1 = aObj.x + aObj.w + gapX;
		aObj = arrObjs[arrObjsSize-2];
		var val2 = aObj.x + aObj.w + gapX;
		val = Math.max(val1, val2);
	}
	if (val < startX) {
		return true;
	} else {
		return false;
	}
}

function removeFrames() {
	if (arrObjs.length === 0) {
		return;
	}
	var aObj = arrObjs[0];
	if (aObj.x + aObj.w < -2) {
		arrObjs.splice(0, 1);
		removeFrames();
	}
}
 
function generatePlaceholder(type) {
	var x,y,w,h,absH,absW,dW;
	var img = imgQueue[0];
	imgQueue.splice(0, 1);
	downloadImage();
	var ratio = img.width / img.height;
	var smallerRate = Math.floor((Math.random() * 10));
	if (type === 1) {
		h = 4 * canH / 5;
		y = canH / 10;
	} else if (type === 2) {
		h = canH * 2 / 5;
		y = canH / 15;
	} else {
		h = canH * 2 / 5;
		y = canH * 8 / 15;
	}
	absH = h;
	absW = absH * ratio;
	h = h - smallerRate * h / 100; //yup, it might be also slightly smaller; Otherwise it would be boring :)
	w = h * ratio;
	dW = absW - w;
	dW = dW / 2;
	x = startX + dW;
	var aObj = {};
	aObj.x = x;
	aObj.y = y;
	aObj.w = w;
	aObj.h = h;
	aObj.i = img;
	arrObjs.push(aObj);
}

function openProgressDialog() {
 	var progressDialog = document.getElementById('progressDialog');
 	if (progressDialog && progressDialog.open === undefined) {
 		progressDialog.style="display:none";
 		return;
 	}
 	if (progressDialog && !progressDialog.open) {
 		progressDialog.showModal();
 	}
}

function closeProgressDialog() {
 	var progressDialog = document.getElementById('progressDialog');
 	if (progressDialog && progressDialog.open) {
 		progressDialog.close();
 	}
}

function updateProgressDialog() {
 	var progressDialog = document.getElementById('progressDialog');
 	if (progressDialog && progressDialog.open) {
 		var progressBar = document.getElementById('progressBar');
 		progressBar.value = imgQueue.length;
 	}
}

