import { StringIndexedBooleanArray } from "./Game";
import { GameObject } from "./GameObject.js";
import { Shape } from "./shapes/Shape.js";


export class Car extends GameObject{
	maxWheelsAngle = 0.15;
	wheelAngleIncrement = 0.006;

	max_speed: number = 0.4
	max_back_speed: number = 0.1
	isRotatingLeft: boolean = false
	isRotatingRight: boolean = false
	isAccelerating: boolean = false
	isBraking: boolean = false
	wheelsAngle: number;
	speed: number;
	angle: number;
	direction: vec3;
	control_keys: StringIndexedBooleanArray;
	lastAnimationTime: number;

	constructor(name: string, startPosition: vec3) {
		super(name, null, null)

		this.transform.position = startPosition

		this.wheelsAngle = 0;
		this.speed = 0;
		this.angle = Math.PI;
		this.direction = [0.0, 0.0, 0.0];
		this.transform.position = [0.0, 0.0, 0.0];
		this.control_keys = [] as unknown as StringIndexedBooleanArray;
		this.lastAnimationTime = -1.0;

		this.createChildren()
	}

	private createChildren(){
		var carHull = new GameObject("CarHull", this, Shape.cube)
		carHull.transform.position[1] += 0.6
		carHull.transform.scaling = [0.8, 0.3, 1]

		var wheelXScaling = 0.1

		var frontLeftWheel = new GameObject("FrontLeftWheel", this, Shape.cylinder)
		frontLeftWheel.transform.pivotAdjustment = [1, 0, 0]
		frontLeftWheel.transform.position = [-0.9, 0.2, -0.8]
		frontLeftWheel.transform.rotation = [0, 0, Math.PI / 2]
		frontLeftWheel.transform.scaling = [wheelXScaling, 0.2, 0.2]

		var frontRightWheel = new GameObject("FrontRightWheel", this, Shape.cylinder)
		frontRightWheel.transform.pivotAdjustment = [1, 0, 0]
		frontRightWheel.transform.position = [0.9, 0.2, -0.8]
		frontRightWheel.transform.rotation = [0, 0, Math.PI / 2]
		frontRightWheel.transform.scaling = [wheelXScaling, 0.2, 0.2]

		var rearRightWheel = new GameObject("RearRightWheel", this, Shape.cylinder)
		rearRightWheel.transform.pivotAdjustment = [1, 0, 0]
		rearRightWheel.transform.position = [0.9, 0.3, 0.8]
		rearRightWheel.transform.rotation = [0, 0, Math.PI / 2]
		rearRightWheel.transform.scaling = [wheelXScaling, 0.3, 0.3]

		var rearLeftWheel = new GameObject("RearLeftWheel", this, Shape.cylinder)
		rearLeftWheel.transform.pivotAdjustment = [1, 0, 0]
		rearLeftWheel.transform.position = [-0.9, 0.3, 0.8]
		rearLeftWheel.transform.rotation = [0, 0, Math.PI / 2]
		rearLeftWheel.transform.scaling = [wheelXScaling, 0.3, 0.3]
	}

	update_step(currTime: number) {
		if (this.lastAnimationTime === -1) {
			this.lastAnimationTime = currTime;
			return;
		}

		var deltaV = (currTime - this.lastAnimationTime);
		deltaV /= 1000;

		this.lastAnimationTime = currTime;
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

		this.updateSpeed(deltaV);

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
	}

	private updateSpeed(deltaV: number) {
		if (this.isBraking) {
			deltaV /= (this.max_speed / this.max_back_speed);
		}

		if (this.speed > this.max_speed || this.speed < -this.max_back_speed) {
			this.speed *= 0.9;
			return;
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
	}
}
