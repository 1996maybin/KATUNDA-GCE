import React, { useState, useEffect, useCallback } from 'react';
import { Candidate, Settings, User } from '../types';
import { SUBJECTS_LIST, DISTRICTS } from '../constants';
import { saveRecord, getSettings } from '../utils/db';
import { Save, RefreshCw, Upload, CheckCircle, AlertCircle, FileText, XCircle, Paperclip } from 'lucide-react';

interface Props {
  user: User;
  onSuccess: () => void;
  initialData?: Candidate | null;
}

const emptyCandidate: Omit<Candidate, 'id' | 'timestamp' | 'regDate' | 'createdBy' | 'feeSchool' | 'feeEcz' | 'paymentStatus'> = {
  photo: null,
  title: 'Mr.',
  otherNames: '',
  surname: '',
  nrc: '',
  gender: 'Male',
  dob: '',
  contact: '',
  email: '',
  province: 'Western',
  district: 'Kaoma',
  address: '',
  docNrc: false,
  docSlip: false,
  fileNrc: null,
  fileSlip: null,
  guardianName: '',
  guardianRel: 'Father',
  guardianNrc: '',
  guardianContact: '',
  guardianAddress: '',
  subjects: [],
  feePaidSchool: 0,
  feePaidEcz: 0,
  feeFormPaid: false,
  paymentRef: '',
};

