import {
  X,
  Y,
  Z,
  vec,
  vec_subtract,
  vec_unit,
  vec_cross,
  vec_dot,
  vec_copy,
  vec_length,
  _vec_multiply,
  _vec_add,
  _vec_subtract,
  _vec_3drotateX,
  _vec_3drotateY,
  _vec_3drotateZ
} from './math';
import { make_heap, heap_add, heap_depth_first } from './heap';

let canvas = document.querySelector('canvas');
let size = [800, 700];
canvas.width = size[0] * 2;
canvas.height = size[1] * 2;
// canvas.style.width = size[0] + 'px';
// canvas.style.height = size[1] + 'px';
let ctx = canvas.getContext('2d');
ctx.scale(2, 2);

let camera = vec(0, 0, -1);
let frustum = make_frustum(60.0, size[0] / size[1], 1.0, 1000.0);
let currentColor = 'red';

let codeString = `(define (shift* f) (let* ((parent-denv (vector-ref *meta-continuation* 2)) (curr-denv (current-dynamic-env)) (diff-denv (dynamic-env-sub curr-denv parent-denv))) (let ((v (call/cc (lambda (k) (abort-env* (lambda () (f (lambda (v) (reset (k v)))))))))) (current-dynamic-env-set! (dynamic-env-add diff-denv (vector-ref *meta-continuation* 2))) v))) (define (reset* thunk) (let ((mc *meta-continuation*) (denv (current-dynamic-env))) (continuation-capture (lambda (k-pure) (current-dynamic-wind-set! ##initial-dynwind) (abort-pure* ((call/cc (lambda (k) (set! *meta-continuation* (make-vector-values (lambda (v) (set! *meta-continuation* mc) (current-dynamic-env-set! denv) (##continuation-return-no-winding k-pure v)) k denv)) thunk))))))))`;

function getCodeIndex(i) {
  // Walk forwards until it's not pointing to a space
  while (codeString[i] === ' ') {
    i++;
  }
  return i;
}

