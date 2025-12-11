import React from 'react';
import { User } from '../types';
import { getRecords } from '../utils/db';
import { RefreshCw, List, CreditCard, CheckCircle, Database, FileSpreadsheet, FileText, MessageSquare, Phone, Activity, Layers, UploadCloud, PieChart, BarChart3, Users } from 'lucide-react';

interface Props {
  user: User;
  onAction: (action: string) => void;
  onClear: () => void;
  stats?: any; // Marked optional as we calculate specific stats internally
}

const DashboardSidebar: React.FC<Props> = ({ user, onAction, onClear }) => {
  const records = getRecords();
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const todayCount = records.filter(r => r.regDate === today).length;
  const monthCount = records.filter(r => r.regDate.startsWith(currentMonth)).length;
  
  const totalRequired = records.reduce((acc, r) => acc + r.feeSchool + r.feeEcz + (r.feeFormPaid ? 50 : 0), 0);
  const totalPaid = records.reduce((acc, r) => acc + (Number(r.feePaidSchool) || 0) + (Number(r.feePaidEcz) || 0) + (r.feeFormPaid ? 50 : 0), 0);
  const balanceDue = totalRequired - totalPaid;
  const uniqueDistricts = new Set(records.map(r => r.district)).size;
  const storageUsed = (JSON.stringify(localStorage).length / 1024).toFixed(2);

  const isAdmin = user.role === 'admin';

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2 pb-10">
      
      {/* Quick Stats Panel */}
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500 animate-fade-in">
        <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
           <Activity size={16} /> Quick Stats
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Today's Regs</span>
            <span className="font-bold bg-blue-100 text-blue-800 px-2 rounded-full">{todayCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Monthly Total</span>
            <span className="font-bold bg-green-100 text-green-800 px-2 rounded-full">{monthCount}</span>
          </div>
          <div className="flex justify-between text-sm">
             <span className="text-gray-500">Balance Due</span>
             <span className="font-bold text-red-600">K{balanceDue.toLocaleString()}</span>
          </div>
           <div className="flex justify-between text-sm">
             <span className="text-gray-500">Districts</span>
             <span className="font-bold">{uniqueDistricts}</span>
          </div>
           <div className="flex justify-between text-sm">
             <span className="text-gray-500">Storage Used</span>
             <span className="font-mono text-xs">{storageUsed} KB</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow overflow-hidden animate-fade-in" style={{animationDelay: '0.1s'}}>
        <div className="bg-blue-900 text-white p-3 font-bold text-sm flex items-center gap-2">
           <Layers size={16} /> Quick Actions
        </div>
        <div className="p-2 space-y-1">
           <button onClick={onClear} className="w-full text-left p-2 hover:bg-blue-50 rounded text-sm flex items-center gap-2 text-gray-700 transition">
             <RefreshCw size={14} /> Clear Form
           </button>
           <button onClick={() => onAction('view_all')} className="w-full text-left p-2 hover:bg-blue-50 rounded text-sm flex items-center gap-2 text-gray-700 transition">
             <List size={14} /> View All Records
           </button>
           <button onClick={() => onAction('pending')} className="w-full text-left p-2 hover:bg-blue-50 rounded text-sm flex items-center gap-2 text-gray-700 transition">
             <CreditCard size={14} className="text-orange-500" /> Pending Payments
           </button>
           <button onClick={() => onAction('paid')} className="w-full text-left p-2 hover:bg-blue-50 rounded text-sm flex items-center gap-2 text-gray-700 transition">
             <CheckCircle size={14} className="text-green-500" /> Fully Paid Records
           </button>
           <button onClick={() => onAction('bank')} className="w-full text-left p-2 hover:bg-blue-50 rounded text-sm flex items-center gap-2 text-gray-700 transition">
             <Database size={14} /> Bank Details
           </button>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow overflow-hidden animate-fade-in" style={{animationDelay: '0.2s'}}>
        <div className="bg-green-700 text-white p-3 font-bold text-sm flex items-center gap-2">
           <FileText size={16} /> Data Export
        </div>
        <div className="p-2 space-y-1">
           <button onClick={() => onAction('export_subject_totals')} className="w-full text-left p-2 hover:bg-green-50 rounded text-sm flex items-center gap-2 text-gray-700 transition">
             <PieChart size={14} className="text-orange-600" /> Subject Analysis
           </button>
           <button onClick={() => onAction('export_system_stats')} className="w-full text-left p-2 hover:bg-green-50 rounded text-sm flex items-center gap-2 text-gray-700 transition">
             <BarChart3 size={14} className="text-blue-600" /> System Statistics
           </button>
           <button onClick={() => onAction('export_excel')} className="w-full text-left p-2 hover:bg-green-50 rounded text-sm flex items-center gap-2 text-gray-700 transition">
             <FileSpreadsheet size={14} className="text-green-600" /> Export Financial (Excel)
           </button>
           <button onClick={() => onAction('export_pdf_report')} className="w-full text-left p-2 hover:bg-green-50 rounded text-sm flex items-center gap-2 text-gray-700 transition">
             <FileText size={14} className="text-red-600" /> Full Report PDF
           </button>
           {user.permissions.export && (
             <>
               <button onClick={() => onAction('export_csv')} className="w-full text-left p-2 hover:bg-green-50 rounded text-sm flex items-center gap-2 text-gray-700 transition">
                 <FileText size={14} className="text-blue-600"/> Export CSV
               </button>
               <button onClick={() => onAction('import_data')} className="w-full text-left p-2 hover:bg-green-50 rounded text-sm flex items-center gap-2 text-gray-700 transition">
                 <UploadCloud size={14} className="text-purple-600"/> Import Data
               </button>
             </>
           )}
        </div>
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow overflow-hidden animate-fade-in" style={{animationDelay: '0.3s'}}>
          <div className="bg-purple-700 text-white p-3 font-bold text-sm flex items-center gap-2">
            <MessageSquare size={16} /> Admin & Comms
          </div>
           <div className="p-2 space-y-1">
             <button onClick={() => onAction('users')} className="w-full text-left p-2 hover:bg-purple-50 rounded text-sm flex items-center gap-2 text-gray-700 transition font-bold bg-yellow-50 text-purple-900 border border-yellow-200">
               <Users size={14} /> User Management
             </button>
             <button onClick={() => onAction('sms')} className="w-full text-left p-2 hover:bg-purple-50 rounded text-sm flex items-center gap-2 text-gray-700 transition">
               <MessageSquare size={14} /> SMS Notifications
             </button>
             <button onClick={() => onAction('whatsapp')} className="w-full text-left p-2 hover:bg-purple-50 rounded text-sm flex items-center gap-2 text-gray-700 transition">
               <Phone size={14} /> WhatsApp Messages
             </button>
             <button onClick={() => onAction('audit')} className="w-full text-left p-2 hover:bg-purple-50 rounded text-sm flex items-center gap-2 text-gray-700 transition">
               <List size={14} /> Audit Logs
             </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default DashboardSidebar;