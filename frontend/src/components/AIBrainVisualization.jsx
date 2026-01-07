import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

// Neural Network Node Component
function NeuralNode({ position, color = "#3b82f6" }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    meshRef.current.material.opacity = 0.6 + Math.sin(t * 2 + position[0]) * 0.3
    meshRef.current.scale.setScalar(1 + Math.sin(t * 3 + position[1]) * 0.2)
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshStandardMaterial color={color} transparent opacity={0.8} />
    </mesh>
  )
}

// Neural Network Connections
function NeuralConnections({ nodes }) {
  const linesRef = useRef()
  
  const connections = useMemo(() => {
    const lines = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = new THREE.Vector3(...nodes[i]).distanceTo(new THREE.Vector3(...nodes[j]))
        if (distance < 1.5 && Math.random() > 0.7) {
          lines.push([nodes[i], nodes[j]])
        }
      }
    }
    return lines
  }, [nodes])

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.material.opacity = 0.3 + Math.sin(state.clock.getElapsedTime()) * 0.2
    }
  })

  return (
    <group ref={linesRef}>
      {connections.map((connection, index) => (
        <Line
          key={index}
          points={connection}
          color="#8b5cf6"
          lineWidth={1}
          transparent
          opacity={0.4}
        />
      ))}
    </group>
  )
}

// Main AI Brain Visualization
function AIBrain() {
  const groupRef = useRef()
  
  // Generate neural network nodes
  const nodes = useMemo(() => {
    const nodePositions = []
    // Create layers of nodes (like a neural network)
    for (let layer = 0; layer < 5; layer++) {
      const nodesInLayer = 8 - layer
      for (let i = 0; i < nodesInLayer; i++) {
        nodePositions.push([
          (layer - 2) * 0.8,
          (i - nodesInLayer / 2) * 0.6,
          (Math.random() - 0.5) * 0.4
        ])
      }
    }
    return nodePositions
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    groupRef.current.rotation.y = t * 0.1
    groupRef.current.rotation.x = Math.sin(t * 0.05) * 0.1
  })

  return (
    <group ref={groupRef}>
      <NeuralConnections nodes={nodes} />
      {nodes.map((position, index) => (
        <NeuralNode
          key={index}
          position={position}
          color={index % 3 === 0 ? "#3b82f6" : index % 3 === 1 ? "#8b5cf6" : "#06b6d4"}
        />
      ))}
    </group>
  )
}

// Floating Data Particles
function DataParticles() {
  const pointsRef = useRef()
  
  const particles = useMemo(() => {
    const positions = new Float32Array(2000 * 3)
    for (let i = 0; i < 2000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return positions
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    pointsRef.current.rotation.y = t * 0.02
    pointsRef.current.rotation.x = t * 0.01
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#3b82f6"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

// Document Processing Visualization
function DocumentFlow() {
  const groupRef = useRef()
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    groupRef.current.children.forEach((child, index) => {
      child.position.x = Math.sin(t + index) * 2
      child.position.y = Math.cos(t * 0.5 + index) * 1
      child.rotation.z = t + index
    })
  })

  return (
    <group ref={groupRef}>
      {[...Array(6)].map((_, index) => (
        <mesh key={index} position={[index * 0.5 - 1.5, 0, 0]}>
          <boxGeometry args={[0.1, 0.15, 0.02]} />
          <meshStandardMaterial
            color={`hsl(${220 + index * 20}, 70%, 60%)`}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  )
}

const AIBrainVisualization = () => {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8b5cf6" />
        
        {/* Main AI Brain */}
        <AIBrain />
        
        {/* Floating Data Particles */}
        <DataParticles />
        
        {/* Document Flow */}
        <group position={[3, 0, 0]}>
          <DocumentFlow />
        </group>
        
        {/* Additional AI Elements */}
        <group position={[-3, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.8, 0.2, 16, 100]} />
            <meshStandardMaterial color="#06b6d4" wireframe transparent opacity={0.4} />
          </mesh>
        </group>
      </Canvas>
    </div>
  )
}

export default AIBrainVisualization