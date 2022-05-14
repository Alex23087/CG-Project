import { Controls } from "../common/Controls.js"
import { Game } from "../common/Game.js"
import { Renderer } from "../common/Rendering/Renderer.js"
import * as Shaders from "../common/Rendering/Shaders.js"

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

window.onload = function (){
	canvas = document.getElementById("OUTPUT-CANVAS") as HTMLCanvasElement;
	renderer = new Renderer(canvas)
	game = new Game(renderer)
	controls = new Controls(renderer, game)
	renderer.canvas.addEventListener('mousemove', function(e: MouseEvent){controls.on_mouseMove(e)}, false);
	renderer.canvas.addEventListener('keydown', on_keydown, false);
	renderer.canvas.addEventListener('keyup', on_keyup, false);
	
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

var cameraSelector = (document.getElementById("cameras") as HTMLSelectElement)
cameraSelector.onchange = function (){
	update_camera(cameraSelector.value as unknown as number)
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
	renderer.scale = scaleSlider.value as unknown as number
	scaleValue.innerText = scaleSlider.value
}

var postProcessingCheckbox = document.getElementById("postprocessing") as HTMLInputElement
postProcessingCheckbox.onchange = function(e: Event){
	renderer.postProcessingEnabled = postProcessingCheckbox.checked as unknown as boolean
}

var skyboxCheckbox = document.getElementById("skybox") as HTMLInputElement
skyboxCheckbox.onchange = function(e: Event){
	if(skyboxCheckbox.checked as unknown as boolean){
		renderer.setSkybox({
			posX: "../common/textures/cubemap/posx.jpg",
			negX: "../common/textures/cubemap/negx.jpg",
			posY: "../common/textures/cubemap/posy.jpg",
			negY: "../common/textures/cubemap/negy.jpg",
			posZ: "../common/textures/cubemap/posz.jpg",
			negZ: "../common/textures/cubemap/negz.jpg"
		})
	}else{
		renderer.disableSkybox()
	}
}

postProcessingCheckbox.checked = true
skyboxCheckbox.checked = true
scaleSlider.value = "1"