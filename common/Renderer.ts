import * as glMatrix from "./libs/gl-matrix/dist/esm/index.js"
import * as Shaders from "./Shaders.js"
import { scene_0 } from "./scenes/scene_0.js"
import { Game } from "./Game.js"
import * as Cameras from "./Cameras.js"
import { Cube } from "./shapes/Cube.js"
import { Cylinder } from "./shapes/Cylinder.js"
import { Shape } from "./shapes/Shape.js"
import { MatrixStack } from "./libs/MatrixStack.js"
import { Transform } from "./Transform.js"
import { GameObject } from "./GameObject.js"

type Color = [number, number, number, number]

export type CameraIndex = 0 | 1

export class Renderer{
	cameras: Cameras.Camera[] = [
		new Cameras.FollowFromUpCamera(),
		new Cameras.ChaseCamera()
	]
	currentCamera: CameraIndex

	shader: Shaders.Shader
	gl: WebGLRenderingContext
	canvas: HTMLCanvasElement
    car: any
    cube: Cube
    cylinder: Cylinder
    game: Game
	stack: MatrixStack
	
    canvasDefaultSize: {x: number, y: number} = {x: 800, y: 450}

	public constructor(canvas: HTMLCanvasElement){
		// set the camera currently in use
		this.currentCamera = 1
        this.canvas = canvas
            
        /* get the webgl context */
        this.gl = this.canvas.getContext("webgl");

        /* read the webgl version and log */
        var gl_version = this.gl.getParameter(this.gl.VERSION); 
        console.log("glversion: " + gl_version);
        var GLSL_version = this.gl.getParameter(this.gl.SHADING_LANGUAGE_VERSION)
        console.log("glsl  version: "+GLSL_version);

        /* create the matrix stack */
        this.stack = new MatrixStack();
        this.game = new Game()
        /* initialize objects to be rendered */
        this.initializeObjects();

        /* create the shader */
        Shaders.Shader.create(Shaders.UniformShader, this.gl).then(program => {
			this.shader = program
			this.Display()
		});
	}

	/*
	draw an object as specified in common/shapes/triangle.js for which the buffer 
	have alrady been created
	*/
	drawObject(obj: Shape, fillColor: Color, lineColor: Color, matrix: mat4 = this.stack.matrix) {
		if(Shaders.isPositionable(this.shader)){
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.vertexBuffer);
			this.gl.enableVertexAttribArray(this.shader.aPositionIndex);
			this.gl.vertexAttribPointer(this.shader.aPositionIndex, 3, this.gl.FLOAT, false, 0, 0);
		}

		this.gl.enable(this.gl.POLYGON_OFFSET_FILL);
		this.gl.polygonOffset(1.0, 1.0);

