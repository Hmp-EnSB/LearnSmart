import { useLocation } from 'wouter';

export default function WelcomePage() {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Left Panel: Hero Illustration */}
      <div className="relative lg:w-1/2 bg-gradient-to-br from-blue-700 to-indigo-800 flex items-center justify-center overflow-hidden">
        <div className="w-3/4 animate-float text-white text-9xl font-extrabold opacity-80 flex items-center justify-center">
          <span className="drop-shadow-2xl">LS</span>
        </div>
        <div className="absolute bottom-0 right-0 p-6 text-white text-right">
          <p className="opacity-50 text-sm">Designed for</p>
          <h3 className="text-xl font-light">Tomorrow's Learners</h3>
        </div>
      </div>

      {/* Right Panel: Content */}
      <div className="lg:w-1/2 flex flex-col justify-center p-8 bg-white">
        <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 animate-fade-in">
          Welcome to <span className="text-indigo-600">Learn Smart</span>
        </h1>
        <p className="text-gray-600 text-lg mb-8 animate-fade-in-delay">
          Personalized learning journeys, collaborative study circles, real-time feedback, and more—built to empower every role: Student, Tutor, and Admin.
        </p>

        {/* Feature Highlights */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 animate-fade-in-delay-2">
          {[
            { icon: '🎯', title: 'Adaptive Paths' },
            { icon: '🛠️', title: 'Course Builder' },
            { icon: '🌐', title: 'Offline Sync' },
            { icon: '🔔', title: 'Instant Alerts' },
          ].map((f) => (
            <li key={f.title} className="flex items-center space-x-3 hover:translate-x-1 transition-transform">
              <span className="text-2xl">{f.icon}</span>
              <span className="text-gray-700 font-medium">{f.title}</span>
            </li>
          ))}
        </ul>

        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 animate-fade-in-delay-3">
          <button
            onClick={() => navigate('/login')}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition"
          >
            Get Started
          </button>
          <button
            className="flex-1 px-6 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition"
          >
            View Features
          </button>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center text-sm text-gray-400 animate-fade-in-delay-4">
          <span className="hover:underline mx-2 cursor-pointer">Terms</span>
          <span className="mx-1">·</span>
          <span className="hover:underline mx-2 cursor-pointer">Privacy</span>
          <span className="mx-1">·</span>
          <span className="hover:underline mx-2 cursor-pointer">Support</span>
        </div>
      </div>
    </div>
  );
}