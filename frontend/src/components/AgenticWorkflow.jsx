import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, Sphere, Box, Cylinder, OrbitControls } from '@react-three/drei'

// Individual AI Agent
function AIAgent({ position, color, label, isActive, agentType }) {
  const meshRef = useRef()
  const glowRef = useRef()
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.1
      
      // Active agent pulsing
      if (isActive) {
        const scale = 1 + Math.sin(t * 4) * 0.2
        meshRef.current.scale.setScalar(scale)
      } else {
        meshRef.current.scale.setScalar(1)
      }
    }
    
    if (glowRef.current && isActive) {
      glowRef.current.material.opacity = 0.3 + Math.sin(t * 3) * 0.2
    }
  })

  return (
    <group position={position}>
      {/* Agent glow effect when active */}
      {isActive && (
        <Sphere ref={glowRef} args={[0.4]}>
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.3}
          />
        </Sphere>
      )}
      
      {/* Main agent body */}
      <Sphere ref={meshRef} args={[0.25]}>
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 0.4 : 0.1}
          metalness={0.3}
          roughness={0.2}
        />
      </Sphere>
      
      {/* Agent type indicator */}
      <Box args={[0.1, 0.1, 0.1]} position={[0, 0.35, 0]}>
        <meshStandardMaterial 
          color={agentType === 'processor' ? '#ff6b6b' : 
                agentType === 'embedder' ? '#4ecdc4' :
                agentType === 'retriever' ? '#45b7d1' : '#96ceb4'}
        />
      </Box>
      
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  )
}

// Data flow particles
function DataFlow({ start, end, isActive, color = "#00ff88" }) {
  const particlesRef = useRef()
  const particleCount = 20
  
  useFrame((state) => {
    if (!isActive || !particlesRef.current) return
    
    const t = state.clock.getElapsedTime()
    const positions = particlesRef.current.geometry.attributes.position.array
    
    for (let i = 0; i < particleCount; i++) {
      const progress = ((t * 2 + i * 0.1) % 1)
      const i3 = i * 3
      
      positions[i3] = start[0] + (end[0] - start[0]) * progress
      positions[i3 + 1] = start[1] + (end[1] - start[1]) * progress + Math.sin(progress * Math.PI * 2) * 0.1
      positions[i3 + 2] = start[2] + (end[2] - start[2]) * progress
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  if (!isActive) return null

  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = start[0]
    positions[i * 3 + 1] = start[1]
    positions[i * 3 + 2] = start[2]
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}

// Central coordination hub
function CoordinationHub({ position, isActive }) {
  const hubRef = useRef()
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    
    if (hubRef.current) {
      hubRef.current.rotation.y = t * 0.5
      hubRef.current.rotation.x = Math.sin(t * 0.3) * 0.2
      
      if (isActive) {
        const scale = 1 + Math.sin(t * 3) * 0.1
        hubRef.current.scale.setScalar(scale)
      }
    }
  })

  return (
    <group position={position}>
      <Cylinder ref={hubRef} args={[0.3, 0.3, 0.2, 8]}>
        <meshStandardMaterial 
          color="#8b5cf6"
          emissive="#7c3aed"
          emissiveIntensity={isActive ? 0.5 : 0.2}
          metalness={0.5}
          roughness={0.1}
        />
      </Cylinder>
      
      <Text
        position={[0, -0.6, 0]}
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Coordination Hub
      </Text>
    </group>
  )
}

// Main Agentic Workflow Component
export default function AgenticWorkflow() {
  const [activeStep, setActiveStep] = useState(0)
  const [activeAgents, setActiveAgents] = useState(new Set())
  
  const agents = [
    { 
      id: 'processor', 
      position: [-2, 1.5, 0], 
      color: '#ff6b6b', 
      label: 'Document Processor',
      type: 'processor'
    },
    { 
      id: 'embedder', 
      position: [2, 1.5, 0], 
      color: '#4ecdc4', 
      label: 'Embedding Agent',
      type: 'embedder'
    },
    { 
      id: 'retriever', 
      position: [-2, -1.5, 0], 
      color: '#45b7d1', 
      label: 'Retrieval Agent',
      type: 'retriever'
    },
    { 
      id: 'generator', 
      position: [2, -1.5, 0], 
      color: '#96ceb4', 
      label: 'Response Generator',
      type: 'generator'
    }
  ]

  const workflows = [
    {
      step: 0,
      activeAgents: ['processor'],
      flows: [],
      description: "Document Processor analyzes incoming files"
    },
    {
      step: 1,
      activeAgents: ['processor', 'embedder'],
      flows: [{ start: [-2, 1.5, 0], end: [2, 1.5, 0], color: '#ff6b6b' }],
      description: "Processed text flows to Embedding Agent"
    },
    {
      step: 2,
      activeAgents: ['embedder'],
      flows: [{ start: [2, 1.5, 0], end: [0, 0, 0], color: '#4ecdc4' }],
      description: "Embeddings stored in vector database"
    },
    {
      step: 3,
      activeAgents: ['retriever'],
      flows: [{ start: [0, 0, 0], end: [-2, -1.5, 0], color: '#8b5cf6' }],
      description: "Query triggers Retrieval Agent"
    },
    {
      step: 4,
      activeAgents: ['retriever', 'generator'],
      flows: [{ start: [-2, -1.5, 0], end: [2, -1.5, 0], color: '#45b7d1' }],
      description: "Retrieved context sent to Response Generator"
    },
    {
      step: 5,
      activeAgents: ['generator'],
      flows: [],
      description: "AI generates intelligent response with sources"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % workflows.length)
    }, 2500)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const currentWorkflow = workflows[activeStep]
    setActiveAgents(new Set(currentWorkflow.activeAgents))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep])

  const currentWorkflow = workflows[activeStep]

  return (
    <div className="w-full h-[500px] bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-3xl overflow-hidden relative border border-gray-200 shadow-lg">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1.2} />
        <pointLight position={[-5, -5, -5]} intensity={0.6} color="#8b5cf6" />
        <pointLight position={[0, 10, 0]} intensity={0.8} color="#06b6d4" />
        
        {/* Central Coordination Hub */}
        <CoordinationHub 
          position={[0, 0, 0]} 
          isActive={activeAgents.size > 1}
        />
        
        {/* AI Agents */}
        {agents.map((agent) => (
          <AIAgent
            key={agent.id}
            position={agent.position}
            color={agent.color}
            label={agent.label}
            agentType={agent.type}
            isActive={activeAgents.has(agent.id)}
          />
        ))}
        
        {/* Data Flows */}
        {currentWorkflow.flows.map((flow, index) => (
          <DataFlow
            key={index}
            start={flow.start}
            end={flow.end}
            color={flow.color}
            isActive={true}
          />
        ))}
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.8}
        />
      </Canvas>
      
      {/* Enhanced Workflow Status */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl px-5 py-3 border border-gray-200 shadow-sm">
          <h3 className="text-gray-900 text-base font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            🤖 Multi-Agent Collaboration
          </h3>
          <p className="text-gray-600 text-xs mt-1">
            Specialized AI agents working together in real-time
          </p>
        </div>
      </div>
      
      {/* Enhanced Workflow Status */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-gray-900 font-semibold text-xs">
              Step {activeStep + 1}: {currentWorkflow.description}
            </h4>
            <div className="flex space-x-1.5">
              {workflows.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    index === activeStep ? 'bg-blue-500 scale-125' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-1.5">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                  activeAgents.has(agent.id)
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-500 border border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    activeAgents.has(agent.id) ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span className="truncate">{agent.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}