const RegistrationForm: React.FC<Props> = ({ user, onSuccess, initialData }) => {
  const [formData, setFormData] = useState<any>(initialData || emptyCandidate);
  const [settings, setSettings] = useState<Settings>(getSettings());

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  // Fee Calculation
  const calculateFees = useCallback(() => {
    let subjectCount = formData.subjects.length;
    let practicalCount = 0;

    formData.subjects.forEach((subName: string) => {
      const sub = SUBJECTS_LIST.find(s => s.name === subName);
      if (sub?.isPractical) practicalCount++;
    });

    const eczExamFee = subjectCount * settings.feeSubject;
    const tuitionFee = subjectCount * settings.feeTuition;
    const practicalFee = practicalCount * settings.feePractical;
    const centreFee = settings.feeCentre;
    const formFee = settings.feeForm;

    const totalSchool = tuitionFee + practicalFee + centreFee;
    const totalEcz = eczExamFee;
    const grandTotal = totalSchool + totalEcz + formFee;
    
    return {
      subjects: subjectCount,
      practicals: practicalCount,
      eczExamFee,
      tuitionFee,
      practicalFee,
      centreFee,
      formFee,
      totalEcz,
      totalSchool,
      grandTotal
    };
  }, [formData.subjects, settings]);

  const currentFees = calculateFees();

  const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const checked = e.target.checked;
    
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData((prev: any) => {
      const exists = prev.subjects.includes(subject);
      return {
        ...prev,
        subjects: exists 
          ? prev.subjects.filter((s: string) => s !== subject)
          : [...prev.subjects, subject]
      };
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress to 300px width, 0.7 quality
      const compressed = await compressImage(file, 300, 0.7);
      setFormData((prev: any) => ({ ...prev, photo: compressed }));
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'fileNrc' | 'fileSlip') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.includes('image')) {
        // Compress documents to 800px width, 0.6 quality
        const compressed = await compressImage(file, 800, 0.6);
        setFormData((prev: any) => ({ 
          ...prev, 
          [field]: compressed,
          [field === 'fileNrc' ? 'docNrc' : 'docSlip']: true
        }));
      } else {
        // For PDF or non-images, we have to store raw (risky for localStorage) or block
        alert("Please upload images (JPG/PNG) for better system performance. PDF storage is limited.");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.surname || !formData.nrc || formData.subjects.length === 0) {
      alert("Please fill in required fields and select at least one subject.");
      return;
    }

    const fees = calculateFees();
    const paidSchool = Number(formData.feePaidSchool);
    const paidEcz = Number(formData.feePaidEcz);
    
    let status: Candidate['paymentStatus'] = 'Pending';
    const isFormFeePaid = formData.feeFormPaid === true || formData.feeFormPaid === "true";
    
    if (paidSchool >= fees.totalSchool && paidEcz >= fees.totalEcz && isFormFeePaid) {
      status = 'Fully Paid';
    } else if (paidSchool > 0 || paidEcz > 0 || isFormFeePaid) {
      status = 'Partial Payment';
    }

    const newRecord: Candidate = {
      ...formData,
      id: initialData?.id || Date.now(),
      feeSchool: fees.totalSchool,
      feeEcz: fees.totalEcz,
      paymentStatus: status,
      regDate: initialData?.regDate || new Date().toISOString().split('T')[0],
      timestamp: initialData?.timestamp || Date.now(),
      createdBy: initialData?.createdBy || user.username
    };

    saveRecord(newRecord);
    alert("Registration Saved Successfully!");
    if (!initialData) {
      setFormData(emptyCandidate);
    }
    onSuccess();
  };

  const formatNRC = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 6) return v;
    if (v.length <= 8) return `${v.slice(0,6)}/${v.slice(6)}`;
    return `${v.slice(0,6)}/${v.slice(6,8)}/${v.slice(8,9)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6 animate-fade-in border-t-4 border-blue-900">
      <h2 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2 border-b pb-4">
        <span className="w-1.5 h-6 bg-orange-500 rounded"></span>
        {initialData ? 'Edit Candidate' : 'New Candidate Registration'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Photo & Docs */}
          <div className="md:col-span-3 space-y-6">
            <div className="border-2 border-dashed border-blue-500 rounded p-1 flex flex-col items-center justify-center w-max mx-auto bg-blue-50/10">
              <div 
                className="bg-gray-200 flex items-center justify-center overflow-hidden relative"
                style={{ width: '100px', height: '128px' }}
              >
                {formData.photo ? (
                  <img src={formData.photo} alt="Candidate" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-1">
                    <span className="text-blue-400 text-[10px] font-bold block leading-tight">PASSPORT<br/>PHOTO</span>
                  </div>
                )}
              </div>
              <label className="cursor-pointer text-blue-700 hover:text-blue-900 text-[10px] font-bold mt-1 mb-0.5 flex items-center gap-1 p-2 touch-manipulation">
                <Upload size={10} /> UPLOAD
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </label>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-2 border-b pb-1">
                <FileText size={14} className="text-blue-600" /> Documents
              </h4>
              
              <div className="space-y-2">
                <label className={`relative flex items-center justify-between p-3 rounded border cursor-pointer transition-all touch-manipulation ${
                  formData.docNrc 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <input 
                    type="checkbox" 
                    name="docNrc" 
                    checked={formData.docNrc} 
                    onChange={handleInputChange} 
                    className="hidden" 
                  />
                  <div className="flex flex-col">
                    <span className={`font-bold text-sm ${formData.docNrc ? 'text-green-800' : 'text-red-800'}`}>NRC Copy</span>
                    {formData.fileNrc && <span className="text-[10px] text-green-600 font-medium mt-0.5 flex items-center gap-1"><Paperclip size={10}/> File Attached</span>}
                  </div>
                  {formData.docNrc ? <CheckCircle size={18} className="text-green-600" /> : <XCircle size={18} className="text-red-400" />}
                </label>
                
                <div className="flex items-center gap-2">
                   <label className="cursor-pointer flex items-center gap-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100">
                     <Upload size={10} /> {formData.fileNrc ? 'Change File' : 'Upload NRC'}
                     <input type="file" className="hidden" accept="image/*" onChange={(e) => handleDocUpload(e, 'fileNrc')} />
                   </label>
                   {formData.fileNrc && <button type="button" onClick={() => setFormData({...formData, fileNrc: null})} className="text-red-500 hover:text-red-700"><XCircle size={14}/></button>}
                </div>
              </div>

              <div className="space-y-2">
                <label className={`relative flex items-center justify-between p-3 rounded border cursor-pointer transition-all touch-manipulation ${
                  formData.docSlip 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <input 
                    type="checkbox" 
                    name="docSlip" 
                    checked={formData.docSlip} 
                    onChange={handleInputChange} 
                    className="hidden"
                  />
                  <div className="flex flex-col">
                    <span className={`font-bold text-sm ${formData.docSlip ? 'text-green-800' : 'text-red-800'}`}>Deposit Slip</span>
                     {formData.fileSlip && <span className="text-[10px] text-green-600 font-medium mt-0.5 flex items-center gap-1"><Paperclip size={10}/> File Attached</span>}
                  </div>
                  {formData.docSlip ? <CheckCircle size={18} className="text-green-600" /> : <XCircle size={18} className="text-red-400" />}
                </label>
                
                <div className="flex items-center gap-2">
                   <label className="cursor-pointer flex items-center gap-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100">
                     <Upload size={10} /> {formData.fileSlip ? 'Change File' : 'Upload Slip'}
                     <input type="file" className="hidden" accept="image/*" onChange={(e) => handleDocUpload(e, 'fileSlip')} />
                   </label>
                   {formData.fileSlip && <button type="button" onClick={() => setFormData({...formData, fileSlip: null})} className="text-red-500 hover:text-red-700"><XCircle size={14}/></button>}
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Forms */}
          <div className="md:col-span-9 space-y-6">
            
            {/* 3.3 Candidate Details */}
            <section className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-bold text-blue-900 border-b border-gray-200 pb-2 mb-3">3.3 Candidate Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Title</label>
                  <select name="title" value={formData.title} onChange={handleInputChange} className="w-full p-2.5 border rounded text-base mt-1 focus:ring-1 focus:ring-blue-500 bg-white">
                    <option>Mr.</option>
                    <option>Mrs.</option>
                    <option>Miss</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Surname</label>
                  <input type="text" name="surname" value={formData.surname} onChange={handleInputChange} className="w-full p-2.5 border rounded text-base mt-1 focus:ring-1 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Other Names</label>
                  <input type="text" name="otherNames" value={formData.otherNames} onChange={handleInputChange} className="w-full p-2.5 border rounded text-base mt-1 focus:ring-1 focus:ring-blue-500" />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">NRC (222222/22/1)</label>
                  <input 
                    type="text" 
                    value={formData.nrc} 
                    onChange={(e) => setFormData({...formData, nrc: formatNRC(e.target.value)})} 
                    placeholder="222222/22/1"
                    maxLength={11}
                    className="w-full p-2.5 border rounded text-base mt-1 focus:ring-1 focus:ring-blue-500" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-2.5 border rounded text-base mt-1 focus:ring-1 focus:ring-blue-500 bg-white">
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="w-full p-2.5 border rounded text-base mt-1 focus:ring-1 focus:ring-blue-500 bg-white" required />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Contact #</label>
                  <input type="tel" name="contact" value={formData.contact} onChange={handleInputChange} className="w-full p-2.5 border rounded text-base mt-1 focus:ring-1 focus:ring-blue-500" maxLength={10} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Email (Optional)</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2.5 border rounded text-base mt-1 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Residential Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full p-2.5 border rounded text-base mt-1 focus:ring-1 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Province</label>
                  <select name="province" value={formData.province} onChange={handleInputChange} className="w-full p-2.5 border rounded text-base mt-1 focus:ring-1 focus:ring-blue-500 bg-white">
                    {Object.keys(DISTRICTS).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">District</label>
                  <select name="district" value={formData.district} onChange={handleInputChange} className="w-full p-2.5 border rounded text-base mt-1 focus:ring-1 focus:ring-blue-500 bg-white">
                    {DISTRICTS[formData.province]?.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </section>

             {/* 3.4 Parent/Guardian Details */}
             <section className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-bold text-blue-900 border-b border-gray-200 pb-2 mb-3">3.4 Parent/Guardian Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                 <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Relationship</label>
                  <select name="guardianRel" value={formData.guardianRel} onChange={handleInputChange} className="w-full p-2.5 border rounded text-base mt-1 bg-white">
                    <option>Father</option>
                    <option>Mother</option>
                    <option>Guardian</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Guardian Full Name</label>
                  <input type="text" name="guardianName" value={formData.guardianName} onChange={handleInputChange} className="w-full p-2.5 border rounded text-base mt-1" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Guardian NRC (Optional)</label>
                  <input 
                    type="text" 
                    name="guardianNrc"
                    value={formData.guardianNrc} 
                    onChange={(e) => setFormData({...formData, guardianNrc: formatNRC(e.target.value)})} 
                    placeholder="222222/22/1"
                    className="w-full p-2.5 border rounded text-base mt-1" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Guardian Contact</label>
                  <input type="tel" name="guardianContact" value={formData.guardianContact} onChange={handleInputChange} className="w-full p-2.5 border rounded text-base mt-1" maxLength={10} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Guardian Address</label>
                  <input type="text" name="guardianAddress" value={formData.guardianAddress} onChange={handleInputChange} className="w-full p-2.5 border rounded text-base mt-1" />
                </div>
              </div>
            </section>

            {/* 3.5 Subjects Selection */}
            <section>
              <h3 className="text-sm font-bold text-blue-900 border-b pb-2 mb-3">3.5 Subjects Selection</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {SUBJECTS_LIST.map(sub => (
                  <button 
                    type="button"
                    key={sub.name}
                    onClick={() => handleSubjectToggle(sub.name)}
                    className={`
                      cursor-pointer p-3 rounded-lg border text-xs font-bold transition-all duration-200 flex flex-col items-center justify-center text-center h-24 touch-manipulation select-none
                      ${formData.subjects.includes(sub.name) 
                        ? 'bg-red-600 text-white border-blue-900 shadow-md ring-1 ring-blue-900' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50 active:bg-blue-100'}
                    `}
                  >
                    <span className="break-words w-full leading-tight px-1">{sub.name}</span>
                    {formData.subjects.includes(sub.name) && <CheckCircle size={14} className="mt-2 flex-shrink-0 text-white" />}
                  </button>
                ))}
              </div>
            </section>

            {/* 3.6 & 3.7 Fees */}
            <section className="bg-slate-50 p-4 lg:p-6 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-blue-900 mb-4 border-b pb-2">3.6 & 3.7 Fee Calculation & Payment</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Breakdown */}
                <div className="space-y-2 text-sm bg-white p-4 rounded border border-gray-200">
                  <div className="flex justify-between border-b pb-2 mb-2">
                    <span className="text-gray-600 font-medium">Number of Subjects</span>
                    <span className="font-bold">{currentFees.subjects}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">ECZ Examination Fee</span>
                    <span className="font-mono">K{currentFees.eczExamFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tuition Fee</span>
                    <span className="font-mono">K{currentFees.tuitionFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Practical Fee</span>
                    <span className="font-mono">K{currentFees.practicalFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Centre Fee</span>
                    <span className="font-mono">K{currentFees.centreFee}</span>
                  </div>
                   <div className="flex justify-between font-bold text-blue-800 border-t pt-2 mt-2">
                    <span>Total School Fee</span>
                    <span className="font-mono">K{currentFees.totalSchool}</span>
                  </div>
                  <div className="flex justify-between font-bold text-blue-800">
                    <span>Total ECZ Fee</span>
                    <span className="font-mono">K{currentFees.totalEcz}</span>
                  </div>

                  <div className="flex justify-between font-bold text-xl text-green-700 mt-2 border-t pt-2 border-dashed">
                    <span>Grand Total</span>
                    <span>K{currentFees.grandTotal}</span>
                  </div>
                  <div className="text-xs text-gray-400 text-right italic">(Includes Form Fee: K{currentFees.formFee})</div>
                </div>

                {/* Payment Inputs */}
                <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase">Form Fee Status</label>
                     <select 
                        name="feeFormPaid" 
                        value={formData.feeFormPaid ? "true" : "false"} 
                        onChange={(e) => setFormData({...formData, feeFormPaid: e.target.value === "true"})}
                        className="w-full p-2.5 border rounded mt-1 bg-white text-base"
                      >
                       <option value="false">Not Paid</option>
                       <option value="true">Paid (K{settings.feeForm})</option>
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase">ECZ Amount Paid</label>
                      <input 
                        type="number" 
                        name="feePaidEcz" 
                        value={formData.feePaidEcz} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 border rounded mt-1 font-mono font-semibold text-base" 
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase">School Amount Paid</label>
                      <input 
                        type="number" 
                        name="feePaidSchool" 
                        value={formData.feePaidSchool} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 border rounded mt-1 font-mono font-semibold text-base"
                        min="0" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Payment Reference</label>
                    <input type="text" name="paymentRef" value={formData.paymentRef} onChange={handleInputChange} className="w-full p-2.5 border rounded mt-1 text-base" placeholder="Bank receipt number" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-2">
                     <div className={`p-2 rounded text-center text-[10px] md:text-xs font-bold border ${formData.feeFormPaid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-100'}`}>
                        Form Fee<br/>{formData.feeFormPaid ? 'PAID' : 'UNPAID'}
                     </div>
                     <div className={`p-2 rounded text-center text-[10px] md:text-xs font-bold border ${Number(formData.feePaidSchool) >= currentFees.totalSchool ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-50 text-yellow-800 border-yellow-100'}`}>
                        School Fee<br/>{Number(formData.feePaidSchool) >= currentFees.totalSchool ? 'CLEARED' : `BAL: K${currentFees.totalSchool - Number(formData.feePaidSchool)}`}
                     </div>
                      <div className={`p-2 rounded text-center text-[10px] md:text-xs font-bold border ${Number(formData.feePaidEcz) >= currentFees.totalEcz ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-50 text-yellow-800 border-yellow-100'}`}>
                        ECZ Fee<br/>{Number(formData.feePaidEcz) >= currentFees.totalEcz ? 'CLEARED' : `BAL: K${currentFees.totalEcz - Number(formData.feePaidEcz)}`}
                     </div>
                  </div>

                </div>
              </div>
            </section>

          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t sticky bottom-0 bg-white p-4 shadow-inner z-10 -mx-4 lg:-mx-6 -mb-4 lg:-mb-6 rounded-b-lg">
          <button type="button" onClick={() => setFormData(emptyCandidate)} className="px-4 py-3 md:px-6 md:py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm md:text-base font-medium touch-manipulation">
            <RefreshCw size={18} /> <span className="hidden md:inline">Clear Form</span><span className="md:hidden">Reset</span>
          </button>
          <button type="submit" className="flex-1 md:flex-none px-6 py-3 md:px-8 md:py-2 bg-blue-900 text-white rounded font-medium hover:bg-blue-800 shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95 text-sm md:text-base touch-manipulation">
            <Save size={18} /> {initialData ? 'Update Record' : 'Submit Registration'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default RegistrationForm;