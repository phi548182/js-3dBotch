let canvas = document.getElementById('canvas');
/**@type {CanvasRenderingContext2D} */
let ctx = canvas.getContext('2d');

let canvasW = window.innerWidth;
let canvasH = window.innerHeight;
let centerx = canvasW / 2;
let centery = canvasH / 2;
canvas.width = canvasW;
canvas.height = canvasH;
ctx.translate(centerx, centery);

let mouse = {
    x: 0,
    y: 0
};

let keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    w: false,
    a: false,
    s: false,
    d: false
};

class Scene {
    constructor() {
        this.scene = {};
    }

    add(name, obj, type = 'object') {
        if (type == 'object') {
            this.scene[name] = obj;
        }
    }

    draw(aCam) {
        let vertices = [];
        let faces = [];
        for (let obj in this.scene) {
            for (let i = 0; i < this.scene[obj].vertices.length; i++) {
                vertices = vertices.concat(this.scene[obj].vertices[i]);
            }

            for (let i = 0; i < this.scene[obj].faces.length; i++) {
                faces = faces.concat(this.scene[obj].faces[i]);
            }
        }


        faces.sort((a, b) => {
            let distanceA = dotProduct(aCam, a.averagePoint, a.normal);
            let distanceB = dotProduct(aCam, b.averagePoint, b.normal);
            return distanceA - distanceB;
        });

        function shouldRenderFace(camera, averagePoint) {
            // calculate forward vector
            let forward = rotate(0, 0, -1, camera.rx, camera.ry, camera.rz);
            // calculate vector from camera to face
            let x = camera.x - averagePoint.x;
            let y = camera.y - averagePoint.y;
            let z = camera.z - averagePoint.z;
            // calculate dot product
            let dot = x * forward[0] + y * forward[1] + z * forward[2];
            return dot > 2;
        }

        for (let i = 0; i < vertices.length; i++) {
            vertices[i].draw(aCam);
        }

        for (let i = 0; i < faces.length; i++) {
            if (shouldRenderFace(aCam, faces[i].averagePoint, faces[i].normal)) {
                faces[i].draw();
            }
        }
    }
}

class Vertex {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.px = 0;
        this.py = 0;
    }
    draw(cam) {
        let point = project(this.x, this.y, this.z, cam.x, cam.y, cam.z, cam.rx, cam.ry, cam.rz, cam.fov * Math.PI / 180);
        this.px = point[0] * canvasW / (canvasW / canvasH);
        this.py = point[1] * canvasH;
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.px, this.py, 5, 5);
    }
    normalize() {
        let l = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        this.x = this.x / l;
        this.y = this.y / l;
        this.z = this.z / l;
    }
    subtract(other) {
        return new Vertex(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    cross(other) {
        let x = this.y * other.z - this.z * other.y;
        let y = this.z * other.x - this.x * other.z;
        let z = this.x * other.y - this.y * other.x;
        return new Vertex(x, y, z);
    }
}



class Face {
    constructor(vertices, color, normal) {
        this.vertices = vertices;
        this.normal = normal;
        this.color = color;

        let x = 0;
        let y = 0;
        let z = 0;
        for (let i = 0; i < vertices.length; i++) {
            x += vertices[i].x;
            y += vertices[i].y;
            z += vertices[i].z;
        }

        x /= vertices.length;
        y /= vertices.length;
        z /= vertices.length;

        this.averagePoint = { 'x': x, 'y': y, 'z': z };
    }
    draw() {
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].px, this.vertices[0].py);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].px, this.vertices[i].py);
        }
        ctx.lineTo(this.vertices[0].px, this.vertices[0].py);

        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Camera {
    constructor(x, y, z, rx, ry, rz, fov) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.rx = rx;
        this.ry = ry;
        this.rz = rz;
        this.fov = fov;
    }
}

