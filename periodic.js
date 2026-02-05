/* ================================
   IMPORTS (CSS3D Periodic Table style)
================================ */
import * as THREE from "https://unpkg.com/three@0.152.2/build/three.module.js";
import { CSS3DRenderer, CSS3DObject } from "https://unpkg.com/three@0.152.2/examples/jsm/renderers/CSS3DRenderer.js";
import { TrackballControls } from "https://unpkg.com/three@0.152.2/examples/jsm/controls/TrackballControls.js";
import TWEEN from "https://unpkg.com/@tweenjs/tween.js@18.6.4/dist/tween.esm.js";

/* ================================
   GOOGLE SHEET CSV (PUBLISH TO WEB)
================================ */
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSciu6zz0nbqtsI7ITqKer2a13m4F73X1qt1tw1uLmpYvGOFeStKjZ5Xls8jqd9gA2K-t7GmwuIrTk6/pub?output=csv";

/* ================================
   GLOBALS
================================ */
let camera, scene, renderer, controls;
const objects = [];
const targets = { table: [], sphere: [], helix: [], grid: [] };

// Container
const container = document.getElementById("container");

/* ================================
   INIT
================================ */
init();
loadDataAndBuild();

function init() {
  camera = new THREE.PerspectiveCamera(40, window.innerWidth / (window.innerHeight - 86), 1, 10000);
  camera.position.z = 3000;

  scene = new THREE.Scene();

  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight - 86);
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "0px";
  container.appendChild(renderer.domElement);

  controls = new TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 0.6;
  controls.minDistance = 500;
  controls.maxDistance = 6000;

  // Buttons
  document.getElementById("btnTable").addEventListener("click", () => transform(targets.table, 1500));
  document.getElementById("btnSphere").addEventListener("click", () => transform(targets.sphere, 1500));
  document.getElementById("btnHelix").addEventListener("click", () => transform(targets.helix, 1500));
  document.getElementById("btnGrid").addEventListener("click", () => transform(targets.grid, 1500));

  window.addEventListener("resize", onWindowResize);

  animate();
}

function onWindowResize() {
  const h = window.innerHeight - 86;
  camera.aspect = window.innerWidth / h;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, h);
}

/* ================================
   CSV PARSER (handles quoted commas)
================================ */
function parseCsvLine(line) {
  const parts = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
  return parts.map((p) => p.replaceAll('"', "").trim());
}

function parseNetWorth(value) {
  // "$251,260.80" -> 251260.8
  return Number(String(value || "0").replace(/[$,]/g, ""));
}

