import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/RGBELoader.js";


//===========PARA EL EFECTO DIAMANTADO===========
const textureLoader = new THREE.TextureLoader();

const diamondNormalMap = textureLoader.load(
  "models/imagenes/normal.jpg"
);

diamondNormalMap.wrapS = THREE.RepeatWrapping;
diamondNormalMap.wrapT = THREE.RepeatWrapping;
diamondNormalMap.repeat.set(4, 4); // ajusta el tamaño del patrón



const viewer = document.getElementById("viewer");

// ================= ESCENA =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// ======= HDR (VA AQUÍ, NO ARRIBA) =======
const rgbeLoader = new RGBELoader();
rgbeLoader.load("models/imagenes/studio.hdr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
});



// ================= CÁMARA =================
const camera = new THREE.PerspectiveCamera(
  45,
  viewer.clientWidth / viewer.clientHeight,
  0.1,
  100
);
camera.position.set(0, 0, 5);

// ================= RENDER =================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewer.clientWidth, viewer.clientHeight);
viewer.appendChild(renderer.domElement);

// ================= LUCES =================
scene.add(new THREE.AmbientLight(0xffffff, 0.9));

const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
keyLight.position.set(5, 5, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1);
fillLight.position.set(-5, 2, 5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
rimLight.position.set(0, 5, -5);
scene.add(rimLight);

// ================= CONTROLES =================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ================= COLORES =================
const finishes = {
  gris_claro: { color: "#888888", metalness: 0.4, roughness: 0.2 },
  negro: { color: "#111111", metalness: 0.0, roughness: 0.8 },
  dorado: { color: "#f8d666", metalness: 0.85, roughness: 0.25 },
  aguamarina: { color: "#288b79", metalness: 0.05, roughness: 0.0 },
  dorado_verdoso: { color: "#e3d23a", metalness: 0.8, roughness: 0.3 },
  gris_2: { color: "#525050", metalness: 0.2, roughness: 0.25 },
  gris_6: { color: "#6b6a66", metalness: 0.1, roughness: 0.0 },
  gris_5: { color: "#3e3d3d", metalness: 0.1, roughness: 0.0 },
  gris_7: { color: "#726e6e", metalness: 0.3, roughness: 0.15 },
  gris_negro: { color: "#2b2b2b", metalness: 0.3, roughness: 0.0 },
  gris_4: { color: "#888888", metalness: 0.2, roughness: 0.0 },
  gris_azulado: { color: "#5f6769", metalness: 0.25, roughness: 0.1 },
  naranja: { color: "#f33d14", metalness: 0.25, roughness: 0.1 },
  gris_rata: { color: "#6f6e6a", metalness: 0.35, roughness: 0.2 },
  gris_oscuro: { color: "#3c3b3b", metalness: 0.15, roughness: 0.0 },
  gris_3: { color: "#474646", metalness: 0.1, roughness: 0.05 },
  gris_8: { color: "#888888", metalness: 0.4, roughness: 0.1 }
};

//==============EFECTO DIAMANTADO==================
const effects = {
  diamantado: {
    normalMap: diamondNormalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),

    metalness: 1.0,
    roughness: 0.06,

    clearcoat: 1.0,
    clearcoatRoughness: 0.02,

    envMapIntensity: 1.0
  }
};

// ================= MODELO =================
let rin;
let originalMaterials = [];

const loader = new GLTFLoader();
loader.load("models/rin.glb", (gltf) => {
  rin = gltf.scene;

  rin.traverse((child) => {
    if (child.isMesh) {
      originalMaterials.push({
        mesh: child,
        material: child.material.clone()
      });
    }
  });

  scene.add(rin);
});

/*Esto es lo que permite:color solo, efecto solo,color + efecto,reset total*/

let currentColor = null;     // color seleccionado
let currentEffect = null;   // efecto activo

//=========ESTO VA A SERVIR PARA EL AR Y LOS COLORES

let arConfig = {
  color: null,
  diamantado: false,
  diamondMode: "partial"
};


// ================= APLICAR COLOR (SIN ACUMULAR) =================
let diamondMode = "partial";
let clickTimeout = null;

