import { Candidate } from '../types';
import { saveRecord, getRecords } from './db';
import { SUBJECTS_LIST } from '../constants';

export const exportToCSV = (data: Candidate[]) => {
  const headers = ["Index No", "Surname", "Other Names", "NRC", "Gender", "Contact", "Payment Status", "School Fee Paid", "ECZ Fee Paid", "Subjects", "Reg Date"];
  
  const rows = data.map(r => [
    r.id,
    `"${r.surname}"`,
    `"${r.otherNames}"`,
    `"${r.nrc}"`,
    r.gender,
    `"${r.contact}"`,
    r.paymentStatus,
    r.feePaidSchool,
    r.feePaidEcz,
    `"${r.subjects.join(', ')}"`,
    r.regDate
  ]);
  
  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n" 
    + rows.map(e => e.join(",")).join("\n");
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `GCE_Records_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (data: Candidate[]) => {
  if (typeof window.XLSX !== 'undefined') {
      const ws = window.XLSX.utils.json_to_sheet(data.map(r => ({
        "Index No": r.id,
        "Surname": r.surname,
        "Other Names": r.otherNames,
        "NRC": r.nrc,
        "Gender": r.gender,
        "DOB": r.dob,
        "Contact": r.contact,
        "Address": r.address,
        "District": r.district,
        "Province": r.province,
        "Guardian Name": r.guardianName,
        "Guardian Contact": r.guardianContact,
        "Subjects": r.subjects.join(", "),
        "Status": r.paymentStatus,
        "School Fee Required": r.feeSchool,
        "School Fee Paid": r.feePaidSchool,
        "ECZ Fee Required": r.feeEcz,
        "ECZ Fee Paid": r.feePaidEcz,
        "Form Fee Paid": r.feeFormPaid ? "Yes" : "No",
        "Reg Date": r.regDate
      })));
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Candidates");
      window.XLSX.writeFile(wb, `GCE_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`);
  } else {
      alert("Excel library not loaded. Please check your internet connection.");
  }
};

export const exportSubjectTotals = (data: Candidate[]) => {
  if (typeof window.XLSX !== 'undefined') {
      const subjectCounts: Record<string, number> = {};

      // Initialize with 0 for all subjects
      SUBJECTS_LIST.forEach(sub => {
          subjectCounts[sub.name] = 0;
      });

      // Count
      data.forEach(c => {
          c.subjects.forEach(sub => {
              if (subjectCounts[sub] !== undefined) {
                  subjectCounts[sub]++;
              } else {
                  // Handle cases where subject name might differ slightly or is new
                  subjectCounts[sub] = 1;
              }
          });
      });

      // Convert to array
      const rows = Object.entries(subjectCounts).map(([subject, count]) => ({
          "Subject Name": subject,
          "Total Candidates": count
      }));

      // Sort by count descending
      rows.sort((a, b) => b["Total Candidates"] - a["Total Candidates"]);

      // Add a total row
      const totalRegistrations = rows.reduce((acc, curr) => acc + curr["Total Candidates"], 0);
      rows.push({ "Subject Name": "TOTAL EXAM ENTRIES", "Total Candidates": totalRegistrations });

      const ws = window.XLSX.utils.json_to_sheet(rows);
      
      const wscols = [{wch: 30}, {wch: 20}];
      ws['!cols'] = wscols;

      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Subject Analysis");
      window.XLSX.writeFile(wb, `Subject_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
  } else {
      alert("Excel library not loaded.");
  }
};

export const exportSystemStats = (data: Candidate[]) => {
  if (typeof window.XLSX !== 'undefined') {
      // Calculate totals
      const totalCandidates = data.length;
      const totalSchoolFees = data.reduce((sum, c) => sum + Number(c.feePaidSchool || 0), 0);
      const totalEczFees = data.reduce((sum, c) => sum + Number(c.feePaidEcz || 0), 0);
      // Assuming Form Fee is 50. In a real app, maybe fetch from settings or check payment history
      const totalFormFees = data.reduce((sum, c) => sum + (c.feeFormPaid ? 50 : 0), 0);
      
      const fullyPaid = data.filter(c => c.paymentStatus === 'Fully Paid').length;
      const partial = data.filter(c => c.paymentStatus === 'Partial Payment').length;
      const pending = data.filter(c => ['Pending', 'Query'].includes(c.paymentStatus)).length;

      const rows = [
        { Metric: "Total Registered Candidates", Value: totalCandidates },
        { Metric: "Total School Fees Collected", Value: totalSchoolFees },
        { Metric: "Total ECZ Fees Paid", Value: totalEczFees },
        { Metric: "Total Form Fees Collected", Value: totalFormFees },
        { Metric: "Total Fully Paid", Value: fullyPaid },
        { Metric: "Total Partial Payment", Value: partial },
        { Metric: "Total Pending/Query", Value: pending },
        { Metric: "Generated On", Value: new Date().toLocaleString() }
      ];

      const ws = window.XLSX.utils.json_to_sheet(rows);
      const wscols = [{wch: 30}, {wch: 20}];
      ws['!cols'] = wscols;

      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "System Statistics");
      window.XLSX.writeFile(wb, `System_Stats_${new Date().toISOString().split('T')[0]}.xlsx`);
  } else {
      alert("Excel library not loaded.");
  }
};

export const importData = (file: File, callback: (count: number) => void) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        let count = 0;
        data.forEach((item: any) => {
          if (item.surname && item.nrc) {
             const record = { ...item, id: item.id || Date.now() + Math.random() };
             saveRecord(record as Candidate);
             count++;
          }
        });
        callback(count);
      } else {
        alert("Invalid file format. Expected a JSON array.");
      }
    } catch (err) {
      alert("Error parsing file. Please upload a valid JSON backup file.");
    }
  };
  reader.readAsText(file);
};