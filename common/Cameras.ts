import * as glMatrix from "./libs/gl-matrix/dist/esm/index.js"

export abstract class Camera{
	frame: vec4
	inverseViewMatrix: mat4
	abstract update(car_position: vec4): void
}
/*
the FollowFromUpCamera always looks at the car from a position right above the car
*/
export class FollowFromUpCamera extends Camera{
	constructor(){
		super()
		/* the only data it needs is the position of the camera */
		this.frame = glMatrix.vec4.create()
		
	}
		/* update the camera with the current car position */
	update(car_position: vec4){
		this.frame = car_position
		this.updateInverseViewMatrix()
	}

	/* return the transformation matrix to transform from world coordinates to the view reference frame */
	private updateInverseViewMatrix(){
		let eye = glMatrix.vec3.create()
		let target = glMatrix.vec3.create()
		let up = glMatrix.vec4.create()
		
		glMatrix.vec3.transformMat4(eye, [0, 50, 0], this.frame)
		glMatrix.vec3.transformMat4(target, [0.0, 0.0, 0.0, 1.0], this.frame)
		glMatrix.vec4.transformMat4(up, [0.0, 0.0, -1, 0.0], this.frame)
		
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
export class ChaseCamera extends Camera{
	private localEye: vec3 = [0, 3, 8, 1.0]
	private localTarget: vec3 = [0.0, 1.0, 0.0, 1.0]
	private worldEye: vec3
	private worldTarget: vec3

	constructor(){
		super()
		this.frame = glMatrix.vec4.create()
		this.worldEye = glMatrix.vec3.create()
		this.worldTarget = glMatrix.vec3.create()
	}
	
	/* update the camera with the current car position */
	update(car_frame: vec4){
		this.frame = (car_frame as number[]).slice()
		this.updateInverseViewMatrix()
	}

	/* return the transformation matrix to transform from worlod coordiantes to the view reference frame */
	private updateInverseViewMatrix(){
		glMatrix.vec3.transformMat4(this.worldEye, this.localEye, this.frame)
		glMatrix.vec3.transformMat4(this.worldTarget, this.localTarget, this.frame)
		this.inverseViewMatrix = glMatrix.mat4.lookAt(glMatrix.mat4.create(), this.worldEye, this.worldTarget, [0, 1, 0])
	}
}