import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI().hide()
if (window.location.hash === '#debug') {
    gui.show()
}


// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
// TODO: some textures are not loading, maybe race condition? need to update render once all textures are loaded
const textureLoader = new THREE.TextureLoader()
const grassColorTexture = textureLoader.load('/textures/grass/color.jpg')
const grassAmbientOcclusionTexture = textureLoader.load('/textures/grass/ambientOcclusion.jpg')
const grassNormalTexture = textureLoader.load('/textures/grass/normal.jpg')
const grassRoughnessTexture = textureLoader.load('/textures/grass/roughness.jpg')

grassColorTexture.repeat.set(8, 8)
grassAmbientOcclusionTexture.repeat.set(8, 8)
grassNormalTexture.repeat.set(8, 8)
grassRoughnessTexture.repeat.set(8, 8)

grassColorTexture.wrapS = THREE.RepeatWrapping
grassAmbientOcclusionTexture.wrapS = THREE.RepeatWrapping
grassNormalTexture.wrapS = THREE.RepeatWrapping
grassRoughnessTexture.wrapS = THREE.RepeatWrapping

grassColorTexture.wrapT = THREE.RepeatWrapping
grassAmbientOcclusionTexture.wrapT = THREE.RepeatWrapping
grassNormalTexture.wrapT = THREE.RepeatWrapping
grassRoughnessTexture.wrapT = THREE.RepeatWrapping

/**
 * Car
 */

// Ground
const terrain = new THREE.Group()

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({
        map: grassColorTexture,
        aoMap: grassAmbientOcclusionTexture,
        normalMap: grassNormalTexture,
        roughnessMap: grassRoughnessTexture,
    })
)
ground.geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(ground.geometry.attributes.uv.array, 2))
ground.rotation.x = - Math.PI * 0.5
ground.receiveShadow = true

terrain.add(ground)

// Bushes
const bushGeometry = new THREE.SphereGeometry(1, 16, 16)
const bushMaterial = new THREE.MeshStandardMaterial({ color: '#89c854' })
const bushes = new THREE.Group()

for (let i = 0; i < 100; i++) {
    const bush = new THREE.Mesh(bushGeometry, bushMaterial)
    bush.position.x = (Math.random() - 0.5) * ground.geometry.parameters.width
    bush.position.z = ((Math.random() < 0.5) ? 1 : -1) * (4 + Math.random() * ground.geometry.parameters.height / 4)
    bush.position.y = 0.2
    bush.scale.setScalar(Math.random() * 0.5 + 0.5)
    bush.castShadow = true
    bushes.add(bush)
}

terrain.add(bushes)

// Road
const road = new THREE.Mesh(
    new THREE.PlaneGeometry(ground.geometry.parameters.width, 6),
    new THREE.MeshStandardMaterial({
        color: 'darkgrey',
    })
)
road.position.y = 0.01
road.rotation.x = - Math.PI * 0.5
road.receiveShadow = true

// Road lines
const roadLines = new THREE.Group()

const centerLine = new THREE.Group()
const dashLength = 0.5
const dashGap = 0.5
const dashCount = Math.floor(road.geometry.parameters.width / (dashLength + dashGap))
const dashGeometry = new THREE.PlaneGeometry(dashLength, 0.2)
const dashMaterial = new THREE.MeshStandardMaterial({ color: 'white' })
for (let i = 0; i < dashCount; i++) {
    const dash = new THREE.Mesh(dashGeometry, dashMaterial)
    dash.position.x = (i * (dashLength + dashGap)) - (road.geometry.parameters.width / 2)
    dash.position.z = 0.02
    centerLine.add(dash)
}
roadLines.add(centerLine)

const line1 = new THREE.Mesh(
    new THREE.PlaneGeometry(ground.geometry.parameters.width, 0.2),
    new THREE.MeshStandardMaterial({
        color: 'yellow',
    })
)
line1.geometry.center()
line1.position.y = road.geometry.parameters.height * 0.45
line1.position.z = 0.01
line1.receiveShadow = true
roadLines.add(line1)

