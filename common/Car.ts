import * as glMatrix from "./libs/gl-matrix/dist/esm/index.js";
import { StringIndexedBooleanArray } from "./Game";


export class Car {
	maxWheelsAngle = 0.15;
	wheelAngleIncrement = 0.006;

	name: string;
	position: vec3;
	max_speed: number;
	max_back_speed: number;
	isRotatingLeft: boolean;
	isRotatingRight: boolean;
	isAccelerating: boolean;
	isBraking: boolean;
	wheelsAngle: number;
	speed: number;
	angle: number;
	direction: vec3;
	control_keys: StringIndexedBooleanArray;
	frame: mat4;
	lastAnimationTime: number;

	constructor(name: string, start_position: vec3) {
		this.name = name;
		this.position = start_position;
		this.max_speed = 0.4;
		this.max_back_speed = 0.1;

		this.isRotatingLeft = false;
		this.isRotatingRight = false;
		this.isAccelerating = false;
		this.isBraking = false;
		this.wheelsAngle = 0;
		this.speed = 0;
		this.angle = Math.PI;
		this.direction = [0.0, 0.0, 0.0];
		this.position = [0.0, 0.0, 0.0];
		this.control_keys = [] as unknown as StringIndexedBooleanArray;
		this.frame = glMatrix.mat4.create();
		this.lastAnimationTime = -1.0;
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

		this.position[0] = this.position[0] + this.direction[0] * this.speed;
		this.position[2] = this.position[2] + this.direction[2] * this.speed;

		this.isAccelerating = false;
		this.isRotatingLeft = false;
		this.isRotatingRight = false;
		this.isBraking = false;


		var o = this.position;
		var y_axis = [0, 1, 0];
		var z_axis = [-this.direction[0], -this.direction[1], -this.direction[2]];
		var x_axis = glMatrix.vec3.create();
		glMatrix.vec3.cross(x_axis, y_axis, z_axis);

		glMatrix.mat4.set(this.frame,
			x_axis[0], x_axis[1], x_axis[2], 0.0,
			y_axis[0], y_axis[1], y_axis[2], 0.0,
			z_axis[0], z_axis[1], z_axis[2], 0.0,
			o[0], o[1], o[2], 1.0
		);
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
