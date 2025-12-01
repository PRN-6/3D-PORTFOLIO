# Three.js Learning Tutorial

Welcome to your Three.js learning journey! This tutorial will help you understand the fundamentals of 3D graphics programming with Three.js and React Three Fiber.

## What is Three.js?

Three.js is a JavaScript library that makes it easy to create 3D graphics in the browser using WebGL. React Three Fiber is a React renderer for Three.js that lets you write Three.js code using React components.

## Key Concepts Explained

### 1. **Scene, Camera, and Renderer**
- **Scene**: The 3D world where all objects exist
- **Camera**: Your viewpoint into the scene
- **Renderer**: Draws the scene from the camera's perspective

In React Three Fiber, the `<Canvas>` component handles all of this automatically!

### 2. **Geometries**
Geometries define the shape of 3D objects:
- `boxGeometry`: Creates a cube/box
- `sphereGeometry`: Creates a sphere
- `torusGeometry`: Creates a donut shape
- `planeGeometry`: Creates a flat surface

### 3. **Materials**
Materials define how objects look:
- `meshStandardMaterial`: Realistic lighting, responds to lights
- `meshBasicMaterial`: Flat color, ignores lights
- `meshPhongMaterial`: Shiny, reflective surface

### 4. **Lights**
Lights illuminate your scene:
- `ambientLight`: Soft overall lighting (no shadows)
- `directionalLight`: Sun-like light from a direction
- `pointLight`: Light from a specific point (like a lightbulb)
- `spotLight`: Focused beam of light

### 5. **Animation**
Use `requestAnimationFrame` or React hooks to animate objects by changing their properties over time.

### 6. **Controls**
`OrbitControls` lets users interact with the camera:
- Left click + drag: Rotate
- Right click + drag: Pan
- Scroll: Zoom

## Code Breakdown

### Basic Component Structure
```jsx
function MyObject() {
  return (
    <mesh>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  )
}
```

### Animation Pattern
```jsx
function AnimatedObject() {
  const meshRef = useRef()
  
  useEffect(() => {
    const animate = () => {
      meshRef.current.rotation.y += 0.01
      requestAnimationFrame(animate)
    }
    animate()
  }, [])
  
  return <mesh ref={meshRef}>...</mesh>
}
```

### Loading 3D Models
```jsx
import { useGLTF } from '@react-three/drei'

function Model({ path }) {
  const { scene } = useGLTF(path)
  return <primitive object={scene} />
}
```

## Next Steps to Learn

1. **Experiment with geometries**: Try different shapes and sizes
2. **Play with materials**: Change colors, add textures, adjust metalness/roughness
3. **Add more lights**: Experiment with different light types and positions
4. **Create animations**: Make objects move, rotate, scale
5. **Load your own models**: Import GLTF/GLB files from sites like Sketchfab
6. **Add physics**: Use libraries like `@react-three/cannon` for physics simulation
7. **Post-processing**: Add effects like bloom, depth of field, etc.

## Useful Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- [Drei (Helpers Library)](https://github.com/pmndrs/drei)
- [Three.js Journey](https://threejs-journey.com/) - Comprehensive paid course

## Common Patterns

### Positioning Objects
```jsx
<mesh position={[x, y, z]}>
  {/* x: left/right, y: up/down, z: forward/back */}
</mesh>
```

### Rotating Objects
```jsx
<mesh rotation={[x, y, z]}>
  {/* Rotation in radians (Math.PI = 180 degrees) */}
</mesh>
```

### Scaling Objects
```jsx
<mesh scale={[x, y, z]}>
  {/* 1 = normal size, 2 = double size, 0.5 = half size */}
</mesh>
```

Happy learning! 🚀

