import { Candidate } from '../types';
import { SUBJECTS_LIST } from '../constants';

const formatDate = (dateString?: string | number | Date) => {
  const date = dateString ? new Date(dateString) : new Date();
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const generatePaymentRequest = (candidate: Candidate) => {
    const photoHtml = candidate.photo 
    ? `<img src="${candidate.photo}" style="width: 100px; height: 120px; object-fit: cover; border: 2px solid #333; display: block;" />` 
    : `<div style="width: 100px; height: 120px; border: 2px solid #333; display: flex; align-items: center; justify-content: center; font-size: 10px;">NO PHOTO</div>`;

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; background: #fff;">
        
        <div style="text-align: center; border-bottom: 4px solid #1a237e; padding-bottom: 20px; margin-bottom: 30px;">
           <h1 style="margin: 0; color: #1a237e; font-size: 28px;">KATUNDA SECONDARY SCHOOL</h1>
           <p style="margin: 5px 0;">P.O. BOX 950054, KATUNDA, LUAMPA</p>
           <h2 style="background: #c62828; color: white; display: inline-block; padding: 5px 20px; margin-top: 10px; font-size: 18px;">PAYMENT REQUEST FORM</h2>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
           <div style="flex: 1;">
              <h3 style="color: #1a237e; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Candidate Details</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr><td style="padding: 5px 0; width: 100px;"><strong>Name:</strong></td><td>${candidate.title} ${candidate.surname} ${candidate.otherNames}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>NRC:</strong></td><td>${candidate.nrc}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Phone:</strong></td><td>${candidate.contact}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Date:</strong></td><td>${formatDate(new Date())}</td></tr>
              </table>
           </div>
           <div style="margin-left: 20px;">
              ${photoHtml}
           </div>
        </div>

        <div style="margin-bottom: 30px;">
           <h3 style="color: #1a237e; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Registered Subjects</h3>
           <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
              ${candidate.subjects.map(s => `<span style="background: #f0f0f0; padding: 8px 12px; border: 1px solid #ccc; font-size: 14px; font-weight: bold; color: #555;">${s}</span>`).join('')}
           </div>
        </div>
        
        <div style="margin-bottom: 30px; text-align: center;">
           <div style="display: inline-block; background: #e3f2fd; padding: 15px 30px; border-radius: 8px; border: 2px solid #2196f3;">
              <div style="font-size: 14px; color: #0d47a1; font-weight: bold; text-transform: uppercase;">Total School Fee (Tuition + Centre + Practical)</div>
              <div style="font-size: 32px; font-weight: 900; color: #0d47a1;">K${candidate.feeSchool.toLocaleString()}</div>
           </div>
        </div>

        <div style="background: #e8eaf6; border: 2px solid #1a237e; padding: 25px; border-radius: 10px; margin-bottom: 30px; text-align: center;">
           <h3 style="color: #1a237e; margin-top: 0; font-size: 20px; margin-bottom: 20px;">BANKING DETAILS</h3>
           <div style="font-size: 16px; line-height: 2;">
              <div style="display: inline-block; text-align: left;">
                <div><span style="display: inline-block; width: 140px; color: #666;">Bank Name:</span> <strong>ACCESS BANK</strong></div>
                <div><span style="display: inline-block; width: 140px; color: #666;">Account Name:</span> <strong>KATUNDA SECONDARY SCHOOL</strong></div>
                <div><span style="display: inline-block; width: 140px; color: #666;">Account Number:</span> <span style="font-family: monospace; font-size: 22px; font-weight: bold; color: #1a237e;">0300510783006</span></div>
                <div><span style="display: inline-block; width: 140px; color: #666;">Branch:</span> <strong>KAOMA BRANCH</strong></div>
              </div>
           </div>
        </div>

        <div style="background: #fff3e0; border-left: 5px solid #ff9800; padding: 20px; margin-bottom: 20px;">
           <h4 style="margin: 0 0 10px 0; color: #e65100; font-size: 16px;">PAYMENT INSTRUCTION</h4>
           <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.5;">
             Please make the payments as soon as possible. Make your payments to the bank details above and use your NRC 
             <span style="background: #ffecb3; padding: 2px 5px; font-weight: bold; border: 1px solid #ffe082;">${candidate.nrc}</span> as the reference.
           </p>
        </div>

        <div style="margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 20px; text-align: center; color: #777; font-size: 12px;">
           <p>Katunda Secondary School Official Document | Generated by GCE System v2.0</p>
        </div>

      </div>
    `;

    if (window.html2pdf) {
      const opt = {
          margin: 0.5,
          filename: `Payment_Request_${candidate.surname}_${candidate.id.toString().slice(-4)}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      window.html2pdf().from(element).set(opt).save();
    }
};

