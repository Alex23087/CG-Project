import { Shape, TexturedShape } from "./Shape.js"
///// CUBE DEFINTION
/////
///// Cube is defined to be centered at the origin of the coordinate reference system. 
///// Cube size is assumed to be 2.0 x 2.0 x 2.0 .
export class Cube extends Shape implements TexturedShape {
	name = "cube"
	texCoordsBuffer: WebGLBuffer
	
	// vertices definition
	////////////////////////////////////////////////////////////
	vertices = new Float32Array([
		-1.0, -1.0,  1.0,
		 1.0, -1.0,  1.0,
		-1.0,  1.0,  1.0,
		 1.0,  1.0,  1.0,
		-1.0, -1.0, -1.0,
		 1.0, -1.0, -1.0,
		-1.0,  1.0, -1.0,
		 1.0,  1.0, -1.0
	])

	texCoords = new Float32Array([
		0, 1,
		1, 1,
		0, 0,
		1, 0,
		1, 1,
		0, 1,
		1, 0,
		0, 0
	])

	// triangles definition
	////////////////////////////////////////////////////////////
	
	triangleIndices = new Uint16Array([
		0, 1, 2,  2, 1, 3,  // front
		5, 4, 7,  7, 4, 6,  // back
		4, 0, 6,  6, 0, 2,  // left
		1, 5, 3,  3, 5, 7,  // right
		2, 3, 6,  6, 3, 7,  // top
		4, 5, 0,  0, 5, 1   // bottom
	])
	
	numVertices = this.vertices.length/3
	numTriangles = this.triangleIndices.length/3

	constructor(){
		super()
		this.computeNormals()
		this.createObjectBuffers()
	}
}