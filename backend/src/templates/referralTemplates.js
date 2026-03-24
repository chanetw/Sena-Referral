/**
 * SENA HAPPY REFER - Email Templates
 * 
 * Templates สำหรับแจ้งผลการเข้าร่วมกิจกรรม
 * - FGF_Pass_1_owner: ได้รับสิทธิ์ - แนะนำตัวเอง (Owner)
 * - FGF_Pass_2_agent: ได้รับสิทธิ์ - แนะนำผู้อื่น (Agent)
 * - FGF_NoPass_1_owner: ไม่ได้รับสิทธิ์ - ไม่ผ่านเงื่อนไข (Owner)
 * - FGF_NoPass_2_agent: ไม่ได้รับสิทธิ์ - ซ้ำในฐานข้อมูล (Agent)
 */

const baseTemplate = (content) => `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SENA HAPPY REFER</title>
    <style>
        body {
            font-family: 'Inter', 'Tahoma', 'Sana Serif', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f7f7f7;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 800px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .primary-bg {
            background-color: #32bcad;
            background-image: linear-gradient(to right, #ffffff, #32bcad);
        }
        .header {
            padding: 24px;
            border-radius: 12px 12px 0 0;
        }
        .header-content {
            display: flex;
            align-items: flex-start;
        }
        .logo {
            width: 96px;
            height: 32px;
            margin-right: 16px;
            flex-shrink: 0;
            margin-top: 4px;
        }
        .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .header-text h1 {
            color: #1f2937;
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 4px 0;
            line-height: 1.2;
        }
        .header-text p {
            color: #1f2937;
            font-size: 14px;
            font-weight: 300;
            margin: 0;
        }
        .body-content {
            padding: 24px 32px;
        }
        .greeting {
            margin-bottom: 8px;
            font-weight: 600;
            color: #374151;
        }
        .subject {
            margin-bottom: 24px;
            font-weight: 600;
            color: #374151;
        }
        .message {
            margin-bottom: 32px;
        }
        .message p {
            margin-bottom: 16px;
        }
        .highlight-box {
            padding: 16px;
            border-radius: 6px;
            margin-bottom: 40px;
        }
        .highlight-box.pass {
            background-color: #cdf0ea;
            border-left: 4px solid #32bcad;
        }
        .highlight-box.nopass {
            background-color: #fee2e2;
            border-left: 4px solid #ef4444;
        }
        .highlight-title {
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 4px;
        }
        .highlight-box.pass .highlight-title {
            color: #115e59;
        }
        .highlight-box.nopass .highlight-title {
            color: #991b1b;
        }
        .highlight-name {
            font-size: 20px;
            font-weight: 800;
            color: #111827;
        }
        .highlight-status {
            font-size: 18px;
            font-weight: 700;
            margin-left: 8px;
        }
        .highlight-box.nopass .highlight-status {
            color: #dc2626;
        }
        .footer {
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
        }
        .signature {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 16px;
        }
        .company {
            font-size: 14px;
            margin-bottom: 24px;
        }
        .contact-box {
            padding: 16px;
            background-color: #eff6ff;
            border-left: 4px solid #32bcad;
            border-radius: 6px;
            font-size: 14px;
        }
        .contact-box p {
            margin: 0 0 4px 0;
        }
        .contact-box .contact-title {
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="primary-bg header">
            <div class="header-content">
                <div class="logo">
                    <img src="https://www.sena.co.th/images/logo-scroll.svg" alt="SENA Logo" 
                         onerror="this.onerror=null; this.src='https://placehold.co/96x32/32bcad/ffffff?text=SENA';" />
                </div>
                <div class="header-text">
                    <h1>SENA HAPPY REFER</h1>
                    <p>จดหมายยืนยันการเข้าร่วมกิจกรรม</p>
                </div>
            </div>
        </div>
        <div class="body-content">
            ${content}
        </div>
    </div>
</body>
</html>`;

const footerTemplate = () => `
            <div class="footer">
                <p class="signature">ขอแสดงความนับถือ</p>
                <div class="company">
                    <p>บริษัท เสนาดีเวลลอปเม้นท์ จำกัด (มหาชน)</p>
                </div>
                <div class="contact-box">
                    <p class="contact-title">ติดต่อสอบถามได้ที่:</p>
                    <p>ฝ่ายกำกับนโยบาย</p>
                    <p>เบอร์โทร: 02-5414642 ต่อ 10411</p>
                </div>
            </div>`;