const line2 = line1.clone()
line2.position.y *= -1
roadLines.add(line2)
road.add(roadLines)
terrain.add(road)

const terrains = new THREE.Group()
terrains.add(terrain)
const terrain_cont = terrain.clone()
terrain_cont.position.x = terrain.position.x - ground.geometry.parameters.width
terrains.add(terrain_cont)

scene.add(terrains)

// Car
const car = new THREE.Group()
car.rotation.y = Math.PI * 0.5

const carBody = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.5, 4),
    new THREE.MeshStandardMaterial({ color: '#0000ff' })
)
carBody.position.y = carBody.geometry.parameters.height * 0.5 + 0.4
carBody.castShadow = true
car.add(carBody)

const carTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.5, 3),
    new THREE.MeshStandardMaterial({ color: '#ffffff' })
)
carTop.position.y = carBody.position.y + carBody.geometry.parameters.height * 0.5 + carTop.geometry.parameters.height * 0.5
car.add(carTop)

const carWheels = new THREE.Group()
for (let i = 0; i < 4; i++) {
    const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.2, 32),
        new THREE.MeshStandardMaterial({ color: '#000000' })
    )
    wheel.rotation.x = Math.PI * 0.5
    wheel.rotation.z = Math.PI * 0.5

    wheel.position.y = wheel.geometry.parameters.radiusTop
    wheel.position.x = (i % 2 == 0 ? 1 : -1) * carBody.geometry.parameters.width * 0.5
    wheel.position.z = (i < 2 ? 1 : -1) * carBody.geometry.parameters.depth * 0.28
    
    carWheels.add(wheel)
}
car.add(carWheels)

const carFrontLights = new THREE.Group()
for (let i = 0; i < 2; i++) {
    const light = new THREE.SpotLight('yellow', 2, 100, Math.PI * 0.2, 0.2, 1)
    light.position.x = (i % 2 == 0 ? 1 : -1) * carBody.geometry.parameters.width * 0.37
    light.position.y = carBody.geometry.parameters.height + 0.1
    light.position.z = -carBody.geometry.parameters.depth / 2 + 0.3
    light.target.position.x = light.position.x - 10
    light.target.position.y = light.position.y
    light.target.position.z = light.position.z - 200
    light.castShadow = true
    carFrontLights.add(light.target)
    carFrontLights.add(light)
}
car.add(carFrontLights)

const carBackLights = new THREE.Group()
for (let i = 0; i < 2; i++) {
    const light = new THREE.PointLight('darkred', 0.7, 5)
    light.position.y = carBody.position.y * 0.1 + 0.6
    light.position.z = carBody.geometry.parameters.depth / 2 + 0.2
    light.position.x = (i % 2 == 0 ? 1 : -1) * carBody.geometry.parameters.width * 0.3
    light.castShadow = true
    carBackLights.add(light)
}
car.add(carBackLights)

const carCherryLights = new THREE.Group()
for (let i = 0; i < 2; i++) {
    const color = i < 1 ? 'red' : 'blue'
    const light = new THREE.PointLight(color, 10 , 2)
    light.position.y = carTop.position.y + carTop.geometry.parameters.height*2
    light.position.x = (i % 2 == 0 ? 1 : -1) * carTop.geometry.parameters.width * 0.5
    carCherryLights.add(light)
}
car.add(carCherryLights)
car.castShadow = true

scene.add(car)


/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight('#b9d5ff', 0.12)
gui.add(ambientLight, 'intensity').min(0).max(0.5).step(0.001).name('ambient light')
scene.add(ambientLight)