class Cube {
    constructor(center, size) {
        let d = size / 2;

        this.vertices = [
            new Vertex(center.x - d, center.y - d, center.z + d), // 0
            new Vertex(center.x - d, center.y - d, center.z - d), // 1
            new Vertex(center.x + d, center.y - d, center.z - d), // 2
            new Vertex(center.x + d, center.y - d, center.z + d), // 3
            new Vertex(center.x + d, center.y + d, center.z + d), // 4
            new Vertex(center.x + d, center.y + d, center.z - d), // 5
            new Vertex(center.x - d, center.y + d, center.z - d), // 6
            new Vertex(center.x - d, center.y + d, center.z + d)  // 7
        ];

        // Generate the faces
        this.faces = [
            //        y-
            new Face([this.vertices[0], this.vertices[1], this.vertices[2], this.vertices[3]], "#000000".replace(/0/g, function () { return (~~(Math.random() * 16)).toString(16); }), [0, -1, 0]),
            //        x+
            new Face([this.vertices[3], this.vertices[2], this.vertices[5], this.vertices[4]], "#000000".replace(/0/g, function () { return (~~(Math.random() * 16)).toString(16); }), [1, 0, 0]),
            //        y+
            new Face([this.vertices[4], this.vertices[5], this.vertices[6], this.vertices[7]], "#000000".replace(/0/g, function () { return (~~(Math.random() * 16)).toString(16); }), [0, 1, 0]),
            //        x-
            new Face([this.vertices[7], this.vertices[6], this.vertices[1], this.vertices[0]], "#000000".replace(/0/g, function () { return (~~(Math.random() * 16)).toString(16); }), [-1, 0, 0]),
            //        z+
            new Face([this.vertices[7], this.vertices[0], this.vertices[3], this.vertices[4]], "#000000".replace(/0/g, function () { return (~~(Math.random() * 16)).toString(16); }), [0, 0, 1]),
            //        z-
            new Face([this.vertices[1], this.vertices[6], this.vertices[5], this.vertices[2]], "#000000".replace(/0/g, function () { return (~~(Math.random() * 16)).toString(16); }), [0, 0, -1])
        ];
    }
}

function project(x, y, z, cx1, cy1, cz1, rx, ry, rz, fov) {
    let a = {
        x: x,
        y: y,
        z: z
    };
    let c = {
        x: cx1,
        y: cy1,
        z: cz1
    };
    let theta = {
        x: rx * Math.PI / 180,
        y: ry * Math.PI / 180,
        z: rz * Math.PI / 180
    };
    let e = {
        x: 0,
        y: 0,
        z: 1 / Math.tan(fov / 2)
    };
    let b = {
        x: 0,
        y: 0
    };
    let d = {
        x: 0,
        y: 0,
        z: 0
    };

    function cx() {
        return Math.cos(theta.x);
    }
    function cy() {
        return Math.cos(theta.y);
    }
    function cz() {
        return Math.cos(theta.z);
    }

    function sx() {
        return Math.sin(theta.x);
    }
    function sy() {
        return Math.sin(theta.y);
    }
    function sz() {
        return Math.sin(theta.z);
    }


    let x1 = a.x - c.x;
    let y1 = a.y - c.y;
    let z1 = a.z - c.z;

    d.x = (cy() * ((sz() * y1) + (cz() * x1))) - (sy() * z1);
    d.y = (sx() * ((cy() * z1) + (sy() * ((sz() * y1) + (cz() * x1))))) + (cx() * ((cz() * y1) - (sz() * x1)));
    d.z = (cx() * ((cy() * z1) + (sy() * ((sz() * y1) + (cz() * x1))))) - (sx() * ((cz() * y1) - (sz() * x1)));

    b.x = ((e.z / d.z) * d.x) + e.x;
    b.y = ((e.z / d.z) * d.y) + e.y;
    return [b.x, b.y];

    // NEEDS FIXING UP
}

function rotate(x, y, z, rx, ry, rz) {
    // convert angles to radians
    rx = rx * Math.PI / 180;
    ry = ry * Math.PI / 180;
    rz = rz * Math.PI / 180;
    // create rotation matrices
    let xMatrix = [[1, 0, 0], [0, Math.cos(rx), -Math.sin(rx)], [0, Math.sin(rx), Math.cos(rx)]];
    let yMatrix = [[Math.cos(ry), 0, Math.sin(ry)], [0, 1, 0], [-Math.sin(ry), 0, Math.cos(ry)]];
    let zMatrix = [[Math.cos(rz), -Math.sin(rz), 0], [Math.sin(rz), Math.cos(rz), 0], [0, 0, 1]];
    // rotate vector
    let rotated = [
        xMatrix[0][0] * x + xMatrix[0][1] * y + xMatrix[0][2] * z,
        xMatrix[1][0] * x + xMatrix[1][1] * y + xMatrix[1][2] * z,
        xMatrix[2][0] * x + xMatrix[2][1] * y + xMatrix[2][2] * z
    ];
    rotated = [
        yMatrix[0][0] * rotated[0] + yMatrix[0][1] * rotated[1] + yMatrix[0][2] * rotated[2],
        yMatrix[1][0] * rotated[0] + yMatrix[1][1] * rotated[1] + yMatrix[1][2] * rotated[2],
        yMatrix[2][0] * rotated[0] + yMatrix[2][1] * rotated[1] + yMatrix[2][2] * rotated[2]
    ];
    rotated = [
        zMatrix[0][0] * rotated[0] + zMatrix[0][1] * rotated[1] + zMatrix[0][2] * rotated[2],
        zMatrix[1][0] * rotated[0] + zMatrix[1][1] * rotated[1] + zMatrix[1][2] * rotated[2],
        zMatrix[2][0] * rotated[0] + zMatrix[2][1] * rotated[1] + zMatrix[2][2] * rotated[2]
    ];

    return rotated;
}



