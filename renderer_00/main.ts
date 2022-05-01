import { Controls } from "../common/Controls.js"
import { CameraIndex, Renderer } from "../common/Renderer.js"

var renderer: Renderer
var controls: Controls
var canvas: HTMLCanvasElement

function on_mouseMove(e){}

function on_keyup(e: KeyboardEvent){
	controls.keyReleased(e.key);
}
function on_keydown(e: KeyboardEvent){
	controls.keyPressed(e.key);
}

window.onload = function (){
	canvas = document.getElementById("OUTPUT-CANVAS") as HTMLCanvasElement;
	renderer = new Renderer(canvas)
	controls = new Controls(renderer)
	//Controls.injectControls(Game.cars[0])
	renderer.canvas.addEventListener('mousemove', on_mouseMove, false);
	renderer.canvas.addEventListener('keydown', on_keydown, false);
	renderer.canvas.addEventListener('keyup', on_keyup, false);
}

function update_camera(value: CameraIndex){
	controls.setCamera(value)
}

var selector = (document.getElementById("cameras") as HTMLSelectElement)
selector.onchange = function (){
	update_camera(selector.value as unknown as CameraIndex)
}