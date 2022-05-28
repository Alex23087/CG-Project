import { Controls } from "../Game/Controls.js"
import { Game } from "../Game/Game.js"
import { Renderer } from "../common/Rendering/Renderer.js"

var renderer: Renderer
var controls: Controls
var game: Game
var canvas: HTMLCanvasElement

function on_keyup(e: KeyboardEvent){
	controls.keyReleased(e.key);
}
function on_keydown(e: KeyboardEvent){
	controls.keyPressed(e.key);
}

var cameraSelector = (document.getElementById("cameras") as HTMLSelectElement)
cameraSelector.onchange = function (){
	update_camera(cameraSelector.value as unknown as number)
}

window.onload = function (){
	canvas = document.getElementById("OUTPUT-CANVAS") as HTMLCanvasElement;
	renderer = new Renderer(canvas)
	game = new Game(renderer)
	controls = new Controls(renderer, game, cameraSelector)
	renderer.canvas.addEventListener('mousemove', function(e: MouseEvent){controls.on_mouseMove(e)}, false)
	renderer.canvas.addEventListener('mouseup', controls.mouseup, false)
	renderer.canvas.addEventListener('mousedown', controls.mousedown, false)
	renderer.canvas.addEventListener('keydown', on_keydown, false)
	renderer.canvas.addEventListener('keyup', on_keyup, false)

	renderer.canvas.onclick = function (e) {
		controls.onClick(e)
	}
}

function update_camera(value: number){
	controls.setCamera(value)
}

/*var wireframeCheckbox = document.getElementById("wireframe") as HTMLInputElement
wireframeCheckbox.onchange = function(e: Event){
	renderer.wireframeEnabled = wireframeCheckbox.checked as unknown as boolean
}

var shaderSelector = (document.getElementById("shader") as HTMLSelectElement)
/*shaderSelector.onchange = function (){
	switch(shaderSelector.value){
		default:
		case "0":
			Shaders.Shader.create(Shaders.UniformShader, renderer.gl).then( shader => {
				renderer.shader = shader
			})
		break;
		case "1":
			Shaders.Shader.create(Shaders.PhongShader, renderer.gl).then( shader => {
				renderer.shader = shader
			})
		break;
		case "2":
			Shaders.Shader.create(Shaders.PhongSpotlightShader, renderer.gl).then( shader => {
				renderer.shader = shader
			})
		break;
	}
}*/

let scaleSlider = document.getElementById("scale") as HTMLInputElement
let scaleValue = document.getElementById("scaleValue") as HTMLInputElement
scaleSlider.oninput = (ev) => {
	renderer.setScale(scaleSlider.value as unknown as number)
	scaleValue.innerText = scaleSlider.value
}

var chromaticAberrationCheckbox = document.getElementById("chromaticAberration") as HTMLInputElement
chromaticAberrationCheckbox.onchange = function(e: Event){
	renderer.postProcessingEnabled = chromaticAberrationCheckbox.checked as unknown as boolean
}

var quantizeCheckbox = document.getElementById("quantize") as HTMLInputElement
quantizeCheckbox.onchange = function(e: Event){
	renderer.quantize = quantizeCheckbox.checked as unknown as boolean
}

var skyboxCheckbox = document.getElementById("skybox") as HTMLInputElement
skyboxCheckbox.onchange = function(e: Event){
	if(skyboxCheckbox.checked as unknown as boolean){
		renderer.setSkybox({
			posX: "../../Assets/Textures/cubemap/posx.jpg",
			negX: "../../Assets/Textures/cubemap/negx.jpg",
			posY: "../../Assets/Textures/cubemap/posy.jpg",
			negY: "../../Assets/Textures/cubemap/negy.jpg",
			posZ: "../../Assets/Textures/cubemap/posz.jpg",
			negZ: "../../Assets/Textures/cubemap/negz.jpg"
		})
	}else{
		renderer.disableSkybox()
	}
}

var shadowmapCheckbox = document.getElementById("shadowmap") as HTMLInputElement
shadowmapCheckbox.onchange = function(e: Event){
	renderer.showShadowMap = shadowmapCheckbox.checked as unknown as boolean
}

var varianceShadowMappingCheckbox = document.getElementById("varianceshadowmapping") as HTMLInputElement
varianceShadowMappingCheckbox.onchange = function(e: Event){
	renderer.varianceShadowMapping = varianceShadowMappingCheckbox.checked as unknown as boolean
}

chromaticAberrationCheckbox.checked = false
skyboxCheckbox.checked = true
scaleSlider.value = "1"
cameraSelector.value = "1"