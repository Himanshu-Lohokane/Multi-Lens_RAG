import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function AnimatedCounter({ end, duration = 2, suffix = "", prefix = "" }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime = null
    let animationFrame = null

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeOutQuart * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [end, duration])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="text-3xl md:text-4xl font-bold text-white mb-2">
        {prefix}{count}{suffix}
      </div>
    </motion.div>
  )
}