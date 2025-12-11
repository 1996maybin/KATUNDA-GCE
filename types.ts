export type Role = 'admin' | 'user';

export interface User {
  username: string;
  name: string;
  role: Role;
  nrc?: string;
  phone?: string;
  status: 'active' | 'pending';
  plainPassword?: string; // Storing plain text as requested for Admin visibility
  permissions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
    settings: boolean;
    sms: boolean;
  };
}

export interface Candidate {
  id: number;
  // Personal
  photo: string | null;
  title: string;
  otherNames: string;
  surname: string;
  nrc: string;
  gender: 'Male' | 'Female';
  dob: string;
  contact: string;
  email: string;
  province: string;
  district: string;
  address: string;
  // Documents
  docNrc: boolean;
  docSlip: boolean;
  fileNrc?: string | null; // Base64 encoded file
  fileSlip?: string | null; // Base64 encoded file
  // Guardian
  guardianName: string;
  guardianRel: string;
  guardianNrc: string; // Added field
  guardianContact: string;
  guardianAddress: string;
  // Academic
  subjects: string[];
  // Fees
  feeSchool: number; // Calculated Total School Fee (Tuition + Prac + Centre)
  feeEcz: number;    // Calculated Total ECZ Fee
  feePaidSchool: number;
  feePaidEcz: number;
  feeFormPaid: boolean;
  paymentRef: string;
  paymentStatus: 'Fully Paid' | 'Partial Payment' | 'Pending' | 'Query';
  // Meta
  regDate: string;
  timestamp: number;
  createdBy: string;
}

export interface Settings {
  feeSubject: number;
  feeTuition: number;
  feePractical: number;
  feeCentre: number;
  feeForm: number;
  schoolName: string;
}

export interface AuditLog {
  timestamp: number;
  action: string;
  user: string;
}

// Global declaration for CDN libraries
declare global {
  interface Window {
    XLSX: any;
    html2pdf: any;
    CryptoJS: any;
  }
}