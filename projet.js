/******************************************* Tools functions *******************************************/

function loadText(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.overrideMimeType("text/plain");
    xhr.send(null);
    if (xhr.status === 200)
        return xhr.responseText;
    else {
        return null;
    }
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : null;
}

function degreeToRadians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}

/******************************************* Global variables *******************************************/

var canvas, gl, program;
var attribPos, attribColor; //attribute position
var cubePositions = [],
    colors = [],
    indices = [];
var buffer, bufferColor, indexBuffer;
var projection = mat4.create();
var modele = mat4.create();
var transform = mat4.create();
var zoomVal = 1,
    FOVVal = 30,
    rxVal = 0,
    ryVal = 0,
    rzVal = 0,
    txVal = 0,
    tyVal = 0,
    tzVal = 0;
var zoomSlider, FOVSlider;
var rxSlider, rySlider, rzSlider;
var txSlider, tySlider, tzSlider;
var colorPickers;
var colorsTab = [{
        r: 0.4,
        g: 0.7,
        b: 0.8
    },
    {
        r: 1.0,
        g: 0.0,
        b: 0.0
    },
    {
        r: 0.0,
        g: 1.0,
        b: 0.0
    },
    {
        r: 0.0,
        g: 0.0,
        b: 1.0
    },
    {
        r: 1.0,
        g: 1.0,
        b: 0.0
    },
    {
        r: 1.0,
        g: 0.0,
        b: 1.0
    }
];

/******************************************* Settings functions *******************************************/

function updateSliderText(id, value) {
    document.getElementById(id).textContent = value;
}

function resetInput(id) {
    let input = document.getElementById(id);
    input.value = input.defaultValue;
    window[id + "Val"] = input.value;
    reCalculTransformMatrix();
    updateSliderText(id + "Value", input.value);
}

function resetSettings() {

    zoomVal = 1;
    rxVal = 0;
    ryVal = 0;
    rzVal = 0;
    txVal = 0;
    tyVal = 0;
    tzVal = 0;
    mat4.translate(modele, mat4.create(), [-0.0, 0.0, -10.0]);
    updateSliderText("txValue", 0);
    updateSliderText("tzValue", 0);
    updateSliderText("tyValue", 0);
    updateSliderText("rxValue", 0);
    updateSliderText("ryValue", 0);
    updateSliderText("rzValue", 0);
    updateSliderText("zoomValue", 1);
    updateSliderText("FOVValue", 30);
    transform = mat4.create();
    document.getElementById('settingsForm').reset();
}

function watchColorPicker(event) {
    let position = this.getAttribute("colorPosition");
    colorsTab[position - 1] = hexToRgb(event.target.value);
    refreshColors(true);
}

function reCalculTransformMatrix() {
    // reset for zoom
    mat4.translate(modele, mat4.create(), [-0.0, 0.0, -10.0]);
    // Zoom
    mat4.scale(modele, modele, [zoomVal, zoomVal, 1]);

    // FOV
    mat4.perspective(projection, degreeToRadians(FOVVal), 1, 0.1, 1000);

    // Translate and rotate
    transform = mat4.create();
    mat4.translate(transform, transform, [txVal, tyVal, tzVal]);
    mat4.rotateX(transform, transform, rxVal);
    mat4.rotateY(transform, transform, ryVal);
    mat4.rotateZ(transform, transform, rzVal);
}

/******************************************* Initialisation *******************************************/

function initContext() {
    canvas = document.getElementById('dawin-webgl');

    zoomSlider = document.getElementById('zoom');
    FOVSlider = document.getElementById('FOV');

    txSlider = document.getElementById('tx');
    tySlider = document.getElementById('ty');
    tzSlider = document.getElementById('tz');

    rxSlider = document.getElementById('rx');
    rySlider = document.getElementById('ry');
    rzSlider = document.getElementById('rz');

    colorPickers = document.querySelectorAll('.color');

    gl = canvas.getContext('webgl');
    if (!gl) {
        console.log('ERREUR : echec chargement du contexte');
        return;
    }
    gl.clearColor(1, 1, 1, 1.0);
}

//Initialisation des shaders et du program
function initShaders() {
    var fragmentSource = loadText('fragment.glsl');
    var vertexSource = loadText('vertex.glsl');

    var fragment = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragment, fragmentSource);
    gl.compileShader(fragment);

    var vertex = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertex, vertexSource);
    gl.compileShader(vertex);

    gl.getShaderParameter(fragment, gl.COMPILE_STATUS);
    gl.getShaderParameter(vertex, gl.COMPILE_STATUS);

    if (!gl.getShaderParameter(fragment, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(fragment));
    }

    if (!gl.getShaderParameter(vertex, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(vertex));
    }

    program = gl.createProgram();
    gl.attachShader(program, fragment);
    gl.attachShader(program, vertex);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Could not initialise shaders");
    }
    gl.useProgram(program);
}

