import * as glMatrix from "../libs/gl-matrix/dist/esm/index.js"
import * as Shaders from "./Shaders.js"
import * as Cameras from "./Cameras.js"
import { Shape, TexturedShape } from "../shapes/Shape.js"
import { GameObject } from "./GameObject.js"
import { Spotlight } from "./Spotlight.js"
import { ShaderMaterial } from "./ShaderMaterial.js"

type Color = [number, number, number, number]

export class Renderer{
	public static gl: WebGLRenderingContext
	wireframeEnabled = false

	canvas: HTMLCanvasElement
    canvasDefaultSize: {x: number, y: number} = {x: 800, y: 450}

	currentCamera: Cameras.Camera

	private lights: {
		spotlights: Spotlight[]
		directional: vec3
	}
	private defaultMaterial: ShaderMaterial
	private defaultTexture: WebGLTexture

	private currentTime: number
	private scene: GameObject

	public constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas
            
        /* get the webgl context */
        Renderer.gl = this.canvas.getContext("webgl");

        /* read the webgl version and log */
        var gl_version = Renderer.gl.getParameter(Renderer.gl.VERSION); 
        console.log("GL version: " + gl_version);
        var GLSL_version = Renderer.gl.getParameter(Renderer.gl.SHADING_LANGUAGE_VERSION)
        console.log("GLSL version: " + GLSL_version);

		this.lights = {
			spotlights: [],
			directional: [0, -1, 0]
		}

		this.scene = GameObject.empty("Scene")

