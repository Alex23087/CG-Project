import { Controls } from "../common/Controls.js"
import { CameraIndex, Renderer } from "../common/Renderer.js"
import * as Shaders from "../common/Shaders.js"

var renderer: Renderer
var controls: Controls
var canvas: HTMLCanvasElement

function on_keyup(e: KeyboardEvent){
	controls.keyReleased(e.key);
}
function on_keydown(e: KeyboardEvent){
	controls.keyPressed(e.key);
}

window.onload = function (){
	canvas = document.getElementById("OUTPUT-CANVAS") as HTMLCanvasElement;
	renderer = new Renderer(canvas, Shaders.PhongSpotlightShader)
	controls = new Controls(renderer)
	renderer.canvas.addEventListener('mousemove', function(e: MouseEvent){controls.on_mouseMove(e)}, false);
	renderer.canvas.addEventListener('keydown', on_keydown, false);
	renderer.canvas.addEventListener('keyup', on_keyup, false);
	
	renderer.canvas.onclick = function (e) {
		controls.onClick(e)
	}
}

function update_camera(value: CameraIndex){
	controls.setCamera(value)
}

var wireframeCheckbox = document.getElementById("wireframe") as HTMLInputElement
wireframeCheckbox.onchange = function(e: Event){
	renderer.wireframeEnabled = wireframeCheckbox.checked as unknown as boolean
}

var cameraSelector = (document.getElementById("cameras") as HTMLSelectElement)
cameraSelector.onchange = function (){
	update_camera(cameraSelector.value as unknown as CameraIndex)
}

var shaderSelector = (document.getElementById("shader") as HTMLSelectElement)
shaderSelector.onchange = function (){
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
}