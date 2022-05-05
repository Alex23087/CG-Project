import { Shape } from "./shapes/Shape.js"
import { Transform } from "./Transform.js"

export class GameObject{
    name: string
    children: GameObject[] = []
    transform: Transform
    shape: Shape | null

    constructor(name: string, parent: GameObject, shape: Shape | null){
        this.name = name
        this.transform = Transform.empty()
        this.transform.gameObject = this
        if(parent){
            parent.addChild(this)
        }
        this.shape = shape
    }

    public static empty(name: string): GameObject{
        return new GameObject(name, null, null)
    }

    addChild(gameObject: GameObject){
        gameObject.transform.parent = this.transform
        this.children.push(gameObject)
    }

    public update(deltaT: number) {}

    public findChildWithName(name: string): GameObject | null{
        for(var i = 0; i < this.children.length; i++){
            if(this.children[i].name == name){
                return this.children[i]
            }
        }
        return null
    }
}