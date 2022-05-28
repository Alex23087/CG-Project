import { GameObject } from "./GameObject.js"
import * as glMatrix from "../libs/gl-matrix/dist/esm/index.js"
import { Transform } from "./Transform.js"
import { Renderer } from "./Renderer.js"

export interface Camera{
	viewMatrix: mat4
	mouseMoved(coords: vec2): void
	projectionMatrix(fov: number, ratio: number): mat4
}
/*
the FollowFromUpCamera always looks at the car from a position right above the car
*/
export class FollowFromUpCamera extends GameObject implements Camera{
	viewMatrix: mat4

	constructor(parent: GameObject){
		super("FollowFromUpCamera", parent, null)
	}
		/* update the camera with the current car position */
	update(deltaT: number){
		this.updateInverseViewMatrix()
	}

	mouseMoved(coords: vec2): void {}

	/* return the transformation matrix to transform from world coordinates to the view reference frame */
	private updateInverseViewMatrix(){
		let eye = glMatrix.vec3.create()
		let target = glMatrix.vec3.create()
		let up = glMatrix.vec4.create()
		
		let frame = this.transform.getWorldMatrix()

		glMatrix.vec3.transformMat4(eye, [0, 30, 0], frame)
		glMatrix.vec3.transformMat4(target, [0.0, 0.0, 0.0, 1.0], frame)
		glMatrix.vec4.transformMat4(up, [0.0, 0.0, -1, 0.0], frame)
		
		this.viewMatrix = glMatrix.mat4.lookAt(
			glMatrix.mat4.create(),
			eye,
			target,
			(up as number[]).slice(0,3)
		)
	}

	projectionMatrix(fov: number, ratio: number): mat4 {
		return glMatrix.mat4.perspective(glMatrix.mat4.create(), fov, ratio, 0.1, 200)
	}
}

/*
the ChaseCamera always look at the car from behind the car, slightly above
*/
export class ChaseCamera extends GameObject implements Camera{
	viewMatrix: mat4
	private localEye: vec3 = [0, 3, 8, 1.0]
	private localTarget: vec3 = [0.0, 1.0, 0.0, 1.0]
	private worldEye: vec3
	private worldTarget: vec3
	private mouseOffset: vec2

	constructor(parent: GameObject){
		super("ChaseCamera", parent, null)
		this.worldEye = glMatrix.vec3.create()
		this.worldTarget = glMatrix.vec3.create()
		this.mouseOffset = [0, 0]
	}

	public mouseMoved(coords: vec2){
		this.mouseOffset = coords
	}
	
	/* update the camera with the current car position */
	update(deltaT: number){
		this.updateInverseViewMatrix()
	}

	/* return the transformation matrix to transform from worlod coordiantes to the view reference frame */
	private updateInverseViewMatrix(){
		var tmp = []
		tmp[0] = this.localEye[0] - this.mouseOffset[0]
		tmp[1] = this.localEye[1] + this.mouseOffset[1]
		tmp[2] = this.localEye[2]

		let frame = this.transform.getWorldMatrix()

		//console.log(tmp)
		glMatrix.vec3.transformMat4(this.worldEye, tmp, frame)
		glMatrix.vec3.transformMat4(this.worldTarget, this.localTarget, frame)
		this.viewMatrix = glMatrix.mat4.lookAt(glMatrix.mat4.create(), this.worldEye, this.worldTarget, [0, 1, 0])
	}

	projectionMatrix(fov: number, ratio: number): mat4 {
		return glMatrix.mat4.perspective(glMatrix.mat4.create(), fov, ratio, 0.1, 200)
	}
}

export class LateChaseCamera extends GameObject implements Camera{
	viewMatrix: mat4
	private localEye: vec3 = [0, 3, 8, 1.0]
	private localTarget: vec3 = [0.0, 1.0, 0.0, 1.0]
	private worldEye: vec3
	private worldTarget: vec3
	private mouseOffset: vec2

	private followed: Transform
	private previous: mat4[]
	private delay: number

	constructor(parent: GameObject, delay: number){
		super("LateChaseCamera", null, null)
		Renderer.instance.addObjectToScene(this)
		this.worldEye = glMatrix.vec3.create()
		this.worldTarget = glMatrix.vec3.create()
		this.mouseOffset = [0, 0]
		this.followed = parent.transform
		this.previous = []
		this.delay = delay
	}

	public mouseMoved(coords: vec2){
		this.mouseOffset = coords
	}
	
	/* update the camera with the current car position */
	update(deltaT: number){
		this.updateInverseViewMatrix()
	}

	/* return the transformation matrix to transform from worlod coordiantes to the view reference frame */
	private updateInverseViewMatrix(){
		var tmp = []
		tmp[0] = this.localEye[0] - this.mouseOffset[0]
		tmp[1] = this.localEye[1] + this.mouseOffset[1]
		tmp[2] = this.localEye[2]

		this.previous.push(this.followed.getWorldMatrix())
		let frame = this.previous[0]
		if(this.previous.length > this.delay){
			this.previous = this.previous.slice(1)
		}

		//console.log(tmp)
		glMatrix.vec3.transformMat4(this.worldEye, tmp, frame)
		glMatrix.vec3.transformMat4(this.worldTarget, this.localTarget, frame)
		this.viewMatrix = glMatrix.mat4.lookAt(glMatrix.mat4.create(), this.worldEye, this.worldTarget, [0, 1, 0])
	}

	projectionMatrix(fov: number, ratio: number): mat4 {
		return glMatrix.mat4.perspective(glMatrix.mat4.create(), fov, ratio, 0.1, 200)
	}
}

export class FreeCamera extends GameObject implements Camera{
	viewMatrix: mat4
	movement: vec3
	private rotationDelta: vec2 = [0,0]
	private previousMouseCoords: vec2 = [0,0]
	private rotation: vec2 = [0,0]
	private mousePressed: boolean = false

	constructor(){
		super("FreeCamera", null, null)
		Renderer.instance.addObjectToScene(this)
		this.movement = [0,0,0]
		this.viewMatrix = glMatrix.mat4.create()
	}

	mouseMoved(coords: vec2): void {
		if(!this.mousePressed){
			return
		}
		glMatrix.vec2.sub(this.rotationDelta, this.previousMouseCoords, coords)
		this.previousMouseCoords = coords
	}

	public update(deltaT: number): void {
		var translation = glMatrix.mat4.create()
		glMatrix.mat4.fromTranslation(translation, this.movement)

		glMatrix.mat4.mul(this.viewMatrix, translation, this.viewMatrix)

		var rotation = glMatrix.mat4.create()
		glMatrix.mat4.fromXRotation(rotation, this.rotationDelta[1] * 0.2)
		glMatrix.mat4.mul(this.viewMatrix, rotation, this.viewMatrix)

		rotation = glMatrix.mat4.create()
		glMatrix.mat4.fromYRotation(rotation, this.rotationDelta[0] * 0.2)
		glMatrix.mat4.mul(this.viewMatrix, rotation, this.viewMatrix)

		this.rotationDelta = [0,0]
	}

	public mouseup(){
		this.mousePressed = false
	}

	public mousedown(amount){
		this.mousePressed = true
		console.log(this.previousMouseCoords)
		this.previousMouseCoords = amount
		console.log(this.previousMouseCoords)
	}

	projectionMatrix(fov: number, ratio: number): mat4 {
		return glMatrix.mat4.perspective(glMatrix.mat4.create(), fov, ratio, 0.1, 200)
	}
}