import { Car } from "./Car.js"
import { Track } from "./shapes/Track.js"
import { Quad } from "./shapes/Quad.js"
import { Building, TexturedFacades, TexturedRoof } from "./shapes/Building.js"
import { Parser } from "./Parser.js"
import { Shape } from "./shapes/Shape.js"
import { Cube } from "./shapes/Cube.js"
import { Cylinder } from "./shapes/Cylinder.js"
import { GameObject } from "./Rendering/GameObject.js"
import { scene_0 } from "./scenes/scene_0.js"
import { Renderer } from "./Rendering/Renderer.js"
import { Camera, LateChaseCamera } from "./Rendering/Cameras.js"
import { Spotlight } from "./Rendering/Spotlight.js"
import { ShaderMaterial } from "./Rendering/ShaderMaterial.js"
import * as Shaders from "./Rendering/Shaders.js"

export interface StringIndexedBooleanArray{
    [index: string]: boolean
}

export class Game {
	car: Car
	scene: any

	cameras: Camera[]

	private worldGameObject: GameObject

	constructor(renderer: Renderer){
		this.cameras = []
		this.initializeObjects(renderer)
	}

	addCar(name: string){
		var newCar = new Car(name, this.scene.startPosition)
		this.car = newCar;
		return newCar;
  	}
	
  	setScene(scene){
		this.scene = new Parser.Race(scene)

		this.worldGameObject = GameObject.empty("World")

		this.scene.trackObj = new Track(this.scene.track, 0.2);

		let trackGameObject = new GameObject("Track", this.worldGameObject, this.scene.trackObj)
		ShaderMaterial.create(Shaders.PhongSpotlightTexturedShader).then(trackMaterial => {
			trackMaterial.setColorTexture("../common/textures/street4.png")
			trackGameObject.material = trackMaterial
		})

		var bbox = scene.bbox;
		var quad: number[] = [
			bbox[0], bbox[1] - 0.01, bbox[5],
			bbox[3], bbox[1] - 0.01, bbox[5],
			bbox[3], bbox[1] - 0.01, bbox[2],
			bbox[0], bbox[1] - 0.01, bbox[2],
		];

		this.scene.groundObj = new Quad(quad, 10);

		let groundGameObject = new GameObject("Ground", this.worldGameObject, this.scene.groundObj)
		ShaderMaterial.create(Shaders.PhongSpotlightTexturedShader).then(groundMaterial => {
			groundMaterial.setColorTexture("../common/textures/grass_tile.png")
			groundGameObject.material = groundMaterial
		})

		this.scene.buildingsObj  = new Array(this.scene.buildings.length);
		this.scene.buildingsObjTex  = new Array(this.scene.buildings.length);
		for (var i = 0; i < this.scene.buildings.length; ++i){  
			this.scene.buildingsObj[i] = new Building(this.scene.buildings[i]);
			
			this.scene.buildingsObjTex[i] = new TexturedFacades(this.scene.buildings[i],0.1);
			this.scene.buildingsObjTex[i].gameObject = new GameObject("Building " + i + " sides", this.worldGameObject, this.scene.buildingsObjTex[i])

			this.scene.buildingsObjTex[i].roof = new TexturedRoof(this.scene.buildings[i],1.0);
			this.scene.buildingsObjTex[i].roof.gameObject = new GameObject("Building " + i + " roof", this.worldGameObject, this.scene.buildingsObjTex[i].roof)
		}

		ShaderMaterial.create(Shaders.PhongSpotlightTexturedShader).then(sidesMaterial => {
			sidesMaterial.setColorTexture("../common/textures/facade2.jpg")
			
			for(var i = 0; i < this.scene.buildingsObjTex.length; i++){
				this.scene.buildingsObjTex[i].gameObject.material = sidesMaterial
			}
		})

		ShaderMaterial.create(Shaders.PhongSpotlightTexturedShader).then(sidesMaterial => {
			sidesMaterial.setColorTexture("../common/textures/roof.jpg")
			
			for(var i = 0; i < this.scene.buildingsObjTex.length; i++){
				this.scene.buildingsObjTex[i].roof.gameObject.material = sidesMaterial
			}
		})
	}

	/*
	initialize the object in the scene
	*/
	private initializeObjects(renderer: Renderer) {
		Shape.cube = new Cube()
		Shape.cylinder = new Cylinder(10)

		this.setScene(scene_0)
		this.addCar("mycar")

		this.cameras.push(this.car.findChildWithName("FollowFromUpCamera") as unknown as Camera)
		this.cameras.push(this.car.findChildWithName("ChaseCamera") as unknown as Camera)
		this.cameras.push(new LateChaseCamera(this.car, 10))

		renderer.currentCamera = this.cameras[1]
		renderer.addObjectToScene(this.car)
		renderer.addObjectToScene(this.worldGameObject)

		for(var i = 0; i < this.scene.lamps.length; i++){
			var spotlight = new Spotlight()
			spotlight.position = this.scene.lamps[i].position
			spotlight.position[1] = this.scene.lamps[i].height
			spotlight.color = [0,0,0]
			spotlight.color[i%3] = 1
			spotlight.intensity = 0.8
			//spotlight.focus = this.gl.
		}

		renderer.setDirectionalLight(this.scene.weather.sunLightDirection)
	}
};