const templates = {
    /**
     * Template: FGF_Pass_1_owner
     * สำหรับ: Owner ที่แนะนำตัวเอง - ได้รับสิทธิ์
     */
    FGF_Pass_1_owner: (data) => {
        const content = `
            <p class="greeting">เรียน ${data.refereeName || '(ชื่อผู้แนะนำ)'}</p>
            <p class="subject">เรื่อง: การได้รับสิทธิ์เข้าร่วมกิจกรรม SENA HAPPY REFER</p>
            
            <div class="message">
                <p>บริษัทฯ ขอขอบคุณท่านที่เข้าร่วมกิจกรรม SENA HAPPY REFER</p>
                <p>ท่านจะได้รับสิทธิ์ในการรับค่าแนะนำ เมื่อท่านและเพื่อนของท่าน ปฏิบัติตามเงื่อนไขที่บริษัทกำหนด</p>
            </div>

            <div class="highlight-box pass">
                <p class="highlight-title">รายชื่อผู้ได้รับสิทธิ์แนะนำตัวเอง:</p>
                <p class="highlight-name">${data.customerName || 'คุณธนสรรค์ แสงสุวรรณ์'}</p>
            </div>
            ${footerTemplate()}
        `;
        return baseTemplate(content);
    },

    /**
     * Template: FGF_Pass_2_agent
     * สำหรับ: Agent ที่แนะนำผู้อื่น - ได้รับสิทธิ์
     */
    FGF_Pass_2_agent: (data) => {
        const content = `
            <p class="greeting">เรียน ${data.refereeName || '(ชื่อผู้แนะนำ)'}</p>
            <p class="subject">เรื่อง: การได้รับสิทธิ์เข้าร่วมกิจกรรม SENA HAPPY REFER</p>
            
            <div class="message">
                <p>บริษัทฯ ขอขอบคุณท่านที่เข้าร่วมกิจกรรม SENA HAPPY REFER</p>
                <p>ท่านจะได้รับสิทธิ์ในการรับค่าแนะนำ เมื่อท่านและเพื่อนของท่าน ปฏิบัติตามเงื่อนไขที่บริษัทกำหนด</p>
            </div>

            <div class="highlight-box pass">
                <p class="highlight-title">รายชื่อผู้ถูกแนะนำที่ได้รับสิทธิ์:</p>
                <p class="highlight-name">${data.customerName || 'คุณกรรณิการ์ พวงผกา'}</p>
            </div>
            ${footerTemplate()}
        `;
        return baseTemplate(content);
    },

    /**
     * Template: FGF_NoPass_1_owner
     * สำหรับ: Owner ที่แนะนำตัวเอง - ไม่ได้รับสิทธิ์ (ไม่ผ่านเงื่อนไข)
     */
    FGF_NoPass_1_owner: (data) => {
        const content = `
            <p class="greeting">เรียน ${data.refereeName || '(ชื่อผู้แนะนำ)'}</p>
            <p class="subject">เรื่อง: การไม่ได้รับสิทธิ์เข้าร่วมกิจกรรม SENA HAPPY REFER</p>
            
            <div class="message">
                <p>บริษัทฯ ขอขอบคุณท่านที่เข้าร่วมกิจกรรม SENA HAPPY REFER</p>
                <p>บริษัท ขออภัย ท่านไม่ได้รับสิทธิ์การแนะนำตามเงื่อนไขที่บริษัทกำหนด</p>
            </div>

            <div class="highlight-box nopass">
                <p class="highlight-title">รายชื่อผู้ถูกแนะนำ:</p>
                <p class="highlight-name">${data.customerName || 'คุณกรรณิการ์ พวงผกา'} <span class="highlight-status">(ไม่ได้รับสิทธิ์)</span></p>
            </div>
            ${footerTemplate()}
        `;
        return baseTemplate(content);
    },

    /**
     * Template: FGF_NoPass_2_agent
     * สำหรับ: Agent ที่แนะนำผู้อื่น - ไม่ได้รับสิทธิ์ (ซ้ำในฐานข้อมูล)
     */
    FGF_NoPass_2_agent: (data) => {
        const content = `
            <p class="greeting">เรียน ${data.refereeName || '(ชื่อผู้แนะนำ)'}</p>
            <p class="subject">เรื่อง: การไม่ได้รับสิทธิ์เข้าร่วมกิจกรรม SENA HAPPY REFER</p>
            
            <div class="message">
                <p>บริษัทฯ ขอขอบคุณท่านที่เข้าร่วมกิจกรรม SENA HAPPY REFER</p>
                <p>บริษัท ขออภัยเนื่องจากข้อมูลรายชื่อเพื่อนของท่านที่แนะนำมานั้น ซ้ำกับรายชื่อในฐานข้อมูลลูกค้าของบริษัทที่มีอยู่แล้ว ท่านจึงไม่ได้รับสิทธิ์การแนะนำตามเงื่อนไขที่บริษัทกำหนด</p>
            </div>

            <div class="highlight-box nopass">
                <p class="highlight-title">รายชื่อผู้ถูกแนะนำ:</p>
                <p class="highlight-name">${data.customerName || 'คุณกรรณิการ์ พวงผกา'} <span class="highlight-status">(ไม่ได้รับสิทธิ์)</span></p>
            </div>
            ${footerTemplate()}
        `;
        return baseTemplate(content);
    }
};

/**
 * รายชื่อ templates ที่มีให้ใช้
 */
const TEMPLATE_NAMES = {
    FGF_Pass_1_owner: 'ได้รับสิทธิ์ - แนะนำตัวเอง (Owner)',
    FGF_Pass_2_agent: 'ได้รับสิทธิ์ - แนะนำผู้อื่น (Agent)',
    FGF_NoPass_1_owner: 'ไม่ได้รับสิทธิ์ - ไม่ผ่านเงื่อนไข (Owner)',
    FGF_NoPass_2_agent: 'ไม่ได้รับสิทธิ์ - ซ้ำในฐานข้อมูล (Agent)'
};

/**
 * ตรวจสอบว่า template มีอยู่หรือไม่
 * @param {string} templateName 
 * @returns {boolean}
 */
const isValidTemplate = (templateName) => {
    return Object.keys(templates).includes(templateName);
};

/**
 * ดึงรายชื่อ templates ทั้งหมด
 * @returns {Object}
 */
const getAvailableTemplates = () => {
    return TEMPLATE_NAMES;
};

module.exports = {
    templates,
    TEMPLATE_NAMES,
    isValidTemplate,
    getAvailableTemplates
};
