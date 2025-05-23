import { useLocation } from 'wouter';

export default function WelcomePage() {
  const [, navigate] = useLocation();

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
      <div className="m-auto text-center max-w-lg p-8">
        <h1 className="text-5xl font-bold mb-4">Welcome to Learn Smart</h1>
        <p className="text-lg mb-8">
          Unlock personalized learning paths, collaborate in study circles, earn badges, and more.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-8 py-3 bg-white text-indigo-600 rounded-full font-semibold hover:bg-gray-100 transition"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}