import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DragControls} from 'three/examples/jsm/controls/DragControls'
import * as dat from 'lil-gui'
import * as CANNON from 'cannon-es'

/**
 * Debug
 */
function isDebug() {
    return window.location.hash === '#debug'
}

const gui = new dat.GUI().hide()
if (isDebug()) {
    gui.show()
}

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()


/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        color: 'paleturquoise',
        metalness: 0.3,
        roughness: 0.4,
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)


/**
 * Physics
 */
const world = new CANNON.World()
world.gravity.set(0, - 9.82, 0)
world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true

const defaultMaterial = new CANNON.Material('default')
const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.1,
        restitution: 0.3
    }
)
world.addContactMaterial(defaultContactMaterial)

const floorShape = new CANNON.Box(new CANNON.Vec3(floor.geometry.parameters.width / 2, floor.geometry.parameters.height / 2, 0.1))
const floorBody = new CANNON.Body({
    material: defaultMaterial
})
floorBody.mass = 0
floorBody.position.y = -0.1
floorBody.addShape(floorShape)
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 0, 0), Math.PI * 0.5)
world.addBody(floorBody)



const objectsToUpdate = []
const meshToBody = {}

function trackObject(mesh, body) {
    objectsToUpdate.push({mesh, body})
    meshToBody[mesh.uuid] = body
}

const sphereGeometry = new THREE.SphereGeometry(1, 20, 10)
const sphereMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.1,
    roughness: 0.4,
    emissive: 'lightyellow',
    emissiveIntensity: 0.3,
    color: 'silver'
})
const createSphere = (radius, position) =>
{
    // Three.js mesh
    const mesh = new THREE.Mesh(
        sphereGeometry,
        sphereMaterial
    )
    mesh.castShadow = true
    mesh.scale.set(radius, radius, radius)
    mesh.position.copy(position)
    scene.add(mesh)

    // Cannon.js body
    const shape = new CANNON.Sphere(radius)

    const body = new CANNON.Body({
        mass: 100 * 4 / 3 * Math.PI * radius ** 3,
        shape: shape,
        material: defaultMaterial
    })
    body.position.copy(position)
    world.addBody(body)

    trackObject(mesh, body)

    return {mesh, body}
}

// Create box
const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
const boxMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.5,
    envMapIntensity: 0.5,
    color: 'lime'
})
const createBox = (width, height, depth, position) =>
{
    // Three.js mesh
    const mesh = new THREE.Mesh(boxGeometry, boxMaterial)
    mesh.scale.set(width, height, depth)
    mesh.castShadow = true
    mesh.position.copy(position)
    scene.add(mesh)

    // Cannon.js body
    const shape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5))

    const body = new CANNON.Body({
        mass: width * height * depth,
        shape: shape,
        material: defaultMaterial
    })
    body.position.copy(position)
    body.addEventListener('collide', playHitSound)

    world.addBody(body)

    // Save in objects
    trackObject(mesh, body)

    return {mesh, body}
}

createBox(0.6, 1.2, 0.2, new CANNON.Vec3(0, 0.6, -0.5))
createBox(0.6, 1.2, 0.2, new CANNON.Vec3(0, 0.6, -1))
createBox(0.6, 1.2, 0.2, new CANNON.Vec3(0, 0.6, -1.5))
createBox(0.6, 1.2, 0.2, new CANNON.Vec3(0, 0.6, -2))
createBox(0.6, 1.2, 0.2, new CANNON.Vec3(0, 0.6, -2.5))
createBox(0.6, 1.2, 0.2, new CANNON.Vec3(0, 0.6, -3))
createBox(0.6, 1.2, 0.2, new CANNON.Vec3(0, 0.6, -3.5))
createBox(0.6, 1.2, 0.2, new CANNON.Vec3(0, 0.6, -4))
createBox(0.6, 1.2, 0.2, new CANNON.Vec3(0, 0.6, -4.5))
createBox(0.6, 1.2, 0.2, new CANNON.Vec3(0, 0.6, -5))

/**
 * Sounds
 */
const hitSound = new Audio('/sounds/hit.mp3')

function playHitSound(collision) {
    const impactStrength = collision.contact.getImpactVelocityAlongNormal()

    if (impactStrength < 0.5) {
        return
    }

    hitSound.currentTime = 0
    hitSound.volume = Math.min(impactStrength / 5, 1)
    hitSound.play()
}

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(-7, 8.5, 2.6)
scene.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setClearColor("lightblue")
renderer.setClearAlpha(0.5)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

function render() {
    renderer.render(scene, camera)
}

let phsyicsEnabled = false

const orbitControls = new OrbitControls(camera, canvas)
orbitControls.enableDamping = true
orbitControls.autoRotate = true
orbitControls.autoRotateSpeed = 0.5
orbitControls.addEventListener('change', (event) => {
})

const draggableObjects = objectsToUpdate.map(x => x.mesh)
const dragControls = new DragControls(
    draggableObjects,
    camera, 
    canvas)
dragControls.addEventListener('drag', render)
dragControls.addEventListener('dragstart', (event) => {
    orbitControls.enabled = false
    const mesh = event.object
    mesh.position.y = 0.6
    const body = meshToBody[mesh.uuid]
    body.position.copy(mesh.position)
})
dragControls.addEventListener('dragend', (event) => {
    const mesh = event.object
    mesh.position.y = 0.6
    const body = meshToBody[mesh.uuid]
    body.position.copy(mesh.position)
    orbitControls.enabled = true
})
dragControls.addEventListener('hoveron', (event) => {
})
dragControls.addEventListener('hoveroff', (event) => {
})

const playButton = document.getElementById('play');
playButton.addEventListener('click', () => {
    phsyicsEnabled = true
    dragControls.enabled = false
    const ball = createSphere(0.2, new CANNON.Vec3(0, 2.5, 2))
    ball.body.applyLocalForce(new CANNON.Vec3(0, 0, -1000), new CANNON.Vec3(0, 0, 0))
})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const deltaTime = clock.getDelta()
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    orbitControls.update()

    // Render
    render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)

    for (const [i, object] of objectsToUpdate.entries()) {
        if (object.body.position.y < - 20) {
            scene.remove(object.mesh)
            world.removeBody(object.body)
            objectsToUpdate.splice(i, 1)
            delete meshToBody[object.mesh.uuid]
        }
    }

    floorBody.quaternion.copy(floor.quaternion)

    // Update physics
    if (phsyicsEnabled) {
        world.step(1 / 60, deltaTime, 3)

        for (const object of objectsToUpdate) {
            object.mesh.position.copy(object.body.position)
            object.mesh.quaternion.copy(object.body.quaternion)
        }
    }
}

tick()

const loadingDiv = document.querySelector('#loading')
loadingDiv.style.display = 'none'