import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()


// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
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
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
)

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({
        map: grassColorTexture,
        aoMap: grassAmbientOcclusionTexture,
        normalMap: grassNormalTexture,
        roughnessMap: grassRoughnessTexture,
    })
)
ground.geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(floor.geometry.attributes.uv.array, 2))
ground.rotation.x = - Math.PI * 0.5
ground.receiveShadow = true

scene.add(ground)

// Car
const car = new THREE.Group()
car.rotation.y = Math.PI * 0.5

const carBody = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.5, 4),
    new THREE.MeshStandardMaterial({ color: '#0000ff' })
)
carBody.position.y = carBody.geometry.parameters.height * 0.5 + 0.4
carBody.castShadow = true
// carBody.geometry.center()
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
    const light = new THREE.PointLight('yellow', 2, 20)
    light.position.y = carBody.position.y * 0.1
    light.position.z = -carBody.geometry.parameters.depth 
    light.position.x = (i % 2 == 0 ? 1 : -1) * carBody.geometry.parameters.width * 0.3
    light.castShadow = true
    carFrontLights.add(light)
}
car.add(carFrontLights)

const carBackLights = new THREE.Group()
for (let i = 0; i < 2; i++) {
    const light = new THREE.PointLight('darkred', 0.5, 5)
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

scene.add(bushes)

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
scene.add(road)



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

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

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

const animationParams = {
    speed: 7
}

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    for (const [i, cherryLight] of carCherryLights.children.entries()) {
        cherryLight.intensity = (Math.sin(elapsedTime * 3) + 1) * 10  + 2
        cherryLight.position.x = Math.cos(
            (i == 0 ? 0 : 1) * Math.PI + elapsedTime * 5) 
    }

    grassColorTexture.offset.x = - elapsedTime * 0.01 * 10 * animationParams.speed
    grassAmbientOcclusionTexture.offset.x = grassColorTexture.offset.x
    grassNormalTexture.offset.x = grassColorTexture.offset.x
    grassRoughnessTexture.offset.x = grassColorTexture.offset.x

    for (const bush of bushes.children) {
        bush.position.x = 
            (bush.position.x + 0.01 * animationParams.speed) 
        if (bush.position.x > ground.geometry.parameters.width / 2) {
            bush.position.x = -ground.geometry.parameters.width / 2
        }
    }

    car.position.y = Math.sin(elapsedTime * animationParams.speed / 1.6) * 0.02
    car.rotation.z = Math.sin(elapsedTime * animationParams.speed / 1.6) * 0.02
    car.position.z = Math.cos(elapsedTime * animationParams.speed / 3.7) * 0.2

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

gui.add(animationParams, 'speed').min(0).max(18).step(0.1)