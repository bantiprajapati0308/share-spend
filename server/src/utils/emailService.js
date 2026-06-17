const nodemailer = require('nodemailer');

/**
 * Creates a reusable nodemailer transporter using Gmail SMTP.
 * Requires env vars:
 *   EMAIL_USER  — your Gmail address (e.g. yourapp@gmail.com)
 *   EMAIL_PASS  — Gmail App Password (NOT your account password)
 *                 Generate at: https://myaccount.google.com/apppasswords
 */
function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

/**
 * Sends a trip invite email to the invitee.
 *
 * @param {object} opts
 * @param {string} opts.to          - Invitee email address
 * @param {string} opts.tripName    - Name of the trip
 * @param {string} opts.invitedBy   - Email of the trip owner who sent the invite
 * @param {string} opts.inviteId    - Invite document ID (for accept/reject links)
 * @returns {Promise<void>}
 */
async function sendTripInviteEmail({ to, tripName, invitedBy, inviteId }) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('[emailService] EMAIL_USER / EMAIL_PASS not set — skipping invite email');
        return;
    }

    const appUrl = process.env.CLIENT_ORIGIN
        ? process.env.CLIENT_ORIGIN.split(',')[0].trim()
        : 'http://localhost:5173';

    const transporter = createTransporter();

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

          <!-- Header -->
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

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="color:#1e62d0;margin:0 0 12px;font-size:20px;">
                You&apos;re invited! ✈️
              </h2>
              <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 20px;">
                <strong>${invitedBy}</strong> has invited you to join the trip
                <strong style="color:#6c63ff;">&ldquo;${tripName}&rdquo;</strong>
                on Share Spend.
              </p>
              <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 28px;">
                Sign in (or create a free account) to accept or decline the invitation.
                The trip will appear in your dashboard once accepted.
              </p>

              <!-- CTA Button -->
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

          <!-- Footer -->
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

module.exports = { sendTripInviteEmail };
