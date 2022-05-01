export abstract class Shader{
	program: WebGLProgram
	static /*abstract*/ create: (gl: WebGLRenderingContext) => Promise<Shader>
	protected constructor(){}
}


export class UniformShader extends Shader {
	aPositionIndex: 0
	uModelViewMatrixLocation: WebGLUniformLocation
	uProjectionMatrixLocation: WebGLUniformLocation
	uColorLocation: WebGLUniformLocation

	public static async create(gl: WebGLRenderingContext): Promise<UniformShader> {
		var shader = new UniformShader()

		var response = await fetch('/common/shaders/UniformShaderVertex.glsl')
		var vertexShaderSource = await response.text()

		response = await fetch('/common/shaders/UniformShaderFragment.glsl')
		var fragmentShaderSource = await response.text()

		// create the vertex shader
		var vertexShader = gl.createShader(gl.VERTEX_SHADER)
		gl.shaderSource(vertexShader, vertexShaderSource)
		gl.compileShader(vertexShader)

		// create the fragment shader
		var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
		gl.shaderSource(fragmentShader, fragmentShaderSource)
		gl.compileShader(fragmentShader)

		// Create the shader program
		shader.aPositionIndex = 0
		shader.program = gl.createProgram()
		gl.attachShader(shader.program, vertexShader)
		gl.attachShader(shader.program, fragmentShader)
		gl.bindAttribLocation(shader.program, shader.aPositionIndex, "aPosition")
		gl.linkProgram(shader.program)

		// If creating the shader program failed, alert
		if (!gl.getProgramParameter(shader.program, gl.LINK_STATUS)) {
			var str = "Unable to initialize the shader program.\n\n"
			str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n"
			str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n"
			str += "PROG:\n" + gl.getProgramInfoLog(shader.program)
			alert(str)
		}

		shader.uModelViewMatrixLocation = gl.getUniformLocation(shader.program, "uModelViewMatrix")
		shader.uProjectionMatrixLocation = gl.getUniformLocation(shader.program, "uProjectionMatrix")
		shader.uColorLocation = gl.getUniformLocation(shader.program, "uColor")

		return shader
	}
}