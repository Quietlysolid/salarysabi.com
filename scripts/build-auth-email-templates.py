"""Build the two transactional Auth templates; no credentials or sending."""
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
LOGO = 'https://npiujcemzypvuuvnxfem.supabase.co/storage/v1/object/public/email-assets/salarysabi-logo-v2.png'

def render(title, description, action, note):
    return f'''<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{escape(title)}</title></head>
<body style="margin:0;padding:0;background-color:#f8f7f3;color:#162820;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f8f7f3">
<tr><td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="max-width:560px;border-top:4px solid #10664c;">
<tr><td style="padding:28px 28px 0;">
<img src="{LOGO}" width="195" height="45" alt="SalarySabi" style="display:block;width:195px;max-width:100%;height:auto;border:0;color:#10664c;font-size:24px;font-weight:bold;">
</td></tr>
<tr><td style="padding:30px 28px 28px;">
<h1 style="margin:0 0 16px;font-size:26px;line-height:34px;font-weight:700;color:#162820;">{escape(title)}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:25px;color:#42584e;">{escape(description)}</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#10664c" style="border-radius:4px;text-align:center;mso-padding-alt:14px 24px;">
<a href="{{{{ .ConfirmationURL }}}}" style="display:inline-block;padding:14px 24px;border:1px solid #10664c;border-radius:4px;background-color:#10664c;color:#ffffff;font-size:16px;line-height:22px;font-weight:700;text-decoration:none;mso-padding-alt:0;">{escape(action)}</a>
</td></tr></table>
<p style="margin:24px 0 0;font-size:14px;line-height:22px;color:#52645c;">{escape(note)}</p>
<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #dce3de;font-size:12px;line-height:19px;color:#52645c;">Button not working? <a href="{{{{ .ConfirmationURL }}}}" style="color:#10664c;text-decoration:underline;">Use this link</a>.</p>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body></html>
'''

templates = {
    'confirmation': ('Confirm your email', 'Confirm your email address to finish creating your SalarySabi account.', 'Confirm email', "If you didn't create an account, you can ignore this email."),
    'recovery': ('Reset your password', 'Choose a new password for your SalarySabi account.', 'Reset password', "If you didn't request a password reset, you can ignore this email."),
}

if __name__ == '__main__':
    target = ROOT / 'supabase/templates'
    target.mkdir(parents=True, exist_ok=True)
    for name, content in templates.items():
        (target / f'{name}.html').write_text(render(*content), encoding='utf-8')
    print('Built confirmation and recovery templates.')