		this.currentTime = 0

		
		ShaderMaterial.create(Shaders.UniformShader).then(material => {
			let image = new Image()
			image.src = "../common/textures/street4.png"
			image.addEventListener('load', () => {
				this.defaultMaterial = material


				Renderer.gl.activeTexture(Renderer.gl.TEXTURE0);
				this.defaultTexture = Renderer.gl.createTexture();
				Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, this.defaultTexture);
				Renderer.gl.activeTexture(Renderer.gl.TEXTURE0)
				Renderer.gl.texImage2D(Renderer.gl.TEXTURE_2D, 0, Renderer.gl.RGB, Renderer.gl.RGB, Renderer.gl.UNSIGNED_BYTE, image);
				Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_WRAP_S, Renderer.gl.REPEAT);
				Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_WRAP_T, Renderer.gl.REPEAT);
				Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_MAG_FILTER, Renderer.gl.LINEAR);
				Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_MIN_FILTER, Renderer.gl.LINEAR_MIPMAP_NEAREST);


				this.startRendering(0)
			})
		})
	}

	private viewMatrix: mat4
	private projectionMatrix: mat4
	private viewSpaceLightDirection: mat4

	private drawObject(modelMatrix: mat4, obj: Shape, material: ShaderMaterial | null){
		if(!material){
			material = this.defaultMaterial
		}

		Renderer.gl.useProgram(material.shader.program)
		
		if(Shaders.hasProjectionMatrix(material.shader)){
			Renderer.gl.uniformMatrix4fv(material.shader.uProjectionMatrixLocation, false, this.projectionMatrix as Float32List);
		}

		if(Shaders.hasViewMatrix(material.shader)){
			Renderer.gl.uniformMatrix4fv(material.shader.uViewMatrixLocation, false, this.viewMatrix as Float32List)
		}

		if(Shaders.hasLightDirection(material.shader)){
			Renderer.gl.uniform3fv(material.shader.uLightDirectionLocation, this.lights.directional as Float32List)
		}

		if(Shaders.hasViewSpaceLightDirection(material.shader)){
			Renderer.gl.uniform3fv(material.shader.uViewSpaceLightDirectionLocation, this.viewSpaceLightDirection as Float32List)
		}

		if(Shaders.hasMVMatrix(material.shader)){
			Renderer.gl.uniformMatrix4fv(
				material.shader.uModelViewMatrixLocation, false,
				modelMatrix as Float32List
			)
		}

		if(Shaders.isTextured(material.shader)){
			let tex = material.properties["texture"]
			if(!tex){
				tex = this.defaultTexture
			}

			//Renderer.gl.generateMipmap(Renderer.gl.TEXTURE_2D);

			Renderer.gl.activeTexture(material.properties["textureUnit"] ?? 0)
			Renderer.gl.bindTexture(material.properties["textureUnit"] ?? 0, tex)
			Renderer.gl.uniform1i(material.shader.uSamplerLocation, material.properties["textureUnit"] ?? 0)

			Renderer.gl.bindBuffer(Renderer.gl.ARRAY_BUFFER, (obj as unknown as TexturedShape).texCoordsBuffer);
			Renderer.gl.enableVertexAttribArray(material.shader.aTexCoordsIndex);
			Renderer.gl.vertexAttribPointer(material.shader.aTexCoordsIndex, 2, Renderer.gl.FLOAT, false, 0, 0)
		}

		if(Shaders.isPositionable(material.shader)){
			Renderer.gl.bindBuffer(Renderer.gl.ARRAY_BUFFER, obj.vertexBuffer);
			Renderer.gl.enableVertexAttribArray(material.shader.aPositionIndex);
			Renderer.gl.vertexAttribPointer(material.shader.aPositionIndex, 3, Renderer.gl.FLOAT, false, 0, 0);
			Renderer.gl.bindBuffer(Renderer.gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
		}

		if(Shaders.isNormal(material.shader)){
			Renderer.gl.bindBuffer(Renderer.gl.ARRAY_BUFFER, obj.normalBuffer);
			Renderer.gl.enableVertexAttribArray(material.shader.aNormalIndex);
			Renderer.gl.vertexAttribPointer(material.shader.aNormalIndex, 3, Renderer.gl.FLOAT, false, 0, 0);
		}

		if(Shaders.isShiny(material.shader)){
			Renderer.gl.uniform1f(material.shader.uShininessLocation, 3)
		}

		if(Shaders.isColorable(material.shader)){
			Renderer.gl.uniform4fv(material.shader.uColorLocation, material.properties["color"]);
		}

		if(Shaders.supportsSpotlights(material.shader)){
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
			Renderer.gl.uniform1fv(material.shader.uSpotlightAttenuationLocation, attenuation)
			Renderer.gl.uniform3fv(material.shader.uSpotlightColorsLocation, colors)
			Renderer.gl.uniform1fv(material.shader.uSpotlightCutoffLocation, cutoff)
			Renderer.gl.uniform3fv(material.shader.uSpotlightDirectionsLocation, direction)
			Renderer.gl.uniform1fv(material.shader.uSpotlightFocusLocation, focus)
			Renderer.gl.uniform1fv(material.shader.uSpotlightIntensityLocation, intensity)
			Renderer.gl.uniform3fv(material.shader.uSpotlightPositionsLocation, position)
		}

		if(this.wireframeEnabled){
			Renderer.gl.enable(Renderer.gl.POLYGON_OFFSET_FILL);
			Renderer.gl.polygonOffset(1.0, 1.0);
		}


		Renderer.gl.drawElements(Renderer.gl.TRIANGLES, obj.triangleIndices.length, Renderer.gl.UNSIGNED_SHORT, 0);


		if(this.wireframeEnabled && Shaders.isColorable(material.shader)){
			Renderer.gl.disable(Renderer.gl.POLYGON_OFFSET_FILL);
			Renderer.gl.uniform4fv(material.shader.uColorLocation, [0, 0, 0]);
			Renderer.gl.bindBuffer(Renderer.gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
			Renderer.gl.drawElements(Renderer.gl.LINES, obj.numTriangles * 3 * 2, Renderer.gl.UNSIGNED_SHORT, 0);
		}

		if(Shaders.isPositionable(material.shader)){
			Renderer.gl.bindBuffer(Renderer.gl.ELEMENT_ARRAY_BUFFER, null);
			Renderer.gl.disableVertexAttribArray(material.shader.aPositionIndex);
			Renderer.gl.bindBuffer(Renderer.gl.ARRAY_BUFFER, null);
		}
	};


	private drawGameObject(gameObject: GameObject, parentMatrix: mat4){
		var modelMatrix = gameObject.transform.applyLocalTransform(
			glMatrix.mat4.create(),
			parentMatrix
		)

		if(gameObject.shape){			
			this.drawObject(modelMatrix, gameObject.shape, gameObject.material)
		}

		for(var i = 0; i < gameObject.children.length; i++){
			this.drawGameObject(gameObject.children[i], modelMatrix)
		}
	}


	private draw() {
		var width = this.canvas.width
		var height = this.canvas.height
		var ratio = width / height;
		
		// Set matrices
		this.projectionMatrix = glMatrix.mat4.perspective(glMatrix.mat4.create(), 3.14 / 4, ratio, 1, 500)
		this.viewMatrix = this.currentCamera.inverseViewMatrix
		this.viewSpaceLightDirection = glMatrix.vec3.transformMat4(glMatrix.vec3.create(), this.lights.directional, this.viewMatrix)
		glMatrix.vec3.normalize(this.viewSpaceLightDirection, this.viewSpaceLightDirection)

		Renderer.gl.viewport(0, 0, width, height);
		
		Renderer.gl.enable(Renderer.gl.DEPTH_TEST);

		// Clear the framebuffer
		Renderer.gl.clearColor(0.34, 0.5, 0.74, 1.0);
		Renderer.gl.clear(Renderer.gl.COLOR_BUFFER_BIT | Renderer.gl.DEPTH_BUFFER_BIT);

		this.drawGameObject(this.scene, this.viewMatrix)
		Renderer.gl.useProgram(null);
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