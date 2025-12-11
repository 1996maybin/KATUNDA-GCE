import React, { useState } from 'react';
import { User, Settings } from '../types';
import { getSettings, saveSettings, updateUserPassword, logAction } from '../utils/db';
import { DEFAULT_SETTINGS } from '../constants';
import { Save, RotateCcw, Trash2, Key, Check, AlertTriangle, X, DollarSign } from 'lucide-react';

interface Props {
  user: User;
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ user, onClose }) => {
  const [settings, setSettingsState] = useState<Settings>(getSettings());
  
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });
  
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setSettingsState(prev => ({ ...prev, [e.target.name]: val }));
  };

  const saveFees = () => {
    saveSettings(settings);
    showMsg('success', 'Fee settings saved successfully.');
  };

  const resetDefaults = () => {
    if(confirm('Reset all fee settings to system defaults?')) {
      setSettingsState(DEFAULT_SETTINGS);
      saveSettings(DEFAULT_SETTINGS);
      showMsg('success', 'Settings reset to defaults.');
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new.length < 4) {
      showMsg('error', 'Password must be at least 4 characters.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showMsg('error', 'Passwords do not match.');
      return;
    }
    
    // Check if CryptoJS is available
    if (!window.CryptoJS) {
       showMsg('error', 'Security library missing. Refresh page.');
       return;
    }

    const hash = window.CryptoJS.MD5(passwords.new).toString();
    // Update signature to include plain password for admin visibility requirement
    if (updateUserPassword(user.username, hash, passwords.new)) {
      showMsg('success', 'Password updated. Please re-login next time.');
      setPasswords({ new: '', confirm: '' });
    } else {
      showMsg('error', 'Failed to update password.');
    }
  };

  const handleFactoryReset = () => {
    if (confirm('CRITICAL WARNING:\n\nThis will delete ALL candidates, payments, and audit logs.\n\nAre you absolutely sure?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full m-4 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 rounded"></span> {isAdmin ? 'System Configuration' : 'My Profile Settings'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8">
           
           {/* Feedback Message */}
           {msg && (
             <div className={`p-3 rounded text-sm font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
               {msg.type === 'success' ? <Check size={16}/> : <AlertTriangle size={16}/>}
               {msg.text}
             </div>
           )}

           {/* Fee Settings - Admin Only */}
           {isAdmin && (
             <section>
               <h4 className="font-bold text-gray-700 border-b pb-2 mb-4 flex items-center gap-2">
                  <DollarSign size={18} className="text-green-600"/> Fee Settings
               </h4>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject Fee (ECZ)</label>
                     <input 
                       type="number" 
                       name="feeSubject" 
                       value={settings.feeSubject} 
                       onChange={handleFeeChange}
                       className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tuition Fee</label>
                     <input 
                       type="number" 
                       name="feeTuition" 
                       value={settings.feeTuition} 
                       onChange={handleFeeChange}
                       className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Practical Fee</label>
                     <input 
                       type="number" 
                       name="feePractical" 
                       value={settings.feePractical} 
                       onChange={handleFeeChange}
                       className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Centre Fee</label>
                     <input 
                       type="number" 
                       name="feeCentre" 
                       value={settings.feeCentre} 
                       onChange={handleFeeChange}
                       className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                     />
                  </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Form Fee</label>
                     <input 
                       type="number" 
                       name="feeForm" 
                       value={settings.feeForm} 
                       onChange={handleFeeChange}
                       className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                     />
                  </div>
               </div>
               <div className="flex gap-3 mt-4">
                  <button onClick={saveFees} className="px-4 py-2 bg-blue-900 text-white rounded text-sm font-medium hover:bg-blue-800 flex items-center gap-2">
                     <Save size={16} /> Save Settings
                  </button>
                  <button onClick={resetDefaults} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                     <RotateCcw size={16} /> Reset Defaults
                  </button>
               </div>
             </section>
           )}

           {/* Account Settings - Available to All */}
           <section>
             <h4 className="font-bold text-gray-700 border-b pb-2 mb-4 flex items-center gap-2">
                <Key size={18} className="text-orange-600"/> Account Settings
             </h4>
             <form onSubmit={handlePasswordChange} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                     <input type="text" value={user.username} disabled className="w-full p-2 border rounded bg-gray-200 text-gray-500 cursor-not-allowed" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                     <input 
                        type="password" 
                        value={passwords.new} 
                        onChange={e => setPasswords({...passwords, new: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="New Password"
                        required
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
                     <input 
                        type="password" 
                        value={passwords.confirm} 
                        onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Confirm Password"
                        required
                     />
                  </div>
               </div>
               <div className="mt-4 flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 flex items-center gap-2">
                    <Check size={16} /> Update Password
                  </button>
               </div>
             </form>
           </section>

           {/* System Actions - Admin Only */}
           {isAdmin && (
             <section>
                 <h4 className="font-bold text-gray-700 border-b pb-2 mb-4 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-600"/> System Actions
                 </h4>
                 <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-red-800 text-sm">Clear All Data</h5>
                      <p className="text-red-600 text-xs mt-1">Permanently delete all candidates, payments, and logs.</p>
                    </div>
                    <button onClick={handleFactoryReset} className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 flex items-center gap-2">
                       <Trash2 size={16} /> Clear All Data
                    </button>
                 </div>
             </section>
           )}

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;