let meshes = [
  // lines
  {
    yaw: 0,
    pitch: Math.PI / 2,
    translate: vec(0, 0, 100),
    scale: vec(7, 7, 7),
    color: '#00ff00',
    data: [
      [[1.490947, 2.589018, 4.14739], [1.490947, 2.570464, -0.952927]],
      [[0.82669, 0.939331, 3.573287], [0.82669, 0.913141, -2.007562]],
      [[1.987827, -0.359111, 5.698228], [1.987827, -0.405375, -4.160209]]
    ]
  },

  // computer
  {
    yaw: 0,
    pitch: Math.PI / 4,
    translate: vec(0, 0, 100),
    scale: vec(7, 7, 7),
    color: '#FF9B9B',
    data: [
      [[4.146833, -2.017568, 3.361326], [-0.369471, -2.052729, 3.361326]],
      [[-0.369471, -2.052729, 3.361326], [-0.369471, -2.052729, -2.481019]],
      [[-0.369471, -2.052729, -2.481019], [4.146832, -2.017568, -2.481019]],
      [[4.146832, -2.017568, -2.481019], [4.146833, -2.017568, 3.361326]],
      [[-0.378355, -2.046666, 3.320174], [-2.182173, 2.093923, 3.320174]],
      [[-2.182173, 2.093923, 3.320174], [-2.182173, 2.093923, -2.522171]],
      [[-2.182173, 2.093923, -2.522171], [-0.378356, -2.046666, -2.522171]],
      [[-0.378356, -2.046666, -2.522171], [-0.378355, -2.046666, 3.320174]],
      [[0.080366, -0.902821, 2.749107], [-1.056806, 1.70751, 2.749107]],
      [[-1.056806, 1.70751, 2.749107], [-1.056806, 1.70751, -2.03474]],
      [[-1.056806, 1.70751, -2.03474], [0.080366, -0.902821, -2.03474]],
      [[0.080366, -0.902821, -2.03474], [0.080366, -0.902821, 2.749107]]
    ]
  },
  // curve
  {
    yaw: 0,
    pitch: Math.PI / 4,
    translate: vec(0, 0, 100),
    scale: vec(0, 0, 0),
    color: '#f0a0f0',
    data: [
      [[0, -3.733048, 2.712219], [0, -1.425897, 4.388462]],
      [[0, -1.425897, 4.388462], [0, 1.425898, 4.388462]],
      [[0, 1.425898, 4.388462], [0, 3.733049, 2.712218]],
      [[-1.917828, -3.733048, 1.917828], [-3.103111, -1.425897, 3.103111]],
      [[-3.103111, -1.425897, 3.103111], [-3.103111, 1.425898, 3.103111]],
      [[-3.103111, 1.425898, 3.103111], [-1.917828, 3.733049, 1.917828]],
      [[0, 3.733049, 2.712218], [-1.917828, 3.733049, 1.917828]],
      [[-3.103111, 1.425898, 3.103111], [0, 1.425898, 4.388462]],
      [[0, -1.425897, 4.388462], [-3.103111, -1.425897, 3.103111]],
      [[-1.917828, -3.733048, 1.917828], [0, -3.733048, 2.712219]],
      [[-2.712219, -3.733048, 0], [-4.388463, -1.425897, 0]],
      [[-4.388463, -1.425897, 0], [-4.388462, 1.425898, 0]],
      [[-4.388462, 1.425898, 0], [-2.712219, 3.733049, 0]],
      [[-2.712219, 3.733049, 0], [0, 4.614302, 0]],
      [[-2.712219, 3.733049, 0], [-1.917828, 3.733049, 1.917828]],
      [[-3.103111, 1.425898, 3.103111], [-4.388462, 1.425898, 0]],
      [[-4.388463, -1.425897, 0], [-3.103111, -1.425897, 3.103111]],
      [[-1.917828, -3.733048, 1.917828], [-2.712219, -3.733048, 0]],
      [[-1.917828, -3.733048, -1.917829], [-3.103111, -1.425897, -3.103112]],
      [[-3.103111, -1.425897, -3.103112], [-3.103111, 1.425898, -3.103111]],
      [[-3.103111, 1.425898, -3.103111], [-1.917828, 3.733049, -1.917828]],
      [[-1.917828, 3.733049, -1.917828], [-2.712219, 3.733049, 0]],
      [[-4.388462, 1.425898, 0], [-3.103111, 1.425898, -3.103111]],
      [[-3.103111, -1.425897, -3.103112], [-4.388463, -1.425897, 0]],
      [[-2.712219, -3.733048, 0], [-1.917828, -3.733048, -1.917829]],
      [[0, -3.733048, -2.712219], [0, -1.425897, -4.388462]],
      [[0, -1.425897, -4.388462], [0, 1.425898, -4.388462]],
      [[0, 1.425898, -4.388462], [0, 3.733049, -2.712219]],
      [[0, 3.733049, -2.712219], [-1.917828, 3.733049, -1.917828]],
      [[-3.103111, 1.425898, -3.103111], [0, 1.425898, -4.388462]],
      [[0, -1.425897, -4.388462], [-3.103111, -1.425897, -3.103112]],
      [[-1.917828, -3.733048, -1.917829], [0, -3.733048, -2.712219]],
      [[0, -4.614302, -0.000001], [1.917828, -3.733048, -1.917829]],
      [[1.917828, -3.733048, -1.917829], [3.103111, -1.425897, -3.103111]],
      [[3.103111, -1.425897, -3.103111], [3.103111, 1.425898, -3.103111]],
      [[3.103111, 1.425898, -3.103111], [1.917828, 3.733049, -1.917828]],
      [[1.917828, 3.733049, -1.917828], [0, 3.733049, -2.712219]],
      [[0, 1.425898, -4.388462], [3.103111, 1.425898, -3.103111]],
      [[3.103111, -1.425897, -3.103111], [0, -1.425897, -4.388462]],
      [[0, -3.733048, -2.712219], [1.917828, -3.733048, -1.917829]],
      [[2.712219, -3.733048, 0], [4.388462, -1.425897, 0]],
      [[4.388462, -1.425897, 0], [4.388462, 1.425898, 0]],
      [[4.388462, 1.425898, 0], [2.712218, 3.733049, 0]],
      [[2.712218, 3.733049, 0], [1.917828, 3.733049, -1.917828]],
      [[3.103111, 1.425898, -3.103111], [4.388462, 1.425898, 0]],
      [[4.388462, -1.425897, 0], [3.103111, -1.425897, -3.103111]],
      [[1.917828, -3.733048, -1.917829], [2.712219, -3.733048, 0]],
      [[1.917828, -3.733048, 1.917828], [3.103111, -1.425897, 3.103111]],
      [[3.103111, -1.425897, 3.103111], [3.103111, 1.425898, 3.103111]],
      [[3.103111, 1.425898, 3.103111], [1.917828, 3.733049, 1.917827]],
      [[1.917828, 3.733049, 1.917827], [2.712218, 3.733049, 0]],
      [[4.388462, 1.425898, 0], [3.103111, 1.425898, 3.103111]],
      [[3.103111, -1.425897, 3.103111], [4.388462, -1.425897, 0]],
      [[2.712219, -3.733048, 0], [1.917828, -3.733048, 1.917828]],
      [[0, -4.614302, -0.000001], [0, -3.733048, 2.712219]],
      [[0, 3.733049, 2.712218], [0, 4.614302, 0]],
      [[0, -4.614302, -0.000001], [-1.917828, -3.733048, 1.917828]],
      [[-1.917828, 3.733049, 1.917828], [0, 4.614302, 0]],
      [[0, -4.614302, -0.000001], [-2.712219, -3.733048, 0]],
      [[0, -4.614302, -0.000001], [-1.917828, -3.733048, -1.917829]],
      [[-1.917828, 3.733049, -1.917828], [0, 4.614302, 0]],
      [[0, -4.614302, -0.000001], [0, -3.733048, -2.712219]],
      [[0, 3.733049, -2.712219], [0, 4.614302, 0]],
      [[1.917828, 3.733049, -1.917828], [0, 4.614302, 0]],
      [[0, -4.614302, -0.000001], [2.712219, -3.733048, 0]],
      [[2.712218, 3.733049, 0], [0, 4.614302, 0]],
      [[0, -4.614302, -0.000001], [1.917828, -3.733048, 1.917828]],
      [[1.917828, 3.733049, 1.917827], [0, 4.614302, 0]],
      [[0, 3.733049, 2.712218], [1.917828, 3.733049, 1.917827]],
      [[3.103111, 1.425898, 3.103111], [0, 1.425898, 4.388462]],
      [[0, -1.425897, 4.388462], [3.103111, -1.425897, 3.103111]],
      [[1.917828, -3.733048, 1.917828], [0, -3.733048, 2.712219]]
    ]
  }
];

