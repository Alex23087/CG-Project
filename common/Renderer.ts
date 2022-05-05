import * as glMatrix from "./libs/gl-matrix/dist/esm/index.js"
import * as Shaders from "./Shaders.js"
import * as Cameras from "./Cameras.js"
import { Shape } from "./shapes/Shape.js"
import { GameObject } from "./GameObject.js"
import { Spotlight } from "./Spotlight.js"

type Color = [number, number, number, number]

export class Renderer{
	gl: WebGLRenderingContext
	shader: Shaders.Shader
	wireframeEnabled = false

	canvas: HTMLCanvasElement
    canvasDefaultSize: {x: number, y: number} = {x: 800, y: 450}

	currentCamera: Cameras.Camera

	private lights: {
		spotlights: Spotlight[]
		directional: vec3
	}

	private currentTime: number
	private scene: GameObject

	public constructor(canvas: HTMLCanvasElement, shader: {new(): Shaders.Shader} | null = null){
        this.canvas = canvas
            
        /* get the webgl context */
        this.gl = this.canvas.getContext("webgl");

        /* read the webgl version and log */
        var gl_version = this.gl.getParameter(this.gl.VERSION); 
        console.log("glversion: " + gl_version);
        var GLSL_version = this.gl.getParameter(this.gl.SHADING_LANGUAGE_VERSION)
        console.log("glsl  version: " + GLSL_version);

		this.lights = {
			spotlights: [],
			directional: [0, -1, 0]
		}

		this.scene = GameObject.empty("Scene")

		if(shader == null){
			shader = Shaders.UniformShader
		}

		this.currentTime = 0

		Shaders.Shader.create(shader, this.gl).then(program => {
			this.shader = program
			this.startRendering(0)
		})
	}

	/*
	draw an object as specified in common/shapes/triangle.js for which the buffer 
	have alrady been created
	*/
	private drawObject(obj: Shape, fillColor: Color, lineColor: Color) {
		if(Shaders.isPositionable(this.shader)){
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.vertexBuffer);
			this.gl.enableVertexAttribArray(this.shader.aPositionIndex);
			this.gl.vertexAttribPointer(this.shader.aPositionIndex, 3, this.gl.FLOAT, false, 0, 0);
		}

