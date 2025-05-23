import { useLocation } from 'wouter';

export default function WelcomePage() {
  const [, navigate] = useLocation();
  
  return (
    <div className="flex flex-col lg:flex-row h-screen bg-white">
      {/* Left Panel: Content */}
      <div className="lg:w-1/2 flex flex-col justify-center p-12 lg:p-16">
        <div className="max-w-xl">
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 animate-fade-in">
            Transform your learning experience
          </h1>
          
          <p className="text-xl text-gray-600 leading-relaxed mb-10 animate-fade-in-delay">
            Discover a powerful platform designed for modern education with personalized learning paths, 
            advanced analytics, and collaborative tools.
          </p>
          
          <div className="space-y-6 animate-fade-in-delay-2">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white text-lg font-medium rounded-lg 
                        shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1"
            >
              Get Started
            </button>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-gray-500">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Multi-role access</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure authentication</span>
              </div>
            </div>
          </div>
          
          <div className="mt-16 grid grid-cols-3 gap-8 animate-fade-in-delay-3">
            {[
              { number: '99%', label: 'Student satisfaction' },
              { number: '24/7', label: 'Expert support' },
              { number: '50+', label: 'Course templates' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl lg:text-3xl font-bold text-indigo-600">{stat.number}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Right Panel: Visual */}
      <div className="lg:w-1/2 bg-gradient-to-br from-indigo-500 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        
        <div className="relative h-full flex items-center justify-center p-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl w-full max-w-lg border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            
            <div className="space-y-6">
              <div className="h-10 bg-white/20 rounded-md animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-white/20 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-white/20 rounded animate-pulse"></div>
                <div className="h-4 bg-white/20 rounded w-5/6 animate-pulse"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-white/20 rounded-lg animate-pulse"></div>
                <div className="h-24 bg-white/20 rounded-lg animate-pulse"></div>
              </div>
              <div className="h-10 bg-white/20 rounded-md w-1/2 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 right-8 text-white/70 text-sm">
          Learn Smart - Trusted by educators worldwide
        </div>
      </div>
    </div>
  );
}