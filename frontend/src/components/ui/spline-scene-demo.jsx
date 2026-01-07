import { SplineScene } from "@/components/ui/spline";
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { Brain, Network, Zap, Shield } from 'lucide-react'
 
export function SplineSceneDemo() {
  return (
    <Card className="w-full h-[600px] bg-gradient-to-br from-orange-900 via-rose-900 to-red-950 relative overflow-hidden border-orange-500/20 shadow-2xl">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="orange"
      />
      
      <div className="flex flex-col md:flex-row h-full">
        {/* Left content */}
        <div className="flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-center">
          <div className="mb-4">
            <span className="px-3 py-1 text-xs font-semibold bg-orange-500/20 text-orange-300 rounded-full border border-orange-500/30">
              Powered by AI
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-orange-200 mb-4">
            Neural RAG
            <br />
            Intelligence
          </h1>
          
          <p className="mt-4 text-orange-100/80 max-w-lg text-lg leading-relaxed">
            Experience next-generation document intelligence powered by multi-agent AI 
            collaboration. Our RAG system transforms how you interact with knowledge.
          </p>

          {/* Feature Pills */}
          <div className="mt-8 grid grid-cols-2 gap-3 max-w-lg">
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
              <Brain className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-100 font-medium">LLM Powered (Gemini)</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
              <Network className="w-4 h-4 text-rose-400" />
              <span className="text-sm text-orange-100 font-medium">Vector Search</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-orange-100 font-medium">&lt;0.5s Response</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-orange-100 font-medium">99.2% Accuracy</span>
            </div>
          </div>
        </div>

        {/* Right content - 3D Scene */}
        <div className="flex-1 relative min-h-[300px]">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  )
}

