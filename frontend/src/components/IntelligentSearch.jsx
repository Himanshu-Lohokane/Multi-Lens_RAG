import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, Sphere, Box, Line, OrbitControls } from '@react-three/drei'

// Search query visualization
function SearchQuery({ position, query, isActive }) {
  const queryRef = useRef()
  const raysRef = useRef()
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    
    if (queryRef.current && isActive) {
      queryRef.current.rotation.y = t * 0.5
      queryRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.1)
    }
    
    if (raysRef.current && isActive) {
      raysRef.current.children.forEach((ray, index) => {
        ray.scale.x = 1 + Math.sin(t * 3 + index) * 0.3
        ray.material.opacity = 0.5 + Math.sin(t * 2 + index) * 0.3
      })
    }
  })

  return (
    <group position={position}>
      {/* Query sphere */}
      <Sphere ref={queryRef} args={[0.2]}>
        <meshStandardMaterial
          color="#ec4899"
          emissive="#db2777"
          emissiveIntensity={isActive ? 0.5 : 0.1}
        />
      </Sphere>
      
      {/* Search rays */}
      {isActive && (
        <group ref={raysRef}>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2
            return (
              <Box
                key={i}
                args={[1.5, 0.02, 0.02]}
                position={[Math.cos(angle) * 0.75, Math.sin(angle) * 0.75, 0]}
                rotation={[0, 0, angle]}
              >
                <meshStandardMaterial
                  color="#ec4899"
                  transparent
                  opacity={0.6}
                  emissive="#db2777"
                  emissiveIntensity={0.3}
                />
              </Box>
            )
          })}
        </group>
      )}
      
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {query}
      </Text>
    </group>
  )
}

// Relevant document highlight
function RelevantDocument({ position, relevanceScore, isHighlighted }) {
  const meshRef = useRef()
  const glowRef = useRef()
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t + position[0]) * 0.1
      
      if (isHighlighted) {
        meshRef.current.scale.setScalar(1 + Math.sin(t * 4) * 0.1)
      }
    }
    
    if (glowRef.current && isHighlighted) {
      glowRef.current.material.opacity = 0.3 + Math.sin(t * 3) * 0.2
    }
  })

  const getRelevanceColor = () => {
    if (relevanceScore > 0.8) return '#10b981' // High relevance - green
    if (relevanceScore > 0.6) return '#f59e0b' // Medium relevance - yellow
    return '#6b7280' // Low relevance - gray
  }

  return (
    <group position={position}>
      {/* Relevance glow */}
      {isHighlighted && (
        <Sphere ref={glowRef} args={[0.4]}>
          <meshBasicMaterial
            color={getRelevanceColor()}
            transparent
            opacity={0.3}
          />
        </Sphere>
      )}
      
      {/* Document */}
      <Box ref={meshRef} args={[0.3, 0.4, 0.03]}>
        <meshStandardMaterial
          color={getRelevanceColor()}
          emissive={getRelevanceColor()}
          emissiveIntensity={isHighlighted ? 0.4 : 0.1}
        />
      </Box>
      
      {/* Relevance score indicator */}
      <Text
        position={[0, -0.3, 0]}
        fontSize={0.06}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {Math.round(relevanceScore * 100)}%
      </Text>
    </group>
  )
}

// AI response generation
function ResponseGenerator({ position, isGenerating, confidence }) {
  const brainRef = useRef()
  const particlesRef = useRef()
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    
    if (brainRef.current && isGenerating) {
      brainRef.current.rotation.y = t * 1.5
      brainRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.15)
    }
    
    if (particlesRef.current && isGenerating) {
      particlesRef.current.rotation.z = t * 2
      particlesRef.current.children.forEach((particle, index) => {
        particle.position.y = Math.sin(t * 2 + index * 0.5) * 0.2
      })
    }
  })

  return (
    <group position={position}>
      {/* AI Brain */}
      <Sphere ref={brainRef} args={[0.25]}>
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#7c3aed"
          emissiveIntensity={isGenerating ? 0.6 : 0.2}
          wireframe
        />
      </Sphere>
      
      {/* Generation particles */}
      {isGenerating && (
        <group ref={particlesRef}>
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * Math.PI * 2
            return (
              <Sphere key={i} args={[0.02]} position={[
                Math.cos(angle) * 0.5,
                Math.sin(angle) * 0.5,
                0
              ]}>
                <meshStandardMaterial
                  color="#a855f7"
                  emissive="#9333ea"
                  emissiveIntensity={0.8}
                />
              </Sphere>
            )
          })}
        </group>
      )}
      
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        AI Response
      </Text>
      
      {/* Confidence indicator */}
      <Text
        position={[0, -0.7, 0]}
        fontSize={0.06}
        color={confidence > 0.8 ? '#10b981' : confidence > 0.6 ? '#f59e0b' : '#ef4444'}
        anchorX="center"
        anchorY="middle"
      >
        {Math.round(confidence * 100)}% Confidence
      </Text>
    </group>
  )
}

// Source verification indicators
function SourceVerification({ sources, isActive }) {
  const groupRef = useRef()
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    
    if (groupRef.current && isActive) {
      groupRef.current.children.forEach((source, index) => {
        source.position.y = Math.sin(t * 1.5 + index * 0.8) * 0.1
        source.material.emissiveIntensity = 0.3 + Math.sin(t * 2 + index) * 0.2
      })
    }
  })

  if (!isActive) return null

  return (
    <group ref={groupRef}>
      {sources.map((source, index) => {
        const angle = (index / sources.length) * Math.PI * 2
        const radius = 2
        
        return (
          <Box
            key={index}
            args={[0.15, 0.2, 0.02]}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle) * radius * 0.3,
              Math.sin(angle) * radius * 0.2
            ]}
          >
            <meshStandardMaterial
              color="#06b6d4"
              emissive="#0891b2"
              emissiveIntensity={0.4}
              transparent
              opacity={0.8}
            />
          </Box>
        )
      })}
    </group>
  )
}

// Main Intelligent Search Component
export default function IntelligentSearch() {
  const [searchStage, setSearchStage] = useState('idle')
  const [highlightedDocs, setHighlightedDocs] = useState(new Set())
  const [currentQuery] = useState('What are our Q3 results?')
  
  const documents = [
    { id: 'doc1', position: [-2, 1, 0], relevance: 0.95, type: 'financial' },
    { id: 'doc2', position: [-1, 2, 0], relevance: 0.87, type: 'report' },
    { id: 'doc3', position: [1, 1.5, 0], relevance: 0.72, type: 'analysis' },
    { id: 'doc4', position: [2, 0.5, 0], relevance: 0.45, type: 'misc' },
    { id: 'doc5', position: [0, -0.5, 0], relevance: 0.91, type: 'summary' }
  ]

  const sources = [
    { id: 'src1', verified: true },
    { id: 'src2', verified: true },
    { id: 'src3', verified: true }
  ]

  const searchStages = [
    { name: 'idle', duration: 2000, description: 'Ready for search query' },
    { name: 'searching', duration: 2000, description: 'Processing search query' },
    { name: 'retrieving', duration: 2500, description: 'Finding relevant documents' },
    { name: 'ranking', duration: 2000, description: 'Ranking by relevance' },
    { name: 'generating', duration: 3000, description: 'Generating AI response' },
    { name: 'verifying', duration: 2000, description: 'Verifying sources' },
    { name: 'complete', duration: 2500, description: 'Response ready with sources' }
  ]

  useEffect(() => {
    let currentStageIndex = 0
    
    const cycleStages = () => {
      const stage = searchStages[currentStageIndex]
      setSearchStage(stage.name)
      
      // Update highlighted documents based on stage
      if (stage.name === 'retrieving' || stage.name === 'ranking') {
        const relevantDocs = documents
          .filter(doc => doc.relevance > 0.6)
          .map(doc => doc.id)
        setHighlightedDocs(new Set(relevantDocs))
      } else if (stage.name === 'complete') {
        const topDocs = documents
          .filter(doc => doc.relevance > 0.8)
          .map(doc => doc.id)
        setHighlightedDocs(new Set(topDocs))
      } else {
        setHighlightedDocs(new Set())
      }
      
      setTimeout(() => {
        currentStageIndex = (currentStageIndex + 1) % searchStages.length
        cycleStages()
      }, stage.duration)
    }
    
    cycleStages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentStage = searchStages.find(s => s.name === searchStage)
  const confidence = searchStage === 'complete' ? 0.94 : 
                    searchStage === 'generating' ? 0.87 : 0.0

  return (
    <div className="w-full h-96 bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 rounded-2xl overflow-hidden relative border border-gray-200 shadow-lg">
      <Canvas camera={{ position: [0, 0, 7], fov: 55 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        
        {/* Search Query */}
        <SearchQuery
          position={[0, 2.5, 0]}
          query="Search Query"
          isActive={searchStage === 'searching'}
        />
        
        {/* Documents */}
        {documents.map((doc) => (
          <RelevantDocument
            key={doc.id}
            position={doc.position}
            relevanceScore={doc.relevance}
            isHighlighted={highlightedDocs.has(doc.id)}
          />
        ))}
        
        {/* AI Response Generator */}
        <ResponseGenerator
          position={[0, -2, 0]}
          isGenerating={searchStage === 'generating'}
          confidence={confidence}
        />
        
        {/* Source Verification */}
        <SourceVerification
          sources={sources}
          isActive={searchStage === 'verifying' || searchStage === 'complete'}
        />
        
        {/* Search connections */}
        {(searchStage === 'retrieving' || searchStage === 'ranking') && (
          <>
            {documents
              .filter(doc => doc.relevance > 0.6)
              .map((doc, index) => (
                <Line
                  key={index}
                  points={[[0, 2.5, 0], doc.position]}
                  color="#ec4899"
                  lineWidth={2}
                  transparent
                  opacity={0.6}
                />
              ))
            }
          </>
        )}
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.6}
        />
      </Canvas>
      
      {/* Search Status */}
      <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-900 text-base font-bold">
              🔍 Intelligent Search
            </h3>
            <p className="text-gray-600 text-xs truncate mt-0.5">
              &quot;{currentQuery}&quot;
            </p>
          </div>
          
          <div className="flex items-center space-x-2 ml-3">
            <div className={`w-2 h-2 rounded-full ${
              searchStage === 'idle' ? 'bg-gray-400' :
              searchStage === 'complete' ? 'bg-green-500' :
              'bg-blue-500 animate-pulse'
            }`} />
            <span className="text-gray-900 text-xs font-medium hidden sm:inline">
              {currentStage?.description}
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
            style={{ 
              width: `${(searchStages.findIndex(s => s.name === searchStage) + 1) / searchStages.length * 100}%` 
            }}
          />
        </div>
      </div>
      
      {/* Results Summary */}
      {searchStage === 'complete' && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-gray-900 font-semibold text-sm">Search Results</h4>
              <p className="text-gray-600 text-xs">
                Found {documents.filter(d => d.relevance > 0.8).length} highly relevant documents
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-green-600 font-bold text-base">
                {Math.round(confidence * 100)}%
              </div>
              <div className="text-gray-500 text-xs">Confidence</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}