/**
 * Utility to generate and print medical certificates for Bukidnon State University.
 * Supports both Normal (MC-F-001A) and Pathologic (MC-F-001B) versions.
 */

export const printMedicalCertificate = (appointment, type = 'normal') => {
    const isNormal = type === 'normal';
    const patient = appointment.patientId || {};
    const doctor = appointment.doctorId || {};
    const doctorName = `Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || '____________________';

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    const styles = `
        @page { size: 8.5in 11in; margin: 0; }
        body { 
            margin: 0; 
            padding: 0.5in; 
            font-family: 'Times New Roman', serif; 
            font-size: 12pt;
            line-height: 1.4;
            color: black;
        }
        .cert-container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            position: relative;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            margin-bottom: 20px;
        }
        .logo {
            width: 80px;
            height: 80px;
            position: absolute;
            left: 0;
        }
        .header-text {
            text-align: center;
        }
        .univ-name {
            font-weight: bold;
            font-size: 14pt;
            margin: 0;
        }
        .univ-details {
            font-size: 10pt;
            margin: 0;
        }
        .annex {
            position: absolute;
            right: 0;
            top: 0;
            font-weight: bold;
            font-size: 11pt;
        }
        .title {
            text-align: center;
            font-weight: bold;
            font-size: 16pt;
            text-decoration: underline;
            margin: 20px 0;
            text-transform: uppercase;
        }
        .date-line {
            text-align: right;
            margin-bottom: 30px;
        }
        .content {
            text-align: justify;
            margin-bottom: 30px;
        }
        .field-row {
            margin-bottom: 15px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .field-label {
            font-weight: bold;
        }
        .underline {
            border-bottom: 1px solid black;
            display: inline-block;
            min-width: 50px;
            padding: 0 5px;
        }
        .vitals-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }
        .vitals-label {
            font-weight: bold;
            font-size: 11pt;
        }
        .vitals-title {
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
            text-transform: uppercase;
            font-size: 12pt;
        }
        .visual-acuity {
            margin: 15px 0;
        }
        .purpose {
            margin: 20px 0;
        }
        .footer-note {
            font-style: italic;
            font-size: 10pt;
            margin-top: 30px;
        }
        .signature-section {
            margin-top: 60px;
            text-align: right;
            margin-left: auto;
            width: 300px;
        }
        .sig-line {
            border-bottom: 2px solid black;
            font-weight: bold;
            text-align: center;
            padding-bottom: 5px;
        }
        .sig-label {
            text-align: center;
            font-weight: bold;
            font-size: 11pt;
            margin-top: 5px;
        }
        .validity {
            margin-top: 40px;
        }
        .metadata-footer {
            position: absolute;
            bottom: 0;
            width: 100%;
            display: flex;
            justify-content: space-between;
            font-size: 9pt;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        }
    `;

    const getNormalContent = () => `
        <div class="date-line">Date: <span class="underline" style="min-width: 150px;">${new Date().toLocaleDateString()}</span></div>
        
        <div class="content">
            This is to certify that <span class="underline" style="min-width: 250px;">${patient.firstName || ''} ${patient.lastName || ''}</span>, 
            <span class="underline" style="min-width: 40px;">${appointment.p_age || '—'}</span> y.o., 
            <span class="underline" style="min-width: 60px;">${appointment.p_sex || '—'}</span>, 
            <span class="underline" style="min-width: 80px;">${appointment.p_civilStatus || '—'}</span>, 
            a resident of <span class="underline" style="min-width: 350px;">${appointment.p_address || '—'}</span>.
            Taking up <span class="underline" style="min-width: 300px;">${appointment.p_course || '—'}</span>, was seen, examined and was found to be physically and 
            mentally fit as of this time of examination.
        </div>

        <div class="vitals-title">Latest Vital Signs:</div>
        <div class="vitals-grid">
            <div><span class="vitals-label">BP:</span> <span class="underline" style="min-width: 80px;">${appointment.bloodPressure || '—'}</span></div>
            <div><span class="vitals-label">Height(cm):</span> <span class="underline" style="min-width: 60px;">${appointment.height || '—'}</span></div>
            <div><span class="vitals-label">Weight:</span> <span class="underline" style="min-width: 60px;">${appointment.weight || '—'}</span></div>
            <div><span class="vitals-label">BMI:</span> <span class="underline" style="min-width: 60px;">${appointment.bmi || '—'}</span></div>
            
            <div><span class="vitals-label">PR:</span> <span class="underline" style="min-width: 80px;">${appointment.pulseRate || '—'}</span></div>
            <div><span class="vitals-label">RR:</span> <span class="underline" style="min-width: 60px;">${appointment.respiratoryRate || '—'}</span></div>
            <div><span class="vitals-label">Temp:</span> <span class="underline" style="min-width: 60px;">${appointment.temperature || '—'}</span></div>
            <div><span class="vitals-label">LMP:</span> <span class="underline" style="min-width: 60px;">${appointment.lmp || '—'}</span></div>
        </div>

        <div class="visual-acuity">
            <span class="field-label">Visual Acuity:</span> 
            <div style="margin-left: 100px;">
                OS: <span class="underline" style="min-width: 150px;">${appointment.visualAcuityOS || '—'}</span><br/>
                OD: <span class="underline" style="min-width: 150px;">${appointment.visualAcuityOD || '—'}</span>
            </div>
        </div>

        <div class="purpose">
            This is issued for <span class="underline" style="min-width: 400px;">${appointment.issuedFor || appointment.purpose || '—'}</span>
        </div>

        <div class="footer-note">
            (This medical certificate is not for medico-legal purposes)
        </div>

        <div class="signature-section">
            <div class="sig-line">${doctorName}</div>
            <div class="sig-label">Examining Physician</div>
        </div>

        <div class="validity">
            Valid for AY <span class="underline" style="min-width: 100px;">${appointment.validForAY || '—'}</span>, <span class="underline" style="min-width: 80px;">${appointment.validForSemester || '—'}</span> Semester
        </div>

        <div class="metadata-footer">
            <span>Document Code: MC-F-001A</span>
            <span>Revision No: 03</span>
            <span>Issue Date: July 11, 2025</span>
            <span>Page 1 of 1</span>
        </div>
    `;

    const getPathologicContent = () => `
        <div class="annex">ANNEX F</div>
        <div class="date-line">DATE: <span class="underline" style="min-width: 150px;">${new Date().toLocaleDateString()}</span></div>
        
        <div class="field-row">
            <span class="field-label">NAME:</span> <span class="underline" style="min-width: 300px;">${patient.firstName || ''} ${patient.lastName || ''}</span>
            <span class="field-label">AGE:</span> <span class="underline" style="min-width: 40px;">${appointment.p_age || '—'}</span>
            <span class="field-label">GENDER:</span> <span class="underline" style="min-width: 60px;">${appointment.p_sex || '—'}</span>
            <span class="field-label">CIVIL STATUS:</span> <span class="underline" style="min-width: 80px;">${appointment.p_civilStatus || '—'}</span>
        </div>
        <div class="field-row">
            <span class="field-label">ADDRESS:</span> <span class="underline" style="min-width: 550px;">${appointment.p_address || '—'}</span>
        </div>
        <div class="field-row">
            <span class="field-label">COURSE/DEPT:</span> <span class="underline" style="min-width: 550px;">${appointment.p_course || '—'}</span>
        </div>

        <div class="vitals-title">VITAL SIGNS</div>
        <div class="vitals-grid" style="grid-template-columns: 1fr 1fr 1fr 1fr;">
            <div><span class="vitals-label">BP:</span> <span class="underline" style="min-width: 80px;">${appointment.bloodPressure || '—'}</span></div>
            <div><span class="vitals-label">HR:</span> <span class="underline" style="min-width: 60px;">${appointment.pulseRate || '—'}</span></div>
            <div><span class="vitals-label">RR:</span> <span class="underline" style="min-width: 60px;">${appointment.respiratoryRate || '—'}</span></div>
            <div><span class="vitals-label">TEMP:</span> <span class="underline" style="min-width: 60px;">${appointment.temperature || '—'}</span></div>
            
            <div><span class="vitals-label">HEIGHT(cm):</span> <span class="underline" style="min-width: 80px;">${appointment.height || '—'}</span></div>
            <div><span class="vitals-label">WEIGHT(kg):</span> <span class="underline" style="min-width: 80px;">${appointment.weight || '—'}</span></div>
            <div><span class="vitals-label">BMI:</span> <span class="underline" style="min-width: 80px;">${appointment.bmi || '—'}</span></div>
        </div>

        <div class="purpose" style="margin-top: 30px;">
            <span class="field-label">DIAGNOSIS:</span> 
            <div class="underline" style="width: 100%; min-height: 40px; margin-top: 5px;">${appointment.diagnosis || '—'}</div>
        </div>

        <div class="purpose" style="margin-top: 30px;">
            <span class="field-label">REMARKS:</span> 
            <div class="underline" style="width: 100%; min-height: 60px; margin-top: 5px;">${appointment.remarks || '—'}</div>
        </div>

        <div class="footer-note" style="margin-top: 50px;">
            (This medical certificate is not valid for medico-legal purposes)
        </div>

        <div class="signature-section" style="margin-top: 80px;">
            <div class="sig-line">${doctorName}</div>
            <div class="sig-label">Examining Physician</div>
        </div>

        <div class="metadata-footer">
            <span>Document Code: MC-F-001B</span>
            <span>Revision No: 01</span>
            <span>Issue Date: July 11, 2025</span>
            <span>Page 1 of 1</span>
        </div>
    `;

    const html = `
        <html>
            <head>
                <title>Medical Certificate - ${patient.firstName} ${patient.lastName}</title>
                <style>${styles}</style>
            </head>
            <body>
                <div class="cert-container">
                    <div class="header">
                        <img src="/logo.png" class="logo" />
                        <div class="header-text">
                            <p class="univ-name">BUKIDNON STATE UNIVERSITY</p>
                            <p class="univ-details">Malaybalay City, Bukidnon 8700</p>
                            <p class="univ-details">Tel (088) 813-5661 to 5663; TeleFax: (088) 813-2717, www.buksu.edu.ph</p>
                        </div>
                    </div>

                    <div class="title">MEDICAL CERTIFICATE</div>

                    ${isNormal ? getNormalContent() : getPathologicContent()}
                </div>
            </body>
        </html>
    `;

    doc.write(html);
    doc.close();

    iframe.onload = () => {
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
    };
};
