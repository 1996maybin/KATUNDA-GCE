import React, { useState, useEffect } from 'react';
import { Candidate, User } from '../types';
import { getRecords, deleteRecord } from '../utils/db';
import { exportToExcel } from '../utils/fileHelpers';
import { Download, Search, Trash2, Edit, FileText, Printer, CheckSquare, Square, Eye, FileCheck, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { generateReceipt, generateConfirmation } from '../utils/pdf';

interface Props {
  onEdit: (candidate: Candidate) => void;
  onView: (candidate: Candidate) => void;
  user: User;
  initialFilter?: string; // Added prop
}

const RecordsTable: React.FC<Props> = ({ onEdit, onView, user, initialFilter }) => {
  const [records, setRecords] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(initialFilter || 'All'); // Use initialFilter
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadRecords();
  }, []);

  // Update filter if initialFilter changes (e.g. navigation from sidebar)
  useEffect(() => {
    if (initialFilter) {
      setFilterStatus(initialFilter);
    }
  }, [initialFilter]);

  const loadRecords = () => {
    setRecords(getRecords().sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this record? This cannot be undone.")) {
      deleteRecord(id);
      loadRecords();
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.surname.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.nrc.includes(searchTerm) ||
      r.otherNames.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || r.paymentStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const handleBatchAction = (action: string) => {
    alert(`Batch Action '${action}' executed on ${selectedIds.size} records.`);
    // Future implementation
  };

  const handleExport = () => {
    const dataToExport = filteredRecords.length > 0 ? filteredRecords : records;
    exportToExcel(dataToExport);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden animate-fade-in flex flex-col h-full">
      <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50">
        <h3 className="font-bold text-lg text-gray-700">Records ({filteredRecords.length})</h3>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="border rounded-lg px-3 py-2 outline-none text-sm bg-white"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Fully Paid">Fully Paid</option>
            <option value="Partial Payment">Partial</option>
            <option value="Pending">Pending</option>
          </select>
          <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm font-medium touch-manipulation">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Batch Operations Panel */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 p-3 border-b border-blue-200 flex items-center justify-between animate-fade-in flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-900 bg-white px-2 py-1 rounded shadow-sm text-xs">{selectedIds.size} Selected</span>
          </div>
          <div className="flex gap-2">
             <button onClick={() => handleBatchAction('receipts')} className="px-3 py-1 bg-white border border-blue-300 rounded text-blue-800 text-xs hover:bg-blue-100 font-medium">Receipts</button>
             {user.role === 'admin' && (
               <button onClick={() => handleBatchAction('delete')} className="px-3 py-1 bg-red-100 border border-red-300 rounded text-red-800 text-xs hover:bg-red-200 font-medium">Delete</button>
             )}
          </div>
        </div>
      )}

      <div className="overflow-auto flex-1 bg-gray-50">
        
        {/* Mobile Card View (< md) */}
        <div className="block md:hidden p-3 space-y-3">
          {filteredRecords.map((r) => (
             <div key={r.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3 relative">
                
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                     <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border border-gray-300 shrink-0">
                        {r.photo ? <img src={r.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">IMG</div>}
                     </div>
                     <div>
                        <h4 className="font-bold text-gray-800 text-sm">{r.surname} {r.otherNames}</h4>
                        <p className="text-xs text-gray-500 font-mono">{r.nrc}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{r.regDate}</p>
                     </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase
                     ${r.paymentStatus === 'Fully Paid' ? 'bg-green-100 text-green-800' : 
                       r.paymentStatus === 'Partial Payment' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                     {r.paymentStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-b py-2 border-gray-100">
                   <div>
                      <span className="text-gray-400 block text-[10px] uppercase">Subjects</span>
                      <span className="font-semibold">{r.subjects.length} Selected</span>
                   </div>
                   <div>
                      <span className="text-gray-400 block text-[10px] uppercase">School Fee</span>
                      <span className="font-semibold">Paid: K{r.feePaidSchool}</span>
                   </div>
                   <div>
                      <span className="text-gray-400 block text-[10px] uppercase">ECZ Fee</span>
                      <span className="font-semibold">Paid: K{r.feePaidEcz}</span>
                   </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase">Form Fee</span>
                      <span className={`font-bold ${r.feeFormPaid ? 'text-green-600' : 'text-red-500'}`}>{r.feeFormPaid ? 'PAID' : 'PENDING'}</span>
                   </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                   <div className="flex gap-2">
                     <button onClick={() => toggleSelection(r.id)} className="p-2 text-gray-400">
                        {selectedIds.has(r.id) ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20} />}
                     </button>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => onView(r)} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded text-xs font-bold border border-blue-100">View</button>
                      <button onClick={() => onEdit(r)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs font-bold border border-gray-200">Edit</button>
                      <button onClick={() => generateReceipt(r)} className="bg-green-50 text-green-700 px-3 py-1.5 rounded text-xs font-bold border border-green-100">Receipt</button>
                   </div>
                </div>
             </div>
          ))}
          {filteredRecords.length === 0 && (
             <div className="text-center py-10 text-gray-400">No records found.</div>
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <table className="hidden md:table w-full text-sm text-left text-gray-600 whitespace-nowrap">
          <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-xs sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 w-10">
                <button onClick={toggleSelectAll}>
                  {selectedIds.size === filteredRecords.length && filteredRecords.length > 0 ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18} />}
                </button>
              </th>
              <th className="px-4 py-3">Index No</th>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">NRC</th>
              <th className="px-4 py-3">Docs</th>
              <th className="px-4 py-3">DOB</th>
              <th className="px-4 py-3">District</th>
              <th className="px-4 py-3 text-center">Subjects</th>
              <th className="px-4 py-3">School Fee (Paid/Req)</th>
              <th className="px-4 py-3">ECZ Fee (Paid/Req)</th>
              <th className="px-4 py-3 text-center">Form Fee</th>
              <th className="px-4 py-3">Payment Status</th>
              <th className="px-4 py-3">Reg Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((r) => (
              <tr key={r.id} className={`border-b hover:bg-gray-50 transition ${selectedIds.has(r.id) ? 'bg-blue-50' : ''}`}>
                <td className="px-4 py-4">
                  <button onClick={() => toggleSelection(r.id)}>
                    {selectedIds.has(r.id) ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18} className="text-gray-400"/>}
                  </button>
                </td>
                <td className="px-4 py-4 font-mono text-xs text-gray-500">#{r.id}</td>
                <td className="px-4 py-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                    {r.photo ? <img src={r.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">IMG</div>}
                  </div>
                </td>
                <td className="px-4 py-4 font-semibold text-gray-900">
                   {r.surname} {r.otherNames}
                </td>
                <td className="px-4 py-4 font-mono text-xs">{r.nrc}</td>
                <td className="px-4 py-4">
                   <div className="flex gap-2">
                     {r.docNrc ? <span title="NRC Submitted" className="text-green-600"><FileText size={16}/></span> : <span title="Missing NRC" className="text-red-300"><FileText size={16}/></span>}
                     {r.docSlip ? <span title="Slip Submitted" className="text-green-600"><CreditCard size={16}/></span> : <span title="Missing Slip" className="text-red-300"><CreditCard size={16}/></span>}
                   </div>
                </td>
                <td className="px-4 py-4 text-xs">{r.dob}</td>
                <td className="px-4 py-4 text-xs">{r.district}</td>
                <td className="px-4 py-4 text-center">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">{r.subjects.length}</span>
                </td>
                <td className="px-4 py-4">
                   <div className="text-xs">
                     <span className="font-bold text-green-700">K{r.feePaidSchool}</span> <span className="text-gray-400">/</span> <span className="text-gray-600">K{r.feeSchool}</span>
                   </div>
                </td>
                <td className="px-4 py-4">
                   <div className="text-xs">
                     <span className="font-bold text-green-700">K{r.feePaidEcz}</span> <span className="text-gray-400">/</span> <span className="text-gray-600">K{r.feeEcz}</span>
                   </div>
                </td>
                <td className="px-4 py-4 text-center">
                  {r.feeFormPaid ? <CheckCircle size={18} className="text-green-500 inline"/> : <XCircle size={18} className="text-red-400 inline"/>}
                </td>
                <td className="px-4 py-4">
                   <span className={`px-2 py-1 rounded-full text-xs font-semibold
                     ${r.paymentStatus === 'Fully Paid' ? 'bg-green-100 text-green-800' : 
                       r.paymentStatus === 'Partial Payment' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                     {r.paymentStatus}
                   </span>
                </td>
                <td className="px-4 py-4 text-xs text-gray-500">{r.regDate}</td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => onView(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View"><Eye size={16} /></button>
                    <button onClick={() => generateConfirmation(r)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="PDF Confirmation"><FileCheck size={16} /></button>
                    <button onClick={() => generateConfirmation(r)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Print"><Printer size={16} /></button>
                    {user.permissions.edit && (
                      <button onClick={() => onEdit(r)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Edit"><Edit size={16} /></button>
                    )}
                    <button onClick={() => generateReceipt(r)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Receipt"><CreditCard size={16} /></button>
                    {user.permissions.delete && (
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={15} className="text-center py-10 text-gray-400">No records found matching your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecordsTable;