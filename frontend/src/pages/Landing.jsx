import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { 
  ArrowRight, 
  Truck, 
  Upload,
  ChevronDown,
  Sparkles,
  Package,
  Globe,
  FileText,
  Zap,
  Search
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { HeroSection } from '../components/ui/hero-section-1'
import FloatingCard from '../components/FloatingCard'

const Landing = () => {

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const features = [
    {
      icon: <Package className="w-6 h-6" />,
      title: "Smart Package Tracking",
      description: "Instantly search shipment details, delivery status, and customs documentation across millions of packages"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Document Intelligence",
      description: "Search invoices, bills of lading, customs forms, and shipping manifests with natural language queries"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Compliance",
      description: "AI-powered search across international shipping regulations and customs requirements for 60+ countries"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Answers",
      description: "Get precise logistics answers in under 0.5 seconds with complete source traceability"
    }
  ]

  const steps = [
    {
      icon: <Upload className="w-8 h-8" />,
      title: "Upload Logistics Documents",
      description: "Import shipping docs, customs forms, invoices, and tracking data—AI processes everything automatically"
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "Ask Natural Questions",
      description: "Search like you talk: 'What's the status of shipment AX-12345?' or 'Show customs docs for Dubai orders'"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Get Instant Insights",
      description: "Receive accurate answers with full document references—perfect for customs, audits, and tracking"
    }
  ]

  const [featuresRef, featuresInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [stepsRef, stepsInView] = useInView({ threshold: 0.1, triggerOnce: true })

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 relative overflow-hidden">
      {/* New Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            variants={staggerContainer}
            initial="initial"
            animate={featuresInView ? "animate" : "initial"}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent"
            >
              📦 Powerful Logistics Features
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4"
            >
              Transform how you manage shipping documents, track packages, and handle customs compliance
              with AI that understands logistics operations.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FloatingCard key={index} delay={index * 0.1}>
                <div className="group p-8 rounded-3xl border border-orange-100 hover:border-rose-300 bg-white h-full transition-all duration-300 hover:shadow-xl shadow-sm">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" ref={stepsRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            variants={staggerContainer}
            initial="initial"
            animate={stepsInView ? "animate" : "initial"}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent"
            >
              🚀 How It Works
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Start searching your logistics documents in minutes—no technical setup required
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <FloatingCard key={index} delay={index * 0.2} className="relative text-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-orange-100/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full z-10">
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ArrowRight className="w-6 h-6 text-orange-400 mx-auto" />
                    </motion.div>
                  </div>
                )}
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500 via-rose-500 to-red-500">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
              Ready to Transform Your Logistics Operations?
            </h2>
            <p className="text-xl text-orange-100 mb-10 max-w-2xl mx-auto">
              Join leading logistics teams using AI-powered document intelligence. 
              Experience the future of logistics management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register"
                className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-white/25 transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-105"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/login"
                className="border-2 border-white/50 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-orange-600 transition-all duration-300 backdrop-blur-sm"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">LogiSearch</span>
                  <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Document AI</span>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed">
                AI-powered logistics document intelligence for faster shipping, customs compliance, and package tracking.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Product</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-orange-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-orange-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#about" className="hover:text-orange-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 LogiSearch Document AI. All rights reserved. Powered by advanced AI & machine learning.</p>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 2, type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.button
          className="w-14 h-14 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full shadow-2xl flex items-center justify-center text-white border border-white/20 backdrop-blur-sm"
          whileHover={{ scale: 1.1, rotate: 360 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ChevronDown className="w-6 h-6 rotate-180" />
        </motion.button>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="flex flex-col items-center text-gray-500 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200 shadow-sm"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-sm mb-2">Scroll to explore</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Landing