		if(Shaders.isColorable(this.shader)){
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
			this.gl.uniform4fv(this.shader.uColorLocation, fillColor);
			this.gl.drawElements(this.gl.TRIANGLES, obj.triangleIndices.length, this.gl.UNSIGNED_SHORT, 0);

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

	/*
	initialize the object in the scene
	*/
	initializeObjects() {
		this.game.setScene(this.gl, scene_0)
		this.car = this.game.addCar("mycar")

		this.cube = new Cube(this.gl)
		
		this.cylinder = new Cylinder(this.gl, 10)
	}



	/*
	draw the car
	*/
	drawCar(parentMatrix: mat4) {/*
		if(!Shaders.hasMVMatrix(this.shader)){
			return
		}

		var currentMatrix = glMatrix.mat4.create()

		this.gl.uniformMatrix4fv(this.shader.uModelViewMatrixLocation, false, currentMatrix as Float32List);

		this.drawObject(this.cube,[0.8,0.6,0.7,1.0],[0.8,0.6,0.7,1.0]);
		this.stack.pop();

		
		glMatrix.mat4.identity(M);
		
		this.drawWheel([-0.8,0.2,-0.7])
		this.drawWheel([0.8,0.2,-0.7])

		/* this will increase the size of the wheel to 0.4*1,5=0.6 *//*
		glMatrix.mat4.fromScaling(scale_matrix,[1,1.5,1.5]);;
		glMatrix.mat4.mul(Mw,scale_matrix,Mw);
		
		this.drawWheel([0.8,0.25,0.7])
		this.drawWheel([-0.8,0.3,0.7])*/

		var car = GameObject.empty("Car")

		var carHull = new GameObject("CarHull", car, this.cube)
		carHull.transform.position[1] += 0.8
		carHull.transform.scaling = [0.8, 0.3, 1]

		var frontLeftWheel = new GameObject("FrontLeftWheel", car, this.cylinder)
		frontLeftWheel.transform.pivotAdjustment = [1, 0, 0]
		frontLeftWheel.transform.position = [-0.9, 0.2, -0.8]
		frontLeftWheel.transform.rotation = [0, 0, Math.PI / 2]
		frontLeftWheel.transform.scaling = [0.1, 0.2, 0.2]

		var frontRightWheel = new GameObject("FrontRightWheel", car, this.cylinder)
		frontRightWheel.transform.pivotAdjustment = [1, 0, 0]
		frontRightWheel.transform.position = [0.9, 0.2, -0.8]
		frontRightWheel.transform.rotation = [0, 0, Math.PI / 2]
		frontRightWheel.transform.scaling = [0.1, 0.2, 0.2]

		var rearRightWheel = new GameObject("RearRightWheel", car, this.cylinder)
		rearRightWheel.transform.pivotAdjustment = [1, 0, 0]
		rearRightWheel.transform.position = [0.9, 0.3, 0.8]
		rearRightWheel.transform.rotation = [0, 0, Math.PI / 2]
		rearRightWheel.transform.scaling = [0.1, 0.3, 0.3]

		var rearLeftWheel = new GameObject("RearLeftWheel", car, this.cylinder)
		rearLeftWheel.transform.pivotAdjustment = [1, 0, 0]
		rearLeftWheel.transform.position = [-0.9, 0.3, 0.8]
		rearLeftWheel.transform.rotation = [0, 0, Math.PI / 2]
		rearLeftWheel.transform.scaling = [0.1, 0.3, 0.3]

		this.drawGameObject(car, parentMatrix)
	};


	drawGameObject(gameObject: GameObject, parentMatrix: mat4){
		if(!Shaders.hasMVMatrix(this.shader)){
			return
		}
	
		/*
		glMatrix.mat4.fromTranslation(translate_matrix, wheelPivotAdjustment);
		glMatrix.mat4.mul(M, translate_matrix, parentMatrix);
		glMatrix.mat4.fromRotation(rotate_transform, wheelRotation[0], [1, 0, 0]);
		glMatrix.mat4.mul(M, rotate_transform, M);
		glMatrix.mat4.fromRotation(rotate_transform, wheelRotation[1], [0, 1, 0]);
		glMatrix.mat4.mul(M, rotate_transform, M);
		glMatrix.mat4.fromRotation(rotate_transform, wheelRotation[2], [0, 0, 1]);
		glMatrix.mat4.mul(M, rotate_transform, M);
		glMatrix.mat4.fromTranslation(translate_matrix, wheelPosition);
		glMatrix.mat4.mul(M, translate_matrix, M)
		glMatrix.mat4.fromScaling(scale_matrix, wheelScaling);
		glMatrix.mat4.mul(M, scale_matrix, M);
		*/


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


	drawScene() {
		if(!Shaders.hasMVMatrix(this.shader) || !Shaders.hasProjectionMatrix(this.shader)){
			return
		}
		var width = this.canvas.width
		var height = this.canvas.height
		var ratio = width / height;
		this.stack = new MatrixStack();

		this.gl.viewport(0, 0, width, height);
		
		this.gl.enable(this.gl.DEPTH_TEST);

		// Clear the framebuffer
		this.gl.clearColor(0.34, 0.5, 0.74, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);


		this.gl.useProgram(this.shader.program);
		
		this.gl.uniformMatrix4fv(this.shader.uProjectionMatrixLocation, false, glMatrix.mat4.perspective(glMatrix.mat4.create(), 3.14 / 4, ratio, 1, 500) as Float32List);

		this.cameras[this.currentCamera].update(this.car.frame);


		
		var invV = this.cameras[this.currentCamera].inverseViewMatrix;
		
		// initialize the stack with the identity
		this.stack.loadIdentity();
		// multiply by the view matrix
		this.stack.multiply(invV);

		// drawing the car
		this.stack.push();
		this.stack.multiply(this.cameras[this.currentCamera].frame); // projection * viewport
		this.drawCar(this.stack.matrix)
		this.stack.pop();
		this.gl.uniformMatrix4fv(this.shader.uModelViewMatrixLocation, false, this.stack.matrix as Float32List);

		// drawing the static elements (ground, track and buldings)
		this.drawObject(this.game.scene.groundObj, [0.3, 0.7, 0.2, 1.0], [0, 0, 0, 1.0]);
		this.drawObject(this.game.scene.trackObj, [0.9, 0.8, 0.7, 1.0], [0, 0, 0, 1.0]);
		for (var i in this.game.scene.buildingsObj) 
			this.drawObject(this.game.scene.buildingsObj[i], [0.8, 0.8, 0.8, 1.0], [0.2, 0.2, 0.2, 1.0]);
		this.gl.useProgram(null);
	};



	Display = () => {
		this.drawScene();
        //console.log("drawing")
        var that = this
		window.requestAnimationFrame(this.Display)
	};

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
}