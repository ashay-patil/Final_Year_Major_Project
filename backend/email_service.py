import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
from dotenv import load_dotenv
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

load_dotenv()

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_APP_PASSWORD")

def create_discharge_pdf(patient, summary, prescription, bill):
    """Create a professional hospital discharge PDF"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=40, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=5,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#666666'),
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=13,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#333333'),
        leading=14,
        alignment=TA_JUSTIFY
    )
    
    story = []
    
    # Hospital Header
    story.append(Paragraph("ST. JUDE'S MEDICAL CENTER", title_style))
    story.append(Paragraph("123 Medical Plaza, Healthcare District, Mumbai - 400001", subtitle_style))
    story.append(Paragraph("Phone: +91-22-2345-6789 | Email: info@stjudes.com | www.stjudes.com", subtitle_style))
    
    # Horizontal line
    story.append(Spacer(1, 0.1*inch))
    line_table = Table([['']], colWidths=[7*inch])
    line_table.setStyle(TableStyle([('LINEABOVE', (0,0), (-1,0), 1, colors.HexColor('#cccccc'))]))
    story.append(line_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Document title
    story.append(Paragraph("DISCHARGE SUMMARY", heading_style))
    story.append(Spacer(1, 0.1*inch))
    
    # Patient Information Table
    patient_data = [
        ['Patient Name:', patient['name'], 'Patient ID:', patient['patient_id']],
        ['Age:', f"{patient['age']} years", 'Gender:', 'Male'],
        ['Diagnosis:', patient['diagnosis'], '', ''],
        ['Admission Date:', patient['admission_date'], 'Discharge Date:', bill['discharge_date']],
    ]
    
    patient_table = Table(patient_data, colWidths=[1.3*inch, 2*inch, 1.3*inch, 2*inch])
    patient_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(patient_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Medical Summary
    story.append(Paragraph("CLINICAL SUMMARY", heading_style))
    summary_lines = summary.split('\n')
    for line in summary_lines:
        if line.strip():
            story.append(Paragraph(line.strip(), body_style))
            story.append(Spacer(1, 0.05*inch))
    story.append(Spacer(1, 0.1*inch))
    
    # Prescription
    story.append(Paragraph("PRESCRIPTION", heading_style))
    prescription_lines = prescription.split('\n')
    for line in prescription_lines:
        if line.strip():
            story.append(Paragraph(line.strip(), body_style))
            story.append(Spacer(1, 0.05*inch))
    story.append(Spacer(1, 0.2*inch))
    
    # Billing Information
    story.append(Paragraph("FINANCIAL SUMMARY", heading_style))
    
    bill_data = [
        ['DESCRIPTION', 'AMOUNT (₹)'],
        ['Room Charges', f"{bill['breakdown']['room_charges']:,.2f}"],
        ['Doctor Consultation', f"{bill['breakdown']['doctor_charges']:,.2f}"],
        ['Nursing Care', f"{bill['breakdown'].get('nursing_charges', 0):,.2f}"],
        ['Pharmacy & Medications', f"{bill['breakdown']['prescription_cost']:,.2f}"],
    ]
    
    if bill['breakdown'].get('additional_charges', 0) > 0:
        bill_data.append(['Medical Procedures & Diagnostics', f"{bill['breakdown']['additional_charges']:,.2f}"])
    
    bill_data.extend([
        ['Subtotal', f"{bill['breakdown'].get('subtotal', 0):,.2f}"],
        ['GST (18%)', f"{bill['breakdown'].get('gst_18_percent', 0):,.2f}"],
        ['TOTAL PAYABLE', f"{bill['total_amount']:,.2f}"],
    ])
    
    bill_table = Table(bill_data, colWidths=[5*inch, 2*inch])
    bill_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#333333')),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 1), (-1, -2), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, -3), (-1, -3), 1, colors.HexColor('#cccccc')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 11),
        ('LINEABOVE', (0, -1), (-1, -1), 1.5, colors.HexColor('#333333')),
    ]))
    story.append(bill_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#666666'),
        alignment=TA_CENTER
    )
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("This is a computer-generated document. For any queries, please contact our billing department.", footer_style))
    story.append(Paragraph("Payment is due within 7 days. We accept cash, card, and online transfers.", footer_style))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Thank you for choosing St. Jude's Medical Center for your healthcare needs.", footer_style))
    
    doc.build(story)
    buffer.seek(0)
    return buffer

def send_email_with_attachment(to_email, subject, html_body, pdf_buffer=None, pdf_filename="document.pdf"):
    """Send email with PDF attachment"""
    try:
        msg = MIMEMultipart('mixed')
        msg['From'] = f"St. Jude's Medical Center <{SENDER_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Attach HTML body
        html_part = MIMEText(html_body, 'html')
        msg.attach(html_part)
        
        # Attach PDF if provided
        if pdf_buffer:
            pdf_attachment = MIMEBase('application', 'pdf')
            pdf_attachment.set_payload(pdf_buffer.read())
            encoders.encode_base64(pdf_attachment)
            pdf_attachment.add_header('Content-Disposition', f'attachment; filename={pdf_filename}')
            msg.attach(pdf_attachment)
        
        # Send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")
        return False

def send_email(to_email, subject, html_body):
    """Send simple email without attachment"""
    return send_email_with_attachment(to_email, subject, html_body, None)

def send_nurse_notification(nurse_email, patient):
    """Send notification to nurse when doctor approves patient for discharge"""
    subject = f"Patient Discharge Approval - {patient['name']} (ID: {patient['patient_id']})"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
            }}
            .email-container {{
                max-width: 650px;
                margin: 0 auto;
                background-color: #ffffff;
            }}
            .header {{
                background-color: #ffffff;
                padding: 30px 40px 20px 40px;
                border-bottom: 3px solid #2c3e50;
            }}
            .hospital-name {{
                font-size: 24px;
                font-weight: 600;
                color: #2c3e50;
                margin: 0 0 5px 0;
            }}
            .hospital-tagline {{
                font-size: 12px;
                color: #7f8c8d;
                margin: 0;
            }}
            .content {{
                padding: 30px 40px;
            }}
            .greeting {{
                font-size: 15px;
                margin-bottom: 20px;
                color: #2c3e50;
            }}
            .message {{
                font-size: 14px;
                margin-bottom: 25px;
                line-height: 1.6;
            }}
            .patient-details {{
                background-color: #f8f9fa;
                border-left: 4px solid #3498db;
                padding: 20px;
                margin: 25px 0;
            }}
            .patient-details h3 {{
                margin: 0 0 15px 0;
                font-size: 16px;
                color: #2c3e50;
            }}
            .detail-row {{
                display: flex;
                margin-bottom: 8px;
                font-size: 14px;
            }}
            .detail-label {{
                font-weight: 600;
                width: 160px;
                color: #555;
            }}
            .detail-value {{
                color: #333;
            }}
            .vitals-section {{
                margin-top: 20px;
            }}
            .vitals-grid {{
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                margin-top: 10px;
            }}
            .vital-item {{
                background-color: #ffffff;
                padding: 10px;
                border: 1px solid #e0e0e0;
            }}
            .vital-label {{
                font-size: 11px;
                color: #7f8c8d;
                text-transform: uppercase;
                margin-bottom: 3px;
            }}
            .vital-value {{
                font-size: 15px;
                font-weight: 600;
                color: #2c3e50;
            }}
            .action-required {{
                background-color: #fff9e6;
                border-left: 4px solid #f39c12;
                padding: 15px;
                margin: 20px 0;
            }}
            .action-required p {{
                margin: 5px 0;
                font-size: 14px;
            }}
            .footer {{
                background-color: #f8f9fa;
                padding: 20px 40px;
                border-top: 1px solid #e0e0e0;
                text-align: center;
            }}
            .footer p {{
                margin: 5px 0;
                font-size: 12px;
                color: #7f8c8d;
            }}
            .contact-info {{
                font-size: 11px;
                color: #95a5a6;
                margin-top: 15px;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1 class="hospital-name">St. Jude's Medical Center</h1>
                <p class="hospital-tagline">Excellence in Healthcare Since 1975</p>
            </div>
            
            <div class="content">
                <p class="greeting">Dear Nursing Staff,</p>
                
                <div class="message">
                    <p>This is to inform you that the following patient has been approved for discharge by the attending physician. Please proceed with the discharge preparation checklist at your earliest convenience.</p>
                </div>
                
                <div class="patient-details">
                    <h3>Patient Information</h3>
                    <div class="detail-row">
                        <span class="detail-label">Patient Name:</span>
                        <span class="detail-value">{patient['name']}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Patient ID:</span>
                        <span class="detail-value">{patient['patient_id']}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Age:</span>
                        <span class="detail-value">{patient['age']} years</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Diagnosis:</span>
                        <span class="detail-value">{patient['diagnosis']}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Admission Date:</span>
                        <span class="detail-value">{patient['admission_date']}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Treatment Status:</span>
                        <span class="detail-value">{patient['treatment_status']}</span>
                    </div>
                    
                    <div class="vitals-section">
                        <p style="margin: 15px 0 5px 0; font-weight: 600; color: #2c3e50;">Current Vital Signs:</p>
                        <div class="vitals-grid">
                            <div class="vital-item">
                                <div class="vital-label">Blood Pressure</div>
                                <div class="vital-value">{patient['vital_signs']['blood_pressure']}</div>
                            </div>
                            <div class="vital-item">
                                <div class="vital-label">Heart Rate</div>
                                <div class="vital-value">{patient['vital_signs']['heart_rate']} bpm</div>
                            </div>
                            <div class="vital-item">
                                <div class="vital-label">Temperature</div>
                                <div class="vital-value">{patient['vital_signs']['temperature']}°F</div>
                            </div>
                            <div class="vital-item">
                                <div class="vital-label">Oxygen Saturation</div>
                                <div class="vital-value">{patient['vital_signs']['oxygen_saturation']}%</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="action-required">
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #e67e22;">Action Required:</p>
                    <p style="margin: 5px 0;">1. Complete discharge preparation checklist</p>
                    <p style="margin: 5px 0;">2. Review and verify all discharge documentation</p>
                    <p style="margin: 5px 0;">3. Coordinate with pharmacy for discharge medications</p>
                    <p style="margin: 5px 0;">4. Update patient records in the system</p>
                </div>
                
                <p style="font-size: 13px; color: #555; margin-top: 25px;">
                    Please log in to the MediFlow AI system to access the complete discharge checklist and patient records.
                </p>
            </div>
            
            <div class="footer">
                <p><strong>St. Jude's Medical Center</strong></p>
                <p>123 Medical Plaza, Healthcare District, Mumbai - 400001</p>
                <div class="contact-info">
                    <p>Phone: +91-22-2345-6789 | Email: info@stjudes.com</p>
                    <p>This is an automated notification from MediFlow AI Hospital Management System</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(nurse_email, subject, html_body)

def send_discharge_summary_to_guardian(guardian_email, patient, summary, prescription, bill):
    """Send complete discharge package to patient's guardian"""
    subject = f"Discharge Summary and Documentation - {patient['name']} (ID: {patient['patient_id']})"
    
    # Create PDF
    pdf_buffer = create_discharge_pdf(patient, summary, prescription, bill)
    pdf_filename = f"Discharge_Summary_{patient['patient_id']}.pdf"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
            }}
            .email-container {{
                max-width: 650px;
                margin: 0 auto;
                background-color: #ffffff;
            }}
            .header {{
                background-color: #ffffff;
                padding: 30px 40px 20px 40px;
                border-bottom: 3px solid #2c3e50;
            }}
            .hospital-name {{
                font-size: 24px;
                font-weight: 600;
                color: #2c3e50;
                margin: 0 0 5px 0;
            }}
            .hospital-tagline {{
                font-size: 12px;
                color: #7f8c8d;
                margin: 0;
            }}
            .content {{
                padding: 30px 40px;
            }}
            .greeting {{
                font-size: 15px;
                margin-bottom: 20px;
                color: #2c3e50;
            }}
            .message {{
                font-size: 14px;
                margin-bottom: 20px;
                line-height: 1.6;
            }}
            .discharge-info {{
                background-color: #e8f5e9;
                border-left: 4px solid #27ae60;
                padding: 20px;
                margin: 25px 0;
            }}
            .discharge-info h3 {{
                margin: 0 0 15px 0;
                font-size: 16px;
                color: #27ae60;
            }}
            .attachment-notice {{
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 20px;
                margin: 25px 0;
            }}
            .attachment-notice p {{
                margin: 8px 0;
                font-size: 14px;
            }}
            .document-list {{
                margin: 15px 0 0 20px;
                padding: 0;
            }}
            .document-list li {{
                margin: 8px 0;
                font-size: 14px;
            }}
            .info-section {{
                margin: 25px 0;
            }}
            .info-section h3 {{
                font-size: 15px;
                color: #2c3e50;
                margin: 0 0 12px 0;
                font-weight: 600;
            }}
            .info-section ul {{
                margin: 0;
                padding-left: 20px;
            }}
            .info-section li {{
                margin: 8px 0;
                font-size: 14px;
                line-height: 1.5;
            }}
            .contact-box {{
                background-color: #f8f9fa;
                padding: 20px;
                margin: 25px 0;
                border: 1px solid #e0e0e0;
            }}
            .contact-box h3 {{
                margin: 0 0 12px 0;
                font-size: 15px;
                color: #2c3e50;
            }}
            .contact-box p {{
                margin: 5px 0;
                font-size: 14px;
            }}
            .footer {{
                background-color: #f8f9fa;
                padding: 20px 40px;
                border-top: 1px solid #e0e0e0;
                text-align: center;
            }}
            .footer p {{
                margin: 5px 0;
                font-size: 12px;
                color: #7f8c8d;
            }}
            .contact-info {{
                font-size: 11px;
                color: #95a5a6;
                margin-top: 15px;
            }}
            .payment-notice {{
                background-color: #fff3e0;
                padding: 15px;
                margin: 20px 0;
                border-left: 4px solid #ff9800;
            }}
            .payment-notice p {{
                margin: 5px 0;
                font-size: 13px;
            }}
            .amount {{
                font-size: 18px;
                font-weight: 600;
                color: #e65100;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1 class="hospital-name">St. Jude's Medical Center</h1>
                <p class="hospital-tagline">Excellence in Healthcare Since 1975</p>
            </div>
            
            <div class="content">
                <p class="greeting">Dear Guardian,</p>
                
                <div class="discharge-info">
                    <h3>Patient Discharged</h3>
                    <p style="margin: 0; font-size: 14px;">
                        We are pleased to inform you that <strong>{patient['name']}</strong> has been successfully discharged from our facility. We trust that the care provided has contributed to a positive recovery.
                    </p>
                </div>
                
                <div class="message">
                    <p>This email contains important discharge documentation. Please find attached a comprehensive PDF document that includes the discharge summary, prescription details, and billing information.</p>
                </div>
                
                <div class="attachment-notice">
                    <p style="margin: 0 0 10px 0; font-weight: 600;">Attached Document Contents:</p>
                    <ul class="document-list">
                        <li>Complete medical discharge summary</li>
                        <li>Prescription with medication details and instructions</li>
                        <li>Itemized billing statement</li>
                        <li>Follow-up care recommendations</li>
                    </ul>
                </div>
                
                <div class="payment-notice">
                    <p style="margin: 0 0 8px 0; font-weight: 600;">Payment Information:</p>
                    <p style="margin: 0;">Total Amount Due: <span class="amount">₹{bill['total_amount']:,.2f}</span></p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">Payment is requested within 7 days. Please retain this document for your records.</p>
                </div>
                
                <div class="info-section">
                    <h3>Important Post-Discharge Instructions:</h3>
                    <ul>
                        <li>Follow all medication instructions as prescribed</li>
                        <li>Schedule follow-up appointment within 7-10 days</li>
                        <li>Monitor for any unusual symptoms or complications</li>
                        <li>Maintain proper rest and nutrition as advised</li>
                        <li>Keep all medical documents in a safe place</li>
                    </ul>
                </div>
                
                <div class="contact-box">
                    <h3>Emergency Contact Information</h3>
                    <p><strong>24/7 Emergency:</strong> +91-22-2345-6789</p>
                    <p><strong>Billing Inquiries:</strong> +91-22-2345-6790</p>
                    <p><strong>Email:</strong> info@stjudes.com</p>
                    <p><strong>Appointment Booking:</strong> +91-22-2345-6791</p>
                </div>
                
                <p style="font-size: 13px; color: #555; margin-top: 25px; line-height: 1.6;">
                    If you have any questions regarding the discharge summary, medications, or billing, please do not hesitate to contact our patient services department during business hours (9:00 AM - 6:00 PM, Monday to Saturday).
                </p>
                
                <p style="font-size: 14px; margin-top: 20px; font-weight: 500;">
                    We wish the patient a complete and speedy recovery.
                </p>
            </div>
            
            <div class="footer">
                <p><strong>St. Jude's Medical Center</strong></p>
                <p>123 Medical Plaza, Healthcare District, Mumbai - 400001</p>
                <div class="contact-info">
                    <p>Phone: +91-22-2345-6789 | Email: info@stjudes.com | Web: www.stjudes.com</p>
                    <p>Registered under the Mumbai Hospitals Act | License No: MH/MUM/HOS/2024/12345</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email_with_attachment(guardian_email, subject, html_body, pdf_buffer, pdf_filename)

def send_test_email(to_email):
    """Send a test email"""
    subject = "Test Email - St. Jude's Medical Center"
    html_body = """
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Email Configuration Successful</h2>
        <p>This is a test email from St. Jude's Medical Center Hospital Management System.</p>
        <p>If you are receiving this message, your email configuration is working correctly.</p>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">St. Jude's Medical Center | MediFlow AI System</p>
    </body>
    </html>
    """
    return send_email(to_email, subject, html_body)