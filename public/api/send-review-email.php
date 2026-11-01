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

$id = htmlspecialchars(isset($body['id']) ? $body['id'] : 'N/A');
$fullName = htmlspecialchars(isset($body['fullName']) ? $body['fullName'] : '');
$phone = htmlspecialchars(isset($body['phone']) ? $body['phone'] : '');
$receiptNumber = htmlspecialchars(isset($body['receiptNumber']) ? $body['receiptNumber'] : '');
$googleReviewName = htmlspecialchars(isset($body['googleReviewName']) ? $body['googleReviewName'] : '');
$rating = isset($body['rating']) ? (int)$body['rating'] : 5;
$comments = htmlspecialchars(isset($body['comments']) ? $body['comments'] : '');
$createdAt = htmlspecialchars(isset($body['createdAt']) ? $body['createdAt'] : date('Y-m-d H:i:s'));

if (empty($fullName) || empty($phone) || empty($receiptNumber)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required review fields']);
    exit(0);
}

$cleanDigits = preg_replace('/[^0-9]/', '', $phone);
if (strpos($cleanDigits, '0') === 0) {
    $cleanDigits = '27' . substr($cleanDigits, 1);
}
$stars = str_repeat('⭐', max(1, min(5, $rating)));

$commentsHtml = !empty($comments) ? "
<tr style=\"background-color: #18181b;\">
  <td style=\"padding: 10px 12px; color: #f59e0b; font-size: 12px; font-weight: 700; text-transform: uppercase;\">Feedback</td>
  <td style=\"padding: 12px; color: #fef3c7; font-size: 13px; font-style: italic; background-color: #27200d; line-height: 18px;\">\"{$comments}\"</td>
</tr>" : "";

$googleNameHtml = !empty($googleReviewName) ? $googleReviewName : '<em style="color: #71717a;">Same as customer name</em>';

$htmlContent = "<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <title>New Weekly Meal Draw Entry - {$fullName}</title>
</head>
<body style=\"margin: 0; padding: 12px 4px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\">
  <table role=\"presentation\" width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width: 580px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;\">
    <tr><td height=\"5\" style=\"background: #f59e0b; line-height: 5px; font-size: 5px;\">&nbsp;</td></tr>
    <tr>
      <td align=\"center\" style=\"padding: 24px 16px 18px 16px; background-color: #121215; border-bottom: 1px solid #27272a;\">
        <div style=\"font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #f59e0b; margin-bottom: 6px;\">🍗 WRAP &amp; WINGS CO.</div>
        <h1 style=\"margin: 0 0 8px 0; font-size: 22px; line-height: 28px; font-weight: 800; color: #ffffff;\">🏆 New Weekly Meal Draw Entry!</h1>
        <div style=\"display: inline-block; background-color: #27272a; color: #fef3c7; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 9999px; border: 1px solid #f59e0b;\">Entry ID: {$id}</div>
      </td>
    </tr>
    <tr>
      <td style=\"padding: 20px 16px;\">
        <table role=\"presentation\" width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse: collapse; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; margin-bottom: 20px;\">
          <tr style=\"border-bottom: 1px solid #27272a; background-color: #1c1c20;\">
            <td width=\"32%\" style=\"padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;\">Customer Name</td>
            <td style=\"padding: 10px 12px; color: #ffffff; font-size: 15px; font-weight: 700;\">{$fullName}</td>
          </tr>
          <tr style=\"border-bottom: 1px solid #27272a; background-color: #18181b;\">
            <td style=\"padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;\">WhatsApp / Cell</td>
            <td style=\"padding: 10px 12px; color: #ffffff; font-size: 14px;\"><a href=\"tel:{$phone}\" style=\"color: #60a5fa; text-decoration: none; font-weight: 600;\">{$phone}</a></td>
          </tr>
          <tr style=\"border-bottom: 1px solid #27272a; background-color: #1c1c20;\">
            <td style=\"padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;\">Order / Receipt #</td>
            <td style=\"padding: 10px 12px; color: #f59e0b; font-size: 14px; font-weight: 800;\">{$receiptNumber}</td>
          </tr>
          <tr style=\"border-bottom: 1px solid #27272a; background-color: #18181b;\">
            <td style=\"padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;\">Google Account</td>
            <td style=\"padding: 10px 12px; color: #e4e4e7; font-size: 14px;\">{$googleNameHtml}</td>
          </tr>
          <tr style=\"border-bottom: 1px solid #27272a; background-color: #1c1c20;\">
            <td style=\"padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;\">Review Rating</td>
            <td style=\"padding: 10px 12px; color: #ffffff; font-size: 14px;\">{$stars} <strong style=\"color: #f59e0b;\">({$rating}/5)</strong></td>
          </tr>
          {$commentsHtml}
        </table>
        <div style=\"text-align: center; font-size: 11px; color: #71717a; border-top: 1px solid #27272a; padding-top: 14px;\">
          Submitted at: {$createdAt} &bull; Wrap &amp; Wings Co. Google Review Campaign
        </div>
      </td>
    </tr>
  </table>
</body>
</html>";

$subject = "🍗 [MEAL DRAW ENTRY] {$fullName} (Slip #{$receiptNumber}) - {$rating}★ Review";
$sent = send_hostinger_smtp('info@wrapandwings.co.za', $subject, $htmlContent, 'Wrap & Wings Co', 'orders@wrapandwings.co.za', 'info@wrapandwings.co.za');

if ($sent) {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Review email sent via Hostinger PHP SMTP']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send review email via Hostinger PHP']);
}
