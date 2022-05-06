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

var wireframeCheckbox = document.getElementById("wireframe") as HTMLInputElement
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