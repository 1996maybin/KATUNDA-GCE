import React from 'react';
import { Candidate, User } from '../types';
import { X, FileText, Printer, Download, User as UserIcon, MapPin, Phone, CreditCard, BookOpen, CheckCircle, XCircle, FileDown, Paperclip } from 'lucide-react';
import { generateReceipt, generateConfirmation, generatePaymentRequest } from '../utils/pdf';

interface Props {
  candidate: Candidate;
  onClose: () => void;
  user?: User;
}

const CandidateDetailModal: React.FC<Props> = ({ candidate, onClose, user }) => {
  const totalPaid = Number(candidate.feePaidSchool) + Number(candidate.feePaidEcz);
  const totalRequired = candidate.feeSchool + candidate.feeEcz;
  const balance = totalRequired - totalPaid;

  const downloadFile = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white md:rounded-xl shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] md:w-[90%] md:max-w-4xl m-0 md:m-4 overflow-hidden flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-5 border-b bg-blue-900 text-white shrink-0">
          <div>
             <h3 className="font-bold text-lg md:text-xl truncate max-w-[200px] md:max-w-none">{candidate.surname}, {candidate.otherNames}</h3>
             <p className="text-blue-200 text-xs md:text-sm font-mono tracking-wider">{candidate.nrc}</p>
          </div>
          <button onClick={onClose} className="bg-blue-800 p-2 rounded-full hover:bg-blue-700 transition"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto p-4 md:p-6 flex-1 bg-slate-50">
           
           <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Photo & Stats */}
              <div className="md:col-span-3 space-y-4">
                 <div className="aspect-[3.5/4.5] bg-gray-200 rounded-lg overflow-hidden border-4 border-white shadow-md w-32 md:w-full mx-auto md:mx-0">
                   {candidate.photo ? (
                     <img src={candidate.photo} className="w-full h-full object-cover" alt="Candidate" />
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                       <UserIcon size={48} />
                       <span className="text-xs font-bold mt-2">NO PHOTO</span>
                     </div>
                   )}
                 </div>
                 
                 <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm space-y-2">
                    <h5 className="font-bold text-gray-700 text-xs uppercase border-b pb-1">Documents</h5>
                    
                    {/* NRC Status & Download */}
                    <div className="flex flex-col gap-1 text-sm border-b border-dashed pb-2">
                       <div className="flex items-center justify-between">
                         <span>NRC Copy</span>
                         {candidate.docNrc ? <CheckCircle size={16} className="text-green-600"/> : <XCircle size={16} className="text-red-400"/>}
                       </div>
                       {candidate.fileNrc && isAdmin && (
                         <button 
                           onClick={() => downloadFile(candidate.fileNrc!, `NRC_${candidate.surname}_${candidate.nrc.replace(/\//g,'')}.png`)}
                           className="text-[10px] text-blue-600 font-bold flex items-center gap-1 hover:underline"
                         >
                           <Download size={10} /> Download File
                         </button>
                       )}
                       {candidate.fileNrc && !isAdmin && (
                         <span className="text-[10px] text-gray-400 italic flex items-center gap-1"><Paperclip size={10} /> File Attached</span>
                       )}
                    </div>

                    {/* Slip Status & Download */}
                    <div className="flex flex-col gap-1 text-sm">
                       <div className="flex items-center justify-between">
                         <span>Deposit Slip</span>
                         {candidate.docSlip ? <CheckCircle size={16} className="text-green-600"/> : <XCircle size={16} className="text-red-400"/>}
                       </div>
                       {candidate.fileSlip && isAdmin && (
                         <button 
                           onClick={() => downloadFile(candidate.fileSlip!, `Slip_${candidate.surname}_${candidate.id}.png`)}
                           className="text-[10px] text-blue-600 font-bold flex items-center gap-1 hover:underline"
                         >
                           <Download size={10} /> Download File
                         </button>
                       )}
                       {candidate.fileSlip && !isAdmin && (
                         <span className="text-[10px] text-gray-400 italic flex items-center gap-1"><Paperclip size={10} /> File Attached</span>
                       )}
                    </div>
                 </div>

                 <div className={`p-4 rounded-lg text-center border ${candidate.paymentStatus === 'Fully Paid' ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    <span className="block text-xs font-bold uppercase mb-1">Payment Status</span>
                    <span className="font-bold text-lg">{candidate.paymentStatus}</span>
                 </div>
              </div>

              {/* Middle Column: Personal Info */}
              <div className="md:col-span-5 space-y-6">
                 
                 {/* Personal */}
                 <section className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
                      <UserIcon size={16}/> Personal Details
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                       <div className="grid grid-cols-3">
                         <span className="font-semibold">Gender:</span>
                         <span className="col-span-2">{candidate.gender}</span>
                       </div>
                       <div className="grid grid-cols-3">
                         <span className="font-semibold">DOB:</span>
                         <span className="col-span-2">{candidate.dob}</span>
                       </div>
                       <div className="grid grid-cols-3">
                         <span className="font-semibold">Contact:</span>
                         <span className="col-span-2">{candidate.contact}</span>
                       </div>
                       <div className="grid grid-cols-3">
                         <span className="font-semibold">Email:</span>
                         <span className="col-span-2 truncate" title={candidate.email}>{candidate.email || 'N/A'}</span>
                       </div>
                       <div className="grid grid-cols-3">
                         <span className="font-semibold">Address:</span>
                         <span className="col-span-2">{candidate.address}</span>
                       </div>
                        <div className="grid grid-cols-3">
                         <span className="font-semibold">District:</span>
                         <span className="col-span-2">{candidate.district}, {candidate.province}</span>
                       </div>
                    </div>
                 </section>

                 {/* Guardian */}
                 <section className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
                      <UserIcon size={16}/> Guardian Information
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                       <div className="grid grid-cols-3">
                         <span className="font-semibold">Name:</span>
                         <span className="col-span-2">{candidate.guardianName}</span>
                       </div>
                       <div className="grid grid-cols-3">
                         <span className="font-semibold">Relation:</span>
                         <span className="col-span-2">{candidate.guardianRel}</span>
                       </div>
                       <div className="grid grid-cols-3">
                         <span className="font-semibold">Contact:</span>
                         <span className="col-span-2">{candidate.guardianContact}</span>
                       </div>
                       <div className="grid grid-cols-3">
                         <span className="font-semibold">Address:</span>
                         <span className="col-span-2">{candidate.guardianAddress}</span>
                       </div>
                    </div>
                 </section>

              </div>

              {/* Right Column: Academic & Financial */}
              <div className="md:col-span-4 space-y-6">
                 
                 {/* Subjects */}
                 <section className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
                      <BookOpen size={16}/> Registered Subjects
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.subjects.map(sub => (
                        <span key={sub} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold border border-blue-100">
                          {sub}
                        </span>
                      ))}
                    </div>
                 </section>

                 {/* Financial */}
                 <section className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
                      <CreditCard size={16}/> Financial Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                          <span className="text-gray-500">School Fee Required</span>
                          <span className="font-mono">K{candidate.feeSchool}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-gray-500">ECZ Fee Required</span>
                          <span className="font-mono">K{candidate.feeEcz}</span>
                       </div>
                       <div className="border-t pt-2 mt-2"></div>
                       <div className="flex justify-between">
                          <span className="text-gray-500">Total Paid</span>
                          <span className="font-mono font-bold text-green-600">K{totalPaid}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-gray-500">Form Fee Paid</span>
                          <span className={`font-bold ${candidate.feeFormPaid ? 'text-green-600' : 'text-red-500'}`}>{candidate.feeFormPaid ? 'Yes' : 'No'}</span>
                       </div>
                       <div className="bg-red-50 p-3 rounded mt-3 border border-red-100 text-center">
                          <span className="block text-xs text-red-500 uppercase font-bold">Balance Due</span>
                          <span className="block text-2xl font-bold text-red-700">K{balance > 0 ? balance : 0}</span>
                       </div>
                    </div>
                 </section>

              </div>

           </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50 flex flex-col md:flex-row gap-3 justify-end shrink-0">
           <button onClick={() => window.print()} className="px-4 py-3 md:py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center justify-center gap-2 touch-manipulation">
              <Printer size={18} /> Print
           </button>
           <button onClick={() => generatePaymentRequest(candidate)} className="px-4 py-3 md:py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium hover:bg-orange-200 flex items-center justify-center gap-2 touch-manipulation">
              <FileDown size={18} /> Payment Req.
           </button>
           <button onClick={() => generateConfirmation(candidate)} className="px-4 py-3 md:py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 flex items-center justify-center gap-2 touch-manipulation">
              <FileText size={18} /> Download
           </button>
           <button onClick={() => generateReceipt(candidate)} className="px-4 py-3 md:py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2 touch-manipulation">
              <Download size={18} /> Receipt
           </button>
        </div>

      </div>
    </div>
  );
};

export default CandidateDetailModal;