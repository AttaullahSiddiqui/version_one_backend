import nodemailer from 'nodemailer';
import { ENV } from '#config/index.js';

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: ENV.SMTP_HOST,
            port: ENV.SMTP_PORT,
            secure: ENV.SMTP_SECURE === 'true',
            auth: {
                user: ENV.SMTP_USER,
                pass: ENV.SMTP_PASSWORD
            }
        });
    }

    async sendEmail({ to, subject, templateName, templateData }) {
        try {
            const html = this.getEmailTemplate(templateName, templateData);

            const mailOptions = {
                from: `${ENV.APP_NAME} <${ENV.SMTP_FROM_EMAIL}>`,
                to,
                subject,
                html
            };

            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Email send error:', error);
            throw new Error('Email could not be sent');
        }
    }

    getEmailTemplate(templateName, data) {
        const templates = {
            welcome: this.getWelcomeTemplate(data),
            notification: this.getNotificationTemplate(data)
        };

        return templates[templateName] || this.getDefaultTemplate(data);
    }

    getDefaultTemplate(data) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${data.subject}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
                    border-radius: 15px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    padding: 25px 0;
                    border-bottom: 2px solid #e9ecef;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 24px;
                    font-weight: bold;
                    color: #2c3e50;
                    text-decoration: none;
                }
                .content {
                    padding: 0 30px;
                    color: #2c3e50;
                }
                .message {
                    font-size: 16px;
                    line-height: 1.8;
                    margin: 20px 0;
                }
                .cta-button {
                    display: inline-block;
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 25px;
                    font-weight: 500;
                    margin: 20px 0;
                    text-align: center;
                    transition: transform 0.2s;
                }
                .footer {
                    text-align: center;
                    padding-top: 30px;
                    margin-top: 30px;
                    border-top: 2px solid #e9ecef;
                    font-size: 14px;
                    color: #6c757d;
                }
                .social-links {
                    margin: 20px 0;
                }
                .social-links a {
                    margin: 0 10px;
                    color: #6c757d;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <a href="${ENV.APP_URL}" class="logo">${ENV.APP_NAME}</a>
                </div>
                <div class="content">
                    <div class="message">
                        ${data.message}
                    </div>
                    ${data.actionUrl ? `
                    <a href="${data.actionUrl}" class="cta-button">
                        ${data.actionText || 'Click Here'}
                    </a>
                    ` : ''}
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} ${ENV.APP_NAME}. All rights reserved.</p>
                    ${data.showSocial ? `
                    <div class="social-links">
                        <a href="${ENV.SOCIAL_FACEBOOK || '#'}">Facebook</a>
                        <a href="${ENV.SOCIAL_TWITTER || '#'}">Twitter</a>
                        <a href="${ENV.SOCIAL_INSTAGRAM || '#'}">Instagram</a>
                    </div>
                    ` : ''}
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

const emailService = new EmailService();
export default emailService;