function initEvents() {

    /********************************* ZOOM ********************************/
    zoomSlider.oninput = function () {
        zoomVal = this.value;
        reCalculTransformMatrix();
        updateSliderText("zoomValue", zoomVal);
    }
    /********************************** FOV ********************************/
    FOVSlider.oninput = function () {
        FOVVal = this.value;
        reCalculTransformMatrix();
        updateSliderText("FOVValue", this.value);
    }
    /******************************** Translate ****************************/
    txSlider.oninput = function () {
        txVal = this.value;
        reCalculTransformMatrix();
        updateSliderText("txValue", this.value);
    }
    tySlider.oninput = function () {
        tyVal = this.value;
        reCalculTransformMatrix();
        updateSliderText("tyValue", this.value);
    }
    tzSlider.oninput = function () {
        tzVal = this.value;
        reCalculTransformMatrix();
        updateSliderText("tzValue", this.value);
    }

    /******************************** Rotate ********************************/
    rxSlider.oninput = function () {
        rxVal = this.value;
        reCalculTransformMatrix();
        updateSliderText("rxValue", this.value);

    }
    rySlider.oninput = function () {
        ryVal = this.value;
        reCalculTransformMatrix();

        updateSliderText("ryValue", this.value);
    }
    rzSlider.oninput = function () {
        rzVal = this.value;
        reCalculTransformMatrix();

        updateSliderText("rzValue", this.value);
    }

    /******************************** Colors ********************************/
    colorPickers.forEach((element, index, array) => {
        element.addEventListener("input", watchColorPicker, false);
    });
}

function initAttributes() {

    // Modele matrix
    mat4.translate(modele, modele, [-0.0, 0.0, -10.0]);

    // Projection matrix
    mat4.perspective(projection, degreeToRadians(30), 1, 0.1, 1000);

    /************************* CUBE *************************/
    cubePositions = [
        // Face avant
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

        // Face arrière
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        // Face supérieure
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // Face inférieure
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        // Face droite
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        // Face gauche
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0
    ];

    indices = [
        0, 1, 2, 0, 2, 3, // front
        4, 5, 6, 4, 6, 7, // back
        8, 9, 10, 8, 10, 11, // top
        12, 13, 14, 12, 14, 15, // bottom
        16, 17, 18, 16, 18, 19, // right
        20, 21, 22, 20, 22, 23, // left
    ];

    refreshColors(false);
}

function initBuffers() {
    attribPos = gl.getAttribLocation(program, "position");
    attribColor = gl.getAttribLocation(program, "color");

    bufferColor = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferColor);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(attribColor);
    gl.vertexAttribPointer(attribColor, 4, gl.FLOAT, true, 0, 0);

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubePositions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(attribPos);
    gl.vertexAttribPointer(attribPos, 3, gl.FLOAT, true, 0, 0);

    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
}

/******************************************* Refresh functions *******************************************/

function refreshColors(refreshBuffersBool) {
    colors = [];

    const faceColors = [
        [colorsTab[0].r, colorsTab[0].g, colorsTab[0].b, 1.0], // Front face: white
        [colorsTab[1].r, colorsTab[1].g, colorsTab[1].b, 1.0], // Back face: red
        [colorsTab[2].r, colorsTab[2].g, colorsTab[2].b, 1.0], // Top face: green
        [colorsTab[3].r, colorsTab[3].g, colorsTab[3].b, 1.0], // Bottom face: blue
        [colorsTab[4].r, colorsTab[4].g, colorsTab[4].b, 1.0], // Right face: yellow
        [colorsTab[5].r, colorsTab[5].g, colorsTab[5].b, 1.0], // Left face: purple
    ];

    for (var j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        // Repeat each color four times for the four vertices of the face
        colors = colors.concat(c, c, c, c);
    }

    if (refreshBuffersBool)
        refreshBuffers();
}

function refreshBuffers() {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubePositions), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferColor);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
}

/******************************************* Draw *******************************************/
function draw() {

    var attrProjection = gl.getUniformLocation(program, "projection");
    var attrModele = gl.getUniformLocation(program, "modele");
    var attrTransform = gl.getUniformLocation(program, "transform");
    gl.uniformMatrix4fv(attrProjection, false, projection);
    gl.uniformMatrix4fv(attrModele, false, modele);
    gl.uniformMatrix4fv(attrTransform, false, transform);

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // dessin du cubes (en utilsant des triangles)
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

    // for animation
    requestAnimationFrame(draw);
}

function main() {
    initContext();
    initShaders();
    initAttributes();
    initBuffers();
    initEvents();
    requestAnimationFrame(draw);
}