		if(Shaders.isNormal(this.shader)){
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.normalBuffer);
			this.gl.enableVertexAttribArray(this.shader.aNormalIndex);
			this.gl.vertexAttribPointer(this.shader.aNormalIndex, 3, this.gl.FLOAT, false, 0, 0);
		}

		if(Shaders.isShiny(this.shader)){
			this.gl.uniform1f(this.shader.uShininessLocation, 3)
		}

		if(Shaders.isColorable(this.shader)){
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
			this.gl.uniform4fv(this.shader.uColorLocation, fillColor);
		}

		if(Shaders.supportsSpotlights(this.shader)){
			var attenuation = []
			var colors = []
			var cutoff = []
			var direction = []
			var focus = []
			var intensity = []
			var position = []
			for(var i = 0; i < this.lights.spotlights.length; i++){
				attenuation[i] = this.lights.spotlights[i].attenuation
				cutoff[i] = this.lights.spotlights[i].cutoff
				focus[i] = this.lights.spotlights[i].focus
				intensity[i] = this.lights.spotlights[i].intensity
				for(var j = 0; j < 3; j++){
					colors[i * 3 + j] = this.lights.spotlights[i].color[j]
					direction[i * 3 + j] = this.lights.spotlights[i].direction[j]
					position[i * 3 + j] = this.lights.spotlights[i].position[j]
				}
			}
			this.gl.uniform1fv(this.shader.uSpotlightAttenuationLocation, attenuation)
			this.gl.uniform3fv(this.shader.uSpotlightColorsLocation, colors)
			this.gl.uniform1fv(this.shader.uSpotlightCutoffLocation, cutoff)
			this.gl.uniform3fv(this.shader.uSpotlightDirectionsLocation, direction)
			this.gl.uniform1fv(this.shader.uSpotlightFocusLocation, focus)
			this.gl.uniform1fv(this.shader.uSpotlightIntensityLocation, intensity)
			this.gl.uniform3fv(this.shader.uSpotlightPositionsLocation, position)
		}

		if(this.wireframeEnabled){
			this.gl.enable(this.gl.POLYGON_OFFSET_FILL);
			this.gl.polygonOffset(1.0, 1.0);
		}


		this.gl.drawElements(this.gl.TRIANGLES, obj.triangleIndices.length, this.gl.UNSIGNED_SHORT, 0);


		if(this.wireframeEnabled && Shaders.isColorable(this.shader)){
			this.gl.disable(this.gl.POLYGON_OFFSET_FILL);
			this.gl.uniform4fv(this.shader.uColorLocation, lineColor);
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
			this.gl.drawElements(this.gl.LINES, obj.numTriangles * 3 * 2, this.gl.UNSIGNED_SHORT, 0);
		}

		if(Shaders.isPositionable(this.shader)){
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
			this.gl.disableVertexAttribArray(this.shader.aPositionIndex);
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
		}
	};


	private drawGameObject(gameObject: GameObject, parentMatrix: mat4){
		if(!Shaders.hasMVMatrix(this.shader)){
			return
		}

		var modelMatrix = gameObject.transform.applyLocalTransform(
			glMatrix.mat4.create(),
			parentMatrix
		)

		if(gameObject.shape){
			this.gl.uniformMatrix4fv(
				this.shader.uModelViewMatrixLocation, false,
				modelMatrix as Float32List
			)
			
			this.drawObject(gameObject.shape, [1.0,0.6,0.5,1.0], [0.0,0.0,0.0,1.0])
		}

		for(var i = 0; i < gameObject.children.length; i++){
			this.drawGameObject(gameObject.children[i], modelMatrix)
		}
	}


	private draw() {
		if(!Shaders.hasMVMatrix(this.shader) || !Shaders.hasProjectionMatrix(this.shader)){
			return
		}
		var width = this.canvas.width
		var height = this.canvas.height
		var ratio = width / height;

		this.gl.viewport(0, 0, width, height);
		
		this.gl.enable(this.gl.DEPTH_TEST);

		// Clear the framebuffer
		this.gl.clearColor(0.34, 0.5, 0.74, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);


		this.gl.useProgram(this.shader.program);
		
		this.gl.uniformMatrix4fv(this.shader.uProjectionMatrixLocation, false, glMatrix.mat4.perspective(glMatrix.mat4.create(), 3.14 / 4, ratio, 1, 500) as Float32List);

		var invV = this.currentCamera.inverseViewMatrix;

		if(Shaders.hasViewMatrix(this.shader)){
			this.gl.uniformMatrix4fv(this.shader.uViewMatrixLocation, false, invV as Float32List)
		}

		if(Shaders.hasLightDirection(this.shader)){
			this.gl.uniform3fv(this.shader.uLightDirectionLocation, this.lights.directional as Float32List)
		}

		if(Shaders.hasViewSpaceLightDirection(this.shader)){
			var viewSpaceLightDirection = glMatrix.vec3.transformMat4(glMatrix.vec3.create(), this.lights.directional, invV)
			glMatrix.vec3.normalize(viewSpaceLightDirection, viewSpaceLightDirection)
			this.gl.uniform3fv(this.shader.uViewSpaceLightDirectionLocation, viewSpaceLightDirection as Float32List)
		}

		this.drawGameObject(this.scene, invV)
		this.gl.useProgram(null);
	};



	startRendering = (time: number) => {
		this.updateGameObjects(this.scene, time - this.currentTime)
		if(this.currentCamera){
			this.draw();
		}
		this.currentTime = time
		window.requestAnimationFrame(this.startRendering)
	}

	private updateGameObjects(obj: GameObject, deltaT: number){
		obj.update(deltaT)
		for(var i = 0; i < obj.children.length; i++){
			this.updateGameObjects(obj.children[i], deltaT)
		}
	}

    toggleFullscreen(){
        if (!document.fullscreenElement) {
            this.canvas.requestFullscreen();
            this.canvas.onresize = () => {
                this.canvas.width = this.canvas.clientWidth
                this.canvas.height = this.canvas.clientHeight
            }
            window.addEventListener('resize', this.canvas.onresize)
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
            this.canvas.width = this.canvasDefaultSize.x
            this.canvas.height = this.canvasDefaultSize.y
          }
        }
    }

	addObjectToScene(go: GameObject){
		this.scene.addChild(go)
	}

	addSpotlight(spotlight: Spotlight){
		this.lights.spotlights.push(spotlight)
	}

	setDirectionalLight(direction: vec3){
		this.lights.directional = direction
	}
}