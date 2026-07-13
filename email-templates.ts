export function getBaseEmailTemplate(title: string, contentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #05050a;
            margin: 0;
            padding: 0;
            color: #e5e9ea;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: linear-gradient(135deg, #0f0d1a 0%, #080612 100%);
            border: 1px solid rgba(126, 120, 226, 0.2);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          }
          .header {
            padding: 40px 30px;
            text-align: center;
            background: linear-gradient(180deg, rgba(126, 120, 226, 0.1) 0%, rgba(0,0,0,0) 100%);
            border-bottom: 1px solid rgba(126, 120, 226, 0.1);
          }
          .logo-svg {
            width: 48px;
            height: 48px;
            margin-bottom: 15px;
          }
          .logo-text {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -1px;
            background: linear-gradient(135deg, #9fa0ec 0%, #7e78e2 50%, #463bb5 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
          }
          .content {
            padding: 40px 35px;
            line-height: 1.7;
          }
          h1 {
            font-size: 24px;
            margin-top: 0;
            color: #ffffff;
            font-weight: 700;
          }
          p {
            font-size: 15px;
            color: rgba(229, 233, 234, 0.85);
            margin: 16px 0;
          }
          .otp-container {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin: 35px 0;
          }
          .otp-digit {
            background-color: rgba(126, 120, 226, 0.1);
            border: 1px solid rgba(126, 120, 226, 0.3);
            border-radius: 12px;
            width: 45px;
            height: 55px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: 800;
            color: #9fa0ec;
            font-family: monospace;
            box-shadow: inset 0 0 15px rgba(126, 120, 226, 0.05);
            text-align: center;
            line-height: 55px;
          }
          .code-box {
             background-color: rgba(126, 120, 226, 0.1);
            border: 1px dashed rgba(126, 120, 226, 0.3);
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            font-size: 32px;
            font-weight: 800;
            color: #9fa0ec;
            letter-spacing: 8px;
            font-family: monospace;
            margin: 30px 0;
            box-shadow: inset 0 0 15px rgba(126, 120, 226, 0.05);
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #7e78e2 0%, #463bb5 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 36px;
            font-size: 14px;
            font-weight: 700;
            border-radius: 24px;
            margin: 20px 0 30px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 8px 25px rgba(70, 59, 181, 0.4);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .footer {
            padding: 30px;
            text-align: center;
            background-color: #08060c;
            border-top: 1px solid rgba(126, 120, 226, 0.1);
            font-size: 12px;
            color: rgba(229, 233, 234, 0.4);
          }
          .footer a {
            color: #7e78e2;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <svg class="logo-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="8" width="3" height="8" rx="1.5" fill="#c1c3f4"/>
              <rect x="6" y="5" width="3" height="14" rx="1.5" fill="#9fa0ec"/>
              <rect x="10" y="2" width="3" height="20" rx="1.5" fill="#7e78e2"/>
              <rect x="14" y="6" width="3" height="12" rx="1.5" fill="#463bb5"/>
              <rect x="18" y="10" width="3" height="4" rx="1.5" fill="#c1c3f4"/>
              <circle cx="21" cy="20" r="1.5" fill="#9fa0ec"/>
            </svg>
            <h1 class="logo-text">playme</h1>
          </div>
          <div class="content">
            ${contentHtml}
          </div>
          <div class="footer">
            <p style="margin: 0 0 10px 0;">This is an automated message from <a href="https://playme-gwl6.onrender.com/">Playme</a>. Please do not reply to this email.</p>
            <p style="margin: 0;">© 2026 Playme Music. All rights reserved. <a href="https://playme-gwl6.onrender.com/">Website</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getWelcomeEmailHtml(name: string): string {
  const content = `
    <h1>Welcome to Playme, ${name}! 🎧</h1>
    <p>Your Playme account has been created successfully. Get ready to experience your music catalog with absolute premium fidelity, completely interactive AI layers, and an offline-first sync engine.</p>
    
    <div style="background: rgba(126, 120, 226, 0.05); border: 1px solid rgba(126, 120, 226, 0.1); border-radius: 12px; padding: 20px; margin: 25px 0;">
      <div style="margin-bottom: 15px;">
        <strong style="color: #9fa0ec; display: block; margin-bottom: 5px;">🎵 High-Fidelity Audio</strong>
        <span style="font-size: 13px; color: rgba(229, 233, 234, 0.6);">Experience your tracks exactly as the artist intended.</span>
      </div>
      <div style="margin-bottom: 15px;">
        <strong style="color: #9fa0ec; display: block; margin-bottom: 5px;">🧠 AI Music Tutor</strong>
        <span style="font-size: 13px; color: rgba(229, 233, 234, 0.6);">Translate and unlock cultural background trivia in real-time.</span>
      </div>
      <div>
        <strong style="color: #9fa0ec; display: block; margin-bottom: 5px;">🔮 Mood Playlist DJ</strong>
        <span style="font-size: 13px; color: rgba(229, 233, 234, 0.6);">Describe your vibe and let our AI generate the perfect soundtrack.</span>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="https://playme-gwl6.onrender.com/" class="btn">Launch Playme</a>
    </div>
    
    <p style="margin-bottom: 0;">Turn it up,<br><strong style="color: #c1c3f4;">The Playme Team</strong></p>
  `;
  return getBaseEmailTemplate("Welcome to Playme!", content);
}

export function getRecoveryCodeEmailHtml(code: string): string {
  const content = `
    <h1>Reset your security credentials 🔑</h1>
    <p>We received a request to recover the security keys for your Playme account. If you did not initiate this request, you can safely ignore this email; your password remains secure.</p>
    <p>To set new account credentials, use the verification security code below:</p>
    
    <div class="code-box">${code}</div>

    <p style="font-size: 13px; color: rgba(229, 233, 234, 0.55); text-align: center; margin-top: -10px; margin-bottom: 30px;">
      This code will remain active for 15 minutes before expiring.
    </p>

    <p style="margin-bottom: 0;">Play secure,<br><strong style="color: #c1c3f4;">The Playme Team</strong></p>
  `;
  return getBaseEmailTemplate("Playme Security Recovery", content);
}

export function getVerificationEmailHtml(name: string, verifyLink: string): string {
  const content = `
    <h1>Verify Your Playme Account 🛡️</h1>
    <p>Greetings ${name},</p>
    <p>Thank you for joining Playme. Click the button below to verify your email address and unlock full dashboard features.</p>
    
    <div style="text-align: center;">
      <a href="${verifyLink}" class="btn">Verify Email Address</a>
    </div>

    <p style="font-size: 13px; color: rgba(229, 233, 234, 0.55); text-align: center; margin-bottom: 30px;">
      This link will expire in 24 hours.
    </p>

    <p style="margin-bottom: 0;">Play secure,<br><strong style="color: #c1c3f4;">The Playme Team</strong></p>
  `;
  return getBaseEmailTemplate("Verify your email", content);
}

export function getForgotOtpEmailHtml(name: string, otp: string): string {
  // Convert OTP string to array of characters for separate boxes
  const digits = otp.split('');
  let otpBoxes = '';
  digits.forEach(digit => {
    otpBoxes += `<div class="otp-digit">${digit}</div>`;
  });

  const content = `
    <h1>Playme Vault Recovery 🔐</h1>
    <p>Greetings ${name},</p>
    <p>We received a request to recover your password. Please use the following One-Time Password (OTP) to reset it.</p>
    
    <div class="otp-container">
      ${otpBoxes}
    </div>

    <p style="font-size: 13px; color: rgba(229, 233, 234, 0.55); text-align: center; margin-top: -10px; margin-bottom: 30px;">
      This OTP expires in 1 hour. If you did not request this, you can ignore this email safely.
    </p>

    <p style="margin-bottom: 0;">Play secure,<br><strong style="color: #c1c3f4;">The Playme Team</strong></p>
  `;
  return getBaseEmailTemplate("Playme Password Recovery", content);
}
