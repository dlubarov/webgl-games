// I'm using the default OpenGL coordinate system, where (-1, -1) is the bottom-left corner and (1, 1) is the top-right corner.

var WALL_COUNT = 30;
var MAX_WALL_LENGTH = 0.4;
var PLAYER_SIZE = 0.1;
var SPEED_WALKING = 0.01;
var SPEED_RUNNING = 0.02;

var KEY_SHIFT = 16;
var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;

var pressedKeys = {};

var canvas;
var gl;
var vertexPositionAttribute;
var position = [0, 0];
var walls = [];

window.addEventListener('load', init);

function init() {
  canvas = document.getElementById('canvas');
  gl = canvas.getContext("experimental-webgl");
  initWalls();
  initInput();
  initShaders();
  tick();
}

function initWalls() {
    var playerPolygon = getSquare(position, PLAYER_SIZE);
    for (var i = 0; i < WALL_COUNT; i += 1) {
        var start = subtractVectors(randomVector(2, 2), [1, 1]);
        var delta = subtractVectors(randomVector(MAX_WALL_LENGTH * 2, MAX_WALL_LENGTH * 2), [MAX_WALL_LENGTH, MAX_WALL_LENGTH]);
        var end = addVectors(start, delta);
        var wall = [start, end];
        if (!polygonsIntersect(playerPolygon, wall)) {
            walls.push(wall);
        }
    }
}

function initInput() {
    window.addEventListener("keydown", function(e) {
        pressedKeys[e.keyCode] = true;
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
    updatePosition();
    render();
    window.requestAnimationFrame(tick);
}

function updatePosition() {
    var velocity = getVelocity();
    var proposedPosition = addVectors(position, velocity);
    var intersectingWalls = getIntersectingWalls(proposedPosition);

    switch (intersectingWalls.length) {
        case 0:
            // We didn't bump into any walls.
            position = proposedPosition;
            break;
        case 1:
            // We bumped into a single wall and want to slide along it. To do so, we will remove the component of our velocity which is in the direction of the wall's normal. Our resulting velocity will be along the wall.
            var wall = intersectingWalls[0];
            var dx = wall[1][0] - wall[0][0], dy = wall[1][1] - wall[0][1];
            var wallNormal = normalizeVector([dy, -dx]);
            var velocityAlongWallNormal = scaleVector(wallNormal, dotProduct(velocity, wallNormal));
            velocity = subtractVectors(velocity, velocityAlongWallNormal);
            proposedPosition = addVectors(position, velocity);
            if (getIntersectingWalls(proposedPosition).length == 0) {
                position = proposedPosition;
            }
            break;
        default:
            // If we're colliding with multiple walls, it's reasonable (though perhaps not ideal) to not move the player at all.
    }
}

function getIntersectingWalls(proposedPosition) {
    var playerPolygon = getSquare(proposedPosition, PLAYER_SIZE);
    var intersectingWalls = [];
    for (var i = 0; i < walls.length; i += 1) {
        if (polygonsIntersect(playerPolygon, walls[i])) {
            intersectingWalls.push(walls[i]);
        }
    }
    return intersectingWalls;
}

function polygonsIntersect(a, b) {
    var n = a.length, m = b.length;
    for (var i = 0; i < n; i += 1) {
        for (var j = 0; j < m; j += 1) {
            if (linesIntersect(a[i], a[(i + 1) % n], b[j], b[(j + 1) % m])) {
                return true;
            }
        }
    }
    return false;
}

function linesIntersect(aStart, aEnd, bStart, bEnd) {
    var aDelta = subtractVectors(aEnd, aStart), bDelta = subtractVectors(bEnd, bStart);
    var aStartToBStart = subtractVectors(bStart, aStart);
    var t = crossProduct(aStartToBStart, bDelta) / crossProduct(aDelta, bDelta);
    var u = crossProduct(aStartToBStart, aDelta) / crossProduct(aDelta, bDelta);
    return 0 < t && t < 1 && 0 < u && u < 1;
}

function getVelocity() {
    var speed = KEY_SHIFT in pressedKeys ? SPEED_RUNNING : SPEED_WALKING;
    return scaleVector(getDirection(), speed);
}

function getDirection() {
    var direction = [0, 0];
    if (KEY_LEFT in pressedKeys) {
        direction = addVectors(direction, [-1, 0]);
    }
    if (KEY_UP in pressedKeys) {
        direction = addVectors(direction, [0, 1]);
    }
    if (KEY_RIGHT in pressedKeys) {
        direction = addVectors(direction, [1, 0]);
    }
    if (KEY_DOWN in pressedKeys) {
        direction = addVectors(direction, [0, -1]);
    }
    
    // Normalize the direction vector, so that you can't move faster by holding down multiple buttons.
    // Skip normalization if 'direction' is the zero vector, to avoid division by zero.
    if (vectorMagnitude(direction) > 0) {
        direction = scaleVector(direction, 1 / vectorMagnitude(direction));
    }
    
    return direction;
}

function render() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    renderWalls();
    renderPlayer();
}

function renderWalls() {
    for (var i = 0; i < walls.length; i += 1) {
        var wall = walls[i];
        renderLine(wall[0], wall[1]);
    }
}

function renderPlayer() {
    renderPolygon(getSquare(position, PLAYER_SIZE));
}

function renderPolygon(vertices) {
    var n = vertices.length;
    for (var i = 0; i < n; i += 1) {
        renderLine(vertices[i], vertices[(i + 1) % n]);
    }
}

function renderLine(a, b) {
    var vertices = [a[0], a[1], b[0], b[1]];
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, 2);
}

function getSquare(center, radius) {
    return [
        addVectors(center, [-radius, -radius]),
        addVectors(center, [-radius, radius]),
        addVectors(center, [radius, radius]),
        addVectors(center, [radius, -radius])
    ];
}

function randomVector(maxX, maxY) {
    return [Math.random() * maxX, Math.random() * maxY];
}

function vectorMagnitude(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
}

function normalizeVector(a) {
    return scaleVector(a, 1 / vectorMagnitude(a));
}

function addVectors(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
}

function subtractVectors(a, b) {
    return [a[0] - b[0], a[1] - b[1]];
}

function scaleVector(a, k) {
    return [a[0] * k, a[1] * k];
}

function dotProduct(a, b) {
    return a[0] * b[0] + a[1] * b[1];
}

// A "2D cross product" - the z component of the two vectors' 3D cross product, if the 2D vectors were treated as 3D vectors with z=0.
function crossProduct(a, b) {
    return a[0] * b[1] - a[1] * b[0];
}
