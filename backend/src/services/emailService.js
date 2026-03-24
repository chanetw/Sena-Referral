/**
 * Email Service
 * ระบบส่งอีเมลสำหรับ SENA Referral System
 * 
 * SMTP Configuration: SENA (smtp.sena.co.th)
 * Support: 100 emails/day (estimated limit for shared hosting)
 */

const nodemailer = require('nodemailer');
const { templates, isValidTemplate } = require('../templates/referralTemplates');

class EmailService {
    constructor() {
        this.transporter = null;
        this.db = null; // Sequelize instance
        this.initTransporter();
    }

    /**
     * Initialize Nodemailer Transporter
     */
    initTransporter() {
        const config = {
            host: process.env.MAIL_HOST || 'smtp.sena.co.th',
            port: parseInt(process.env.MAIL_PORT) || 587,
            secure: false, // true for 465, false for other ports (587)
            auth: {
                user: process.env.MAIL_USERNAME || 'pridesena@sena.co.th',
                pass: process.env.MAIL_PASSWORD || '',
            },
            tls: {
                rejectUnauthorized: false,
                ciphers: 'SSLv3'
            },
            pool: true, // Use pooled connections
            maxConnections: 5,
            maxMessages: 100,
            rateDelta: 1000,
            rateLimit: 5 // Max 5 messages per second
        };

        this.transporter = nodemailer.createTransport(config);
        
        // Verify connection on startup
        this.verifyConnection().catch(err => {
            console.error('[EmailService] SMTP Connection failed:', err.message);
        });
    }

    /**
     * Set database instance for logging
     * @param {Object} sequelize - Sequelize instance
     */
    setDatabase(sequelize) {
        this.db = sequelize;
    }

    /**
     * Verify SMTP Connection
     * @returns {Promise<Object>}
     */
    async verifyConnection() {
        try {
            const result = await this.transporter.verify();
            return {
                success: true,
                message: 'SMTP connection verified successfully',
                host: process.env.MAIL_HOST,
                port: process.env.MAIL_PORT
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                host: process.env.MAIL_HOST,
                port: process.env.MAIL_PORT
            };
        }
    }

    /**
     * Send Email with Template
     * 
     * @param {Object} options
     * @param {string} options.to - Recipient email
     * @param {string} options.template - Template name (e.g., 'FGF_Pass_1_owner')
     * @param {Object} options.data - Template data { refereeName, customerName }
     * @param {string} options.recipientName - Recipient name for logging
     * @param {string} options.cc - CC email(s)
     * @param {string} options.bcc - BCC email(s)
     * @param {Array} options.attachments - Array of attachment objects
     * 
     * @returns {Promise<Object>}
     */
    async sendTemplateEmail(options) {
        let { to, template, data, recipientName, cc, bcc, attachments = [] } = options;

        // Validate template
        if (!isValidTemplate(template)) {
            throw new Error(`Invalid template: ${template}. Available: ${Object.keys(templates).join(', ')}`);
        }

        // Check test mode - override recipient for safety
        const testModeRecipient = process.env.MAIL_TEST_MODE_RECIPIENT;
        let actualRecipient = to;
        let isTestMode = false;
        
        if (testModeRecipient && testModeRecipient.trim() !== '') {
            actualRecipient = testModeRecipient;
            isTestMode = true;
            console.log(`[EmailService] TEST MODE: Redirecting email from ${to} to ${testModeRecipient}`);
        }

        // Generate HTML from template
        const html = templates[template](data);
        const subject = this.getSubjectByTemplate(template) + (isTestMode ? ' [TEST]' : '');

        // Create log entry
        const logId = await this.createLog({
            recipientEmail: actualRecipient,
            recipientName: recipientName || data.refereeName,
            templateName: template,
            subject,
            data: { ...data, originalRecipient: to, isTestMode },
            status: 'pending'
        });

        try {
            // Send email (use actualRecipient which may be test mode override)
            const result = await this.transporter.sendMail({
                from: `"${process.env.MAIL_FROM_NAME || 'SENA HAPPY REFER'}" <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME}>`,
                to: actualRecipient,
                cc: isTestMode ? undefined : cc,  // Don't CC in test mode
                bcc: isTestMode ? undefined : bcc, // Don't BCC in test mode
                subject,
                html,
                attachments
            });

            // Update log to success
            await this.updateLog(logId, {
                status: 'sent',
                sentAt: new Date(),
                messageId: result.messageId
            });

            return {
                success: true,
                messageId: result.messageId,
                logId,
                to: actualRecipient,
                originalRecipient: to,
                isTestMode,
                template,
                subject
            };

        } catch (error) {
            // Update log to failed
            await this.updateLog(logId, {
                status: 'failed',
                errorMessage: error.message
            });

            throw error;
        }
    }

    /**
     * Send Raw Email (without template)
     * 
     * @param {Object} options
     * @param {string} options.to - Recipient email
     * @param {string} options.subject - Email subject
     * @param {string} options.html - HTML content
     * @param {string} options.text - Plain text content (fallback)
     * @param {string} options.recipientName - Recipient name for logging
     * @param {string} options.templateName - Template name for logging
     * @param {Object} options.data - Data for logging
     * @param {Array} options.attachments - Attachments
     * 
     * @returns {Promise<Object>}
     */
    async sendEmail(options) {
        let { 
            to, 
            subject, 
            html, 
            text, 
            recipientName, 
            templateName = 'custom', 
            data = {},
            attachments = [] 
        } = options;

        // Check test mode - override recipient for safety
        const testModeRecipient = process.env.MAIL_TEST_MODE_RECIPIENT;
        let actualRecipient = to;
        let isTestMode = false;
        
        if (testModeRecipient && testModeRecipient.trim() !== '') {
            actualRecipient = testModeRecipient;
            isTestMode = true;
            console.log(`[EmailService] TEST MODE: Redirecting email from ${to} to ${testModeRecipient}`);
        }

        // Add [TEST] prefix to subject in test mode
        if (isTestMode) {
            subject = subject + ' [TEST]';
        }

        // Create log entry
        const logId = await this.createLog({
            recipientEmail: actualRecipient,
            recipientName,
            templateName,
            subject,
            data: { ...data, originalRecipient: to, isTestMode },
            status: 'pending'
        });

        try {
            const result = await this.transporter.sendMail({
                from: `"${process.env.MAIL_FROM_NAME || 'SENA HAPPY REFER'}" <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME}>`,
                to: actualRecipient,
                subject,
                html,
                text,
                attachments
            });

            await this.updateLog(logId, {
                status: 'sent',
                sentAt: new Date(),
                messageId: result.messageId
            });

            return {
                success: true,
                messageId: result.messageId,
                logId,
                to: actualRecipient,
                originalRecipient: to,
                isTestMode,
                subject
            };

        } catch (error) {
            await this.updateLog(logId, {
                status: 'failed',
                errorMessage: error.message
            });

            throw error;
        }
    }

    /**
     * Send Referral Result Email
     * Helper method สำหรับส่งผลการอนุมัติ/ปฏิเสธลูกค้า
     * 
     * @param {Object} options
     * @param {string} options.to - Agent email
     * @param {string} options.agentName - Agent name
     * @param {string} options.customerName - Customer name
     * @param {string} options.status - 'approved' | 'rejected'
     * @param {string} options.reason - 'condition' | 'duplicate' (for rejected)
     * @param {boolean} options.isSelfReferral - Is self-referral?
     * 
     * @returns {Promise<Object>}
     */
    async sendReferralResult(options) {
        const { 
            to, 
            agentName, 
            customerName, 
            status, 
            reason = 'condition',
            isSelfReferral = false 
        } = options;

        // Determine template based on status and type
        let template;
        if (status === 'approved') {
            template = isSelfReferral ? 'FGF_Pass_1_owner' : 'FGF_Pass_2_agent';
        } else {
            template = isSelfReferral ? 'FGF_NoPass_1_owner' : 'FGF_NoPass_2_agent';
        }

        return this.sendTemplateEmail({
            to,
            template,
            data: {
                refereeName: agentName,
                customerName
            },
            recipientName: agentName
        });
    }

    /**
     * Create email log entry
     * @private
     */
    async createLog(logData) {
        if (!this.db) {
            console.warn('[EmailService] Database not set, skipping log');
            return null;
        }

        try {
            const [result] = await this.db.query(
                `INSERT INTO email_logs 
                (recipient_email, recipient_name, template_name, subject, status, data, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                {
                    replacements: [
                        logData.recipientEmail ?? null,
                        logData.recipientName ?? null,
                        logData.templateName ?? 'custom',
                        logData.subject ?? '',
                        logData.status ?? 'pending',
                        JSON.stringify(logData.data ?? {})
                    ]
                }
            );
            return result;
        } catch (error) {
            console.error('[EmailService] Failed to create log:', error.message);
            return null;
        }
    }

    /**
     * Update email log entry
     * @private
     */
    async updateLog(logId, updateData) {
        if (!this.db || !logId) return;

        try {
            const updates = [];
            const values = [];

            if (updateData.status) {
                updates.push('status = ?');
                values.push(updateData.status);
            }
            if (updateData.sentAt) {
                updates.push('sent_at = ?');
                values.push(updateData.sentAt);
            }
            if (updateData.errorMessage) {
                updates.push('error_message = ?');
                values.push(updateData.errorMessage);
            }

            if (updates.length > 0) {
                values.push(logId);
                await this.db.query(
                    `UPDATE email_logs SET ${updates.join(', ')} WHERE id = ?`,
                    { replacements: values }
                );
            }
        } catch (error) {
            console.error('[EmailService] Failed to update log:', error.message);
        }
    }

    /**
     * Get email subject by template
     * @private
     */
    getSubjectByTemplate(template) {
        const subjects = {
            FGF_Pass_1_owner: 'ยืนยันการได้รับสิทธิ์ SENA HAPPY REFER (แนะนำตัวเอง)',
            FGF_Pass_2_agent: 'ยืนยันการได้รับสิทธิ์ SENA HAPPY REFER',
            FGF_NoPass_1_owner: 'แจ้งผลการไม่ได้รับสิทธิ์ SENA HAPPY REFER (แนะนำตัวเอง)',
            FGF_NoPass_2_agent: 'แจ้งผลการไม่ได้รับสิทธิ์ SENA HAPPY REFER'
        };
        return subjects[template] || 'แจ้งผลการเข้าร่วมกิจกรรม SENA HAPPY REFER';
    }

    /**
     * Get email statistics
     * @returns {Promise<Object>}
     */
    async getStats() {
        if (!this.db) {
            return { error: 'Database not connected' };
        }

        try {
            const [results] = await this.db.query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM email_logs
                GROUP BY status
            `);

            const stats = {
                total: 0,
                sent: 0,
                failed: 0,
                pending: 0
            };

            results.forEach(row => {
                stats[row.status] = parseInt(row.count);
                stats.total += parseInt(row.count);
            });

            return stats;
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Get recent email logs
     * @param {number} limit - Number of logs to return
     * @returns {Promise<Array>}
     */
    async getRecentLogs(limit = 50) {
        if (!this.db) {
            return [];
        }

        try {
            const [results] = await this.db.query(
                `SELECT * FROM email_logs ORDER BY created_at DESC LIMIT ?`,
                { replacements: [limit] }
            );
            return results;
        } catch (error) {
            return [];
        }
    }

    /**
     * Get test mode status
     * @returns {Object} Test mode configuration
     */
    getTestModeStatus() {
        const testModeRecipient = process.env.MAIL_TEST_MODE_RECIPIENT;
        const isTestMode = !!(testModeRecipient && testModeRecipient.trim() !== '');
        
        return {
            isTestMode,
            testRecipient: isTestMode ? testModeRecipient : null,
            message: isTestMode 
                ? `TEST MODE: All emails will be sent to ${testModeRecipient}` 
                : 'PRODUCTION MODE: Emails will be sent to actual recipients'
        };
    }
}

// Export singleton instance
module.exports = new EmailService();
