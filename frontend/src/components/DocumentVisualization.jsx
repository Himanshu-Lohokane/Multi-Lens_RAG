import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, Sphere, Box, Line, OrbitControls, Cylinder } from '@react-three/drei'

// Document with transformation animation
function TransformingDocument({ position, stage, documentType }) {
  const meshRef = useRef()
  const particlesRef = useRef()
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t + position[0]) * 0.1
      
      // Transform based on stage
      if (stage === 'processing') {
        meshRef.current.rotation.y = t * 2
        meshRef.current.scale.setScalar(1 + Math.sin(t * 4) * 0.1)
      } else if (stage === 'vectorizing') {
        meshRef.current.material.opacity = 0.3 + Math.sin(t * 3) * 0.2
      }
    }
    
    // Particle effects during transformation
    if (particlesRef.current && stage === 'vectorizing') {
      particlesRef.current.rotation.y = t * 1.5
      particlesRef.current.children.forEach((particle, index) => {
        particle.position.y = Math.sin(t * 2 + index) * 0.3
      })
    }
  })

  const getDocumentColor = () => {
    switch (documentType) {
      case 'pdf': return '#ef4444'
      case 'docx': return '#3b82f6'
      case 'txt': return '#10b981'
      case 'csv': return '#f59e0b'
      default: return '#8b5cf6'
    }
  }

  return (
    <group position={position}>
      {/* Main document */}
      <Box ref={meshRef} args={[0.4, 0.5, 0.03]}>
        <meshStandardMaterial
          color={getDocumentColor()}
          transparent
          opacity={stage === 'vectorizing' ? 0.5 : 0.9}
          emissive={stage === 'processing' ? getDocumentColor() : '#000000'}
          emissiveIntensity={stage === 'processing' ? 0.2 : 0}
        />
      </Box>
      
      {/* Document content lines */}
      {[0.15, 0.05, -0.05, -0.15].map((y, index) => (
        <Box key={index} args={[0.3, 0.015, 0.001]} position={[0, y, 0.016]}>
          <meshStandardMaterial color="#333333" />
        </Box>
      ))}
      
      {/* Transformation particles */}
      {stage === 'vectorizing' && (
        <group ref={particlesRef}>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2
            return (
              <Sphere key={i} args={[0.02]} position={[
                Math.cos(angle) * 0.6,
                Math.sin(angle) * 0.6,
                0
              ]}>
                <meshStandardMaterial 
                  color="#00ff88" 
                  emissive="#00ff88" 
                  emissiveIntensity={0.5}
                />
              </Sphere>
            )
          })}
        </group>
      )}
      
      {/* Document type label */}
      <Text
        position={[0, -0.4, 0]}
        fontSize={0.06}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {documentType.toUpperCase()}
      </Text>
    </group>
  )
}

// Vector database visualization
function VectorDatabase({ position, isActive }) {
  const containerRef = useRef()
  const vectorsRef = useRef()
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    
    if (containerRef.current) {
      containerRef.current.rotation.y = t * 0.3
      
      if (isActive) {
        containerRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05)
      }
    }
    
    if (vectorsRef.current && isActive) {
      vectorsRef.current.children.forEach((vector, index) => {
        vector.position.y = Math.sin(t * 1.5 + index * 0.5) * 0.1
        vector.material.emissiveIntensity = 0.3 + Math.sin(t * 3 + index) * 0.2
      })
    }
  })

  return (
    <group position={position}>
      {/* Database container */}
      <Cylinder ref={containerRef} args={[0.8, 0.8, 1.2, 16]}>
        <meshStandardMaterial
          color="#1e293b"
          transparent
          opacity={0.3}
          wireframe
        />
      </Cylinder>
      
      {/* Vector embeddings inside */}
      <group ref={vectorsRef}>
        {[...Array(20)].map((_, i) => {
          const phi = Math.acos(-1 + (2 * i) / 20)
          const theta = Math.sqrt(20 * Math.PI) * phi
          const radius = 0.6
          
          return (
            <Sphere key={i} args={[0.03]} position={[
              radius * Math.cos(theta) * Math.sin(phi),
              radius * Math.sin(theta) * Math.sin(phi),
              radius * Math.cos(phi)
            ]}>
              <meshStandardMaterial
                color="#06b6d4"
                emissive="#0891b2"
                emissiveIntensity={isActive ? 0.4 : 0.1}
              />
            </Sphere>
          )
        })}
      </group>
      
      <Text
        position={[0, -1, 0]}
        fontSize={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Vector Database
      </Text>
    </group>
  )
}