function applyMaterialState() {
  if (!rin) return;

  rin.traverse(child => {
    if (!child.isMesh) return;

    const original = originalMaterials.find(m => m.mesh === child);
    if (!original) return;

    // Reset siempre
    child.material = original.material.clone();

    const materialName = child.material.name;

    // ================= COLOR SOLO A Color_Rin =================
    if (currentColor && materialName === "Color_Rin") {
      child.material.color.set(currentColor.color);
      child.material.metalness = currentColor.metalness;
      child.material.roughness = currentColor.roughness;
    }

// ================= DIAMANTADO =================
if (currentEffect === effects.diamantado) {

  const applyDiamond =
    diamondMode === "full" ||
    (diamondMode === "partial" && materialName === "Diamantado_Rin");

  if (applyDiamond) {
    child.material.normalMap = effects.diamantado.normalMap;
    child.material.normalScale = effects.diamantado.normalScale;

    child.material.metalness = effects.diamantado.metalness;
    child.material.roughness = effects.diamantado.roughness;

    if ("clearcoat" in child.material) {
      child.material.clearcoat = effects.diamantado.clearcoat;
      child.material.clearcoatRoughness =
        effects.diamantado.clearcoatRoughness;
    }

    child.material.envMapIntensity =
      effects.diamantado.envMapIntensity;
      }
    }
  });
}



// ================= BOTONES DE COLOR =================
document.querySelectorAll(".controls button[data-finish]").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentColor = finishes[btn.dataset.finish] || null;

    arConfig.color = btn.dataset.finish; // GUARDAMOS COLOR PARA EL AR

    applyMaterialState();
  });
});


//===========para que los botones de limpiar y diamantado funcionen

const diamondBtn = document.getElementById("diamondBtn");
const clearBtn = document.getElementById("clearBtn");


//=========BOTON DIAMANTADO=========
diamondBtn.addEventListener("click", () => {

  if (clickTimeout) {
    // ES DOBLE CLICK
    clearTimeout(clickTimeout);
    clickTimeout = null;

    diamondMode = "full";
    currentEffect = effects.diamantado;

    // GUARDAMOS CONFIG PARA AR
    arConfig.diamantado = true;
    arConfig.diamondMode = "full";

    applyMaterialState();

  } else {
    // 👇 ESPERAMOS A VER SI ES DOBLE CLICK
    clickTimeout = setTimeout(() => {
      diamondMode = "partial";

      if (currentEffect === effects.diamantado) {
        currentEffect = null;

        // SE APAGA DIAMANTADO
        arConfig.diamantado = false;

      } else {
        currentEffect = effects.diamantado;

        // SE ACTIVA DIAMANTADO PARCIAL
        arConfig.diamantado = true;
        arConfig.diamondMode = "partial";
      }

      applyMaterialState();
      clickTimeout = null;
    }, 250);
  }
});



//========= BOTON LIMPIAR / RESET =========
clearBtn.addEventListener("click", () => {
  currentColor = null;
  currentEffect = null;
  diamondMode = "partial";

  arConfig.color = null;
  arConfig.diamantado = false;
  arConfig.diamondMode = "partial";


  rin.traverse(child => {
    if (!child.isMesh) return;

    const original = originalMaterials.find(m => m.mesh === child);
    if (original) {
      child.material = original.material.clone();
      child.material.needsUpdate = true;
    }
  });
});


// ================= ANIMACIÓN =================
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ================= SCROLL TOUCH =================
const slider = document.querySelector(".controls");
let isDown = false;
let startX;
let scrollLeft;

slider.addEventListener("mousedown", (e) => {
  isDown = true;
  startX = e.pageX - slider.offsetLeft;
  scrollLeft = slider.scrollLeft;
});

slider.addEventListener("mouseleave", () => isDown = false);
slider.addEventListener("mouseup", () => isDown = false);

slider.addEventListener("mousemove", (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - slider.offsetLeft;
  slider.scrollLeft = scrollLeft - (x - startX) * 1.5;
});

slider.addEventListener("touchstart", (e) => {
  startX = e.touches[0].pageX;
  scrollLeft = slider.scrollLeft;
});

slider.addEventListener("touchmove", (e) => {
  const x = e.touches[0].pageX;
  slider.scrollLeft = scrollLeft - (x - startX) * 1.2;
});

// ================= RESPONSIVE =================
window.addEventListener("resize", () => {
  camera.aspect = viewer.clientWidth / viewer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(viewer.clientWidth, viewer.clientHeight);
});

window.arConfig = arConfig;
window.finishes = finishes;



