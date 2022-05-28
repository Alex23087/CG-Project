import { ChaseCamera, FollowFromUpCamera } from "../../common/Rendering/Cameras.js";
import { StringIndexedBooleanArray } from "../Game.js";
import { GameObject } from "../../common/Rendering/GameObject.js";
import { Shape } from "../../common/shapes/Shape.js";
import { ShaderMaterial } from "../../common/Rendering/ShaderMaterial.js";
import * as Shaders from "../../common/Rendering/Shaders.js"
import { Spotlight } from "../../common/Rendering/Spotlight.js";
import { Renderer } from "../../common/Rendering/Renderer.js";
import { Projector } from "../../common/Rendering/Projector.js";


export class Car extends GameObject{
	maxWheelsAngle = 0.15;
	wheelAngleIncrement = 0.006;

	max_speed: number = 0.4
	max_back_speed: number = 0.1
	isRotatingLeft: boolean = false
	isRotatingRight: boolean = false
	isAccelerating: boolean = false
	isBraking: boolean = false
	wheelsAngle: number
	speed: number
	angle: number
	direction: vec3
	control_keys: StringIndexedBooleanArray
	lastAnimationTime: number

	private audioTrack: AudioBufferSourceNode

	wheels: {
		frontLeft: GameObject
		frontRight: GameObject
		rearLeft: GameObject
		rearRight: GameObject
	}

	constructor(name: string, startPosition: vec3) {
		super(name, null, null)

		this.transform.position = startPosition

		this.wheelsAngle = 0;
		this.speed = 0;
		this.angle = Math.PI;
		this.direction = [0.0, 0.0, 0.0];
		this.control_keys = [] as unknown as StringIndexedBooleanArray;
		this.lastAnimationTime = -1.0;

		this.createChildren()

		this.playAudio("../../Assets/Sounds/vrooooooooom.mp3").then(at => this.audioTrack = at)
	}

	private createChildren(){
		new FollowFromUpCamera(this)
		new ChaseCamera(this)

		let leftLight = new Spotlight()
		leftLight.parent = this.transform
		leftLight.position = [-0.35, 0.6, -0.5]
		leftLight.direction = [0, -0.5, -1]
		leftLight.cutoff = 0.95
		leftLight.attenuation = 0.9
		leftLight.intensity = 0.2

		let rightLight = new Spotlight()
		rightLight.parent = this.transform
		rightLight.position = [0.35, 0.6, -0.5]
		rightLight.direction = [0, -0.5, -1]
		rightLight.cutoff = 0.95
		rightLight.attenuation = 0.9
		rightLight.intensity = 0.2

		let leftProjector = new Projector("LeftHeadlight", this, "../../Assets/Textures/headlight.png")
		leftProjector.transform.rotation[0] = -Math.PI / 16
		let rightProjector = new Projector("RightHeadlight", this, "../../Assets/Textures/headlight.png")
		rightProjector.transform.rotation[0] = -Math.PI / 16

		leftProjector.transform.position = [-0.2, 0.2, -0.5]
		rightProjector.transform.position = [0.2, 0.2, -0.5]

		var carHull = new GameObject("CarHull", this, Shape.cube)
		carHull.transform.position[1] += 0.6
		carHull.transform.scaling = [0.8, 0.3, 1]

		var wheelXScaling = 0.1

		var frontLeftWheel = new GameObject("FrontLeftWheel", this, Shape.cylinder)
		frontLeftWheel.transform.position = [-0.8, 0.2, -0.8]
		frontLeftWheel.transform.rotation = [0, 0, Math.PI / 2]
		frontLeftWheel.transform.scaling = [0.2, wheelXScaling, 0.2]

		var frontRightWheel = new GameObject("FrontRightWheel", this, Shape.cylinder)
		frontRightWheel.transform.position = [1, 0.2, -0.8]
		frontRightWheel.transform.rotation = [0, 0, Math.PI / 2]
		frontRightWheel.transform.scaling = [0.2, wheelXScaling, 0.2]

		var rearRightWheel = new GameObject("RearRightWheel", this, Shape.cylinder)
		rearRightWheel.transform.position = [1, 0.3, 0.8]
		rearRightWheel.transform.rotation = [0, 0, Math.PI / 2]
		rearRightWheel.transform.scaling = [0.3, wheelXScaling, 0.3]

		var rearLeftWheel = new GameObject("RearLeftWheel", this, Shape.cylinder)
		rearLeftWheel.transform.position = [-0.8, 0.3, 0.8]
		rearLeftWheel.transform.rotation = [0, 0, Math.PI / 2]
		rearLeftWheel.transform.scaling = [0.3, wheelXScaling, 0.3]

		this.wheels = {
			frontLeft: frontLeftWheel,
			frontRight: frontRightWheel,
			rearLeft: rearLeftWheel,
			rearRight: rearRightWheel
		}

		ShaderMaterial.create(Shaders.PhongSpotlightShader).then(wheelMaterial => {
			wheelMaterial.setColor([0.1, 0.1, 0.1, 1])

			this.wheels.frontLeft.material = wheelMaterial
			this.wheels.frontRight.material = wheelMaterial
			this.wheels.rearLeft.material = wheelMaterial
			this.wheels.rearRight.material = wheelMaterial
		})

		ShaderMaterial.create(Shaders.PhongSpotlightShader).then(carMaterial => {
			carMaterial.setColor([1, 0, 0, 1])
			carHull.material = carMaterial
		})
	}