let explodeStarted = null;
let explodeEnded = null;
let touchArea = document.querySelector('.demo-touch-area');

function startExplode(e) {
  explodeStarted = Date.now();
  explodeEnded = null;

  let curves = meshes[2];
  if (curves.opacity === 0) {
    curves.scale = [0, 0, 0];
  }

  meshes.forEach(mesh => {
    mesh.originalScale = mesh.scale;
    mesh.originalOpacity = mesh.opacity;
  });
}

function stopExplode() {
  explodeStarted = null;
  explodeEnded = Date.now();
  meshes.forEach(mesh => {
    mesh.originalScale = mesh.scale;
    mesh.originalOpacity = mesh.opacity;
  });
}

touchArea.addEventListener('mouseenter', startExplode);
touchArea.addEventListener('mouseleave', stopExplode);
touchArea.addEventListener('touchstart', startExplode);

// Newer iOS phones have sucky tendency to bring up a bottom tab bar
// but still think that 100vh means you want to go underneath it. This
// is stupid. window.innerHeight is correct so set it to that, and we
// have to do it a little in the future because it's racy.
if (window.innerWidth < 500) {
  setTimeout(() => {
    document.querySelector('.demo-full-screen').style.height =
      window.innerHeight + 'px';
  }, 100);
}

let resumeTimeout;
let animationFrame;
window.addEventListener('resize', () => {
  clearTimeout(resumeTimeout);
  cancelAnimationFrame(animationFrame);

  resumeTimeout = setTimeout(() => {
    let width = window.innerWidth;
    let ratio = Math.min(width, size[0]) / size[0];

    frame(0, 0, ctx);
  }, 250);
});

frame(0, 0, ctx);

function make_frustum(fovy, aspect, znear, zfar) {
  var range = znear * Math.tan((fovy * Math.PI) / 360.0);

  return {
    xmax: range,
    xmin: -range,
    ymax: range / aspect,
    ymin: -range / aspect,
    znear: znear,
    zfar: zfar
  };
}

function project2d(points, frustum) {
  function proj(point, frustum) {
    var x = point[X] / point[Z];
    var y = point[Y] / point[Z];

    x = (frustum.xmax - x) / (frustum.xmax - frustum.xmin);
    y = (frustum.ymax - y) / (frustum.ymax - frustum.ymin);

    return vec(x * size[0], y * size[1]);
  }

  return [proj(points[0], frustum), proj(points[1], frustum)];
}

