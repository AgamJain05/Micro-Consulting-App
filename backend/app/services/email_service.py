"""
Email Service - Handles email notifications
"""
import logging
from typing import Optional, List
from pathlib import Path
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings

logger = logging.getLogger(__name__)

# Email templates directory
TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "email"


class EmailService:
    """Service for sending email notifications"""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.EMAILS_FROM_EMAIL
        self.from_name = settings.EMAILS_FROM_NAME
        
        # Setup Jinja2 for email templates
        if TEMPLATES_DIR.exists():
            self.jinja_env = Environment(
                loader=FileSystemLoader(str(TEMPLATES_DIR)),
                autoescape=select_autoescape(['html', 'xml'])
            )
        else:
            self.jinja_env = None
            logger.warning(f"Email templates directory not found: {TEMPLATES_DIR}")
    
    @property
    def is_configured(self) -> bool:
        """Check if email is properly configured"""
        return bool(self.smtp_user and self.smtp_password)
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send an email"""
        if not self.is_configured:
            logger.warning("Email not configured. Skipping send.")
            return False
        
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            
            # Add plain text version
            if text_content:
                message.attach(MIMEText(text_content, "plain"))
            
            # Add HTML version
            message.attach(MIMEText(html_content, "html"))
            
            # Send email
            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_user,
                password=self.smtp_password,
                start_tls=True
            )
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    def _render_template(self, template_name: str, **context) -> str:
        """Render an email template"""
        if not self.jinja_env:
            # Fallback to basic HTML
            return self._get_fallback_html(template_name, **context)
        
        try:
            template = self.jinja_env.get_template(f"{template_name}.html")
            return template.render(**context)
        except Exception as e:
            logger.error(f"Template rendering failed: {e}")
            return self._get_fallback_html(template_name, **context)
    
    def _get_fallback_html(self, template_name: str, **context) -> str:
        """Generate fallback HTML when template is not available"""
        base_style = """
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9fafb; }
                .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; margin: 10px 0; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
        """
        return f"<html><head>{base_style}</head><body><div class='container'>{context.get('body', '')}</div></body></html>"
    
    # Specific notification methods
    
    async def send_session_request_notification(
        self,
        consultant_email: str,
        consultant_name: str,
        client_name: str,
        topic: str,
        session_id: str
    ) -> bool:
        """Notify consultant about new session request"""
        subject = f"New Session Request: {topic}"
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; }}
                .highlight {{ background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; }}
                .button {{ display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 8px; font-weight: bold; }}
                .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 New Session Request</h1>
                </div>
                <div class="content">
                    <p>Hi {consultant_name},</p>
                    <p>Great news! You have a new consultation request.</p>
                    
                    <div class="highlight">
                        <strong>Client:</strong> {client_name}<br>
                        <strong>Topic:</strong> {topic}
                    </div>
                    
                    <p>Log in to your dashboard to accept or decline this request.</p>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:5173/my-sessions" class="button">View Request</a>
                    </p>
                    
                    <p>Best,<br>The MicroConsult Team</p>
                </div>
                <div class="footer">
                    <p>© 2026 MicroConsult. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(consultant_email, subject, html_content)
    
    async def send_session_accepted_notification(
        self,
        client_email: str,
        client_name: str,
        consultant_name: str,
        topic: str,
        session_id: str
    ) -> bool:
        """Notify client that session was accepted"""
        subject = f"Session Accepted: {topic}"
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; }}
                .highlight {{ background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }}
                .button {{ display: inline-block; background: #10b981; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 8px; font-weight: bold; }}
                .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Session Accepted!</h1>
                </div>
                <div class="content">
                    <p>Hi {client_name},</p>
                    <p>Great news! Your consultation request has been accepted.</p>
                    
                    <div class="highlight">
                        <strong>Consultant:</strong> {consultant_name}<br>
                        <strong>Topic:</strong> {topic}
                    </div>
                    
                    <p>You can now join the session room to start your consultation.</p>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:5173/session/{session_id}" class="button">Join Session</a>
                    </p>
                    
                    <p>Best,<br>The MicroConsult Team</p>
                </div>
                <div class="footer">
                    <p>© 2026 MicroConsult. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(client_email, subject, html_content)
    
    async def send_session_rejected_notification(
        self,
        client_email: str,
        client_name: str,
        consultant_name: str,
        topic: str
    ) -> bool:
        """Notify client that session was rejected"""
        subject = f"Session Update: {topic}"
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #6b7280; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; }}
                .button {{ display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 8px; font-weight: bold; }}
                .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Session Update</h1>
                </div>
                <div class="content">
                    <p>Hi {client_name},</p>
                    <p>Unfortunately, {consultant_name} is unable to accept your session request at this time.</p>
                    <p>Don't worry - there are many other great consultants available!</p>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:5173/consultants" class="button">Find Another Expert</a>
                    </p>
                    
                    <p>Best,<br>The MicroConsult Team</p>
                </div>
                <div class="footer">
                    <p>© 2026 MicroConsult. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(client_email, subject, html_content)
    
    async def send_session_reminder(
        self,
        email: str,
        name: str,
        other_party_name: str,
        topic: str,
        scheduled_time: str,
        session_id: str
    ) -> bool:
        """Send reminder for scheduled session"""
        subject = f"Reminder: Upcoming Session - {topic}"
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; }}
                .highlight {{ background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }}
                .button {{ display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 8px; font-weight: bold; }}
                .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⏰ Session Reminder</h1>
                </div>
                <div class="content">
                    <p>Hi {name},</p>
                    <p>This is a reminder about your upcoming consultation.</p>
                    
                    <div class="highlight">
                        <strong>With:</strong> {other_party_name}<br>
                        <strong>Topic:</strong> {topic}<br>
                        <strong>Scheduled:</strong> {scheduled_time}
                    </div>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:5173/session/{session_id}" class="button">Join Session</a>
                    </p>
                    
                    <p>Best,<br>The MicroConsult Team</p>
                </div>
                <div class="footer">
                    <p>© 2026 MicroConsult. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(email, subject, html_content)
    
    async def send_session_completed_notification(
        self,
        email: str,
        name: str,
        other_party_name: str,
        topic: str,
        duration_minutes: int,
        total_cost: float,
        is_client: bool,
        session_id: str
    ) -> bool:
        """Notify about completed session"""
        subject = f"Session Completed: {topic}"
        
        cost_text = f"Total Cost: ${total_cost:.2f}" if is_client else f"Earnings: ${total_cost:.2f}"
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; }}
                .stats {{ display: flex; justify-content: space-around; margin: 20px 0; }}
                .stat {{ text-align: center; padding: 15px; }}
                .stat-value {{ font-size: 24px; font-weight: bold; color: #10b981; }}
                .button {{ display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 8px; font-weight: bold; }}
                .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Session Completed!</h1>
                </div>
                <div class="content">
                    <p>Hi {name},</p>
                    <p>Your consultation session has been completed successfully.</p>
                    
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>With:</strong> {other_party_name}</p>
                        <p><strong>Topic:</strong> {topic}</p>
                        <p><strong>Duration:</strong> {duration_minutes} minutes</p>
                        <p><strong>{cost_text}</strong></p>
                    </div>
                    
                    {"<p>We'd love to hear your feedback! Please take a moment to leave a review.</p>" if is_client else ""}
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:5173/my-sessions" class="button">
                            {"Leave a Review" if is_client else "View Dashboard"}
                        </a>
                    </p>
                    
                    <p>Thank you for using MicroConsult!</p>
                    <p>Best,<br>The MicroConsult Team</p>
                </div>
                <div class="footer">
                    <p>© 2026 MicroConsult. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(email, subject, html_content)


# Singleton instance
email_service = EmailService()
