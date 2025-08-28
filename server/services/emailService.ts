import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    this.transporter = nodemailer.createTransport(config);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendBudgetAlert(userEmail: string, budget: any, spent: number): Promise<boolean> {
    const percentage = Math.round((spent / parseFloat(budget.amount)) * 100);
    
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
            <h1>Budget Alert</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Budget Limit Approaching</h2>
            <p>Hello,</p>
            <p>You are approaching your budget limit for <strong>${budget.category}</strong>.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Category:</strong> ${budget.category}</p>
              <p><strong>Budget:</strong> $${budget.amount}</p>
              <p><strong>Spent:</strong> $${spent.toFixed(2)}</p>
              <p><strong>Percentage Used:</strong> ${percentage}%</p>
            </div>
            <p>Consider reviewing your spending in this category to stay within your budget.</p>
            <p>Best regards,<br>FinanceAI Pro Team</p>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject: `Budget Alert: ${budget.category} (${percentage}% used)`,
      html,
    });
  }

  async sendMonthlyReport(userEmail: string, reportData: any): Promise<boolean> {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>Monthly Financial Report</h1>
            <p>${reportData.month} ${reportData.year}</p>
          </div>
          <div style="padding: 20px;">
            <h2>Summary</h2>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Total Income:</strong> $${reportData.totalIncome}</p>
              <p><strong>Total Expenses:</strong> $${reportData.totalExpenses}</p>
              <p><strong>Net Savings:</strong> $${reportData.netSavings}</p>
            </div>
            
            <h3>Top Spending Categories</h3>
            <ul>
              ${reportData.topCategories.map((cat: any) => 
                `<li>${cat.category}: $${cat.amount}</li>`
              ).join('')}
            </ul>
            
            <h3>AI Insights</h3>
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p>${reportData.aiInsights}</p>
            </div>
            
            <p>Keep up the great work managing your finances!</p>
            <p>Best regards,<br>FinanceAI Pro Team</p>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject: `Your Monthly Financial Report - ${reportData.month} ${reportData.year}`,
      html,
    });
  }
}

export const emailService = new EmailService();