function _transform_points(mesh, points) {
  var p = [vec_copy(points[0]), vec_copy(points[1])];

  if (mesh.scale) {
    _line_apply(p, function(v) {
      _vec_multiply(v, mesh.scale);
    });
  }

  if (mesh.yaw) {
    _line_apply(p, function(v) {
      _vec_3drotateX(v, mesh.yaw);
    });
  }

  if (mesh.pitch) {
    _line_apply(p, function(v) {
      _vec_3drotateY(v, mesh.pitch);
    });
  }

  if (mesh.roll) {
    _line_apply(p, function(v) {
      _vec_3drotateZ(v, mesh.roll);
    });
  }

  if (mesh.translate) {
    _line_apply(p, function(v) {
      _vec_add(v, mesh.translate);
    });
  }

  return p;
}

function _tri_apply(tri, transform) {
  transform(tri[0]);
  transform(tri[1]);
  transform(tri[2]);
}

function _line_apply(tri, transform) {
  transform(tri[0]);
  transform(tri[1]);
}

function frame(time, lastTime, ctx) {
  update(time - lastTime);
  render(ctx);

  animationFrame = requestAnimationFrame(newTime => {
    frame(newTime, time, ctx);
  });
}

function x(progress) {
  let damping = 10.0;
  let mass = 1.0;
  let stiffness = 100.0;
  let velocity = 0.0;

  let beta = damping / (2 * mass);
  let omega0 = Math.sqrt(stiffness / mass);
  let omega1 = Math.sqrt(omega0 * omega0 - beta * beta);
  let omega2 = Math.sqrt(beta * beta - omega0 * omega0);

  let x0 = -1;

  let oscillation;

  if (beta < omega0) {
    // Underdamped
    oscillation = t => {
      let envelope = Math.exp(-beta * t);

      let part2 = x0 * Math.cos(omega1 * t);
      let part3 = ((beta * x0 + velocity) / omega1) * Math.sin(omega1 * t);
      return -x0 + envelope * (part2 + part3);
    };
  } else if (beta == omega0) {
    // Critically damped
    oscillation = t => {
      let envelope = Math.exp(-beta * t);
      return -x0 + envelope * (x0 + (beta * x0 + velocity) * t);
    };
  } else {
    // Overdamped
    oscillation = t => {
      let envelope = Math.exp(-beta * t);
      let part2 = x0 * Math.cosh(omega2 * t);
      let part3 = ((beta * x0 + velocity) / omega2) * Math.sinh(omega2 * t);
      return -x0 + envelope * (part2 + part3);
    };
  }

  return oscillation(progress);
}

function spring(v1, v2, progress) {
  return (v2 - v1) * x(progress) + v1;
}

function quadraticOut(k) {
  return k === 0 ? 0 : Math.pow(1024, k - 1);
}

function lerp(v1, v2, progress, func) {
  return (v2 - v1) * (func ? func(progress) : progress) + v1;
}

function update(dt) {
  let computer = meshes[1];
  let lines = meshes[0];
  let curve = meshes[2];

  computer.pitch += 0.0001 * dt;
  lines.pitch += 0.00025 * dt;
  curve.pitch += 0.0005 * dt;

  lines.data[0].codeIndex = 0;
  lines.data[1].codeIndex = getCodeIndex(25);

  if (explodeStarted) {
    meshes.forEach(mesh => {
      if (mesh === meshes[2]) {
        let d = Math.min((Date.now() - explodeStarted) / 500, 1);

        if (mesh.originalOpacity > 0) {
          mesh.opacity = lerp(mesh.originalOpacity, 1, d);
        } else {
          mesh.opacity = 1;
        }

        mesh.scale = [
          spring(mesh.originalScale[0], 8.8, d),
          spring(mesh.originalScale[1], 8.8, d),
          spring(mesh.originalScale[2], 8.8, d)
        ];
      } else if (mesh.id !== 'box') {
        let d = Math.min((Date.now() - explodeStarted) / 1500, 1);
        mesh.scale = [
          spring(mesh.originalScale[0], 4.5, d),
          spring(mesh.originalScale[1], 4.5, d),
          spring(mesh.originalScale[2], 4.5, d)
        ];
      }
    });
  } else if (explodeEnded) {
    let d = Math.min((Date.now() - explodeEnded) / 1500, 1);

    meshes.forEach(mesh => {
      if (mesh === meshes[2]) {
        let d = Math.min((Date.now() - explodeEnded) / 3000, 1);
        let dOpacity = Math.min((Date.now() - explodeEnded) / 500, 1);
        mesh.opacity = lerp(mesh.originalOpacity, 0, dOpacity);
      } else if (mesh.id !== 'box') {
        let d = Math.min((Date.now() - explodeEnded) / 1500, 1);
        mesh.scale = [
          spring(mesh.originalScale[0], 7, d),
          spring(mesh.originalScale[1], 7, d),
          spring(mesh.originalScale[2], 7, d)
        ];
      }
    });
  }
}

