import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function WelcomePage() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading to show animation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-20 h-20 mb-8"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "loop"
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <motion.path
                d="M50 10 L90 90 L10 90 Z"
                fill="none"
                stroke="#6366F1"
                strokeWidth="5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </svg>
          </motion.div>
          <p className="text-indigo-600 font-medium">Loading Learn Smart...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-indigo-50 to-slate-100 overflow-hidden relative">
      {/* Floating elements for background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full bg-gradient-to-br opacity-70 blur-3xl`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${(i+2) * 50}px`,
              height: `${(i+2) * 50}px`,
              background: i % 2 === 0 
                ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' 
                : 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)'
            }}
            animate={{
              y: [0, -15, 0],
              x: [0, i % 2 === 0 ? 10 : -10, 0],
              opacity: [0.5, 0.7, 0.5]
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: i * 0.2
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 mb-6"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Adaptive Learning
        </motion.h1>
        
        <motion.p
          className="text-xl text-gray-600 max-w-2xl mb-12"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Personalized education pathways that adapt to your learning style, providing tailored feedback and empowering every student, tutor, and administrator
        </motion.p>
        
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button 
            onClick={handleGetStarted}
            className="px-10 py-5 bg-indigo-600 text-white text-xl font-medium rounded-full shadow-xl hover:bg-indigo-700 transition-all duration-300"
          >
            Get Started
            <motion.span 
              className="inline-block ml-2"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              →
            </motion.span>
          </button>
        </motion.div>
        
        <motion.div
          className="grid grid-cols-3 gap-10 mt-16 max-w-3xl w-full"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {[
            { icon: '📚', title: 'Smart Courses', desc: 'Curriculum that adapts' },
            { icon: '🚀', title: 'Fast Progress', desc: 'Learn at your own pace' },
            { icon: '🏆', title: 'Achievement', desc: 'Earn badges & certificates' },
          ].map((feature) => (
            <motion.div 
              key={feature.title}
              className="flex flex-col items-center"
              whileHover={{ y: -5 }}
            >
              <span className="text-4xl mb-2">{feature.icon}</span>
              <h3 className="text-lg font-bold text-gray-800">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div
          className="absolute bottom-6 left-0 right-0 text-center text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          © 2025 Learn Smart • Multi-role platform with secure authentication
        </motion.div>
      </motion.div>
    </div>
  );
}