	update(deltaT: number) {
		deltaT /= 1000;

		this.isRotatingLeft = this.control_keys['ArrowLeft'];
		this.isRotatingRight = this.control_keys['ArrowRight'];
		this.isAccelerating = this.control_keys['ArrowUp'];
		this.isBraking = this.control_keys['ArrowDown'];

		if (this.isRotatingLeft) {
			this.wheelsAngle += this.wheelAngleIncrement;
			if (this.wheelsAngle > this.maxWheelsAngle) {
				this.wheelsAngle = this.maxWheelsAngle;
			}
		} else if (this.isRotatingRight) {
			this.wheelsAngle -= this.wheelAngleIncrement;
			if (this.wheelsAngle < -this.maxWheelsAngle) {
				this.wheelsAngle = -this.maxWheelsAngle;
			}
		} else {
			this.wheelsAngle /= (1.0 + 0.5 * Math.abs(this.speed));
		}

		this.updateSpeed(deltaT);

		this.angle += this.wheelsAngle * this.speed * 0.8;

		let sinC = Math.sin(this.angle);
		let cosC = Math.cos(this.angle);


		this.direction = [cosC, 0, -sinC];

		this.transform.position[0] = this.transform.position[0] + this.direction[0] * this.speed;
		this.transform.position[2] = this.transform.position[2] + this.direction[2] * this.speed;

		this.isAccelerating = false;
		this.isRotatingLeft = false;
		this.isRotatingRight = false;
		this.isBraking = false;

		this.transform.position = this.transform.position
		this.transform.rotation[1] = this.angle - Math.PI / 2
		this.updateWheels()

		if((Renderer.instance.currentCamera as unknown as GameObject).name == "LateChaseCamera"){
			Renderer.instance.fov = Math.PI / 4
		}else{
			const alpha = Math.min(deltaT * 5, 1)
			Renderer.instance.fov = (Renderer.instance.fov * (1-alpha)) + ((Math.PI / 4 + this.speed) * alpha)
		}

		this.updatePitch()
	}

	private updateSpeed(deltaV: number) {
		if (this.isBraking) {
			deltaV /= (this.max_speed / this.max_back_speed);
		}

		if (this.isAccelerating && this.speed < 0 || this.isBraking && this.speed > 0) {
			this.speed *= 0.88;
		}
		if (!this.isAccelerating && !this.isBraking) {
			this.speed *= 0.95;
		} else if (this.isAccelerating) {
			this.speed += deltaV;
		} else if (this.isBraking) {
			this.speed -= deltaV;
		}

		if (this.speed > this.max_speed){
			this.speed = this.max_speed
			return
		}else if(this.speed < -this.max_back_speed) {
			this.speed = -this.max_back_speed
			return;
		}
	}

	private updateWheels(){
		var frontAngle = this.wheelsAngle
		this.wheels.frontLeft.transform.rotation[1] = frontAngle
		this.wheels.frontRight.transform.rotation[1] = frontAngle

		var rotation = this.speed

		this.wheels.frontLeft.transform.rotation[0] -= rotation
		this.wheels.frontRight.transform.rotation[0] -= rotation
		this.wheels.rearLeft.transform.rotation[0] -= rotation
		this.wheels.rearRight.transform.rotation[0] -= rotation
	}

	private async playAudio(filepath: string){
		const AudioContext = window.AudioContext || (window as any).webkitAudioContext
		const audioCtx: AudioContext = new AudioContext()
		const response = await fetch(filepath)
		const arrayBuffer = await response.arrayBuffer()
		const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
		const audioTrack = audioCtx.createBufferSource()
		audioTrack.buffer = audioBuffer
		audioTrack.connect(audioCtx.destination)
		audioTrack.start()
		audioTrack.loop = true
		return audioTrack
	}

	private updatePitch(){
		if(this.audioTrack){
			this.audioTrack.playbackRate.value = Math.abs(this.speed)/2.5 + 0.75
		}
	}
}
