/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../contexts/POSContext';
import { 
  Mail, 
  Phone, 
  Lock, 
  User, 
  Store, 
  CheckCircle, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  X
} from 'lucide-react';

export const LoginSignupView: React.FC = () => {
  const { staff, loginUser, addStaff, settings, updateSettings } = usePOS();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup States
  const [signupName, setSignupName] = useState('');
  const [signupStore, setSignupStore] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  
  // Validation / Error States
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  
  // Default Credentials info
  const defaultCredentials = [
    { email: 'abdulhaseebb976@gmail.com', password: 'admin', name: 'Abdul Haseeb', role: 'owner' },
    { email: 'owner@zappos.pk', password: 'admin123', name: 'Abdul Haseeb', role: 'owner' }
  ];

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const validatePhone = (val: string) => {
    // Pakistani numbers: 03XXXXXXXXX (11 digits) or +923XXXXXXXXX (13 digits)
    return /^((\+92)|(0092))?3\d{9}$|^03\d{9}$/.test(val.replace(/[-\s]/g, ''));
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password / passcode.');
      return;
    }

    // 1. Check default credentials
    const defaultUser = defaultCredentials.find(
      c => c.email.toLowerCase() === email.toLowerCase().trim() && c.password === password
    );

    if (defaultUser) {
      const staffUser = {
        id: 'user-1',
        name: defaultUser.name,
        email: defaultUser.email,
        role: 'owner' as const,
        dateAdded: '2026-06-01',
        status: 'active' as const
      };
      loginUser(staffUser);
      return;
    }

    // 2. Check current staff database
    const existingStaff = staff.find(
      s => s.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (existingStaff) {
      // For standard staff, let them in (simulated password match for simplicity or passcode "admin123")
      if (password === 'admin123' || password === 'admin') {
        loginUser(existingStaff);
        return;
      } else {
        setError('Incorrect passcode for this staff member. (Try "admin123" or "admin" for simulation)');
        return;
      }
    }

    setError('Invalid credentials. If you are Abdul Haseeb, use your email and passcode.');
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!signupName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!signupStore.trim()) {
      setError('Store / Business Name is required.');
      return;
    }
    if (!validateEmail(signupEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!validatePhone(signupPhone)) {
      setError('Please enter a valid Pakistani mobile number (e.g., 03001234567).');
      return;
    }
    if (signupPassword.length < 4) {
      setError('Password/Passcode must be at least 4 characters.');
      return;
    }

    // Trigger OTP simulation
    setOtpError('');
    setShowOtpModal(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    // Let's require the user to enter '1234' for Email OTP and '5678' for Mobile Phone OTP
    if (emailOtp !== '1234') {
      setOtpError('Incorrect Email Verification Code. Enter "1234" to verify.');
      return;
    }

    if (phoneOtp !== '5678') {
      setOtpError('Incorrect SMS Phone Verification Code. Enter "5678" to verify.');
      return;
    }

    // Verification successful! Create user
    const newUser = {
      id: `user-${Date.now()}`,
      name: signupName,
      email: signupEmail.toLowerCase().trim(),
      role: 'owner' as const,
      dateAdded: new Date().toISOString().split('T')[0],
      status: 'active' as const
    };

    // Update settings business name to match newly registered store
    updateSettings({
      businessName: signupStore,
      phone: signupPhone
    });

    loginUser(newUser);
    setShowOtpModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      
      {/* Absolute Decorative Blurred Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md z-10">
        
        {/* Upper Brand Block */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-primary text-white p-3.5 rounded-2xl font-black text-2xl tracking-tighter shadow-xl mb-4">
            Z
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">ZapPOS</h1>
          <p className="text-sm text-slate-400 mt-2 font-sans">Pakistan Retail & Gated ERP Suite</p>
        </div>

        {/* Outer Form Card */}
        <div className="bg-slate-800/90 border border-slate-700/60 shadow-2xl rounded-3xl p-8 backdrop-blur-md">
          
          {/* Tabs */}
          <div className="flex bg-slate-900 p-1.5 rounded-2xl mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                isLogin ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                !isLogin ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Store
            </button>
          </div>

          {/* Form Message Prompts */}
          {error && (
            <div className="flex gap-2.5 items-start bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-2xl text-xs mb-5 font-sans">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex gap-2.5 items-start bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-2xl text-xs mb-5 font-sans">
              <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORM CONTENT */}
          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary font-sans"
                    placeholder="e.g. owner@zappos.pk"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">Passcode / Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary font-sans"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-sage-dark text-white font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg mt-6 cursor-pointer"
              >
                <span>Access Workspace</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </button>

              {/* Default Creds Box */}
              <div className="mt-6 pt-5 border-t border-slate-700/50">
                <div className="bg-slate-900/60 border border-slate-700/30 p-3.5 rounded-2xl text-[11px] text-slate-400 leading-normal space-y-2">
                  <p className="font-bold text-slate-300 font-sans flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>Quick Simulator Access:</span>
                  </p>
                  <p className="font-sans">
                    Use default credential: <strong className="text-white font-mono text-xs">abdulhaseebb976@gmail.com</strong> with passcode <strong className="text-white font-mono text-xs">admin</strong> (or <strong className="text-slate-300 font-mono">owner@zappos.pk</strong> / <strong className="text-white font-mono text-xs">admin123</strong>) for instant authorization.
                  </p>
                </div>
              </div>

            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">Your Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary font-sans"
                      placeholder="Abdul Haseeb"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">Store Name</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={signupStore}
                      onChange={(e) => setSignupStore(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary font-sans"
                      placeholder="Haseeb Super Mart"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">Owner Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary font-sans"
                    placeholder="e.g. owner@zappos.pk"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">Mobile Phone (Pakistani)</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary font-mono"
                    placeholder="03001234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">Choose Password / Passcode</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary font-sans"
                    placeholder="Min 4 characters"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-sage-dark text-white font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg mt-6 cursor-pointer"
              >
                <span>Verify & Create Workspace</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </button>

            </form>
          )}

        </div>

        {/* Footer info text */}
        <p className="text-center text-slate-500 text-xs mt-6 font-sans">
          &copy; 2026 ZapPOS ERP Inc. Karachi, Pakistan. All Rights Reserved.
        </p>

      </div>

      {/* VERIFICATION DUAL-OTP MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-750 max-w-md w-full rounded-3xl p-6 shadow-2xl relative">
            
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <div className="h-12 w-12 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-white">Dual Multi-Channel Verification</h3>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                We've simulated real-time 2FA activation codes for security compliance.
              </p>
            </div>

            {otpError && (
              <div className="flex gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-2xl text-xs mb-4 font-sans">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              
              {/* 1. Email OTP */}
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-300 font-sans flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    Email verification code sent to:
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mb-2">{signupEmail}</p>
                <input
                  type="text"
                  required
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  placeholder="Enter '1234' to verify"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary text-center font-mono placeholder-slate-600"
                />
              </div>

              {/* 2. Phone OTP */}
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-300 font-sans flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    SMS OTP Code sent to:
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mb-2">{signupPhone}</p>
                <input
                  type="text"
                  required
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value)}
                  placeholder="Enter '5678' to verify"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary text-center font-mono placeholder-slate-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-sage-dark text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg mt-6 cursor-pointer"
              >
                <span>Confirm & Activate POS ERP</span>
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
