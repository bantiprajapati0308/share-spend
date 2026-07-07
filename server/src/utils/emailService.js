let nodemailer = null;

function getNodemailer() {
  if (nodemailer) return nodemailer;
  try {
    nodemailer = require('nodemailer');
    return nodemailer;
  } catch (error) {
    console.error('[emailService] nodemailer module not found:', error?.message || error);
    return null;
  }
}

/**
 * Creates a reusable nodemailer transporter using Gmail SMTP.
 * Requires env vars:
 *   EMAIL_USER - your Gmail address (e.g. yourapp@gmail.com)
 *   EMAIL_PASS - Gmail App Password (NOT your account password)
 *                Generate at: https://myaccount.google.com/apppasswords
 */
function createTransporter() {
  const mailer = getNodemailer();
  if (!mailer) return null;

  return mailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function getAppUrl() {
  return process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',')[0].trim()
    : 'https://share-spend.vercel.app';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sends a trip invite email to the invitee.
 *
 * @param {object} opts
 * @param {string} opts.to        - Invitee email address
 * @param {string} opts.tripName  - Name of the trip
 * @param {string} opts.invitedBy - Email of the trip owner who sent the invite
 * @returns {Promise<void>}
 */
async function sendTripInviteEmail({ to, tripName, invitedBy }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[emailService] EMAIL_USER / EMAIL_PASS not set - skipping invite email');
    return;
  }

  const appUrl = getAppUrl();
  const safeTripName = escapeHtml(tripName);
  const safeInvitedBy = escapeHtml(invitedBy);

  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[emailService] nodemailer unavailable - skipping invite email');
    return;
  }

  const mailOptions = {
    from: `"Share Spend" <${process.env.EMAIL_USER}>`,
    to,
    subject: `You've been invited to join "${tripName}" on Share Spend`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 4px 24px rgba(30,98,208,0.10);overflow:hidden;">
          <tr>
            <td style="background:#1e62d0;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:1px;">
                Share Spend
              </h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">
                Trip Expense Manager
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px;">
              <h2 style="color:#1e62d0;margin:0 0 12px;font-size:20px;">
                You're invited!
              </h2>
              <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 20px;">
                <strong>${safeInvitedBy}</strong> has invited you to join the trip
                <strong style="color:#6c63ff;">&ldquo;${safeTripName}&rdquo;</strong>
                on Share Spend.
              </p>
              <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 28px;">
                Sign in or create a free account to accept or decline the invitation.
                The trip will appear in your dashboard once accepted.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td align="center" style="background:#1e62d0;border-radius:8px;">
                    <a href="${appUrl}/trip"
                       style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.5px;">
                      Open Share Spend
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#888;font-size:13px;text-align:center;margin:0;">
                If you did not expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #e9ecef;">
              <p style="color:#aaa;font-size:12px;margin:0;">
                &copy; ${new Date().getFullYear()} Share Spend &mdash; Trip Expense Manager
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };

  await transporter.sendMail(mailOptions);
  console.log(`[emailService] Invite email sent to ${to} for trip "${tripName}"`);
}

async function sendDailyReminderEmail({ email, name }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[emailService] EMAIL_USER / EMAIL_PASS not set - skipping daily reminder email');
    return;
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[emailService] nodemailer unavailable - skipping daily reminder email');
    return;
  }

  const appUrl = getAppUrl();
  const displayName = escapeHtml(name || 'there');

  const mailOptions = {
    from: `"Share Spend" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Quick reminder to add today\'s spend',
    text: `Hi ${name || 'there'},\n\nYou have not added any spend entry today. Take a minute to log it now so your daily tracker stays accurate.\n\nClick here to go to the application: ${appUrl}\n\nBest,\nShare Spend Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#eef3f8;font-family:Arial,Helvetica,sans-serif;color:#243447;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#eef3f8;padding:32px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 14px 34px rgba(36,52,71,0.12);">
          <tr>
            <td style="background:#116466;padding:30px 34px;text-align:left;">
              <p style="margin:0 0 8px;color:#d9f3ee;font-size:13px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">
                Daily spend reminder
              </p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;line-height:1.25;font-weight:800;">
                Keep today's expenses from slipping away
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:34px;">
              <p style="margin:0 0 18px;color:#243447;font-size:16px;line-height:1.6;">
                Hi ${displayName},
              </p>
              <p style="margin:0 0 18px;color:#3d5166;font-size:16px;line-height:1.6;">
                We noticed you have not added any spend entry today. A quick update now will keep your daily tracker accurate and your monthly totals easier to trust.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;background:#f6faf9;border:1px solid #d7ebe7;border-radius:10px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0;color:#116466;font-size:14px;font-weight:700;">
                      Tip
                    </p>
                    <p style="margin:6px 0 0;color:#4f6578;font-size:14px;line-height:1.5;">
                      Add even small cash or UPI payments today, so tomorrow's review stays simple.
                    </p>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td align="center" style="background:#116466;border-radius:8px;">
                    <a href="${appUrl}" style="display:inline-block;padding:14px 26px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">
                      Click here to go to the application
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#6b7c8f;font-size:13px;line-height:1.5;">
                Button not working? Open this link: <a href="${appUrl}" style="color:#116466;text-decoration:underline;">${appUrl}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f7f9fb;padding:18px 34px;text-align:center;border-top:1px solid #e5edf3;">
              <p style="margin:0;color:#8997a5;font-size:12px;line-height:1.5;">
                Share Spend helps you track daily spends, trips, and settlements in one place.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };

  await transporter.sendMail(mailOptions);
  console.log(`[emailService] Daily reminder email sent to ${email}`);
}

module.exports = { sendTripInviteEmail, sendDailyReminderEmail };
