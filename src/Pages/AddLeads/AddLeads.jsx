import React, { useState } from 'react'
import './AddLeads.css'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { Funnel, MapPin, Phone, User, UserPlus, Folder, Target, MessageSquare, X } from 'lucide-react'
import Dropdown from '../../Components/Dropdown/Dropdown'
import { LeadStatus } from '../../SLAData'
import { db } from '../../Firebase'
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { useAppContext } from '../../Context';

const AddLeads = () => {
  const { user, userDetails, userDetailsLoading } = useAppContext();
  const [selectedServices, setSelectedServices] = useState([]) // Changed to array for multi-select
  const [loading, setLoading] = useState(false);
  
  // New source dropdowns
  const [selectedSource, setSelectedSource] = useState('Select Source')
  const [selectedSubSource, setSelectedSubSource] = useState('Select Sub Source')
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    status: "",
    details: ""
  });

  // Source options
  const sourceOptions = [
    'Digital Marketing',
    'Online',
    'Offline Marketing',
    'Reference',
    'Marketing',
    'Interior Designers',
    'Builders',
    'Engineers'
  ];

  // Sub source options
  const subSourceOptions = [
    'Instagram',
    'Facebook',
    'Google',
    'Just Dial',
    'Google Listing',
    'Existing Customer',
    'Friends',
    'Marketers',
    'Flex',
    'Newspapers',
    'Bike Stickers',
    'Others'
  ];

  // Services options
  const serviceOptions = [
    'Invisible Grills',
    'Mosquito Mesh',
    'Cloth Hangers',
    'Artificial Grass',
    'Bird Spikes'
  ];

  // input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // dropdown select
  const handleDropdown = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Handle service selection (multi-select)
  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      if (prev.includes(service)) {
        // Remove service if already selected
        return prev.filter(s => s !== service);
      } else {
        // Add service if not selected
        return [...prev, service];
      }
    });
  };

  // Remove individual service
  const removeService = (serviceToRemove) => {
    setSelectedServices(prev => prev.filter(s => s !== serviceToRemove));
  };

  // Clear all selected services
  const clearAllServices = () => {
    setSelectedServices([]);
  };

  // validation
  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.phone.trim()) return "Phone number is required";
    if (!/^\d{10}$/.test(formData.phone)) return "Enter a valid 10-digit phone number";
    if (selectedServices.length === 0) return "Please select at least one service";
    if (selectedSource === "Select Source") return "Please select a source";
    if (selectedSubSource === "Select Sub Source") return "Please select a sub source";
    return null;
  };

  // Email sending function
  const sendEmail = async (to, subject, message) => {
    try {
      const response = await fetch('https://sla-backend-seven.vercel.app/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          message
        })
      });

      if (!response.ok) {
        console.error('Failed to send email:', response.statusText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

  // Create beautiful HTML email template for lead confirmation
  const createLeadConfirmationEmail = (leadData) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Your Interest - SLA</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8fafc;
                margin: 0;
                padding: 20px;
            }
            .email-container {
                max-width: 650px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }
            .email-header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                padding: 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            .email-header::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
                background-size: 30px 30px;
                animation: float 20s ease-in-out infinite;
            }
            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(180deg); }
            }
            .welcome-badge {
                background: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 12px 24px;
                border-radius: 50px;
                display: inline-block;
                margin-bottom: 20px;
                font-size: 14px;
                font-weight: 600;
                color: #ffffff;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .email-header h1 {
                color: #ffffff;
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 8px;
                position: relative;
                z-index: 1;
            }
            .email-header p {
                color: rgba(255, 255, 255, 0.9);
                font-size: 18px;
                margin: 0;
                position: relative;
                z-index: 1;
            }
            .email-content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 24px;
                font-weight: 700;
                color: #1a202c;
                margin-bottom: 20px;
                text-align: center;
            }
            .greeting .wave {
                display: inline-block;
                animation: wave 2s ease-in-out infinite;
            }
            @keyframes wave {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(20deg); }
                75% { transform: rotate(-10deg); }
            }
            .thank-you-message {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
                border-left: 4px solid #10b981;
                position: relative;
            }
            .thank-you-message::before {
                content: '🙏';
                position: absolute;
                top: -10px;
                right: 20px;
                font-size: 24px;
            }
            .inquiry-details-card {
                background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
                border: 1px solid #e2e8f0;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }
            .details-header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                font-size: 18px;
                font-weight: 700;
                color: #2d3748;
            }
            .details-header::before {
                content: '📋';
                margin-right: 10px;
                font-size: 24px;
            }
            .details-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }
            .detail-item {
                background: #f7fafc;
                padding: 12px 16px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
            }
            .detail-label {
                font-size: 12px;
                font-weight: 600;
                color: #718096;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
            }
            .detail-value {
                font-size: 14px;
                font-weight: 600;
                color: #2d3748;
            }
            .services-section {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
                border: 2px solid #3b82f6;
            }
            .services-header {
                display: flex;
                align-items: center;
                margin-bottom: 16px;
                font-size: 18px;
                font-weight: 700;
                color: #1e40af;
            }
            .services-header::before {
                content: '🛠️';
                margin-right: 12px;
                font-size: 24px;
            }
            .services-list {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
            }
            .service-tag {
                background: #3b82f6;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .service-tag::before {
                content: '✓';
                font-size: 12px;
                font-weight: bold;
            }
            .next-steps-section {
                background: #fff3cd;
                border: 2px solid #ffc107;
                border-radius: 12px;
                padding: 20px;
                margin: 24px 0;
            }
            .next-steps-header {
                display: flex;
                align-items: center;
                margin-bottom: 16px;
                font-size: 18px;
                font-weight: 700;
                color: #856404;
            }
            .next-steps-header::before {
                content: '🚀';
                margin-right: 12px;
                font-size: 24px;
            }
            .steps-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .steps-list li {
                padding: 8px 0;
                color: #856404;
                font-size: 14px;
                display: flex;
                align-items: center;
            }
            .steps-list li::before {
                content: '📞';
                margin-right: 12px;
                font-size: 16px;
            }
            .steps-list li:nth-child(2)::before { content: '📍'; }
            .steps-list li:nth-child(3)::before { content: '📝'; }
            .steps-list li:nth-child(4)::before { content: '🔧'; }
            .contact-section {
                background: #f7fafc;
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
                border: 1px solid #e2e8f0;
            }
            .contact-header {
                display: flex;
                align-items: center;
                margin-bottom: 16px;
                font-size: 18px;
                font-weight: 700;
                color: #2d3748;
            }
            .contact-header::before {
                content: '📞';
                margin-right: 10px;
                font-size: 24px;
            }
            .contact-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }
            .contact-item {
                display: flex;
                align-items: center;
                padding: 12px;
                background: #ffffff;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
            }
            .contact-item::before {
                margin-right: 12px;
                font-size: 20px;
            }
            .contact-item:nth-child(1)::before { content: '📧'; }
            .contact-item:nth-child(2)::before { content: '📱'; }
            .contact-item:nth-child(3)::before { content: '🌐'; }
            .contact-details {
                flex: 1;
            }
            .contact-label {
                font-size: 12px;
                font-weight: 600;
                color: #718096;
                margin-bottom: 2px;
            }
            .contact-value {
                font-size: 14px;
                font-weight: 600;
                color: #2d3748;
            }
            .email-footer {
                background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
                padding: 32px 30px;
                text-align: center;
                color: #ffffff;
            }
            .footer-logo {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
                background: linear-gradient(135deg, #10b981, #059669);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .footer-tagline {
                font-size: 16px;
                color: #a0aec0;
                margin-bottom: 20px;
            }
            .footer-disclaimer {
                font-size: 12px;
                color: #718096;
                line-height: 1.5;
                border-top: 1px solid #4a5568;
                padding-top: 20px;
                margin-top: 20px;
            }
            
            /* Responsive Design */
            @media (max-width: 600px) {
                body { padding: 10px; }
                .email-container { border-radius: 12px; }
                .email-header, .email-content { padding: 24px 20px; }
                .email-header h1 { font-size: 28px; }
                .greeting { font-size: 20px; }
                .details-grid, .contact-grid { 
                    grid-template-columns: 1fr; 
                }
                .services-list { 
                    flex-direction: column; 
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- Header -->
            <div class="email-header">
                <div class="welcome-badge">Lead Inquiry</div>
                <h1>Thank You for Your Interest!</h1>
                <p>We've received your inquiry and will get back to you soon</p>
            </div>
            
            <!-- Content -->
            <div class="email-content">
                <div class="greeting">
                    Hello ${leadData.name}! <span class="wave">👋</span>
                </div>
                
                <div class="thank-you-message">
                    <p><strong>Thank you for reaching out to SLA!</strong></p>
                    <p>We appreciate your interest in our services and have received your inquiry. Our team will review your requirements and get back to you within 24 hours with detailed information and next steps.</p>
                </div>
                
                <!-- Inquiry Details -->
                <div class="inquiry-details-card">
                    <div class="details-header">Your Inquiry Details</div>
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Inquiry ID</div>
                            <div class="detail-value">#${Date.now().toString().slice(-6)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Phone</div>
                            <div class="detail-value">${leadData.phone}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Source</div>
                            <div class="detail-value">${leadData.source}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Sub Source</div>
                            <div class="detail-value">${leadData.subSource}</div>
                        </div>
                        ${leadData.city ? `
                        <div class="detail-item">
                            <div class="detail-label">Location</div>
                            <div class="detail-value">${leadData.city}${leadData.state ? `, ${leadData.state}` : ''}</div>
                        </div>
                        ` : ''}
                        <div class="detail-item">
                            <div class="detail-label">Date Submitted</div>
                            <div class="detail-value">${new Date().toLocaleDateString('en-IN')}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Services -->
                <div class="services-section">
                    <div class="services-header">Services You're Interested In</div>
                    <div class="services-list">
                        ${leadData.requiredServices.map(service => `
                            <span class="service-tag">${service}</span>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Next Steps -->
                <div class="next-steps-section">
                    <div class="next-steps-header">What Happens Next?</div>
                    <ul class="steps-list">
                        <li>Our team will contact you within 24 hours to discuss your requirements</li>
                        <li>We'll schedule a convenient time for a site visit (if required)</li>
                        <li>You'll receive a detailed quotation tailored to your needs</li>
                        <li>We'll begin work once you approve the proposal</li>
                    </ul>
                </div>
                
                <!-- Contact Section -->
                <div class="contact-section">
                    <div class="contact-header">Need Immediate Assistance?</div>
                    <p style="margin-bottom: 16px; color: #4a5568;">Feel free to reach out to us directly:</p>
                    <div class="contact-grid">
                        <div class="contact-item">
                            <div class="contact-details">
                                <div class="contact-label">Email</div>
                                <div class="contact-value">info@sla.com</div>
                            </div>
                        </div>
                        <div class="contact-item">
                            <div class="contact-details">
                                <div class="contact-label">Phone</div>
                                <div class="contact-value">+91 XXXXX XXXXX</div>
                            </div>
                        </div>
                        <div class="contact-item">
                            <div class="contact-details">
                                <div class="contact-label">Website</div>
                                <div class="contact-value">www.sla.com</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="email-footer">
                <div class="footer-logo">🏢 SLA</div>
                <div class="footer-tagline">Quality Services, Satisfied Customers</div>
                <div class="footer-disclaimer">
                    This is an automated confirmation email for your inquiry. 
                    We'll contact you soon with more details about your requirements.
                    <br><br>
                    © ${new Date().getFullYear()} SLA. All rights reserved.
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  };

  // Create admin notification email
  const createAdminNotificationEmail = (leadData) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Lead Inquiry - SLA Admin</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8fafc;
                margin: 0;
                padding: 20px;
            }
            .email-container {
                max-width: 700px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }
            .email-header {
                background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                padding: 32px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            .notification-badge {
                background: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 8px 20px;
                border-radius: 50px;
                display: inline-block;
                margin-bottom: 16px;
                font-size: 12px;
                font-weight: 700;
                color: #ffffff;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .email-header h1 {
                color: #ffffff;
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
                position: relative;
                z-index: 1;
            }
            .email-header p {
                color: rgba(255, 255, 255, 0.9);
                font-size: 16px;
                margin: 0;
                position: relative;
                z-index: 1;
            }
            .email-content {
                padding: 32px 30px;
            }
            .alert-box {
                background: #dbeafe;
                border: 2px solid #3b82f6;
                border-radius: 12px;
                padding: 20px;
                margin: 0 0 24px 0;
                display: flex;
                align-items: center;
                position: relative;
                overflow: hidden;
            }
            .alert-icon {
                font-size: 24px;
                margin-right: 16px;
                background: #3b82f6;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .alert-text {
                flex: 1;
            }
            .alert-title {
                font-size: 16px;
                font-weight: 700;
                color: #1e40af;
                margin-bottom: 4px;
            }
            .alert-message {
                font-size: 14px;
                color: #1e40af;
                margin: 0;
            }
            .lead-details-card {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
                border: 1px solid #cbd5e1;
            }
            .details-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 16px;
                border-bottom: 2px solid #e2e8f0;
            }
            .details-title {
                font-size: 20px;
                font-weight: 700;
                color: #1e293b;
                display: flex;
                align-items: center;
            }
            .details-title::before {
                content: '👤';
                margin-right: 12px;
                font-size: 24px;
            }
            .priority-badge {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
            }
            .details-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 16px;
            }
            .detail-item {
                background: #ffffff;
                padding: 16px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .detail-label {
                font-size: 12px;
                font-weight: 700;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 6px;
                display: flex;
                align-items: center;
            }
            .detail-value {
                font-size: 15px;
                font-weight: 600;
                color: #1e293b;
                word-break: break-word;
            }
            .detail-label::before {
                margin-right: 8px;
                font-size: 14px;
            }
            .detail-item:nth-child(1) .detail-label::before { content: '👨‍💼'; }
            .detail-item:nth-child(2) .detail-label::before { content: '📱'; }
            .detail-item:nth-child(3) .detail-label::before { content: '📧'; }
            .detail-item:nth-child(4) .detail-label::before { content: '📍'; }
            .detail-item:nth-child(5) .detail-label::before { content: '🎯'; }
            .detail-item:nth-child(6) .detail-label::before { content: '🔗'; }
            .address-item {
                grid-column: 1 / -1;
            }
            .address-item .detail-label::before { content: '🏠'; }
            .services-section {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
                border: 2px solid #10b981;
            }
            .services-header {
                font-size: 18px;
                font-weight: 700;
                color: #059669;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
            }
            .services-header::before {
                content: '🛠️';
                margin-right: 12px;
                font-size: 24px;
            }
            .services-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
            }
            .service-item {
                background: #10b981;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 6px;
                box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
            }
            .service-item::before {
                content: '✓';
                font-size: 12px;
                font-weight: bold;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .action-section {
                background: #fff7ed;
                border: 2px solid #f97316;
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
            }
            .action-header {
                font-size: 18px;
                font-weight: 700;
                color: #ea580c;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
            }
            .action-header::before {
                content: '🚀';
                margin-right: 12px;
                font-size: 24px;
            }
            .action-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .action-item {
                display: flex;
                align-items: center;
                padding: 8px 0;
                color: #ea580c;
                font-size: 14px;
                font-weight: 500;
            }
            .action-item::before {
                content: '📋';
                margin-right: 12px;
                font-size: 16px;
            }
            .action-item:nth-child(2)::before { content: '📞'; }
            .action-item:nth-child(3)::before { content: '📅'; }
            .action-item:nth-child(4)::before { content: '📝'; }
            .timestamp {
                background: #f8fafc;
                border-radius: 8px;
                padding: 16px;
                margin: 24px 0;
                border: 1px solid #e2e8f0;
                font-size: 13px;
                color: #64748b;
                text-align: center;
                border-left: 4px solid #6366f1;
            }
            .timestamp-icon {
                display: inline-block;
                margin-right: 8px;
                font-size: 16px;
            }
            .email-footer {
                background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
                padding: 32px 30px;
                text-align: center;
                color: #ffffff;
            }
            .footer-logo {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 8px;
                background: linear-gradient(135deg, #3b82f6, #1e40af);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .footer-tagline {
                font-size: 14px;
                color: #9ca3af;
                margin-bottom: 16px;
            }
            .footer-disclaimer {
                font-size: 12px;
                color: #6b7280;
                line-height: 1.5;
                border-top: 1px solid #374151;
                padding-top: 16px;
                margin-top: 16px;
            }
            
            /* Responsive Design */
            @media (max-width: 600px) {
                body { padding: 10px; }
                .email-container { border-radius: 12px; }
                .email-header, .email-content { padding: 20px; }
                .email-header h1 { font-size: 24px; }
                .details-grid { 
                    grid-template-columns: 1fr; 
                }
                .details-header { 
                    flex-direction: column; 
                    text-align: center; 
                    gap: 12px; 
                }
                .services-grid {
                    flex-direction: column;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- Header -->
            <div class="email-header">
                <div class="notification-badge">New Lead Alert</div>
                <h1>New Lead Inquiry Received</h1>
                <p>A potential customer has submitted an inquiry</p>
            </div>
            
            <!-- Content -->
            <div class="email-content">
                <!-- Alert -->
                <div class="alert-box">
                    <div class="alert-icon">🔔</div>
                    <div class="alert-text">
                        <div class="alert-title">Action Required!</div>
                        <div class="alert-message">A new lead inquiry has been submitted and requires immediate attention.</div>
                    </div>
                </div>
                
                <!-- Lead Details -->
                <div class="lead-details-card">
                    <div class="details-header">
                        <div class="details-title">Lead Information</div>
                        <div class="priority-badge">New Lead</div>
                    </div>
                    
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Customer Name</div>
                            <div class="detail-value">${leadData.name}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Phone Number</div>
                            <div class="detail-value">${leadData.phone}</div>
                        </div>
                        ${leadData.email ? `
                        <div class="detail-item">
                            <div class="detail-label">Email Address</div>
                            <div class="detail-value">${leadData.email}</div>
                        </div>
                        ` : ''}
                        ${leadData.city && leadData.state ? `
                        <div class="detail-item">
                            <div class="detail-label">Location</div>
                            <div class="detail-value">${leadData.city}, ${leadData.state}</div>
                        </div>
                        ` : ''}
                        <div class="detail-item">
                            <div class="detail-label">Source</div>
                            <div class="detail-value">${leadData.source}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Sub Source</div>
                            <div class="detail-value">${leadData.subSource}</div>
                        </div>
                        ${leadData.address ? `
                        <div class="detail-item address-item">
                            <div class="detail-label">Full Address</div>
                            <div class="detail-value">${leadData.address}</div>
                        </div>
                        ` : ''}
                        ${leadData.details ? `
                        <div class="detail-item address-item">
                            <div class="detail-label">Additional Details</div>
                            <div class="detail-value">${leadData.details}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Services -->
                <div class="services-section">
                    <div class="services-header">Services of Interest</div>
                    <div class="services-grid">
                        ${leadData.requiredServices.map(service => `
                            <div class="service-item">${service}</div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Action Items -->
                <div class="action-section">
                    <div class="action-header">Recommended Next Steps</div>
                    <ul class="action-list">
                        <li class="action-item">Review lead details and assign to appropriate team member</li>
                        <li class="action-item">Contact customer within 24 hours to discuss requirements</li>
                        <li class="action-item">Schedule site visit if required for accurate assessment</li>
                        <li class="action-item">Prepare and send detailed quotation based on requirements</li>
                    </ul>
                </div>
                
                <!-- Timestamp -->
                <div class="timestamp">
                    <span class="timestamp-icon">🕒</span>
                    <strong>Lead Submitted:</strong> ${new Date().toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Kolkata'
                    })} IST
                </div>
            </div>
            
            <!-- Footer -->
            <div class="email-footer">
                <div class="footer-logo">🏢 SLA Admin System</div>
                <div class="footer-tagline">Lead Management Notification</div>
                <div class="footer-disclaimer">
                    This is an automated notification from the SLA Lead Management System. 
                    Please take appropriate action to follow up with this lead promptly.
                    <br><br>
                    Please do not reply to this automated message.
                    <br>
                    © ${new Date().getFullYear()} SLA. All rights reserved.
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  };

  // save lead
  const handleSaveLead = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    try {
      const leadData = {
        ...formData,
        requiredServices: selectedServices,
        source: selectedSource,
        subSource: selectedSubSource,
        createdAt: Timestamp.now(),
        createdBy: userDetails?.name || user?.email || 'Unknown User'
      };
      
      // Save to Firebase
      const docRef = await addDoc(collection(db, "Leads"), leadData);
      
      toast.success('Lead saved successfully!');

      // Send emails if customer has email
      if (formData.email && formData.email.trim() !== '') {
        toast.info('Sending confirmation emails...', { autoClose: 2000 });
        
        // Create beautiful HTML emails
        const customerEmailHTML = createLeadConfirmationEmail(leadData);
        const adminEmailHTML = createAdminNotificationEmail(leadData);

        // Send both emails
        Promise.all([
          sendEmail(userDetails.email, "🎉 Thank You for Your Interest - SLA", customerEmailHTML),
          sendEmail('db4sla@gmail.com', "🚨 New Lead Inquiry - SLA Admin", adminEmailHTML)
        ]).then(([customerEmailSent, adminEmailSent]) => {
          if (customerEmailSent) {
            toast.success('📧 Confirmation email sent to customer!');
            console.log('✅ Confirmation email sent to customer successfully');
          } else {
            toast.warning('⚠️ Lead saved but confirmation email failed to send');
            console.log('❌ Failed to send confirmation email to customer');
          }
          
          if (adminEmailSent) {
            toast.success('📧 Admin notification sent!');
            console.log('✅ Admin notification email sent successfully');
          } else {
            console.log('❌ Failed to send admin notification email');
          }
        }).catch(emailError => {
          console.error('❌ Error in email sending process:', emailError);
          toast.warning('Lead saved but some emails failed to send');
        });
      } else {
        // Send only admin notification if no customer email
        const adminEmailHTML = createAdminNotificationEmail(leadData);
        sendEmail('db4sla@gmail.com', "🚨 New Lead Inquiry - SLA Admin", adminEmailHTML)
          .then(adminEmailSent => {
            if (adminEmailSent) {
              toast.success('📧 Admin notification sent!');
              console.log('✅ Admin notification email sent successfully');
            } else {
              console.log('❌ Failed to send admin notification email');
            }
          });
      }

      // Clear all form fields after successful save
      setFormData({
        name: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "India",
        status: "",
        details: ""
      });
      setSelectedServices([]);
      setSelectedSource("Select Source");
      setSelectedSubSource("Select Sub Source");
      
    } catch (err) {
      toast.error('Something went wrong. Try Again!');
      console.error('Save lead error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container d-none d-lg-flex">
          <h1>Add Lead</h1>
        </div>
        <div className="actions-container">
          <div className="filter-container">
            <button type="button" className="filter-btn">
              <Funnel className="icon" />
            </button>
          </div>

          {/* Save Button */}
          <button 
            className="saveDetails-btn" 
            onClick={handleSaveLead} 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Saving...
              </>
            ) : (
              <>
                <UserPlus style={{ width: '18px' }} /> Save Lead
              </>
            )}
          </button>
        </div>
      </div>

      <div className="add-leads-main-container">
        <div className="add-lead-content-main-con">
          {/* Lead Status Section */}
          <h1 className="section-heading">Lead Status:</h1>
          <div className="leads-status-section-container">
            <Dropdown data={LeadStatus} label={'Status'} onSelect={(val) => handleDropdown("status", val)} />
          </div>
          <hr />

          {/* Source Information Section */}
          <h1 className="section-heading mb-5">Source Information:</h1>
          <div className="source-info-container">
            {/* Primary Source */}
            <div className="input-container">
              <p className="input-label">Source :</p>
              <div className="input-con">
                <div className="icon-con"><Target className="icon" /></div>
                <div className="dropdown input-dropdown-container">
                  <button className="btn btn-secondary dropdown-toggle dp-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    {selectedSource}
                  </button>
                  <ul className="dropdown-menu input-drop-con-list">
                    {sourceOptions.map((source, index) => (
                      <li key={index} onClick={() => setSelectedSource(source)}>
                        {source}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Sub Source */}
            <div className="input-container">
              <p className="input-label">Sub Source :</p>
              <div className="input-con">
                <div className="icon-con"><Target className="icon" /></div>
                <div className="dropdown input-dropdown-container">
                  <button className="btn btn-secondary dropdown-toggle dp-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    {selectedSubSource}
                  </button>
                  <ul className="dropdown-menu input-drop-con-list">
                    {subSourceOptions.map((subSource, index) => (
                      <li key={index} onClick={() => setSelectedSubSource(subSource)}>
                        {subSource}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="input-container">
              <p className="input-label">Details :</p>
              <div className="input-con">
                <div className="icon-con"><MessageSquare className="icon" /></div>
                <input 
                  type="text" 
                  name="details" 
                  value={formData.details} 
                  onChange={handleChange} 
                  placeholder="Enter additional details" 
                />
              </div>
            </div>

            {/* Required Services - Multi Select */}
            <div className="input-container">
              <p className="input-label">Required services :</p>
              <div className="input-con services-multi-select-container">
                <div className="icon-con"><Folder className="icon" /></div>
                <div className="services-select-wrapper">
                  <div className="dropdown input-dropdown-container">
                    <button 
                      className="btn btn-secondary dropdown-toggle dp-btn services-dropdown-btn" 
                      type="button" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                      data-count={selectedServices.length}
                    >
                      {selectedServices.length === 0 
                        ? 'Select Required Services' 
                        : selectedServices.length === 1
                        ? `${selectedServices[0]}`
                        : `${selectedServices.length} Services Selected`
                      }
                    </button>
                    <ul className="dropdown-menu input-drop-con-list services-dropdown-list">
                      <li className="services-dropdown-header">
                        <span>📋 Available Services (${selectedServices.length}/${serviceOptions.length})</span>
                        {selectedServices.length > 0 && (
                          <button 
                            type="button" 
                            className="clear-all-services"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearAllServices();
                            }}
                          >
                            Clear All
                          </button>
                        )}
                      </li>
                      {serviceOptions.map((service, index) => (
                        <li 
                          key={index} 
                          className={`service-option ${selectedServices.includes(service) ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleServiceToggle(service);
                          }}
                        >
                          {/* <input 
                            type="checkbox" 
                            checked={selectedServices.includes(service)}
                            onChange={() => {}} // Controlled by parent click
                            onClick={(e) => e.stopPropagation()}
                          /> */}
                          <span>{service}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Selected Services Display */}
            {selectedServices.length > 0 && (
              <div className="selected-services-display">
                <p className="input-label">Selected Services ({selectedServices.length}):</p>
                <div className="selected-services-tags">
                  {selectedServices.map((service, index) => (
                    <span key={index} className="service-tag">
                      {service}
                      <button 
                        type="button" 
                        className="remove-service"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeService(service);
                        }}
                        title={`Remove ${service}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <hr />

          {/* Customer Details Section */}
          <h1 className="section-heading mb-5">Customer Details:</h1>
          <div className="customer-details-container">
            <form>
              <div className="input-container">
                <p className="input-label">Name :</p>
                <div className="input-con">
                  <div className="icon-con"><User className="icon" /></div>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Customer Name" />
                </div>
              </div>

              <div className="input-container">
                <p className="input-label">Phone :</p>
                <div className="input-con">
                  <div className="icon-con"><Phone className="icon" /></div>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" />
                </div>
              </div>

              <div className="input-container">
                <p className="input-label">Address :</p>
                <div className="input-con">
                  <div className="icon-con"><MapPin className="icon" /></div>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Address" />
                </div>
              </div>

              <div className="input-container">
                <p className="input-label">City :</p>
                <div className="input-con">
                  <div className="icon-con"><MapPin className="icon" /></div>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" />
                </div>
              </div>

              <div className="input-container">
                <p className="input-label">State :</p>
                <div className="input-con">
                  <div className="icon-con"><MapPin className="icon" /></div>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State" />
                </div>
              </div>

              <div className="input-container">
                <p className="input-label">Country :</p>
                <div className="input-con">
                  <div className="icon-con"><MapPin className="icon" /></div>
                  <input type="text" name="country" value={formData.country} disabled />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddLeads
