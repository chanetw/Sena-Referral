/**
 * Email Controller
 * API endpoints สำหรับจัดการอีเมล
 */

const emailService = require('../services/emailService');
const { getAvailableTemplates, isValidTemplate } = require('../templates/referralTemplates');

class EmailController {
    /**
     * POST /api/emails/send-template
     * ส่งอีเมลด้วย template
     */
    async sendTemplateEmail(req, res) {
        try {
            const { 
                to, 
                template, 
                data, 
                recipientName,
                cc,
                bcc 
            } = req.body;

            // Validation
            if (!to || !template) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาระบุอีเมลผู้รับ (to) และ template'
                });
            }

            if (!isValidTemplate(template)) {
                return res.status(400).json({
                    success: false,
                    message: `Template ไม่ถูกต้อง: ${template}`,
                    availableTemplates: getAvailableTemplates()
                });
            }

            // Send email
            const result = await emailService.sendTemplateEmail({
                to,
                template,
                data: data || {},
                recipientName,
                cc,
                bcc
            });

            res.json({
                success: true,
                message: 'ส่งอีเมลสำเร็จ',
                data: result
            });

        } catch (error) {
            console.error('[EmailController] sendTemplateEmail error:', error);
            res.status(500).json({
                success: false,
                message: 'ส่งอีเมลไม่สำเร็จ',
                error: error.message
            });
        }
    }

    /**
     * POST /api/emails/send
     * ส่งอีเมลแบบกำหนดเอง (raw HTML)
     */
    async sendEmail(req, res) {
        try {
            const { 
                to, 
                subject, 
                html, 
                text,
                recipientName,
                attachments 
            } = req.body;

            // Validation
            if (!to || !subject || !html) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาระบุ to, subject และ html'
                });
            }

            const result = await emailService.sendEmail({
                to,
                subject,
                html,
                text,
                recipientName,
                attachments
            });

            res.json({
                success: true,
                message: 'ส่งอีเมลสำเร็จ',
                data: result
            });

        } catch (error) {
            console.error('[EmailController] sendEmail error:', error);
            res.status(500).json({
                success: false,
                message: 'ส่งอีเมลไม่สำเร็จ',
                error: error.message
            });
        }
    }

    /**
     * POST /api/emails/send-referral-result
     * ส่งผลการอนุมัติ/ปฏิเสธลูกค้า
     */
    async sendReferralResult(req, res) {
        try {
            const {
                to,
                agentName,
                customerName,
                status,
                reason,
                isSelfReferral
            } = req.body;

            // Validation
            if (!to || !agentName || !customerName || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาระบุ to, agentName, customerName และ status (approved/rejected)'
                });
            }

            if (!['approved', 'rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'status ต้องเป็น approved หรือ rejected'
                });
            }

            const result = await emailService.sendReferralResult({
                to,
                agentName,
                customerName,
                status,
                reason,
                isSelfReferral
            });

            res.json({
                success: true,
                message: `ส่งอีเมลแจ้งผล ${status === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'} สำเร็จ`,
                data: result
            });

        } catch (error) {
            console.error('[EmailController] sendReferralResult error:', error);
            res.status(500).json({
                success: false,
                message: 'ส่งอีเมลไม่สำเร็จ',
                error: error.message
            });
        }
    }

    /**
     * GET /api/emails/verify-smtp
     * ตรวจสอบการเชื่อมต่อ SMTP
     */
    async verifySmtp(req, res) {
        try {
            const result = await emailService.verifyConnection();
            
            res.json({
                success: result.success,
                message: result.success ? 'เชื่อมต่อ SMTP สำเร็จ' : 'เชื่อมต่อ SMTP ไม่สำเร็จ',
                data: result
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'ตรวจสอบการเชื่อมต่อไม่สำเร็จ',
                error: error.message
            });
        }
    }

    /**
     * GET /api/emails/templates
     * ดูรายชื่อ templates ทั้งหมด
     */
    async getTemplates(req, res) {
        res.json({
            success: true,
            data: {
                templates: getAvailableTemplates()
            }
        });
    }

    /**
     * POST /api/emails/preview
     * Preview template HTML
     */
    async previewTemplate(req, res) {
        try {
            const { template, data } = req.body;

            if (!template) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาระบุ template'
                });
            }

            if (!isValidTemplate(template)) {
                return res.status(400).json({
                    success: false,
                    message: `Template ไม่ถูกต้อง: ${template}`,
                    availableTemplates: getAvailableTemplates()
                });
            }

            const { templates } = require('../templates/referralTemplates');
            const html = templates[template](data || {});

            res.json({
                success: true,
                data: { html }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'สร้าง preview ไม่สำเร็จ',
                error: error.message
            });
        }
    }

    /**
     * GET /api/emails/stats
     * ดูสถิติการส่งอีเมล
     */
    async getStats(req, res) {
        try {
            const stats = await emailService.getStats();
            
            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'ดึงสถิติไม่สำเร็จ',
                error: error.message
            });
        }
    }

    /**
     * GET /api/emails/logs
     * ดูประวัติการส่งอีเมล
     */
    async getLogs(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const logs = await emailService.getRecentLogs(limit);

            // Parse JSON data in logs
            const parsedLogs = logs.map(log => ({
                ...log,
                data: log.data ? JSON.parse(log.data) : null
            }));

            res.json({
                success: true,
                data: {
                    count: parsedLogs.length,
                    logs: parsedLogs
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'ดึงประวัติไม่สำเร็จ',
                error: error.message
            });
        }
    }

    /**
     * POST /api/emails/test
     * ส่งอีเมลทดสอบ
     */
    async sendTest(req, res) {
        try {
            const { to, template = 'FGF_Pass_2_agent' } = req.body;

            if (!to) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาระบุอีเมลผู้รับ (to)'
                });
            }

            const result = await emailService.sendTemplateEmail({
                to,
                template,
                data: {
                    refereeName: 'คุณทดสอบ ระบบ',
                    customerName: 'คุณกรรณิการ์ พวงผกา'
                },
                recipientName: 'คุณทดสอบ ระบบ'
            });

            res.json({
                success: true,
                message: 'ส่งอีเมลทดสอบสำเร็จ',
                data: result
            });

        } catch (error) {
            console.error('[EmailController] sendTest error:', error);
            res.status(500).json({
                success: false,
                message: 'ส่งอีเมลทดสอบไม่สำเร็จ',
                error: error.message
            });
        }
    }
}

module.exports = new EmailController();
