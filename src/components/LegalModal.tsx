import React, { useEffect, useRef } from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface LegalModalProps {
  document: 'terms' | 'privacy' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ document, onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll to top when document changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [document]);

  if (!document) return null;

  const isTerms = document === 'terms';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 md:p-12 bg-black/80 backdrop-blur-3xl animate-fade-in">
      <div className="w-full max-w-4xl h-full max-h-[85vh] bg-[#050505]/90 border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative flex flex-col">
        
        {/* Header */}
        <div className="flex-none p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isTerms ? 'bg-[#00f2ff]/10 text-[#00f2ff]' : 'bg-purple-500/10 text-purple-400'}`}>
              {isTerms ? <FileText size={24} /> : <Shield size={24} />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {isTerms ? 'Terms of Service' : 'Privacy Policy'}
              </h2>
              <p className="text-xs text-white/50 font-mono tracking-widest mt-1 uppercase">
                Last Updated: July 2026
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
          <div className="max-w-3xl mx-auto prose prose-invert prose-headings:font-bold prose-h3:text-white prose-p:text-white/70 prose-li:text-white/70 prose-a:text-[#00f2ff] prose-a:no-underline hover:prose-a:underline">
            
            {isTerms ? (
              // TERMS OF SERVICE CONTENT
              <>
                <p className="lead text-xl text-white/90 font-medium mb-8">
                  Welcome to PlayMe. By using our service, you agree to these terms. Please read them carefully.
                </p>

                <h3 className="text-xl text-[#00f2ff] mt-8 mb-4">1. Introduction</h3>
                <p className="mb-4">
                  These Terms of Service ("Terms") cover your use and access to the PlayMe Music streaming service, including all features, functionalities, user interfaces, and software associated with the service (collectively, the "Service").
                </p>

                <h3 className="text-xl text-[#00f2ff] mt-8 mb-4">2. The PlayMe Service</h3>
                <p className="mb-4">
                  We provide a premium digital music streaming service. The Service requires an internet connection for streaming, though Premium subscribers may download content for offline playback.
                </p>
                <ul className="list-disc pl-5 mb-6 space-y-2">
                  <li><strong>Free Tier:</strong> Ad-supported streaming with standard audio quality.</li>
                  <li><strong>Premium Tier:</strong> Ad-free listening, Lossless Hi-Res audio, and offline downloads.</li>
                </ul>

                <h3 className="text-xl text-[#00f2ff] mt-8 mb-4">3. User Guidelines</h3>
                <p className="mb-4">
                  We respect intellectual property rights and expect you to do the same. You agree not to:
                </p>
                <ul className="list-disc pl-5 mb-6 space-y-2">
                  <li>Reverse-engineer, decompile, or disassemble any aspect of the Service.</li>
                  <li>Circumvent any technology used by PlayMe or its licensors to protect content.</li>
                  <li>Sell, rent, sublicense, or lease any part of the PlayMe Service.</li>
                  <li>Provide your password to any other person or use any other person's username and password.</li>
                </ul>

                <h3 className="text-xl text-[#00f2ff] mt-8 mb-4">4. Subscriptions and Billing</h3>
                <p className="mb-4">
                  Premium subscriptions are billed on a recurring monthly basis. You may cancel your subscription at any time through your Account Settings. Upon cancellation, your Premium access will continue until the end of your current billing cycle. No refunds or credits for partial month subscription periods are provided.
                </p>

                <h3 className="text-xl text-[#00f2ff] mt-8 mb-4">5. Limitation of Liability</h3>
                <p className="mb-4">
                  TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL PLAYME, ITS OFFICERS, SHAREHOLDERS, EMPLOYEES, AGENTS, DIRECTORS, SUBSIDIARIES, AFFILIATES, SUCCESSORS, ASSIGNS, SUPPLIERS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, PUNITIVE, EXEMPLARY, OR CONSEQUENTIAL DAMAGES.
                </p>
              </>
            ) : (
              // PRIVACY POLICY CONTENT
              <>
                <p className="lead text-xl text-white/90 font-medium mb-8">
                  Your privacy is critically important to us. This policy explains what we collect and how we use it.
                </p>

                <h3 className="text-xl text-purple-400 mt-8 mb-4">1. Information We Collect</h3>
                <p className="mb-4">
                  We collect information to provide better services to all our users. The information PlayMe collects includes:
                </p>
                <ul className="list-disc pl-5 mb-6 space-y-2">
                  <li><strong>Account Information:</strong> Name, email address, password, and date of birth.</li>
                  <li><strong>Usage Data:</strong> Your listening history, created playlists, saved artists, and interactions with our AI DJ.</li>
                  <li><strong>Device Information:</strong> Hardware model, operating system version, unique device identifiers, and mobile network information.</li>
                </ul>

                <h3 className="text-xl text-purple-400 mt-8 mb-4">2. How We Use Your Data</h3>
                <p className="mb-4">
                  We use the information we collect to operate, maintain, and improve the PlayMe Service. Specifically:
                </p>
                <ul className="list-disc pl-5 mb-6 space-y-2">
                  <li>To personalize your music recommendations (e.g. AI Vibe generation).</li>
                  <li>To process your premium subscription payments.</li>
                  <li>To communicate with you about service updates and promotional offers.</li>
                  <li>To maintain the security and integrity of our platform.</li>
                </ul>

                <h3 className="text-xl text-purple-400 mt-8 mb-4">3. Data Sharing</h3>
                <p className="mb-4">
                  We do not sell your personal data to third parties. We may share data with trusted third-party service providers who assist us in operating our application, conducting our business, or servicing you, so long as those parties agree to keep this information confidential (e.g. payment processors).
                </p>

                <h3 className="text-xl text-purple-400 mt-8 mb-4">4. Security</h3>
                <p className="mb-4">
                  We implement a variety of security measures to maintain the safety of your personal information when you enter, submit, or access your personal information. All sensitive payment information is transmitted via Secure Socket Layer (SSL) technology and encrypted.
                </p>

                <h3 className="text-xl text-purple-400 mt-8 mb-4">5. Your Rights</h3>
                <p className="mb-4">
                  You have the right to access, update, or delete your personal information at any time through your Account Settings. If you wish to completely erase your account and all associated data, you may contact our support team.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer Fade */}
        <div className="h-12 w-full bg-gradient-to-t from-[#050505] to-transparent absolute bottom-0 left-0 pointer-events-none" />
      </div>
    </div>
  );
};
