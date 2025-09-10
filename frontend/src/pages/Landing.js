import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';


export default function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        await api.getMe();
        navigate('/dashboard', { replace: true });
      } catch (e) {
        // not logged in, stay on landing
      } finally {
        setChecking(false);
      }
    })();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <h1 className="text-2xl font-bold tracking-tight">QuickMap</h1>
          <div className="space-x-2">
            <Link to="/login" className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">Login</Link>
            <Link to="/register" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">Register</Link>
          </div>
        </header>

        <main>
          {/* Hero Section */}
          <section className="py-20 sm:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400 pb-3">
                  Plan your learning, master your goals.
                </h2>
                <p className="mt-6 text-lg text-slate-400 max-w-xl mx-auto lg:mx-0">
                  Generate a tailored study roadmap, track milestones, bookmark public plans, and stay accountable. Get started in minutes.
                </p>
                <div className="mt-8 flex justify-center lg:justify-start gap-4">
                  <Link to="/register" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-base font-medium text-white transition-colors shadow-lg hover:shadow-indigo-500/50">
                    Get Started Free
                  </Link>
                  <Link to="/login" className="rounded-lg bg-slate-800 hover:bg-slate-700 px-6 py-3 text-base font-medium text-slate-200 transition-colors">
                    I have an account
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <img 
                  src="/landing-page-image.jpg"
                  alt="Landing page image" 
                  className="rounded-2xl shadow-2xl shadow-slate-900/60"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 sm:py-28 border-t border-slate-800">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold tracking-tight">Everything you need to succeed</h3>
              <p className="mt-3 text-lg text-slate-400">A powerful toolset to organize your study journey.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-800">
                <img src="/roadmap.svg" alt="Roadmap icon" className="w-8 h-8 mb-4" />
                <h4 className="text-xl font-semibold text-slate-100">Tailored Roadmaps</h4>
                <p className="mt-2 text-slate-400">Generate a personalized AI-powered study plan for any topic, complete with timelines and resources.</p>
              </div>
              {/* Feature 2 */}
              <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-800">
                <img src="/goal.svg" alt="Goal icon" className="w-8 h-8 mb-4" />
                <h4 className="text-xl font-semibold text-slate-100">Track Milestones</h4>
                <p className="mt-2 text-slate-400">Monitor your progress, mark topics as complete, and stay motivated on your path to mastery.</p>
              </div>
              {/* Feature 3 */}
              <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-800">
                <img src="/bookmark.svg" alt="Bookmark icon" className="w-8 h-8 mb-4" />
                <h4 className="text-xl font-semibold text-slate-100">Bookmark Plans</h4>
                <p className="mt-2 text-slate-400">Discover and save public study plans created by the community for inspiration.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}