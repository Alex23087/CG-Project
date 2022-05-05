import { Cube } from "./Cube"
import { Cylinder } from "./Cylinder"
import * as glMatrix from "../libs/gl-matrix/dist/esm/index.js"
import { Renderer } from "../Rendering/Renderer.js"

export abstract class Shape{
    abstract name: string
    abstract vertices: Float32Array
    abstract triangleIndices: Uint16Array
    abstract numVertices: number
    abstract numTriangles: number

    vertexBuffer: WebGLBuffer
	normals: Float32Array
	normalBuffer: WebGLBuffer
    indexBufferTriangles: WebGLBuffer
    indexBufferEdges: WebGLBuffer

	static cube: Cube
	static cylinder: Cylinder


	/*
	create the buffers for an object as specified in common/shapes/triangle.js
	*/
	protected createObjectBuffers() {
		let gl = Renderer.gl
		this.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		this.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		this.indexBufferTriangles = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBufferTriangles);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndices, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		// create edges
		var edges = new Uint16Array(this.numTriangles * 3 * 2);
		for (var i = 0; i < this.numTriangles; ++i) {
			edges[i * 6 + 0] = this.triangleIndices[i * 3 + 0];
			edges[i * 6 + 1] = this.triangleIndices[i * 3 + 1];
			edges[i * 6 + 2] = this.triangleIndices[i * 3 + 0];
			edges[i * 6 + 3] = this.triangleIndices[i * 3 + 2];
			edges[i * 6 + 4] = this.triangleIndices[i * 3 + 1];
			edges[i * 6 + 5] = this.triangleIndices[i * 3 + 2];
		}

		this.indexBufferEdges = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBufferEdges);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}

	private static vec3add( v3,i,rs){
		v3[i*3] 	+= rs[0];
		v3[i*3+1] += rs[1];
		v3[i*3+2] += rs[2];
	}

	private static vec3eq( v3,i,rs){
		v3 [i*3] 	  = rs [0];
		v3 [i*3+1]  = rs [1];
		v3 [i*3+2]  = rs [2];
	}

	protected computeNormals() {
		var nv = this.vertices.length/3;
		var nt = this.triangleIndices.length/ 3;
		
		this.normals = new Float32Array(nv*3);
		var star_size = new Float32Array(nv);
		
		for( var i = 0 ; i  < nv; ++i){
			star_size[i] = 0;
			this.normals[3*i] = 0.0;
			this.normals[3*i+1] = 0.0;
			this.normals[3*i+2] = 0.0;
		}
		
		for( var i = 0 ; i  < nt; ++i){
			var i_v  = [ this.triangleIndices[i*3+0], 	this.triangleIndices[i*3+1], 	this.triangleIndices[i*3+2]];
			
			var p0 = [this.vertices[3*i_v[0]+0],this.vertices[3*i_v[0]+1],this.vertices[3*i_v[0]+2]];
			var p1 = [this.vertices[3*i_v[1]+0],this.vertices[3*i_v[1]+1],this.vertices[3*i_v[1]+2]];
			var p2 = [this.vertices[3*i_v[2]+0],this.vertices[3*i_v[2]+1],this.vertices[3*i_v[2]+2]];
		
			var p01 = glMatrix.vec3.sub(glMatrix.vec3.create(),p1,p0);
			var p02 = glMatrix.vec3.sub(glMatrix.vec3.create(),p2,p0);
			var n = glMatrix.vec3.cross(glMatrix.vec3.create(),p02,p01);
			
			n = glMatrix.vec3.normalize(n,n);
			
			Shape.vec3add(this.normals,i_v[0],n);
			Shape.vec3add(this.normals,i_v[1],n);
			Shape.vec3add(this.normals,i_v[2],n);
		
			star_size[i_v[0]] += 1;
			star_size[i_v[1]] += 1;
			star_size[i_v[2]] += 1;
		}
		for( var i = 0 ; i  < nv; ++i){
			var n: vec3 = [ this.normals[ 3*i],	this.normals[ 3*i+1],	this.normals[ 3*i+2] ];

			glMatrix.vec3.mul(n,n,[1.0/star_size[i],1.0/star_size[i],1.0/star_size[i]]);
			n = glMatrix.vec3.normalize(n,n);
			
			Shape.vec3eq(this.normals,i,[-n[0],-n[1],-n[2]]);
		}
		
		this.numVertices = nv;
		this.numTriangles = this.triangleIndices.length/3;
	}

	public static isTexturedShape(object: any): object is TexturedShape{
		return 'texCoords' in object
	}
}

export interface TexturedShape{
	texCoords: Float32Array
}
