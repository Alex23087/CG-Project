import { GameObject } from "./GameObject.js"
import * as glMatrix from "../libs/gl-matrix/dist/esm/index.js"

export interface Camera{
	inverseViewMatrix: mat4
	mouseMoved(coords: vec2): void
}
/*
the FollowFromUpCamera always looks at the car from a position right above the car
*/
export class FollowFromUpCamera extends GameObject implements Camera{
	inverseViewMatrix: mat4

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

		glMatrix.vec3.transformMat4(eye, [0, 10, 0], frame)
		glMatrix.vec3.transformMat4(target, [0.0, 0.0, 0.0, 1.0], frame)
		glMatrix.vec4.transformMat4(up, [0.0, 0.0, -1, 0.0], frame)
		
		this.inverseViewMatrix = glMatrix.mat4.lookAt(
			glMatrix.mat4.create(),
			eye,
			target,
			(up as number[]).slice(0,3)
		)
	}
}

/*
the ChaseCamera always look at the car from behind the car, slightly above
*/
export class ChaseCamera extends GameObject implements Camera{
	inverseViewMatrix: mat4
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
		this.inverseViewMatrix = glMatrix.mat4.lookAt(glMatrix.mat4.create(), this.worldEye, this.worldTarget, [0, 1, 0])
	}
}