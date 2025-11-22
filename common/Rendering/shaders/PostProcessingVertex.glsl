attribute vec2 aTexCoord;
attribute vec2 aPosition;

varying vec2 vTexCoord;
    
void main() {
    vTexCoord = aTexCoord;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}