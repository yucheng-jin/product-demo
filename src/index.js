import _ from 'lodash';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader';
import { RGBELoader } from 'three/addons/loaders/RGBELoader';
// import { Water } from 'three/addons/objects/Water2';
import MeshReflectorMaterial from './MeshReflectorMaterial';

let scene, camera, renderer, skybox, reflectorFloor;

const materialTable = {
    'Body.001': {
        aoMapPath: 'assets/textures/Body_AO.png',
        aoMap: null,
    },
    'Bottom.001': {
        aoMapPath: 'assets/textures/Bottom_AO.png',
        aoMap: null,
    },
    'Common.001': {
        aoMapPath: 'assets/textures/Common_AO.png',
        aoMap: null,
    },
    'Driver.001': {
        aoMapPath: 'assets/textures/Driver_AO.png',
        aoMap: null,
    },
    'Wheels.001': {
        aoMapPath: 'assets/textures/Wheels_AO.png',
        aoMap: null,
    },
}

function init() {

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(-10, 7, 10);

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor("black");
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 1.0;
    renderer.physicallyCorrectLights = true;


    document.body.appendChild(renderer.domElement);

    var controls = new OrbitControls(camera, renderer.domElement);

}

async function setupScene() {

    
    

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x777777, 0.2);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(-1, 1, 1);
    scene.add(directionalLight);

    const hdrLoader = new RGBELoader();
    const envMap = await hdrLoader.loadAsync('assets/env/blouberg_sunrise_2_1k.hdr');
    envMap.mapping = THREE.EquirectangularReflectionMapping;

    scene.environment = envMap;

    scene.background = new THREE.Color(0x707070);
    scene.fog = new THREE.Fog(0x707070, 20, 30);

    const params = {
        height: 15,
        radius: 100,
        enabled: true,
    };

    // skybox = new GroundedSkybox(envMap, params.height, params.radius);
    // skybox.position.y = params.height - 0.01;
    // scene.add(skybox);

    // load ao textures

    const textureLoader = new THREE.TextureLoader();

    Object.entries(materialTable).forEach(([key, value]) => {
        value.aoMap = textureLoader.load(value.aoMapPath);
        value.aoMap.flipY = false;
    });

    // reflecting floor

    reflectorFloor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    reflectorFloor.material = new MeshReflectorMaterial(renderer, camera, scene, reflectorFloor, {
        mixStrength: 5,
        mixBlur: 0,
        mirror: 0.5,
    });
    reflectorFloor.rotation.x = - Math.PI / 2;
    scene.add(reflectorFloor);

    reflectorFloor.material.color = new THREE.Color(0x707070);

    const floorDiffuseMap = textureLoader.load('assets/textures/FloorsCheckerboard_S_Diffuse.jpg');
    floorDiffuseMap.wrapS = THREE.RepeatWrapping;
    floorDiffuseMap.wrapT = THREE.RepeatWrapping;
    floorDiffuseMap.repeat.set(40, 40);
    floorDiffuseMap.colorSpace = THREE.SRGBColorSpace;
    reflectorFloor.material.map = floorDiffuseMap;

    const floorNormalMap = textureLoader.load('assets/textures/FloorsCheckerboard_S_Normal.jpg');
    floorNormalMap.wrapS = THREE.RepeatWrapping;
    floorNormalMap.wrapT = THREE.RepeatWrapping;
    floorNormalMap.repeat.set(40, 40);
    floorNormalMap.colorSpace = THREE.SRGBColorSpace;
    reflectorFloor.material.normalMap = floorNormalMap;

    reflectorFloor.material.roughness = 0.5;

    // load car model

    new GLTFLoader().load('assets/model/aston_martin.glb', (gltf) => {
        console.log(">>> gltf: ", gltf);

        scene.add(gltf.scene);

        gltf.scene.traverse((child) => {
            if (child.isMesh && !child.material.aoMap && !!materialTable[child.material.name]) {
                child.material.aoMap = materialTable[child.material.name].aoMap;
            }
        })
    })

}

function animate() {

    reflectorFloor.material.update();

    requestAnimationFrame(animate);

    renderer.render(scene, camera);

}

(async function () {

    init();

    await setupScene();

    animate();

})();