// Directional light
const moonLight = new THREE.DirectionalLight('#b9d5ff', 0.12)
moonLight.position.set(4, 5, - 2)
gui.add(moonLight, 'intensity').min(0).max(0.5).step(0.001).name('moonlight')
scene.add(moonLight)

 /* 
 * Fog
*/
const fogColor = '#262837'
const fog = new THREE.Fog(fogColor, 1, ground.geometry.parameters.width * 0.6)
scene.fog = fog

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
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
camera.position.x = 8
camera.position.y = 7
camera.position.z = 12
scene.add(camera)

const maxSpeed = 120
const controlParams = {
    speed: 25,
    left: () => {
        car.position.z = Math.min(car.position.z + 0.005 * controlParams.speed, road.geometry.parameters.height * 0.3)
    },
    right: () => {
        car.position.z = Math.max(car.position.z - 0.005 * controlParams.speed, -road.geometry.parameters.height * 0.3)
    },
    faster: () => {
        controlParams.speed = Math.min(controlParams.speed + 1, maxSpeed)
        updateSpeedGauge()
    },
    slower: () => {
        controlParams.speed = Math.max(controlParams.speed - 1, 0)
        updateSpeedGauge()
    }
}
function updateSpeedGauge() {
    document.querySelector('#speed-gauge').innerHTML = `${controlParams.speed} km/h`
}
updateSpeedGauge()
gui.add(controlParams, 'speed').min(0).max(maxSpeed).step(0.1).listen()

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// handle keyboad arrows event:
document.addEventListener('keydown', (event) => {
    // TODO: update control button css accordingly
    if (event.key == 'ArrowUp') {
        controlParams.faster()
    }
    if (event.key == 'ArrowDown') {
        controlParams.slower()
    }
    if (event.key == 'ArrowRight') {
        controlParams.right()
    }
    if (event.key == 'ArrowLeft') {
        controlParams.left()
    }
})

let controlIntervalId = null;
function handleLongClick(buttonId, callback) {
    const start = () => {
        if (!!controlIntervalId) {
            clearInterval(controlIntervalId)
            controlIntervalId = null
        }
        controlIntervalId = setInterval(() => {
            callback()
        }, 100)
    }
    const stop = (event) => {
        clearInterval(controlIntervalId)
        controlIntervalId = null
    }
    document.querySelector(buttonId).addEventListener('mousedown', start)
    document.querySelector(buttonId).addEventListener('mouseup', stop)
    document.querySelector(buttonId).addEventListener('touchstart', start)
    document.querySelector(buttonId).addEventListener('touchend', stop)
    document.querySelector(buttonId).addEventListener('touchmove', stop)
    document.querySelector(buttonId).addEventListener('touchcancel', stop)
    document.querySelector(buttonId).addEventListener('touchleave', stop)
}

handleLongClick("#up", () => {controlParams.faster()})
handleLongClick("#down", () => {controlParams.slower()})
handleLongClick("#left", () => {controlParams.left()})
handleLongClick("#right", () => {controlParams.right()})

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(fogColor)
renderer.shadowMap.enabled = true

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const deltaTime = clock.getDelta()
    const elapsedTime = clock.getElapsedTime()

    for (const [i, cherryLight] of carCherryLights.children.entries()) {
        cherryLight.intensity = (Math.sin(elapsedTime * 3) + 1) * 10  + 2
        cherryLight.position.x = Math.cos(
            (i == 0 ? 0 : 1) * Math.PI + elapsedTime * 5) 
    }

    for (const [i, terrain] of terrains.children.entries()) {
        if (terrain.position.x > ground.geometry.parameters.width) {
            terrain.position.x = terrains.children[(i+1)%2].position.x - ground.geometry.parameters.width + 1
        } else {
            terrain.position.x += deltaTime * (controlParams.speed / (60 * 60 / 1000))
        }
    }

    car.position.y = Math.sin(elapsedTime * controlParams.speed / 1.6) * 0.02
    car.rotation.z = Math.sin(elapsedTime * controlParams.speed / 1.6) * 0.02
    car.position.z += Math.sin(elapsedTime * controlParams.speed / 3.7) * 0.001

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