// [
//     {
//         "x": -1,
//         "y": -1,
//         "z": 1,
//         "px": -315.34496341867333,
//         "py": -240.3852771821279
//     },
//     {
//         "x": -1,
//         "y": -1,
//         "z": -1,
//         "px": -119.23226849622573,
//         "py": -251.02316200588984
//     },
//     {
//         "x": 1,
//         "y": -1,
//         "z": -1,
//         "px": 111.42424893989772,
//         "py": -239.52945533419762
//     },
//     {
//         "x": 1,
//         "y": -1,
//         "z": 1,
//         "px": -87.22176640597264,
//         "py": -233.48622702675257
//     },
//     {
//         "x": 1,
//         "y": 1,
//         "z": 1,
//         "px": -80.84041018652029,
//         "py": -3.5580970985825116
//     },
//     {
//         "x": 1,
//         "y": 1,
//         "z": -1,
//         "px": 101.44981824892339,
//         "py": 42.33915659860702
//     },
//     {
//         "x": -1,
//         "y": 1,
//         "z": -1,
//         "px": -105.03378270592145,
//         "py": 125.30691878941079
//     },
//     {
//         "x": -1,
//         "y": 1,
//         "z": 1,
//         "px": -286.400327489602,
//         "py": 48.70835896577452
//     }
// ]

function dotProduct(camera, averagePoint, normal) {
    let x = camera.x - averagePoint.x;
    let y = camera.y - averagePoint.y;
    let z = camera.z - averagePoint.z;
    let dot = x * normal[0] + y * normal[1] + z * normal[2];
    return dot;
}


function UnitCircle(angle) {
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    return [x, y];
}

let camera = new Camera(0, 0, 0, 0, 0, 0, 100);
let cube = new Cube(new Vertex(0, 0, 10), 2);

let scene = new Scene();

scene.add('cube', cube);


function frame() {
    requestAnimationFrame(frame);

    ctx.fillStyle = 'black';
    ctx.fillRect(-10000, -10000, 100000, 100000);
    scene.draw(camera);
}


setInterval(() => {
    if (keys.w) {
        camera.z += UnitCircle(camera.ry * Math.PI / 180)[0] / 10;
        camera.x += UnitCircle(camera.ry * Math.PI / 180)[1] / 10;
    }
    if (keys.a) {
        camera.x -= UnitCircle(camera.ry * Math.PI / 180)[0] / 10;
        camera.z += UnitCircle(camera.ry * Math.PI / 180)[1] / 10;
    }
    if (keys.s) {
        camera.z -= UnitCircle(camera.ry * Math.PI / 180)[0] / 10;
        camera.x -= UnitCircle(camera.ry * Math.PI / 180)[1] / 10;
    }
    if (keys.d) {
        camera.x += UnitCircle(camera.ry * Math.PI / 180)[0] / 10;
        camera.z -= UnitCircle(camera.ry * Math.PI / 180)[1] / 10;
    }
    if (keys.ArrowUp) { camera.y -= 0.1; }
    if (keys.ArrowDown) { camera.y += 0.1; }

    camera.ry += mouse.x / 3;
    camera.rx -= mouse.y / 3;

    if (camera.rx > 90) { camera.rx = 90; } else if (camera.rx < -90) { camera.rx = -90; }

    mouse.x = 0;
    mouse.y = 0;
}, 5);


frame();

window.onkeydown = (e) => {
    document.body.requestPointerLock();
    let key = e.key;
    if (key == ' ') {
        keys.ArrowUp = true;
    }
    if (key == 'Shift') {
        keys.ArrowDown = true;
    }
    if (key == 'ArrowLeft') {
        keys.ArrowLeft = true;
    }
    if (key == 'ArrowRight') {
        keys.ArrowRight = true;
    }
    if (key == 'w' || key == 'W') {
        keys.w = true;
    }
    if (key == 'a' || key == 'A') {
        keys.a = true;
    }
    if (key == 's' || key == 'S') {
        keys.s = true;
    }
    if (key == 'd' || key == 'D') {
        keys.d = true;
    }
};
window.onkeyup = (e) => {
    let key = e.key;
    if (key == ' ') {
        keys.ArrowUp = false;
    }
    if (key == 'Shift') {
        keys.ArrowDown = false;
    }
    if (key == 'ArrowLeft') {
        keys.ArrowLeft = false;
    }
    if (key == 'ArrowRight') {
        keys.ArrowRight = false;
    }
    if (key == 'w' || key == 'W') {
        keys.w = false;
    }
    if (key == 'a' || key == 'A') {
        keys.a = false;
    }
    if (key == 's' || key == 'S') {
        keys.s = false;
    }
    if (key == 'd' || key == 'D') {
        keys.d = false;
    }
};
document.body.onmousemove = (e) => {
    mouse.x = e.movementX;
    mouse.y = e.movementY;
};