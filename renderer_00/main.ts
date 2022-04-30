import { Controls } from "../common/Controls.js"
import { CameraIndex, Renderer } from "../common/Renderer.js"

var renderer: Renderer

function on_mouseMove(e){}

function on_keyup(e: KeyboardEvent){
	Controls.keyReleased(renderer, e.key);
}
function on_keydown(e: KeyboardEvent){
	Controls.keyPressed(renderer, e.key);
}

window.onload = function (){
	renderer = new Renderer()
	renderer.initializeAndDisplay()
	//Controls.injectControls(Game.cars[0])
	renderer.canvas.addEventListener('mousemove', on_mouseMove, false);
	renderer.canvas.addEventListener('keydown', on_keydown, false);
	renderer.canvas.addEventListener('keyup', on_keyup, false);
}

function update_camera(value: CameraIndex){
	renderer.currentCamera = value;
}

var selector = (document.getElementById("cameras") as HTMLSelectElement)
selector.onchange = function (){
	update_camera(selector.value as unknown as CameraIndex)
}