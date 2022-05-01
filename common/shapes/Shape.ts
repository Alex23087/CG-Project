export abstract class Shape{
    abstract name: string
    abstract vertices: Float32Array
    abstract triangleIndices: Uint16Array
    abstract numVertices: number
    abstract numTriangles: number

    vertexBuffer: WebGLBuffer
    indexBufferTriangles: WebGLBuffer
    indexBufferEdges: WebGLBuffer


	/*
	create the buffers for an object as specified in common/shapes/triangle.js
	*/
	protected createObjectBuffers(gl: WebGLRenderingContext) {

		this.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
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

	public static isTexturedShape(object: any): object is TexturedShape{
		return 'texCoords' in object
	}
}

export interface TexturedShape{
	texCoords: Float32Array
}