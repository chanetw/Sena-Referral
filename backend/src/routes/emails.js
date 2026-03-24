/**
 * Email Routes
 * API Routes สำหรับระบบอีเมล
 */

const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Emails
 *   description: Email management API
 */

/**
 * @swagger
 * /api/emails/templates:
 *   get:
 *     summary: ดูรายชื่อ templates ทั้งหมด
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายชื่อ templates
 */
router.get('/templates', authenticate, emailController.getTemplates);

/**
 * @swagger
 * /api/emails/verify-smtp:
 *   get:
 *     summary: ตรวจสอบการเชื่อมต่อ SMTP
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ผลการตรวจสอบการเชื่อมต่อ
 */
router.get('/verify-smtp', authenticate, emailController.verifySmtp);

/**
 * @swagger
 * /api/emails/stats:
 *   get:
 *     summary: ดูสถิติการส่งอีเมล
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สถิติการส่งอีเมล
 */
router.get('/stats', authenticate, emailController.getStats);

/**
 * @swagger
 * /api/emails/logs:
 *   get:
 *     summary: ดูประวัติการส่งอีเมล
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: จำนวนรายการที่ต้องการดู
 *     responses:
 *       200:
 *         description: ประวัติการส่งอีเมล
 */
router.get('/logs', authenticate, emailController.getLogs);

/**
 * @swagger
 * /api/emails/send:
 *   post:
 *     summary: ส่งอีเมลแบบกำหนดเอง
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - html
 *             properties:
 *               to:
 *                 type: string
 *                 example: user@example.com
 *               subject:
 *                 type: string
 *                 example: หัวข้ออีเมล
 *               html:
 *                 type: string
 *                 example: <h1>HTML Content</h1>
 *               text:
 *                 type: string
 *                 example: Plain text content
 *               recipientName:
 *                 type: string
 *                 example: คุณสมชาย
 *     responses:
 *       200:
 *         description: ส่งอีเมลสำเร็จ
 */
router.post('/send', authenticate, emailController.sendEmail);

/**
 * @swagger
 * /api/emails/send-template:
 *   post:
 *     summary: ส่งอีเมลด้วย template
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - template
 *             properties:
 *               to:
 *                 type: string
 *                 example: agent@example.com
 *               template:
 *                 type: string
 *                 enum: [FGF_Pass_1_owner, FGF_Pass_2_agent, FGF_NoPass_1_owner, FGF_NoPass_2_agent]
 *                 example: FGF_Pass_2_agent
 *               data:
 *                 type: object
 *                 properties:
 *                   refereeName:
 *                     type: string
 *                     example: คุณสมชาย ใจดี
 *                   customerName:
 *                     type: string
 *                     example: คุณกรรณิการ์ พวงผกา
 *               recipientName:
 *                 type: string
 *               cc:
 *                 type: string
 *               bcc:
 *                 type: string
 *     responses:
 *       200:
 *         description: ส่งอีเมลสำเร็จ
 */
router.post('/send-template', authenticate, emailController.sendTemplateEmail);

/**
 * @swagger
 * /api/emails/send-referral-result:
 *   post:
 *     summary: ส่งผลการอนุมัติ/ปฏิเสธลูกค้า
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - agentName
 *               - customerName
 *               - status
 *             properties:
 *               to:
 *                 type: string
 *                 example: agent@example.com
 *               agentName:
 *                 type: string
 *                 example: คุณสมชาย ใจดี
 *               customerName:
 *                 type: string
 *                 example: คุณกรรณิการ์ พวงผกา
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 example: approved
 *               reason:
 *                 type: string
 *                 enum: [condition, duplicate]
 *                 example: condition
 *               isSelfReferral:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: ส่งอีเมลสำเร็จ
 */
router.post('/send-referral-result', authenticate, emailController.sendReferralResult);

/**
 * @swagger
 * /api/emails/preview:
 *   post:
 *     summary: Preview template HTML
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - template
 *             properties:
 *               template:
 *                 type: string
 *                 example: FGF_Pass_2_agent
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: HTML preview
 */
router.post('/preview', authenticate, emailController.previewTemplate);

/**
 * @swagger
 * /api/emails/test:
 *   post:
 *     summary: ส่งอีเมลทดสอบ
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 example: test@example.com
 *               template:
 *                 type: string
 *                 example: FGF_Pass_2_agent
 *     responses:
 *       200:
 *         description: ส่งอีเมลทดสอบสำเร็จ
 */
router.post('/test', authenticate, emailController.sendTest);

module.exports = router;
