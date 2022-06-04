import { Controls } from "./Game/Controls.js"
import { Game } from "./Game/Game.js"
import { Renderer } from "./common/Rendering/Renderer.js"
import * as Globals from "./Game/Globals.js"

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

	switch(Globals.renderer){
		case 0:{
			renderer.wireframeMode = 2
			wireframePicker.value = "2"
		}
		case 1:
		case 2:{
			renderer.disableSkybox()
			renderer.shadowMappingMode = 3

			chromaticAberrationCheckbox.checked = false
			quantizeCheckbox.checked = false
			skyboxCheckbox.checked = false
			scaleSlider.value = "1"
			cameraSelector.value = "1"
			shadowMappingModePicker.value = "3"
			framebufferPicker.value = "0"
			break
		}
		case 3:{
			renderer.chromaticAberration = true
			chromaticAberrationCheckbox.checked = true
		}
	}
}

function update_camera(value: number){
	controls.setCamera(value)
}

let scaleSlider = document.getElementById("scale") as HTMLInputElement
let scaleValue = document.getElementById("scaleValue") as HTMLInputElement
scaleSlider.oninput = (ev) => {
	renderer.setScale(scaleSlider.value as unknown as number)
	scaleValue.innerText = scaleSlider.value
}

let shadowMapScaleSlider = document.getElementById("shadowmapScale") as HTMLInputElement
let shadowmapScaleValue = document.getElementById("shadowmapScaleValue") as HTMLInputElement
shadowMapScaleSlider.oninput = (ev) => {
	renderer.setShadowmapScale(shadowMapScaleSlider.value as unknown as number)
	shadowmapScaleValue.innerText = shadowMapScaleSlider.value
}

var chromaticAberrationCheckbox = document.getElementById("chromaticAberration") as HTMLInputElement
chromaticAberrationCheckbox.onchange = function(e: Event){
	renderer.chromaticAberration = chromaticAberrationCheckbox.checked as unknown as boolean
}

var quantizeCheckbox = document.getElementById("quantize") as HTMLInputElement
quantizeCheckbox.onchange = function(e: Event){
	renderer.quantize = quantizeCheckbox.checked as unknown as boolean
}

var invertCheckbox = document.getElementById("invert") as HTMLInputElement
invertCheckbox.onchange = function(e: Event){
	renderer.invert = invertCheckbox.checked as unknown as boolean
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

var framebufferPicker = document.getElementById("framebuffer") as HTMLSelectElement
framebufferPicker.onchange = function (){
	renderer.showFramebuffer = parseInt(framebufferPicker.value)
}

var shadowMappingModePicker = document.getElementById("shadowmappingmode") as HTMLSelectElement
shadowMappingModePicker.onchange = function (){
	renderer.shadowMappingMode = parseInt(shadowMappingModePicker.value)
}

var wireframePicker = document.getElementById("wireframe") as HTMLSelectElement
wireframePicker.onchange = function (){
	renderer.wireframeMode = parseInt(wireframePicker.value)
}

chromaticAberrationCheckbox.checked = false
quantizeCheckbox.checked = false
invertCheckbox.checked = false
skyboxCheckbox.checked = true
scaleSlider.value = "1"
shadowMapScaleSlider.value = "2"
cameraSelector.value = "1"
shadowMappingModePicker.value = "1"
wireframePicker.value = "0"
framebufferPicker.value = "0"