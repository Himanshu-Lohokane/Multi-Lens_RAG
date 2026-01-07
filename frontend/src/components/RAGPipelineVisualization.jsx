import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, Sphere, Box, Line, OrbitControls } from '@react-three/drei'

// Document ingestion visualization
function DocumentIngestion({ position }) {
  const groupRef = useRef()
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    groupRef.current.rotation.y = t * 0.3
    
    // Animate documents flowing in
    groupRef.current.children.forEach((child, index) => {
      if (child.userData.isDocument) {
        child.position.y = Math.sin(t + index) * 0.2
        child.rotation.z = Math.sin(t * 0.5 + index) * 0.1
      }
    })
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Central processor */}
      <Sphere args={[0.3]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#3b82f6" emissive="#1e40af" emissiveIntensity={0.2} />
      </Sphere>
      
      {/* Documents orbiting around */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2
        const radius = 1.2
        return (
          <Box 
            key={i}
            args={[0.15, 0.2, 0.02]} 
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle) * radius * 0.3,
              Math.sin(angle) * radius
            ]}
            userData={{ isDocument: true }}
          >
            <meshStandardMaterial 
              color={`hsl(${200 + i * 30}, 70%, 60%)`} 
              transparent 
              opacity={0.8} 
            />
          </Box>
        )
      })}
      
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Document Ingestion
      </Text>
    </group>
  )
}

// Vector embedding visualization
function VectorEmbedding({ position }) {
  const particlesRef = useRef()
  const count = 200
  
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2
    }
    return positions
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (particlesRef.current) {
      particlesRef.current.rotation.x = t * 0.1
      particlesRef.current.rotation.y = t * 0.15
      
      // Animate particles clustering
      const positions = particlesRef.current.geometry.attributes.position.array
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const cluster = Math.floor(i / 40)
        const clusterCenter = [
          Math.cos(cluster * 1.2) * 0.8,
          Math.sin(cluster * 1.2) * 0.8,
          Math.sin(t + cluster) * 0.3
        ]
        
        positions[i3] += (clusterCenter[0] - positions[i3]) * 0.02
        positions[i3 + 1] += (clusterCenter[1] - positions[i3 + 1]) * 0.02
        positions[i3 + 2] += (clusterCenter[2] - positions[i3 + 2]) * 0.02
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group position={position}>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#10b981"
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
      
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Vector Embeddings
      </Text>
    </group>
  )
}

// Knowledge graph visualization
function KnowledgeGraph({ position }) {
  const groupRef = useRef()
  const nodes = useMemo(() => {
    return [...Array(8)].map((_, i) => ({
      position: [
        Math.cos(i * 0.785) * 1.2,
        Math.sin(i * 0.785) * 1.2,
        (Math.random() - 0.5) * 0.5
      ],
      connections: Math.floor(Math.random() * 3) + 1
    }))
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.rotation.z = t * 0.1
      
      // Pulse effect on nodes
      groupRef.current.children.forEach((child, index) => {
        if (child.userData.isNode) {
          const scale = 1 + Math.sin(t * 2 + index) * 0.2
          child.scale.setScalar(scale)
        }
      })
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Nodes */}
      {nodes.map((node, i) => (
        <Sphere 
          key={i} 
          args={[0.08]} 
          position={node.position}
          userData={{ isNode: true }}
        >
          <meshStandardMaterial 
            color="#f59e0b" 
            emissive="#d97706" 
            emissiveIntensity={0.3} 
          />
        </Sphere>
      ))}
      
      {/* Connections */}
      {nodes.map((node, i) => 
        nodes.slice(i + 1).map((otherNode, j) => {
          if (Math.random() > 0.6) {
            return (
              <Line
                key={`${i}-${j}`}
                points={[node.position, otherNode.position]}
                color="#6366f1"
                lineWidth={2}
                transparent
                opacity={0.4}
              />
            )
          }
          return null
        })
      )}
      
      <Text
        position={[0, -1.8, 0]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Knowledge Graph
      </Text>
    </group>
  )
}

// AI query processing
function QueryProcessor({ position }) {
  const brainRef = useRef()
  const raysRef = useRef()
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    
    if (brainRef.current) {
      brainRef.current.rotation.y = t * 0.5
      brainRef.current.material.emissiveIntensity = 0.3 + Math.sin(t * 3) * 0.2
    }
    
    if (raysRef.current) {
      raysRef.current.rotation.z = t * 0.8
      raysRef.current.children.forEach((ray, index) => {
        ray.scale.x = 1 + Math.sin(t * 2 + index) * 0.3
      })
    }
  })

  return (
    <group position={position}>
      {/* Central brain */}
      <Sphere ref={brainRef} args={[0.25]}>
        <meshStandardMaterial 
          color="#8b5cf6" 
          emissive="#7c3aed" 
          emissiveIntensity={0.3}
          wireframe
        />
      </Sphere>
      
      {/* Query rays */}
      <group ref={raysRef}>
        {[...Array(6)].map((_, i) => {
          const angle = (i / 6) * Math.PI * 2
          return (
            <Box
              key={i}
              args={[0.8, 0.02, 0.02]}
              position={[Math.cos(angle) * 0.4, Math.sin(angle) * 0.4, 0]}
              rotation={[0, 0, angle]}
            >
              <meshStandardMaterial 
                color="#ec4899" 
                emissive="#db2777" 
                emissiveIntensity={0.5}
                transparent
                opacity={0.7}
              />
            </Box>
          )
        })}
      </group>
      
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        AI Query Processing
      </Text>
    </group>
  )
}

// Main RAG Pipeline Visualization
export default function RAGPipelineVisualization() {
  return (
    <div className="w-full h-[500px] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl overflow-hidden border border-gray-200 shadow-lg">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} intensity={0.6} color="#3b82f6" />
        <pointLight position={[0, 10, 0]} intensity={0.8} color="#8b5cf6" />
        
        {/* RAG Pipeline Components */}
        <DocumentIngestion position={[-3, 1, 0]} />
        <VectorEmbedding position={[3, 1, 0]} />
        <KnowledgeGraph position={[-3, -1.5, 0]} />
        <QueryProcessor position={[3, -1.5, 0]} />
        
        {/* Enhanced data flow connections */}
        <Line
          points={[[-2.7, 1, 0], [2.7, 1, 0]]}
          color="#06b6d4"
          lineWidth={4}
          transparent
          opacity={0.8}
        />
        <Line
          points={[[-3, 0.7, 0], [-3, -1.2, 0]]}
          color="#06b6d4"
          lineWidth={4}
          transparent
          opacity={0.8}
        />
        <Line
          points={[[3, 0.7, 0], [3, -1.2, 0]]}
          color="#06b6d4"
          lineWidth={4}
          transparent
          opacity={0.8}
        />
        <Line
          points={[[-2.7, -1.5, 0], [2.7, -1.5, 0]]}
          color="#06b6d4"
          lineWidth={4}
          transparent
          opacity={0.8}
        />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  )
}