"use strict";

var fs = require("fs");
var shell = require("gl-now")({ clearColor: [0,0,0,0] });
// var camera = require("game-shell-orbit-camera")(shell);
var glslify = require("glslify");

var gl;

// var glm = require("gl-matrix");
// var mat4 = glm.mat4;

var createFlatShader = glslify({
	vertex: "./lib/flatshader.vsh",
	fragment: "./lib/flatshader.fsh"
});

var flatshader;
var boxen = [];

var FRAME_WIDTH = 16;
var FRAME_HEIGHT = 20;

var loadRobot = function (gl) {
    var c=document.getElementById("robot");
    var ctx=c.getContext("2d");
    var robotImg = new Image();
    robotImg.onload = function () {
        var w = c.width,
            h = c.height;
        ctx.drawImage(this, 0, 0);
        var imgData = ctx.getImageData(0,0, w, h);
        var pix = imgData.data;

        for (var i = 0, n = pix.length; i < n; i += 4) {
            // ix is the pixel in question
            var ix = i/4;
            var y = Math.floor(ix/w);
            var img_x = ix - (y*w);
            var z = Math.floor(img_x/FRAME_WIDTH);
            var x = (ix - (y*w)) - z*FRAME_WIDTH;
            if (pix[i+3] > 0) {
                var box = new boxel(gl, x, y, z, pix[i], pix[i+1], pix[i+2], pix[i+3]);
                boxen.push(box);
            }
        }
        document.body.removeChild(c);
    };
    robotImg.src = "./img/js-robot-prototype.png";
}

shell.on("gl-init", function () {
	gl = shell.gl;
	// console.log(createFlatShader);
	// flatshader = createFlatShader(gl);

	// camera.lookAt([0,0,100], [0,0,0], [0,0,0]);
	initShaders();
	// box = new boxel(gl, 1,2,3,1,1,1,1);
    loadRobot(gl);

});

shell.on("gl-error", function () {

});

shell.on("gl-render", function () {
	var gl = shell.gl;
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, shell.width / shell.height, 0.1, 10000.0, pMatrix);

    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, [0.0, 0.0, -70.0]);

    mvPushMatrix();
    mat4.rotate(mvMatrix, 3.5, [1.0, 0.0, 0.0]);
    mat4.rotate(mvMatrix, degToRad(rCube), [0.0, -0.1, 0.0]);

    for (var p in boxen) {
        var box = boxen[p];
        gl.bindBuffer(gl.ARRAY_BUFFER, box.vPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, box.vPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, box.vColourBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, box.vColourBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, box.vIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, box.vIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    mvPopMatrix();
 	animate();
});
var lastTime = 0; 
function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        rCube -= (75 * elapsed) / 5000.0;
    }
    lastTime = timeNow;
}

var rCube = 0;

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}


function setMatrixUniforms() {
	var gl = shell.gl
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

var shaderProgram;

function initShaders() {
	var gl = shell.gl
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}