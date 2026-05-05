import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Zap, Shield, Users, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bg_image from '../assets/bg_image.png';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-brown-900 selection:bg-terracotta/20 overflow-hidden relative">
      {/* Background Image Container */}
      <div 
      className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-80"
      style={{ 
        backgroundImage: `url(${bg_image})`,
        backgroundRepeat: 'no-repeat', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center'
      }}
    />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-32 relative z-10">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-terracotta/10 border border-terracotta/20 px-5 py-2 rounded-full text-terracotta-dark text-xs font-black uppercase tracking-widest mb-10"
          >
            <Sparkles className="w-4 h-4" />
            <span>Next-Gen Communication</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tight mb-8 text-brown-900 leading-[0.9]"
          >
            GuppShapp <br />
            <span className="text-terracotta italic font-serif">Redefined.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-brown-700 max-w-2xl mb-12 leading-relaxed font-medium"
          >
            Simple, secure, and aesthetic. Join the community and experience 
            a warm, distraction-free environment for your most important conversations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-5"
          >
            <button
              onClick={() => navigate('/chat')}
              className="group bg-terracotta hover:bg-terracotta-dark text-white px-10 py-5 rounded-2xl font-black text-lg transition-all flex items-center gap-3 shadow-xl shadow-terracotta/30 active:scale-95"
            >
              Get Started
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-white/60 hover:bg-white/80 backdrop-blur-md border border-brown-900/10 text-brown-900 px-10 py-5 rounded-2xl font-black text-lg transition-all active:scale-95">
              Learn More
            </button>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-10 mt-40">
          <FeatureCard 
            icon={<Zap className="w-7 h-7 text-white" />}
            title="Instant Sync"
            description="Our custom engine ensures messages fly across the globe in milliseconds."
          />
          <FeatureCard 
            icon={<Shield className="w-7 h-7 text-white" />}
            title="Secure Vault"
            description="Your privacy is non-negotiable. Everything is encrypted from end to end."
          />
          <FeatureCard 
            icon={<Users className="w-7 h-7 text-white" />}
            title="Global Hubs"
            description="Create channels for anything—from work squads to weekend planning."
          />
        </div>
      </main>

    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="p-10 rounded-[2.5rem] bg-white/40 border border-white/60 shadow-xl shadow-brown-900/5 backdrop-blur-md group"
  >
    <div className="w-14 h-14 bg-terracotta rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-terracotta/20 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-2xl font-black mb-4 text-brown-900 tracking-tight">{title}</h3>
    <p className="text-brown-700 leading-relaxed font-medium opacity-80">
      {description}
    </p>
  </motion.div>
);

export default LandingPage;
