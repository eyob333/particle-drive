import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import fragmentShader from './shader/Particle/fragment.glsl'
import vertexShader from './shader/Particle/vertex.glsl'


/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
    effectComposer.setSize(sizes.width, sizes.height)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 5
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
// renderer.toneMapping = THREE.ACESFilmicToneMapping
// renderer.toneMappingExposure = 3
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)



/**
 * Material
 */

let params = {}
params.count = 1000
params.innerVoidRad = .5;
params.outerRad = 1.;
params.color = '#619ae5'

let uniforms = {}
uniforms.uTime = new THREE.Uniform(0)
uniforms.uSpeed = new THREE.Uniform(.1)
uniforms.uSize = new THREE.Uniform(35.)
uniforms.uResolution = new THREE.Uniform(new THREE.Vector2(sizes.width, sizes.height))
uniforms.uColor = new THREE.Uniform(new THREE.Color(params.color))


const geometry = new THREE.BufferGeometry();
const position = new Float32Array(params.count * 3);
const speed = new Float32Array(params.count)


for (let i = 0; i < params.count; i++) {
    let i3 = i * 3;
    while (true) {
        position[i3 + 0] = Math.random() * 2 - 1;
        position[i3 + 1] = Math.random() * 2 - 1;
        position[i3 + 2] = 0;

        // let distance = Math.sqrt(position[ i3 + 0] * position[ i3 + 0] + position[ i3 + 1] * position[ i3 + 1] +  position[ i3 + 2] * position[ i3 + 2])

        // Calculate the distance from the center (0, 0)
        const distance = Math.sqrt(position[i3 + 0] * position[i3 + 0] + position[i3 + 1] * position[i3 + 1]);

        // Check if the point is within the hollow disc
        if (distance >= 0.3 && distance <= 1) {
            break;
        }
    }


    let factor = Math.abs(position[i3 + 0] * position[i3 + 0] + position[i3 + 1] * position[i3 + 1]);
    speed[i] = (factor * 3.);
}


geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))

const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms,
    transparent: true,
    wireframe: false,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    opacity: .5
});

let particles = new THREE.Points(geometry, material);
particles.position.set(0, 0, 0)
particles.frustumCulled = false
scene.add(particles)


//text mesh
const box = new THREE.Mesh( new THREE.BoxGeometry, new THREE.MeshBasicMaterial({color: 0xffffff}))
// scene.add(box)



gui.add(params, 'count').min(10).max(100000).step(1).name('count')
gui.add(params, 'outerRad').min(0).max(1.).step(.001).name('outerRadius')
gui.add(params, 'innerVoidRad').min(0).max(1.).step(.001).name('VoidRadius')
gui.add(uniforms.uSpeed, 'value').min(0).max(3).step(0.0001).name('uSpeed')
gui.add(uniforms.uSize, 'value').min(0).max(40).step(0.0001).name('uSize')
gui.addColor(params, 'color').onChange(() => {
    uniforms.uColor.value.set(params.color)
}).name('uColor')
gui.add(material, 'wireframe').name('wireframe')
gui.add(material, 'transparent').name('transparent')


//Post processing

params.threshold = 0;
params.strength = 1;
params.radius =  0;
params.clearColor =  '#000000';
params.exposure = 1;


let effectComposer = new EffectComposer(renderer)
let renderPass = new RenderPass( scene, camera );
let outputPass = new OutputPass();
let bloomPass = new UnrealBloomPass(sizes.width, sizes.height );
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;
        


effectComposer.addPass(renderPass) 
effectComposer.addPass(bloomPass)
effectComposer.addPass(outputPass)


        gui.add( params, 'threshold', 0.0, 3.0 ).onChange( () => {
            bloomPass.threshold = params.threshold;
        } );
        gui.add( params, 'strength', 0.0, 3.0 ).onChange( () =>{
            bloomPass.strength = params.strength;
        } );
        gui.add( params, 'radius', 0.0, 1.0 ).step( 0.01 ).onChange(  () => {
            bloomPass.radius = params.radius;
        } );
        gui.add( params, 'exposure', 0.1, 2 ).onChange(  () => {
            renderer.toneMappingExposure = Math.pow( params.exposure, 4.0 );
        } );

        gui.addColor( params, 'clearColor').onChange(  () => {
            renderer.setClearColor(params.clearColor)
        } );
        gui.add( renderer, 'toneMapping',{
            no: THREE.NoToneMapping,
            Liner: THREE.LinearToneMapping,
            Reinhard: THREE.ReinhardToneMapping,
            Cineon: THREE.CineonToneMapping,
            ACESFilmic: THREE.ACESFilmicToneMapping,
            })


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    uniforms.uTime.value = elapsedTime


    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)
    // renderer.clear()
    effectComposer.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()


