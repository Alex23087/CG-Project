import { ChaseCamera, FollowFromUpCamera } from "../../common/Rendering/Cameras.js"
import { StringIndexedBooleanArray } from "../Game.js"
import { GameObject } from "../../common/Rendering/GameObject.js"
import { Shape } from "../../common/shapes/Shape.js"
import { ShaderMaterial } from "../../common/Rendering/ShaderMaterial.js"
import * as Shaders from "../../common/Rendering/Shaders.js"
import { Spotlight } from "../../common/Rendering/Spotlight.js"
import { Renderer } from "../../common/Rendering/Renderer.js"
import { Projector } from "../../common/Rendering/Projector.js"
import * as Globals from "../Globals.js"


export class Car extends GameObject{
	private maxWheelsAngle = 0.15;
	private wheelAngleIncrement = 0.006;

	private max_speed: number = 0.4
	private max_back_speed: number = 0.1
	private isRotatingLeft: boolean = false
	private isRotatingRight: boolean = false
	private isAccelerating: boolean = false
	private isBraking: boolean = false
	private wheelsAngle: number
	private speed: number
	private angle: number
	private direction: vec3
	control_keys: StringIndexedBooleanArray
	private lastAnimationTime: number

	private audioTrack: AudioBufferSourceNode

	private wheels: {
		frontLeft: GameObject
		frontRight: GameObject
		rearLeft: GameObject
		rearRight: GameObject
	}

	private headlights: {
		projectorLeft: Projector
		projectorRight: Projector
		spotlightLeft: Spotlight
		spotlightRight: Spotlight
	}
	private headlightMode: number = 2

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

		this.headlights = {} as any

		this.headlights.spotlightLeft = new Spotlight()
		this.headlights.spotlightLeft.parent = this.transform
		this.headlights.spotlightLeft.position = [-0.35, 0.6, -0.5]
		this.headlights.spotlightLeft.direction = [0, -0.5, -1]
		this.headlights.spotlightLeft.cutoff = 0.95
		this.headlights.spotlightLeft.attenuation = 0.9

		this.headlights.spotlightRight = new Spotlight()
		this.headlights.spotlightRight.parent = this.transform
		this.headlights.spotlightRight.position = [0.35, 0.6, -0.5]
		this.headlights.spotlightRight.direction = [0, -0.5, -1]
		this.headlights.spotlightRight.cutoff = 0.95
		this.headlights.spotlightRight.attenuation = 0.9

		this.headlights.projectorLeft = new Projector("LeftHeadlight", this, "../../Assets/Textures/headlight.png", Math.PI / 4, 1)
		this.headlights.projectorLeft.transform.rotation[0] = -Math.PI / 16
		this.headlights.projectorRight = new Projector("RightHeadlight", this, "../../Assets/Textures/headlight.png", Math.PI / 4, 1)
		this.headlights.projectorRight.transform.rotation[0] = -Math.PI / 16

		this.headlights.projectorLeft.transform.position = [-0.3, 0.7, -0.5]
		this.headlights.projectorRight.transform.position = [0.3, 0.7, -0.5]

		this.setHeadlights()

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

		switch(Globals.renderer){
			case 0:{
				ShaderMaterial.create(Shaders.UniformShader).then(wheelMaterial => {
					wheelMaterial.setColor([0.1, 0.1, 0.1, 1])
		
					this.wheels.frontLeft.material = wheelMaterial
					this.wheels.frontRight.material = wheelMaterial
					this.wheels.rearLeft.material = wheelMaterial
					this.wheels.rearRight.material = wheelMaterial
				})
		
				ShaderMaterial.create(Shaders.UniformShader).then(carMaterial => {
					carMaterial.setColor([1, 0, 0, 1])
					carHull.material = carMaterial
				})
				break
			}
			default:{
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
		}
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
		if(Globals.renderer == 0){
			return
		}
		var frontAngle = this.wheelsAngle
		this.wheels.frontLeft.transform.rotation[1] = frontAngle * 2
		this.wheels.frontRight.transform.rotation[1] = frontAngle * 2

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

	toggleHeadlights(){
		this.headlightMode = (this.headlightMode + 1) % 4
		this.setHeadlights()
	}

	private setHeadlights(){
		switch(this.headlightMode){
			case 0:
				this.headlights.projectorLeft.intensity = 0.3
				this.headlights.projectorRight.intensity = 0.3
				this.headlights.spotlightLeft.intensity = 0
				this.headlights.spotlightRight.intensity = 0
				break
			case 1:
				this.headlights.projectorLeft.intensity = 0
				this.headlights.projectorRight.intensity = 0
				this.headlights.spotlightLeft.intensity = 0.2
				this.headlights.spotlightRight.intensity = 0.2
				break
			case 2:
				this.headlights.projectorLeft.intensity = 0.2
				this.headlights.projectorRight.intensity = 0.2
				this.headlights.spotlightLeft.intensity = 0.15
				this.headlights.spotlightRight.intensity = 0.15
				break
			case 3:
				this.headlights.projectorLeft.intensity = 0
				this.headlights.projectorRight.intensity = 0
				this.headlights.spotlightLeft.intensity = 0
				this.headlights.spotlightRight.intensity = 0
				break
		}
	}
}
