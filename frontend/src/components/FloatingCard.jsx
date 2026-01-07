import { motion } from 'framer-motion'

export default function FloatingCard({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -10,
        transition: { duration: 0.2 }
      }}
      viewport={{ once: true }}
      className={className}
    >
      {children}
    </motion.div>
  )
}