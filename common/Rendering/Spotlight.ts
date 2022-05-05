export class Spotlight{
    position: vec3
    direction: vec3
    attenuation: number
    cutoff: number
    color: vec3
    focus: number
    intensity: number

    constructor(
        position: vec3 = [0, 0, 0],
        direction: vec3 = [0, -1, 0],
        attenuation: number = 0,
        cutoff: number = 0,
        color: vec3 = [0.996, 0.698, 0.902],
        focus: number = 10.0,
        intensity: number = 0.4
    ){
        this.position = position
        this.direction = direction
        this.attenuation = attenuation
        this.cutoff = cutoff
        this.color = color
        this.focus = focus
        this.intensity = intensity
    }
}