function render(ctx) {
  let heap = make_heap();

  ctx.clearRect(0, 0, size[0], size[1]);

  for (var i = 0; i < meshes.length; i++) {
    if (!meshes[i].hidden) {
      renderMesh(meshes[i], heap);
    }
  }

  heap_depth_first(heap, function(line) {
    render3d(ctx, line, camera, frustum);
  });
}

function renderMesh(mesh, heap) {
  let { data } = mesh;
  for (var i = 0; i < data.length; i++) {
    if (data[i].codeIndex == null) {
      data[i].codeIndex = getCodeIndex(
        (Math.random() * (codeString.length - 15)) | 0
      );
    }

    var line = _transform_points(mesh, data[i]);

    _line_apply(line, function(v) {
      _vec_subtract(v, camera);
    });

    line.color = mesh.color || currentColor;
    line.opacity = mesh.opacity != null ? mesh.opacity : 1;
    line.codeIndex = data[i].codeIndex;
    line.meshId = mesh.id;

    heap_add(heap, line);
  }
}

function render3d(ctx, points, camera, frustum) {
  var p_camera = [
    vec_subtract(points[0], camera),
    vec_subtract(points[1], camera)
  ];

  // var tri_ca = vec_subtract(p_camera[2], p_camera[0]);
  // var tri_cb = vec_subtract(p_camera[2], p_camera[1]);

  // var normal_camera = vec_cross(tri_ca, tri_cb);
  // var angle = vec_dot(p_camera[0], normal_camera);

  // // don't render back faces of triangles
  // if (angle >= 0) {
  //   return;
  // }

  // lighting
  // var p_ba = vec_subtract(points[1], points[0]);
  // var p_ca = vec_subtract(points[2], points[0]);
  // var normal = vec_unit(vec_cross(p_ba, p_ca));

  var color = points.color;

  // var angle = vec_dot(normal, light);
  // var ambient = 0.3;
  // var shade = Math.min(1.0, Math.max(0.0, angle));
  // shade = Math.min(1.0, shade + ambient);

  var points2d = project2d(p_camera, frustum);

  if (points.meshId === 'box') {
    render2d(ctx, points2d, color);
  } else {
    render2dWords(ctx, points2d, color, points.opacity, points.codeIndex);
  }
}

function render2d(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(points[0][X], points[0][Y]);
  ctx.lineTo(points[1][X], points[1][Y]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function render2dWords(ctx, points, color, opacity, codeIndex) {
  // ctx.lineWidth = 20;

  let line = vec_subtract(points[1], points[0]);
  let length = vec_length(line);
  let v = vec_unit(line);
  // Invert the Y, positive should be going up
  v[Y] = -v[Y];
  let axis = vec(1, 0);

  let angle = Math.acos(vec_dot(v, axis));
  if (v[Y] > 0) {
    angle = -angle;
  }

  if (opacity === 1) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.translate(points[0][X], points[0][Y]);
    ctx.rotate(angle);
    ctx.translate(5, -7);
    ctx.moveTo(0, 0);
    ctx.lineTo(length - 15, 0);
    ctx.lineWidth = 18;
    ctx.strokeStyle = 'black';
    ctx.stroke();
    ctx.restore();
  }

  if (opacity > 0) {
    ctx.save();
    ctx.translate(points[0][X], points[0][Y]);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.font = '16px monaco';
    ctx.fillText(codeString.slice(codeIndex, codeIndex + length / 10), 0, 0);
    ctx.restore();
  }

  // Debug lines
  // ctx.beginPath();
  // ctx.moveTo(points[0][X], points[0][Y]);
  // ctx.lineTo(points[1][X], points[1][Y]);
  // ctx.lineWidth = 1;
  // ctx.strokeStyle = color;
  // ctx.stroke();
}
