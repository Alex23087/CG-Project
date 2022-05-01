import { Shape } from "./Shape.js"

class Triangle extends Shape {
	name = "triangle";
	vertices = new Float32Array([0.5,0.0,0.0, 0.0,0.0,-2.0, -0.5,0.0,0.0]);
	triangleIndices = new Uint16Array([0,1,2]);
	numVertices  = 3;
	numTriangles = 1;

	constructor(gl: WebGLRenderingContext){
		super()
		this.createObjectBuffers(gl)
	}
}