// Knowledge graph connections
function KnowledgeConnections({ documents, isActive }) {
  const connectionsRef = useRef()
  
  useFrame((state) => {
    if (!isActive || !connectionsRef.current) return
    
    const t = state.clock.getElapsedTime()
    connectionsRef.current.children.forEach((connection, index) => {
      connection.material.opacity = 0.3 + Math.sin(t * 2 + index) * 0.2
    })
  })

  if (!isActive) return null

  return (
    <group ref={connectionsRef}>
      {documents.map((doc, i) => 
        documents.slice(i + 1).map((otherDoc, j) => {
          if (Math.random() > 0.7) {
            return (
              <Line
                key={`${i}-${j}`}
                points={[doc.position, otherDoc.position]}
                color="#f59e0b"
                lineWidth={2}
                transparent
                opacity={0.4}
              />
            )
          }
          return null
        })
      )}
    </group>
  )
}

// Main Document Visualization Component
export default function DocumentVisualization() {
  const [processingStage, setProcessingStage] = useState('idle')
  const [activeDocuments, setActiveDocuments] = useState(new Set())
  
  const documents = useMemo(() => [
    { id: 'pdf1', position: [-2, 1.5, 0], type: 'pdf' },
    { id: 'docx1', position: [0, 2, 0], type: 'docx' },
    { id: 'txt1', position: [2, 1.5, 0], type: 'txt' },
    { id: 'csv1', position: [-1, 0.5, 0], type: 'csv' },
    { id: 'pdf2', position: [1, 0.5, 0], type: 'pdf' }
  ], [])

  const stages = [
    { name: 'idle', duration: 2000, description: 'Documents ready for processing' },
    { name: 'processing', duration: 3000, description: 'AI agents processing documents' },
    { name: 'vectorizing', duration: 3000, description: 'Converting to vector embeddings' },
    { name: 'storing', duration: 2000, description: 'Storing in vector database' },
    { name: 'connecting', duration: 3000, description: 'Building knowledge connections' }
  ]

  useEffect(() => {
    let currentStageIndex = 0
    
    const cycleStages = () => {
      const stage = stages[currentStageIndex]
      setProcessingStage(stage.name)
      
      // Activate documents based on stage
      if (stage.name === 'processing' || stage.name === 'vectorizing') {
        setActiveDocuments(new Set(documents.map(d => d.id)))
      } else {
        setActiveDocuments(new Set())
      }
      
      setTimeout(() => {
        currentStageIndex = (currentStageIndex + 1) % stages.length
        cycleStages()
      }, stage.duration)
    }
    
    cycleStages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentStage = stages.find(s => s.name === processingStage)

  return (
    <div className="w-full h-[500px] bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 rounded-3xl overflow-hidden relative border border-gray-200 shadow-lg">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} intensity={0.6} color="#8b5cf6" />
        <pointLight position={[0, 10, 0]} intensity={0.8} color="#06b6d4" />
        
        {/* Documents */}
        {documents.map((doc) => (
          <TransformingDocument
            key={doc.id}
            position={doc.position}
            documentType={doc.type}
            stage={activeDocuments.has(doc.id) ? processingStage : 'idle'}
          />
        ))}
        
        {/* Vector Database */}
        <VectorDatabase 
          position={[0, -1.5, 0]} 
          isActive={processingStage === 'storing' || processingStage === 'connecting'}
        />
        
        {/* Knowledge Connections */}
        <KnowledgeConnections 
          documents={documents}
          isActive={processingStage === 'connecting'}
        />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.6}
        />
      </Canvas>
      
      {/* Enhanced Processing Status */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl px-5 py-3 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                📚 Document Intelligence
              </h3>
              <p className="text-gray-600 text-xs mt-0.5">
                {currentStage?.description}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                processingStage === 'idle' ? 'bg-gray-400' :
                processingStage === 'processing' ? 'bg-yellow-500 animate-pulse' :
                processingStage === 'vectorizing' ? 'bg-blue-500 animate-pulse' :
                processingStage === 'storing' ? 'bg-green-500 animate-pulse' :
                'bg-purple-500 animate-pulse'
              }`} />
              <span className="text-gray-900 text-xs font-medium capitalize hidden sm:inline">
                {processingStage.replace('ing', 'ing...')}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Document Types Legend */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm">
          <h4 className="text-gray-900 text-xs font-semibold mb-2">Formats</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 bg-red-500 rounded"></div>
              <span className="text-gray-700 font-medium">PDF</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 bg-blue-500 rounded"></div>
              <span className="text-gray-700 font-medium">DOCX</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 bg-green-500 rounded"></div>
              <span className="text-gray-700 font-medium">TXT</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 bg-yellow-500 rounded"></div>
              <span className="text-gray-700 font-medium">CSV</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Processing Progress Indicator */}
      <div className="absolute bottom-4 right-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm">
          <h4 className="text-gray-900 text-xs font-semibold mb-2">Stages</h4>
          <div className="space-y-1.5">
            {stages.map((stage, index) => (
              <div key={stage.name} className="flex items-center space-x-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  processingStage === stage.name ? 'bg-blue-500 animate-pulse' : 
                  stages.findIndex(s => s.name === processingStage) > index ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span className={`text-xs font-medium ${
                  processingStage === stage.name ? 'text-blue-600' : 
                  stages.findIndex(s => s.name === processingStage) > index ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {stage.name.charAt(0).toUpperCase() + stage.name.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