function formatUSD(num) {
  if (!Number.isFinite(num)) return "$0";
  return "$" + num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// Color rule (as requested)
// Red <100K, Orange >100K & Green >200K
function bgColor(netWorth) {
  if (netWorth > 200000) return "rgba(46, 204, 113, 0.85)";  // green
  if (netWorth > 100000) return "rgba(243, 156, 18, 0.85)";  // orange
  return "rgba(231, 76, 60, 0.85)";                          // red
}

/* ================================
   LOAD DATA + BUILD OBJECTS/TARGETS
================================ */
async function loadDataAndBuild() {
  const csv = await fetch(SHEET_URL).then((r) => r.text());
  const lines = csv.trim().split("\n");

  // Expect columns:
  // Name, Photo, Age, Country, Interest, Net Worth
  const data = lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    return {
      name: cols[0] || "",
      photo: cols[1] || "",
      age: cols[2] || "",
      country: cols[3] || "",
      interest: cols[4] || "",
      netWorth: parseNetWorth(cols[5]),
    };
  });

  console.log("DATA SAMPLE:", data.slice(0, 3));

  // Build tiles (CSS3DObjects)
  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    const element = document.createElement("div");
    element.className = "element";
    element.style.background = bgColor(item.netWorth);

    // Image
    const img = document.createElement("img");
    img.src = item.photo;
    img.alt = item.name;
    img.loading = "lazy";

    // Name
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = item.name || "(No Name)";

    // Meta (structure ikut Image B)
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      Age: <b>${item.age || "-"}</b><br/>
      ${item.country || "-"} • ${item.interest || "-"}
    `;

    // Net worth badge
    const worth = document.createElement("div");
    worth.className = "worth";
    worth.textContent = formatUSD(item.netWorth);

    element.appendChild(img);
    element.appendChild(name);
    element.appendChild(meta);
    element.appendChild(worth);

    const objectCSS = new CSS3DObject(element);

    // random start position (for animation)
    objectCSS.position.x = Math.random() * 4000 - 2000;
    objectCSS.position.y = Math.random() * 4000 - 2000;
    objectCSS.position.z = Math.random() * 4000 - 2000;

    scene.add(objectCSS);
    objects.push(objectCSS);
  }

  // Build targets
  buildTableTargets(data.length);  // 20 x 10
  buildSphereTargets(data.length);
  buildDoubleHelixTargets(data.length);
  buildGridTargets(data.length);   // 5 x 4 x 10

  // default start = TABLE
  transform(targets.table, 1500);
}

/* ================================
   TARGETS: TABLE 20x10
================================ */
function buildTableTargets(n) {
  targets.table = [];

  const cols = 20;
  const rows = 10;

  // spacing
  const sx = 140;
  const sy = 190;

  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const object = new THREE.Object3D();
    object.position.x = (col - (cols / 2 - 0.5)) * sx;
    object.position.y = (-(row) + (rows / 2 - 0.5)) * sy;
    object.position.z = 0;

    targets.table.push(object);
  }
}

/* ================================
   TARGETS: SPHERE
================================ */
function buildSphereTargets(n) {
  targets.sphere = [];
  const vector = new THREE.Vector3();

  for (let i = 0; i < n; i++) {
    const object = new THREE.Object3D();

    // Fibonacci-ish distribution
    const phi = Math.acos(-1 + (2 * i) / n);
    const theta = Math.sqrt(n * Math.PI) * phi;

    object.position.setFromSphericalCoords(1000, phi, theta);

    vector.copy(object.position).multiplyScalar(2);
    object.lookAt(vector);

    targets.sphere.push(object);
  }
}

/* ================================
   TARGETS: DOUBLE HELIX
================================ */
function buildDoubleHelixTargets(n) {
  targets.helix = [];
  const vector = new THREE.Vector3();

  const radius = 900;
  const separation = 180;   // jarak antara dua helix
  const stepY = 18;

  for (let i = 0; i < n; i++) {
    const object = new THREE.Object3D();

    const angle = i * 0.35;
    const isSecond = (i % 2 === 1);
    const phase = isSecond ? Math.PI : 0;

    const x = (radius * Math.sin(angle + phase)) + (isSecond ? separation : -separation);
    const z = (radius * Math.cos(angle + phase));
    const y = -(i * stepY) + 450;

    object.position.set(x, y, z);

    vector.set(x * 2, y, z * 2);
    object.lookAt(vector);

    targets.helix.push(object);
  }
}

/* ================================
   TARGETS: GRID 5x4x10
   (x=5, y=4, z=10)
================================ */
function buildGridTargets(n) {
  targets.grid = [];

  const xCount = 5;
  const yCount = 4;
  const zCount = 10;

  const sx = 400;
  const sy = 320;
  const sz = 450;

  for (let i = 0; i < n; i++) {
    const object = new THREE.Object3D();

    const x = i % xCount;
    const y = Math.floor(i / xCount) % yCount;
    const z = Math.floor(i / (xCount * yCount)) % zCount;

    object.position.x = (x - (xCount / 2 - 0.5)) * sx;
    object.position.y = (-(y) + (yCount / 2 - 0.5)) * sy;
    object.position.z = (z - (zCount / 2 - 0.5)) * sz;

    targets.grid.push(object);
  }
}

/* ================================
   TRANSFORM ANIMATION (TWEEN)
================================ */
function transform(targetArray, duration) {
  TWEEN.removeAll();

  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    const target = targetArray[i] || targetArray[targetArray.length - 1];

    new TWEEN.Tween(object.position)
      .to(
        { x: target.position.x, y: target.position.y, z: target.position.z },
        duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to(
        { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z },
        duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
  }

  // smooth render during tween
  new TWEEN.Tween({})
    .to({}, duration)
    .onUpdate(render)
    .start();
}

/* ================================
   LOOP
================================ */
function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
  render();
}

function render() {
  renderer.render(scene, camera);
}