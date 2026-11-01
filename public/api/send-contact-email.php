<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once __DIR__ . '/smtp_helper.php';

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);

$title = htmlspecialchars(isset($body['title']) ? $body['title'] : '');
$firstName = htmlspecialchars(isset($body['firstName']) ? $body['firstName'] : '');
$lastName = htmlspecialchars(isset($body['lastName']) ? $body['lastName'] : '');
$email = htmlspecialchars(isset($body['email']) ? $body['email'] : '');
$telephone = htmlspecialchars(isset($body['telephone']) ? $body['telephone'] : '');
$message = htmlspecialchars(isset($body['message']) ? $body['message'] : '');

if (empty($firstName) || empty($email) || empty($telephone) || empty($message)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required contact form fields']);
    exit(0);
}

$fullName = trim(($title ? "$title " : '') . "$firstName $lastName");
$sentTime = date('Y-m-d H:i:s');

$htmlContent = "<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <title>New Website Contact Form Message - {$fullName}</title>
</head>
<body style=\"margin: 0; padding: 12px 4px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\">
  <table role=\"presentation\" width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width: 580px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;\">
    <tr><td height=\"4\" style=\"background: #ea580c; line-height: 4px; font-size: 4px;\">&nbsp;</td></tr>
    <tr>
      <td align=\"center\" style=\"padding: 24px 16px 18px 16px; background-color: #121215; border-bottom: 1px solid #27272a;\">
        <div style=\"font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #f59e0b; margin-bottom: 6px;\">✉️ WRAP &amp; WINGS CO.</div>
        <h1 style=\"margin: 0 0 8px 0; font-size: 22px; line-height: 28px; font-weight: 800; color: #ffffff;\">New Website Message!</h1>
        <div style=\"display: inline-block; background-color: #27272a; color: #fdba74; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 9999px; border: 1px solid #ea580c;\">Customer Contact Inquiry</div>
      </td>
    </tr>
    <tr>
      <td style=\"padding: 20px 16px;\">
        <table role=\"presentation\" width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse: collapse; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; margin-bottom: 20px;\">
          <tr style=\"border-bottom: 1px solid #27272a; background-color: #1c1c20;\">
            <td width=\"30%\" style=\"padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;\">Sender Name</td>
            <td style=\"padding: 10px 12px; color: #ffffff; font-size: 15px; font-weight: 700;\">{$fullName}</td>
          </tr>
          <tr style=\"border-bottom: 1px solid #27272a; background-color: #18181b;\">
            <td style=\"padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;\">Email</td>
            <td style=\"padding: 10px 12px; color: #ffffff; font-size: 14px;\"><a href=\"mailto:{$email}\" style=\"color: #60a5fa;\">{$email}</a></td>
          </tr>
          <tr style=\"border-bottom: 1px solid #27272a; background-color: #1c1c20;\">
            <td style=\"padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;\">Telephone</td>
            <td style=\"padding: 10px 12px; color: #ffffff; font-size: 14px;\"><a href=\"tel:{$telephone}\" style=\"color: #60a5fa;\">{$telephone}</a></td>
          </tr>
          <tr style=\"background-color: #18181b;\">
            <td style=\"padding: 10px 12px; color: #ea580c; font-size: 12px; font-weight: 700; text-transform: uppercase;\">Message</td>
            <td style=\"padding: 12px; color: #f4f4f5; font-size: 13px; line-height: 18px; white-space: pre-wrap;\">{$message}</td>
          </tr>
        </table>
        <div style=\"text-align: center; font-size: 11px; color: #71717a; border-top: 1px solid #27272a; padding-top: 14px;\">
          Received: {$sentTime} &bull; Wrap &amp; Wings Co. Website Contact
        </div>
      </td>
    </tr>
  </table>
</body>
</html>";

$subject = "✉️ [NEW INQUIRY] {$fullName} - Website Contact Form";
$sent = send_hostinger_smtp('info@wrapandwings.co.za', $subject, $htmlContent, 'Wrap & Wings Co Website', 'orders@wrapandwings.co.za', $email);

if ($sent) {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Contact email sent via Hostinger PHP SMTP']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send contact email via Hostinger PHP']);
}
