import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useGLTF } from '@react-three/drei'
import './index.css'
import App from './App.tsx'

// Configure Draco decoder to use local WASM decoders in public/draco/gltf/
useGLTF.setDecoderPath('/draco/gltf/')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
