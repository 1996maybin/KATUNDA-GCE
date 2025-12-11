import React, { useState, useEffect, useRef } from 'react';
import { User, Candidate, AuditLog } from './types';
import { initDB, getCurrentUser, login, logout, getRecords, getAuditLogs, signupUser, getUsers, approveUser, deleteUser } from './utils/db';
import { exportToCSV, exportToExcel, importData, exportSubjectTotals, exportSystemStats } from './utils/fileHelpers';
import { generateFullReport } from './utils/pdf';
import RegistrationForm from './components/RegistrationForm';
import RecordsTable from './components/RecordsTable';
import DashboardSidebar from './components/DashboardSidebar';
import SettingsModal from './components/SettingsModal';
import CandidateDetailModal from './components/CandidateDetailModal';
import { LayoutDashboard, Users, LogOut, Settings as SettingsIcon, Menu, X, DollarSign, FileText, CheckCircle, Clock, PieChart, BarChart3, FileSpreadsheet, UploadCloud, MessageSquare, Phone, Send, UserPlus, Shield, Lock } from 'lucide-react';

// Initialize DB immediately
initDB();

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'records'>('dashboard');
  const [recordsFilter, setRecordsFilter] = useState<string>('All');
  const [stats, setStats] = useState<any>({});
  const [editingRecord, setEditingRecord] = useState<Candidate | null>(null);
  const [viewingRecord, setViewingRecord] = useState<Candidate | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Communication Form State
  const [commForm, setCommForm] = useState({ phone: '+260', message: '' });
  
  // Modals
  const [modal, setModal] = useState<string | null>(null);
  
  // Auth State
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [error, setError] = useState('');

  // Signup Form State
  const [signupData, setSignupData] = useState({
    name: '',
    username: '',
    password: '',
    nrc: '',
    phone: '+260'
  });

  // Admin User Management State
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) setUser(u);
    updateStats();
  }, []);

  const updateStats = () => {
    const records = getRecords();
    const schoolFees = records.reduce((acc, r) => acc + (Number(r.feePaidSchool) || 0), 0);
    const eczFees = records.reduce((acc, r) => acc + (Number(r.feePaidEcz) || 0), 0);
    const formFees = records.reduce((acc, r) => acc + (r.feeFormPaid ? 50 : 0), 0);
    
    setStats({
      total: records.length,
      schoolFees,
      eczFees,
      formFees,
      totalFees: schoolFees + eczFees + formFees,
      fullyPaid: records.filter(r => r.paymentStatus === 'Fully Paid').length,
      partial: records.filter(r => r.paymentStatus === 'Partial Payment').length,
      pending: records.filter(r => ['Pending', 'Query'].includes(r.paymentStatus)).length
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.CryptoJS) {
       alert("Security library not loaded. Please refresh.");
       return;
    }
    const hash = window.CryptoJS.MD5(loginPass).toString();
    const result = login(loginUser, hash);
    
    if (result === 'pending') {
      setError('Account pending approval by Admin.');
      return;
    }

    if (result) {
      setUser(result);
      setError('');
    } else {
      setError('Invalid credentials');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.CryptoJS) {
      alert("Security library not loaded.");
      return;
    }
    if (!signupData.name || !signupData.username || !signupData.password || !signupData.nrc) {
      setError('All fields are required');
      return;
    }

    const success = signupUser({
      name: signupData.name,
      username: signupData.username,
      nrc: signupData.nrc,
      phone: signupData.phone
    }, signupData.password);

    if (success) {
      alert("Registration Successful! Please wait for Admin approval.");
      setIsSigningUp(false);
      setError('');
      setSignupData({ name: '', username: '', password: '', nrc: '', phone: '+260' });
    } else {
      setError('Username already taken.');
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const handleAction = (action: string) => {
    const records = getRecords();

    if (action === 'view_all') {
      setRecordsFilter('All');
      setView('records');
    }
    if (action === 'pending') {
      setRecordsFilter('Pending');
      setView('records');
    }
    if (action === 'paid') {
      setRecordsFilter('Fully Paid');
      setView('records');
    }
    if (action === 'export_excel') {
      exportToExcel(records);
    }
    if (action === 'export_subject_totals') {
      exportSubjectTotals(records);
    }
    if (action === 'export_system_stats') {
      exportSystemStats(records);
    }
    if (action === 'export_csv') {
      exportToCSV(records);
    }
    if (action === 'export_pdf_report') {
      generateFullReport(records);
    }
    if (action === 'import_data') {
      fileInputRef.current?.click();
    }
    
    if (action === 'bank') setModal('bank');
    
    if (action === 'sms') {
      setCommForm({ phone: '+260', message: '' });
      setModal('sms');
    }
    if (action === 'whatsapp') {
      setCommForm({ phone: '+260', message: '' });
      setModal('whatsapp');
    }
    if (action === 'audit') setModal('audit');
    if (action === 'users') {
      setAllUsers(getUsers());
      setModal('users');
    }
    
    setIsMobileMenuOpen(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importData(file, (count) => {
        alert(`Successfully imported ${count} records.`);
        updateStats();
        window.location.reload(); 
      });
    }
    if (e.target) e.target.value = '';
  };

  const navigate = (target: 'dashboard' | 'records') => {
    if (target === 'records') setRecordsFilter('All');
    setView(target);
    setIsMobileMenuOpen(false);
  };

  const sendWhatsApp = () => {
    if (!commForm.phone) return alert('Please enter a phone number');
    const num = commForm.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${num}?text=${encodeURIComponent(commForm.message)}`;
    window.open(url, '_blank');
  };

  const sendSMS = () => {
    if (!commForm.phone) return alert('Please enter a phone number');
    const url = `sms:${commForm.phone}?body=${encodeURIComponent(commForm.message)}`;
    window.location.href = url;
  };

  const handleApproveUser = (username: string) => {
    approveUser(username);
    setAllUsers(getUsers());
  };

  const handleDeleteUser = (username: string) => {
    if (confirm(`Are you sure you want to delete user ${username}?`)) {
      deleteUser(username);
      setAllUsers(getUsers());
    }
  };

  // Auth Screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in border-t-8 border-orange-500 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-blue-900 font-sans tracking-tight">KATUNDA SECONDARY SCHOOL</h1>
            <p className="text-orange-600 font-bold text-sm tracking-wider mt-1">GCE E-REGISTRATION V2.0</p>
          </div>
          
          {isSigningUp ? (
             <form onSubmit={handleSignup} className="space-y-4">
                <h2 className="text-center text-lg font-bold text-gray-700 border-b pb-2">Registration Officer Sign Up</h2>
                <input 
                  type="text" 
                  placeholder="Full Name"
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-base"
                  value={signupData.name}
                  onChange={e => setSignupData({...signupData, name: e.target.value})}
                  required
                />
                 <input 
                  type="text" 
                  placeholder="NRC Number"
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-base"
                  value={signupData.nrc}
                  onChange={e => setSignupData({...signupData, nrc: e.target.value})}
                  required
                />
                 <input 
                  type="tel" 
                  placeholder="Phone Number"
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-base"
                  value={signupData.phone}
                  onChange={e => setSignupData({...signupData, phone: e.target.value})}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Desired Username"
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-base"
                  value={signupData.username}
                  onChange={e => setSignupData({...signupData, username: e.target.value})}
                  required
                />
                <input 
                  type="password" 
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-base"
                  value={signupData.password}
                  onChange={e => setSignupData({...signupData, password: e.target.value})}
                  required
                />
                {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}
                <button className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition transform active:scale-95 shadow-lg">
                  SUBMIT REGISTRATION
                </button>
                <button type="button" onClick={() => { setIsSigningUp(false); setError(''); }} className="w-full text-blue-600 py-2 text-sm font-bold hover:underline">
                  Back to Login
                </button>
             </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                <input 
                  type="text" 
                  value={loginUser}
                  onChange={e => setLoginUser(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition text-base"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                <input 
                  type="password" 
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition text-base"
                  placeholder="••••••"
                />
              </div>
              {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}
              <button className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition transform active:scale-95 shadow-lg mt-4 text-base touch-manipulation">
                SECURE LOGIN
              </button>
              
              <div className="pt-4 border-t text-center">
                 <p className="text-gray-500 text-sm mb-2">Registration Officer?</p>
                 <button type="button" onClick={() => { setIsSigningUp(true); setError(''); }} className="text-blue-600 font-bold hover:underline flex items-center justify-center gap-1 w-full">
                    <UserPlus size={16}/> Create Account
                 </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Authenticated Layout
  const isRegistrationOfficer = user.role === 'user';
  const pageTitle = isRegistrationOfficer ? "Katunda e-system" : "Admin Dashboard";

  return (
    <div className="flex h-screen bg-blue-50 overflow-hidden font-sans">
      
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileImport} 
        className="hidden" 
        accept=".json" 
      />

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-blue-900 text-white flex flex-col shadow-2xl transition-transform duration-300
          lg:static lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-4 lg:p-6 border-b border-blue-800 flex items-center justify-between lg:justify-start gap-3">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center font-bold text-xl shrink-0">K</div>
             <div>
               <h2 className="text-lg font-bold leading-tight">KATUNDA</h2>
               <p className="text-blue-300 text-[10px] tracking-widest uppercase">GCE System</p>
             </div>
           </div>
           <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-blue-200">
             <X size={24} />
           </button>
        </div>
        
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto mt-2">
          {isRegistrationOfficer ? (
             <div className="bg-blue-800 rounded-lg p-3 text-sm text-blue-200 mb-4">
               <p className="mb-2">Welcome, {user.name}.</p>
               <p className="text-xs">Access restricted to Registration form only.</p>
             </div>
          ) : null}

          <button onClick={() => navigate('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-base touch-manipulation ${view === 'dashboard' ? 'bg-blue-800 text-white shadow-inner border-l-4 border-orange-500' : 'text-blue-100 hover:bg-blue-800'}`}>
            <LayoutDashboard size={22} /> <span className="font-medium">{isRegistrationOfficer ? 'New Registration' : 'Dashboard'}</span>
          </button>
          
          {!isRegistrationOfficer && (
            <button onClick={() => navigate('records')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-base touch-manipulation ${view === 'records' ? 'bg-blue-800 text-white shadow-inner border-l-4 border-orange-500' : 'text-blue-100 hover:bg-blue-800'}`}>
              <Users size={22} /> <span className="font-medium">All Records</span>
            </button>
          )}
          
          {!isRegistrationOfficer && (
             <button onClick={() => { setModal('reports'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-base touch-manipulation text-blue-100 hover:bg-blue-800`}>
               <BarChart3 size={22} /> <span className="font-medium">Reports & Export</span>
            </button>
          )}

          <button onClick={() => { setModal('settings'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-base touch-manipulation text-blue-100 hover:bg-blue-800`}>
            <SettingsIcon size={22} /> <span className="font-medium">{isRegistrationOfficer ? 'My Profile' : 'Settings'}</span>
          </button>
        </nav>
        <div className="p-4 border-t border-blue-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white py-3 rounded transition text-sm font-medium touch-manipulation">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center px-4 lg:px-6 justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-gray-800 truncate max-w-[200px] sm:max-w-none">
                {pageTitle}
              </h2>
              <p className="text-xs text-gray-500 hidden sm:block">{new Date().toDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-gray-800 text-sm">{user.name}</p>
              <p className="text-xs text-blue-600 capitalize">{user.role}</p>
            </div>
            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 border-2 border-white shadow-sm">
              {user.username[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto p-3 lg:p-6 bg-blue-50">

          {/* Dashboard Header - Visible on all screens */}
          {view === 'dashboard' && (
            <div className="mb-6 lg:mb-8 text-center animate-fade-in">
               <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white bg-blue-900 px-4 py-3 sm:px-8 sm:py-4 rounded-xl shadow-lg uppercase tracking-tighter inline-block max-w-full break-words leading-tight">
                 {isRegistrationOfficer ? "Katunda e-system" : "Katunda Secondary School GCE"}
               </h1>
            </div>
          )}
          
          {/* Stat Cards - Only show for Admin or if Registration Officer functionality allows (showing stats for their motivation) */}
          {view === 'dashboard' && !isRegistrationOfficer && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              <StatCard title="Total Regs" value={stats.total} icon={<Users size={18} />} color="blue" />
              <StatCard title="School Fees" value={`K${stats.schoolFees}`} icon={<DollarSign size={18} />} color="green" />
              <StatCard title="ECZ Fees" value={`K${stats.eczFees}`} icon={<DollarSign size={18} />} color="indigo" />
              <StatCard title="Collected" value={`K${stats.totalFees}`} icon={<DollarSign size={18} />} color="teal" />
              
              <StatCard title="Fully Paid" value={stats.fullyPaid} icon={<CheckCircle size={18} />} color="emerald" />
              <StatCard title="Partial" value={stats.partial} icon={<Clock size={18} />} color="amber" />
              <StatCard title="Pending" value={stats.pending} icon={<X size={18} />} color="red" />
              <StatCard title="Form Fees" value={`K${stats.formFees}`} icon={<FileText size={18} />} color="purple" />
            </div>
          )}

          {/* Dashboard Split View */}
          {view === 'dashboard' && (
             <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100%-180px)]">
                {/* Left Panel: Form */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 lg:overflow-y-auto min-h-[500px]">
                   {user.permissions.create ? (
                      <RegistrationForm 
                        user={user} 
                        initialData={editingRecord} 
                        onSuccess={() => {
                          updateStats();
                          setEditingRecord(null);
                        }} 
                      />
                   ) : (
                     <div className="p-10 text-center text-gray-400">
                        View Only Mode
                     </div>
                   )}
                </div>

                {/* Right Panel: Sidebar - Hidden for Registration Officer to simplify view */}
                {!isRegistrationOfficer && (
                  <div className="w-full lg:w-80 shrink-0">
                    <DashboardSidebar 
                      user={user} 
                      stats={stats}
                      onAction={handleAction}
                      onClear={() => setEditingRecord(null)}
                    />
                  </div>
                )}
             </div>
          )}

          {/* Records View */}
          {view === 'records' && (
             <div className="h-full">
                <RecordsTable 
                  user={user} 
                  initialFilter={recordsFilter}
                  onEdit={(r) => {
                    setEditingRecord(r);
                    setView('dashboard');
                  }} 
                  onView={(r) => setViewingRecord(r)}
                />
             </div>
          )}

        </div>

        {/* Modals */}
        {modal === 'bank' && (
          <Modal title="Bank Details" onClose={() => setModal(null)}>
             <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Bank Name</label>
                  <p className="font-bold text-lg text-gray-800">ACCESS BANK</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Account Name</label>
                  <p className="font-bold text-lg text-gray-800">KATUNDA SECONDARY SCHOOL</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Account Number</label>
                  <p className="font-mono font-bold text-2xl text-blue-900 tracking-wider break-all">0300510783006</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Branch</label>
                  <p className="font-bold text-gray-800">KAOMA BRANCH</p>
                </div>
              </div>
          </Modal>
        )}
        
        {modal === 'users' && (
          <Modal title="User Management" onClose={() => setModal(null)}>
             <div className="p-4">
               <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4 text-sm text-yellow-800">
                 Admin Control Panel: Approve new registration officers and manage access.
               </div>
               <div className="max-h-[60vh] overflow-y-auto space-y-3">
                 {allUsers.filter(u => u.username !== 'admin').length === 0 && <p className="text-center text-gray-500 py-4">No other users found.</p>}
                 
                 {allUsers.filter(u => u.username !== 'admin').map((u, i) => (
                   <div key={i} className="border rounded-lg p-3 bg-white shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                         <div>
                           <h4 className="font-bold text-gray-800">{u.name}</h4>
                           <p className="text-xs text-gray-500">@{u.username}</p>
                         </div>
                         <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {u.status}
                         </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2 rounded">
                        <div><span className="font-bold">NRC:</span> {u.nrc}</div>
                        <div><span className="font-bold">Phone:</span> {u.phone}</div>
                        <div className="col-span-2 text-red-600 font-mono">
                           <span className="font-bold text-gray-600">Password:</span> {u.plainPassword || '******'}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        {u.status === 'pending' && (
                          <button onClick={() => handleApproveUser(u.username)} className="flex-1 bg-green-600 text-white py-1.5 rounded text-xs font-bold hover:bg-green-700">
                            Approve Access
                          </button>
                        )}
                        <button onClick={() => handleDeleteUser(u.username)} className="flex-1 bg-red-100 text-red-700 py-1.5 rounded text-xs font-bold hover:bg-red-200">
                           Delete User
                        </button>
                      </div>
                   </div>
                 ))}
               </div>
             </div>
          </Modal>
        )}

        {modal === 'reports' && (
          <Modal title="Reports & Data Export" onClose={() => setModal(null)}>
            <div className="p-4 space-y-3">
               <p className="text-sm text-gray-500 mb-4">Select a report type to download. These files generate instantly based on current system data.</p>
               
               <button onClick={() => handleAction('export_system_stats')} className="w-full flex items-center p-3 rounded-lg border hover:bg-blue-50 transition gap-3 text-left">
                  <div className="bg-blue-100 p-2 rounded-full text-blue-700"><BarChart3 size={20}/></div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">System Statistics</div>
                    <div className="text-xs text-gray-500">Overview of totals, fees collected, and payment statuses.</div>
                  </div>
               </button>

               <button onClick={() => handleAction('export_subject_totals')} className="w-full flex items-center p-3 rounded-lg border hover:bg-orange-50 transition gap-3 text-left">
                  <div className="bg-orange-100 p-2 rounded-full text-orange-700"><PieChart size={20}/></div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">Subject Analysis</div>
                    <div className="text-xs text-gray-500">Breakdown of candidates per subject.</div>
                  </div>
               </button>

               <button onClick={() => handleAction('export_excel')} className="w-full flex items-center p-3 rounded-lg border hover:bg-green-50 transition gap-3 text-left">
                  <div className="bg-green-100 p-2 rounded-full text-green-700"><FileSpreadsheet size={20}/></div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">Financial Report (Excel)</div>
                    <div className="text-xs text-gray-500">Detailed candidate list with fee breakdowns.</div>
                  </div>
               </button>

               <button onClick={() => handleAction('export_pdf_report')} className="w-full flex items-center p-3 rounded-lg border hover:bg-red-50 transition gap-3 text-left">
                  <div className="bg-red-100 p-2 rounded-full text-red-700"><FileText size={20}/></div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">Full Report (PDF)</div>
                    <div className="text-xs text-gray-500">Printable master list of all registrations.</div>
                  </div>
               </button>
               
               {user.permissions.export && (
                 <div className="pt-2 border-t mt-2">
                    <button onClick={() => handleAction('export_csv')} className="w-full flex items-center p-2 rounded hover:bg-gray-100 transition gap-2 text-gray-600 text-sm">
                       <FileText size={16}/> Export Raw CSV
                    </button>
                    <button onClick={() => handleAction('import_data')} className="w-full flex items-center p-2 rounded hover:bg-gray-100 transition gap-2 text-gray-600 text-sm">
                       <UploadCloud size={16}/> Import Data Backup
                    </button>
                 </div>
               )}
            </div>
          </Modal>
        )}

        {modal === 'sms' && (
          <Modal title="Send SMS" onClose={() => setModal(null)}>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. +26097..." 
                  value={commForm.phone}
                  onChange={e => setCommForm({...commForm, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                <textarea 
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  rows={4} 
                  placeholder="Type your message here..."
                  value={commForm.message}
                  onChange={e => setCommForm({...commForm, message: e.target.value})}
                ></textarea>
              </div>
              <div className="pt-2">
                <button 
                  onClick={sendSMS}
                  className="bg-blue-900 text-white px-4 py-3 rounded w-full font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition"
                >
                  <MessageSquare size={18} /> Send SMS via App
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">Note: This will open your device's default SMS app with the message pre-filled.</p>
              </div>
            </div>
          </Modal>
        )}

        {modal === 'whatsapp' && (
          <Modal title="Send via WhatsApp" onClose={() => setModal(null)}>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Number</label>
                <input 
                  type="tel" 
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500 outline-none" 
                  placeholder="e.g. 26097..." 
                  value={commForm.phone}
                  onChange={e => setCommForm({...commForm, phone: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">Include country code (e.g. 260) without +</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                <textarea 
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500 outline-none" 
                  rows={4} 
                  placeholder="Type your message here..."
                  value={commForm.message}
                  onChange={e => setCommForm({...commForm, message: e.target.value})}
                ></textarea>
              </div>
              <div className="pt-2">
                <button 
                  onClick={sendWhatsApp}
                  className="bg-green-600 text-white px-4 py-3 rounded w-full font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition"
                >
                  <Send size={18} /> Send WhatsApp Message
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                   This will open WhatsApp Web or App. To send files, please attach them manually in the opened chat.
                </p>
              </div>
            </div>
          </Modal>
        )}
        
        {modal === 'audit' && (
          <Modal title="System Audit Logs" onClose={() => setModal(null)}>
             <div className="max-h-[60vh] overflow-y-auto">
               <table className="w-full text-xs text-left">
                 <thead className="bg-gray-100 font-bold sticky top-0">
                   <tr>
                     <th className="p-2">Time</th>
                     <th className="p-2">User</th>
                     <th className="p-2">Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   {getAuditLogs().map((log, i) => (
                     <tr key={i} className="border-b">
                       <td className="p-2 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                       <td className="p-2 font-bold">{log.user}</td>
                       <td className="p-2">{log.action}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </Modal>
        )}
        
        {modal === 'settings' && (
          <SettingsModal user={user} onClose={() => setModal(null)} />
        )}
        
        {viewingRecord && (
          <CandidateDetailModal user={user} candidate={viewingRecord} onClose={() => setViewingRecord(null)} />
        )}

      </main>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    teal: "bg-teal-50 text-teal-600 border-teal-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };
  
  return (
    <div className={`p-3 lg:p-4 rounded-xl border ${colors[color]} shadow-sm flex flex-col justify-between min-h-[80px]`}>
      <div className="flex justify-between items-start mb-1">
         <span className="text-[10px] font-bold uppercase opacity-70 tracking-wider text-black truncate pr-1">{title}</span>
         <div className={`p-1 rounded-lg bg-white/50 ${colors[color].split(' ')[1]}`}>
           {icon}
         </div>
      </div>
      <span className="text-xl lg:text-2xl font-bold text-gray-800 truncate">{value}</span>
    </div>
  )
}

const Modal = ({ title, children, onClose }: any) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden max-h-full flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center p-4 border-b bg-gray-50 shrink-0">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-2"><X size={20} /></button>
      </div>
      <div className="overflow-y-auto">{children}</div>
    </div>
  </div>
)

export default App;