export const generateReceipt = (candidate: Candidate) => {
  // Calculate totals
  const totalRequired = candidate.feeSchool + candidate.feeEcz; 
  const formFeePaidAmount = candidate.feeFormPaid ? 50 : 0;
  const totalPaid = Number(candidate.feePaidSchool) + Number(candidate.feePaidEcz);
  
  const targetAmount = candidate.feeSchool + candidate.feeEcz + 50;
  const totalPaidCalc = totalPaid + (candidate.feeFormPaid ? 50 : 0);
  
  const balance = targetAmount - totalPaidCalc;
  const photoHtml = candidate.photo 
    ? `<img src="${candidate.photo}" style="width: 80px; height: 90px; object-fit: cover; border: 2px solid #333; display: block;" />` 
    : `<div style="width: 80px; height: 90px; border: 2px solid #333; display: flex; align-items: center; justify-content: center; font-size: 10px;">NO PHOTO</div>`;

  const element = document.createElement('div');
  element.innerHTML = `
    <div style="font-family: 'Courier New', monospace; padding: 30px; color: #333; max-width: 800px; margin: 0 auto; border: 4px double #333; background: #fff;">
      
      <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 2px dashed #333; padding-bottom: 20px; margin-bottom: 20px;">
        <div style="flex: 1;">
           <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #1a237e;">KATUNDA SECONDARY SCHOOL</h1>
           <p style="margin: 5px 0; font-size: 12px; font-weight: bold;">P.O. BOX 950054, KATUNDA, LUAMPA</p>
           <h2 style="margin: 10px 0 0 0; font-size: 16px; text-decoration: underline;">OFFICIAL GUIDANCE DEPARTMENT RECEIPT</h2>
        </div>
        <div style="margin-left: 20px;">
          ${photoHtml}
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
        <div>
          <strong>Date:</strong> ${formatDate(new Date())}<br/>
          <strong>Receipt No:</strong> REC-${candidate.id.toString().slice(-6)}
        </div>
        <div style="text-align: right;">
          <strong>Ref:</strong> ${candidate.paymentRef || 'CASH'}
        </div>
      </div>

      <div style="margin-bottom: 30px; font-size: 14px; line-height: 1.6; background: #f9f9f9; padding: 15px; border: 1px solid #ddd;">
        Received from <strong>${candidate.title} ${candidate.surname} ${candidate.otherNames}</strong> (NRC: ${candidate.nrc})<br/>
        The sum of <strong>K${totalPaid.toLocaleString()}</strong><br/>
        Being payment for <strong>GCE Registration Fees - 2025-2025</strong>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #333; font-size: 13px;">
        <tr style="background: #1a237e; color: white;">
          <th style="border: 1px solid #333; padding: 10px; text-align: left;">Description</th>
          <th style="border: 1px solid #333; padding: 10px; text-align: right;">Amount (ZMW)</th>
        </tr>
        <tr>
          <td style="border: 1px solid #333; padding: 10px;">Form Fee ${candidate.feeFormPaid ? '(Paid)' : '(Not Paid)'}</td>
          <td style="border: 1px solid #333; padding: 10px; text-align: right;">${formFeePaidAmount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #333; padding: 10px;">School Fees</td>
          <td style="border: 1px solid #333; padding: 10px; text-align: right;">${Number(candidate.feePaidSchool).toLocaleString()}</td>
        </tr>
         <tr>
          <td style="border: 1px solid #333; padding: 10px;">ECZ Fees</td>
          <td style="border: 1px solid #333; padding: 10px; text-align: right;">${Number(candidate.feePaidEcz).toLocaleString()}</td>
        </tr>
        <tr style="font-weight: bold; background: #eee;">
          <td style="border: 1px solid #333; padding: 10px;">TOTAL PAID</td>
          <td style="border: 1px solid #333; padding: 10px; text-align: right;">K${(totalPaid + formFeePaidAmount).toLocaleString()}</td>
        </tr>
      </table>

      <div style="display: flex; justify-content: flex-end;">
        <div style="border: 2px solid #d32f2f; padding: 10px 20px; text-align: center; background: #fff0f0;">
          <div style="font-size: 12px; margin-bottom: 2px; color: #d32f2f;">BALANCE DUE</div>
          <div style="font-size: 22px; font-weight: bold; color: #d32f2f;">K${balance > 0 ? balance.toLocaleString() : '0.00'}</div>
        </div>
      </div>

      <div style="text-align: center; font-size: 10px; margin-top: 40px; color: #666; border-top: 1px solid #ccc; padding-top: 10px;">
        Generated by Katunda GCE System v2.0
      </div>
    </div>
  `;

  if (window.html2pdf) {
      const opt = {
          margin: 0.5,
          filename: `Receipt_${candidate.surname}_${candidate.id}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      window.html2pdf().from(element).set(opt).save();
  }
};

export const generateConfirmation = (candidate: Candidate) => {
  let subjectCount = candidate.subjects.length;
  let practicalCount = 0;
  candidate.subjects.forEach((subName: string) => {
     const sub = SUBJECTS_LIST.find(s => s.name === subName);
     if (sub?.isPractical) practicalCount++;
  });

  const eczExamFee = subjectCount * 200;
  const tuitionFee = subjectCount * 200;
  const practicalFee = practicalCount * 100;
  const centreFee = 200;
  const formFee = 50;
  
  const grandTotal = eczExamFee + tuitionFee + practicalFee + centreFee + formFee;
  const totalPaid = Number(candidate.feePaidSchool) + Number(candidate.feePaidEcz);
  const totalPaidWithForm = totalPaid + (candidate.feeFormPaid ? 50 : 0);
  const balance = grandTotal - totalPaidWithForm;

  const photoHtml = candidate.photo 
  ? `<img src="${candidate.photo}" style="width: 120px; height: 140px; object-fit: cover; border: 4px solid #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: block;" />` 
  : `<div style="width: 120px; height: 140px; background: #eee; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">No Photo</div>`;

  const element = document.createElement('div');
  element.innerHTML = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 800px; margin: 0 auto; background: #fff; border: 5px solid #000; padding: 5px;">
      
      <div style="border: 2px solid #1a237e; padding: 25px;">
        <!-- Header -->
        <div style="background: #1a237e; color: white; padding: 25px; text-align: center; border-bottom: 5px solid #ff6f00;">
          <h1 style="margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 1px;">Katunda Secondary School</h1>
          <p style="margin: 5px 0; font-size: 14px; opacity: 0.9;">P.O. BOX 950054, KATUNDA, LUAMPA</p>
          <h2 style="margin: 15px 0 0 0; font-size: 20px; font-weight: 400; background: #ff6f00; display: inline-block; padding: 5px 20px; border-radius: 20px;">GCE REGISTRATION FORM 2025-2025</h2>
        </div>

        <div style="padding: 20px 5px;">
          
          <!-- Layout for Photo and Personal Info -->
          <div style="display: flex; gap: 30px; margin-bottom: 30px;">
             <div style="flex: 1;">
                <h3 style="color: #1a237e; border-bottom: 2px solid #1a237e; padding-bottom: 5px; margin-top: 0;">Personal Details</h3>
                <table style="width: 100%; font-size: 13px; border-collapse: separate; border-spacing: 0 8px;">
                   <tr><td style="font-weight: bold; width: 120px; color: #555;">Full Name:</td><td>${candidate.title} ${candidate.surname} ${candidate.otherNames}</td></tr>
                   <tr><td style="font-weight: bold; width: 120px; color: #555;">NRC Number:</td><td>${candidate.nrc}</td></tr>
                   <tr><td style="font-weight: bold; width: 120px; color: #555;">Gender:</td><td>${candidate.gender}</td></tr>
                   <tr><td style="font-weight: bold; width: 120px; color: #555;">Date of Birth:</td><td>${formatDate(candidate.dob)}</td></tr>
                   <tr><td style="font-weight: bold; width: 120px; color: #555;">Phone:</td><td>${candidate.contact}</td></tr>
                   <tr><td style="font-weight: bold; width: 120px; color: #555;">Address:</td><td>${candidate.address}</td></tr>
                   <tr><td style="font-weight: bold; width: 120px; color: #555;">District:</td><td>${candidate.district}, ${candidate.province} Province</td></tr>
                </table>
             </div>
             <div>
                ${photoHtml}
                <div style="text-align: center; margin-top: 10px; font-size: 12px; font-weight: bold; color: #1a237e;">
                  CANDIDATE
                </div>
             </div>
          </div>

          <!-- Guardian Info -->
          <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #1a237e;">
             <h3 style="color: #1a237e; margin-top: 0; font-size: 16px;">Guardian Information</h3>
             <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
                <div><strong>Name:</strong> ${candidate.guardianName}</div>
                <div><strong>Relationship:</strong> ${candidate.guardianRel}</div>
                <div><strong>Contact:</strong> ${candidate.guardianContact}</div>
                <div><strong>Address:</strong> ${candidate.guardianAddress}</div>
             </div>
          </div>

          <!-- Subjects -->
          <h3 style="color: #1a237e; border-bottom: 2px solid #1a237e; padding-bottom: 5px;">Registered Subjects</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 25px;">
             ${candidate.subjects.map(s => `
               <span style="background: #e3f2fd; color: #1565c0; padding: 5px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; border: 1px solid #bbdefb;">${s}</span>
             `).join('')}
          </div>

          <!-- Financials -->
          <div style="display: flex; gap: 20px;">
             <div style="flex: 2;">
                <h3 style="color: #1a237e; border-bottom: 2px solid #1a237e; padding-bottom: 5px;">Payment Summary</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #eee;">
                  <tr style="background: #1a237e; color: white;">
                    <th style="padding: 8px; text-align: left;">Item</th>
                    <th style="padding: 8px; text-align: right;">Amount</th>
                  </tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Tuition Fees</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align:right">K${tuitionFee}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">ECZ Exam Fees</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align:right">K${eczExamFee}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Practical Fees</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align:right">K${practicalFee}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Centre & Form Fees</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align:right">K${centreFee + formFee}</td></tr>
                  <tr style="font-weight:bold; background: #fafafa;"><td style="padding: 8px;">TOTAL REQUIRED</td><td style="padding: 8px; text-align:right">K${grandTotal}</td></tr>
                </table>
             </div>
             <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                <div style="background: ${balance <= 0 ? '#e8f5e9' : '#ffebee'}; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid ${balance <= 0 ? '#c8e6c9' : '#ffcdd2'};">
                   <div style="font-size: 12px; color: #555; text-transform: uppercase;">Payment Status</div>
                   <div style="font-size: 18px; font-weight: bold; color: ${balance <= 0 ? '#2e7d32' : '#c62828'}; margin: 5px 0;">${candidate.paymentStatus}</div>
                   <div style="font-size: 12px; margin-top: 10px;">Balance Due</div>
                   <div style="font-size: 24px; font-weight: bold; color: #333;">K${balance > 0 ? balance : '0.00'}</div>
                </div>
             </div>
          </div>

          <!-- Signatures -->
          <div style="margin-top: 60px; display: flex; justify-content: space-between; gap: 40px;">
             <div style="flex: 1; text-align: center;">
                <div style="border-bottom: 1px solid #333; height: 40px; margin-bottom: 10px;"></div>
                <div style="font-size: 12px; font-weight: bold; color: #555;">CANDIDATE'S SIGNATURE</div>
             </div>
             <div style="flex: 1; text-align: center;">
                <div style="border-bottom: 1px solid #333; height: 40px; margin-bottom: 10px;"></div>
                <div style="font-size: 12px; font-weight: bold; color: #555;">GUIDANCE TEACHER'S SIGNATURE</div>
             </div>
          </div>

          <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #999;">
             Printed on ${formatDate(new Date())} | Katunda Secondary School GCE System
          </div>
        </div>
      </div>
    </div>
  `;
  if (window.html2pdf) {
      const opt = {
          margin: 0.3,
          filename: `Confirmation_${candidate.surname}_${candidate.id}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      window.html2pdf().from(element).set(opt).save();
  }
};

export const generateFullReport = (candidates: Candidate[]) => {
    const totalSchool = candidates.reduce((a, b) => a + Number(b.feePaidSchool), 0);
    const totalEcz = candidates.reduce((a, b) => a + Number(b.feePaidEcz), 0);
    const totalForm = candidates.reduce((a, b) => a + (b.feeFormPaid ? 50 : 0), 0);

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: 'Helvetica', sans-serif; padding: 20px;">
        <h1 style="color: #1a237e; text-align: center;">KATUNDA SECONDARY SCHOOL</h1>
        <h3 style="text-align: center; margin-top: 0;">GCE Registration Master Report</h3>
        <p style="text-align: center; font-size: 12px; color: #666;">Generated on ${formatDate(new Date())}</p>
        
        <div style="display: flex; justify-content: space-around; margin: 20px 0; background: #f0f0f0; padding: 15px; border-radius: 5px;">
           <div style="text-align: center;"><strong>Total Candidates</strong><br/>${candidates.length}</div>
           <div style="text-align: center;"><strong>Total School Fees</strong><br/>K${totalSchool.toLocaleString()}</div>
           <div style="text-align: center;"><strong>Total ECZ Fees</strong><br/>K${totalEcz.toLocaleString()}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead style="background: #1a237e; color: white;">
            <tr>
              <th style="padding: 5px; border: 1px solid #ccc;">#</th>
              <th style="padding: 5px; border: 1px solid #ccc;">Name</th>
              <th style="padding: 5px; border: 1px solid #ccc;">NRC</th>
              <th style="padding: 5px; border: 1px solid #ccc;">Subjects</th>
              <th style="padding: 5px; border: 1px solid #ccc;">Status</th>
              <th style="padding: 5px; border: 1px solid #ccc;">Paid (Total)</th>
            </tr>
          </thead>
          <tbody>
            ${candidates.map((c, i) => `
              <tr style="background: ${i % 2 === 0 ? '#fff' : '#f9f9f9'};">
                <td style="padding: 4px; border: 1px solid #ccc; text-align: center;">${i + 1}</td>
                <td style="padding: 4px; border: 1px solid #ccc;">${c.surname}, ${c.otherNames}</td>
                <td style="padding: 4px; border: 1px solid #ccc;">${c.nrc}</td>
                <td style="padding: 4px; border: 1px solid #ccc; text-align: center;">${c.subjects.length}</td>
                <td style="padding: 4px; border: 1px solid #ccc;">${c.paymentStatus}</td>
                <td style="padding: 4px; border: 1px solid #ccc; text-align: right;">K${Number(c.feePaidSchool) + Number(c.feePaidEcz)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    if (window.html2pdf) {
        const opt = {
            margin: 0.3,
            filename: `GCE_Master_Report_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        };
        window.html2pdf().from(element).set(opt).save();
    } else {
        alert("PDF library not loaded.");
    }
};