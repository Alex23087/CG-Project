export abstract class Shader{
	public program: WebGLProgram

	protected abstract name: string

	static async create<T extends Shader>(type: {new(): T}, gl: WebGLRenderingContext): Promise<T> {
		var shader = new type()
		await Shader._compileProgram(shader, gl)
		shader._bindAttribs(gl)
		shader._getLocations(gl)
		return shader
	}

	protected static async _compileProgram(shader: Shader, gl: WebGLRenderingContext){
		var response = await fetch('/common/shaders/' + shader.name + 'Vertex.glsl')
		var vertexShaderSource = await response.text()

		response = await fetch('/common/shaders/' + shader.name + 'Fragment.glsl')
		var fragmentShaderSource = await response.text()

		// create the vertex shader
		var vertexShader = gl.createShader(gl.VERTEX_SHADER)
		gl.shaderSource(vertexShader, vertexShaderSource)
		gl.compileShader(vertexShader)

		// create the fragment shader
		var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
		gl.shaderSource(fragmentShader, fragmentShaderSource)
		gl.compileShader(fragmentShader)

		shader.program = gl.createProgram()
		gl.attachShader(shader.program, vertexShader)
		gl.attachShader(shader.program, fragmentShader)

		gl.linkProgram(shader.program)

		// If creating the shader program failed, alert
		if (!gl.getProgramParameter(shader.program, gl.LINK_STATUS)) {
			var str = "Unable to initialize the shader program.\n\n"
			str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n"
			str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n"
			str += "PROG:\n" + gl.getProgramInfoLog(shader.program)
			alert(str)
		}
	}

	protected abstract _bindAttribs(gl: WebGLRenderingContext): void
	protected abstract _getLocations(gl: WebGLRenderingContext): void
}

interface PositionableShader{
	aPositionIndex: 0
}

interface ColorableShader{
	uColorLocation: WebGLUniformLocation
}

interface MVMatrixShader{
	uModelViewMatrixLocation: WebGLUniformLocation
}

interface ProjectionMatrixShader{
	uProjectionMatrixLocation: WebGLUniformLocation
}

export function isPositionable(object: any): object is PositionableShader{
	return 'aPositionIndex' in object
}

export function isColorable(object: any): object is ColorableShader{
	return 'uColorLocation' in object
}

export function hasMVMatrix(object: any): object is MVMatrixShader{
	return 'uModelViewMatrixLocation' in object
}

export function hasProjectionMatrix(object: any): object is ProjectionMatrixShader{
	return 'uProjectionMatrixLocation' in object
}


export class UniformShader extends Shader implements PositionableShader, ColorableShader, MVMatrixShader, ProjectionMatrixShader {
	name: string = "UniformShader"

	aPositionIndex: 0
	uColorLocation: WebGLUniformLocation
	uModelViewMatrixLocation: WebGLUniformLocation
	uProjectionMatrixLocation: WebGLUniformLocation


	protected _bindAttribs(gl: WebGLRenderingContext){
		this.aPositionIndex = 0
		gl.bindAttribLocation(this.program, this.aPositionIndex, "aPosition")
	}

	protected _getLocations(gl: WebGLRenderingContext){
		this.uModelViewMatrixLocation = gl.getUniformLocation(this.program, "uModelViewMatrix")
		this.uProjectionMatrixLocation = gl.getUniformLocation(this.program, "uProjectionMatrix")
		this.uColorLocation = gl.getUniformLocation(this.program, "uColor")
	}
}


export class PhongShader extends Shader implements PositionableShader, ColorableShader, MVMatrixShader, ProjectionMatrixShader{
	name: string = "Phong"
	
	aPositionIndex: 0
	uColorLocation: WebGLUniformLocation
	uModelViewMatrixLocation: WebGLUniformLocation
	uProjectionMatrixLocation: WebGLUniformLocation

	protected _bindAttribs(gl: WebGLRenderingContext): void {
		this.aPositionIndex = 0
		gl.bindAttribLocation(this.program, this.aPositionIndex, "aPosition")
	}
	protected _getLocations(gl: WebGLRenderingContext): void {
		this.uModelViewMatrixLocation = gl.getUniformLocation(this.program, "uModelViewMatrix")
		this.uProjectionMatrixLocation = gl.getUniformLocation(this.program, "uProjectionMatrix")
		this.uColorLocation = gl.getUniformLocation(this.program, "uColor")
	}
}