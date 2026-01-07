import { OrbitingCircles } from "@/components/ui/orbiting-circles"
import { RAGExplanationCards } from "@/components/ui/rag-explanation-cards"
import { Brain, Database, Zap, Network, Search, Bot, Sparkles } from 'lucide-react'

// Technology Icons
const TechIcons = {
  googleDrive: () => (
    <svg className="w-6 h-6" viewBox="0 0 87.3 78" fill="currentColor">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  ),
  whatsapp: () => (
    <svg className="w-6 h-6" viewBox="0 0 175.216 175.552" fill="currentColor">
      <defs>
        <linearGradient id="b" x1="85.915" x2="86.535" y1="32.567" y2="137.092" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#57d163"/>
          <stop offset="1" stopColor="#23b33a"/>
        </linearGradient>
      </defs>
      <path d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.559 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.517 31.126 8.523h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.928z" fill="url(#b)"/>
      <path d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647" fill="#ffffff" fillRule="evenodd"/>
    </svg>
  ),
  notion: () => (
    <svg className="w-6 h-6" viewBox="0 0 100 100" fill="currentColor">
      <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="#ffffff"/>
      <path d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917z" fill="#000000"/>
    </svg>
  ),
  langchain: () => <Network className="w-6 h-6" />,
  pinecone: () => <Database className="w-6 h-6" />,
  fastapi: () => <Zap className="w-6 h-6" />,
}

const RAG_CONCEPTS = [
  {
    id: '1',
    title: 'Retrieval-Augmented Generation',
    description: 'RAG combines the power of large language models with your own document knowledge base, providing accurate, context-aware responses.',
    icon: <Brain className="w-6 h-6" />
  },
  {
    id: '2',
    title: 'Vector Embeddings',
    description: 'Documents are transformed into high-dimensional vectors that capture semantic meaning, enabling intelligent similarity search.',
    icon: <Network className="w-6 h-6" />
  },
  {
    id: '3',
    title: 'Semantic Search',
    description: 'Go beyond keyword matching. Our AI understands context and intent to find the most relevant information in your documents.',
    icon: <Search className="w-6 h-6" />
  },
  {
    id: '4',
    title: 'Multi-Agent Collaboration',
    description: 'Specialized AI agents work together—processing, embedding, retrieving, and generating responses with human-like intelligence.',
    icon: <Bot className="w-6 h-6" />
  },
  {
    id: '5',
    title: 'Context-Aware Responses',
    description: 'The AI generates answers using retrieved document chunks, ensuring responses are grounded in your actual data.',
    icon: <Sparkles className="w-6 h-6" />
  },
]

export function RAGTechShowcase() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
            Powered by Advanced AI Technology
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Built with cutting-edge RAG architecture and state-of-the-art language models
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-stretch">
          {/* Left: Orbiting Circles */}
          <div className="relative flex h-[500px] w-full items-center justify-center overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 shadow-xl">
            <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-gray-900 to-gray-400 bg-clip-text text-center text-6xl font-bold leading-none text-transparent">
              RAG AI
            </span>

            {/* Inner Circles */}
            <OrbitingCircles
              className="size-[50px] border-none bg-white shadow-lg"
              duration={20}
              delay={20}
              radius={80}
            >
              <div className="flex items-center justify-center">
                <TechIcons.googleDrive />
              </div>
            </OrbitingCircles>
            <OrbitingCircles
              className="size-[50px] border-none bg-white shadow-lg"
              duration={20}
              delay={10}
              radius={80}
            >
              <div className="flex items-center justify-center">
                <TechIcons.whatsapp />
              </div>
            </OrbitingCircles>

            {/* Middle Circles */}
            <OrbitingCircles
              className="size-[50px] border-none bg-white shadow-lg"
              duration={25}
              radius={140}
            >
              <div className="flex items-center justify-center text-purple-600">
                <TechIcons.pinecone />
              </div>
            </OrbitingCircles>
            <OrbitingCircles
              className="size-[50px] border-none bg-white shadow-lg"
              duration={25}
              delay={12.5}
              radius={140}
            >
              <div className="flex items-center justify-center text-orange-600">
                <TechIcons.fastapi />
              </div>
            </OrbitingCircles>

            {/* Outer Circles (reverse) */}
            <OrbitingCircles
              className="size-[60px] border-none bg-white shadow-lg"
              radius={200}
              duration={30}
              reverse
            >
              <div className="flex items-center justify-center">
                <TechIcons.notion />
              </div>
            </OrbitingCircles>
            <OrbitingCircles
              className="size-[60px] border-none bg-white shadow-lg"
              radius={200}
              duration={30}
              delay={15}
              reverse
            >
              <div className="flex items-center justify-center text-green-600">
                <TechIcons.langchain />
              </div>
            </OrbitingCircles>
          </div>

          {/* Right: RAG Explanation Cards */}
          <div className="relative h-[500px] rounded-3xl border border-gray-200 bg-gradient-to-br from-slate-50 to-gray-50 shadow-xl">
            <RAGExplanationCards cards={RAG_CONCEPTS} />
          </div>
        </div>
      </div>
    </section>
  )
}

