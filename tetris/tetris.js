// I'm using the default OpenGL coordinate system, where (-1, -1) is the bottom-left corner and (1, 1) is the top-right corner.

var BOARD_WIDTH = 12;
var BOARD_HEIGHT = 24;

var KEY_CODES = {
  SHIFT: 16,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
}

var pressedKeys = {};

var canvas;
var gl;
var vertexPositionAttribute;

var board;

var TETRIMINOS = {
  I: {
    color: [1, 0, 0],
    bits: [[-1, 0], [0, 0], [1, 0], [2, 0]]
  },
  J: {
    color: [1, 0, 0],
    bits: [[-1, 0], [0, 0], [1, 0], [2, 0]]
  },
  L: {
    color: [1, 0, 0],
    bits: [[-1, 0], [0, 0], [1, 0], [2, 0]]
  },
  O: {
    color: [1, 0, 0],
    bits: [[-1, 0], [0, 0], [1, 0], [2, 0]]
  },
  S: {
    color: [1, 0, 0],
    bits: [[-1, 0], [0, 0], [1, 0], [2, 0]]
  },
  T: {
    color: [1, 0, 0],
    bits: [[-1, 0], [0, 0], [1, 0], [2, 0]]
  },
  Z: {
    color: [1, 0, 0],
    bits: [[-1, 0], [0, 0], [1, 0], [2, 0]]
  }
};

var TETRIMINO_LIST = Object.keys(TETRIMINOS);

function initBoard() {
  board = [];
  for (var y = 0; y < BOARD_HEIGHT; y += 1) {
    var row = []
    for (var x = 0; x < BOARD_WIDTH; x += 1) {
      row.push(null);
    }
    g.push(row);
  }
}

var currentPiece = {
  type: randomPiece(),
  position: [BOARD_WIDTH / 2, 0],
  rotation: 0,
}

window.addEventListener('load', init);

function randomPiece() {
  TETRIMINO_LIST[Math.floor(Math.random() * TETRIMINO_LIST.length)];
}

function init() {
  canvas = document.getElementById('canvas');
  gl = canvas.getContext("experimental-webgl");
  initBoard();
  initInput();
  initShaders();
  tick();
}

function initInput() {
  window.addEventListener("keydown", function(e) {
    pressedKeys[e.keyCode] = true;

    if (e.keyCode == KEY_CODES.SPACE) {
    }
  });

  window.addEventListener("keyup", function(e) {
    delete pressedKeys[e.keyCode];
  });
}

function initShaders() {
  var vsCode = document.querySelector("#shader-vs").textContent;
  var vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vsCode);
  gl.compileShader(vs);

  var fsCode = document.querySelector("#shader-fs").textContent;
  var fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fsCode);
  gl.compileShader(fs);

  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }
  gl.useProgram(program);
  
  vertexPositionAttribute = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(program.vertexPositionAttribute);
}

function tick() {
  physics();
  render();
  window.requestAnimationFrame(tick);
}

function physics() {
  if (KEY_CODES.DOWN in pressedKeys) {
    ;
  }
}

function render() {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
}
