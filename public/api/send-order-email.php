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
$order = isset($body['order']) ? $body['order'] : null;

if (!$order || empty($order['orderId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid order data']);
    exit(0);
}

$orderId = htmlspecialchars($order['orderId']);
$customerName = htmlspecialchars(isset($order['customer']['customerName']) ? $order['customer']['customerName'] : 'Customer');
$customerPhone = htmlspecialchars(isset($order['customer']['phone']) ? $order['customer']['phone'] : 'Not provided');
$cleanDigits = preg_replace('/[^0-9]/', '', $customerPhone);
if (strpos($cleanDigits, '0') === 0) {
    $cleanDigits = '27' . substr($cleanDigits, 1);
}

$orderMode = (isset($order['orderMode']) && $order['orderMode'] === 'collection') ? 'Collection' : 'Delivery';
$preferredTime = htmlspecialchars(isset($order['preferredTime']) ? $order['preferredTime'] : 'ASAP');
$address = ($orderMode === 'Delivery') 
    ? htmlspecialchars((isset($order['customer']['address']) ? $order['customer']['address'] : '') . ', ' . (isset($order['customer']['suburb']) ? $order['customer']['suburb'] : 'Pinetown'))
    : 'Store Collection (Pine Crest Centre, Pinetown)';
$notes = htmlspecialchars(isset($order['customer']['notes']) ? $order['customer']['notes'] : '');
$createdAt = htmlspecialchars(isset($order['createdAt']) ? $order['createdAt'] : date('Y-m-d H:i:s'));

$paymentMethod = isset($order['paymentMethod']) ? $order['paymentMethod'] : 'cod';
$paymentLabel = ($paymentMethod === 'payfast') ? 'PayFast Online (Confirmed Paid)' : (($paymentMethod === 'whatsapp') ? 'WhatsApp Order' : 'Pay on ' . $orderMode . ' (Card / Cash)');

$subtotal = 'R' . number_format((float)(isset($order['subtotal']) ? $order['subtotal'] : 0), 2);
$deliveryFee = 'R' . number_format((float)(isset($order['deliveryFee']) ? $order['deliveryFee'] : 0), 2);
$tip = 'R' . number_format((float)(isset($order['tip']) ? $order['tip'] : 0), 2);
$grandTotal = 'R' . number_format((float)(isset($order['grandTotal']) ? $order['grandTotal'] : 0), 2);

$itemsRows = '';
if (!empty($order['items']) && is_array($order['items'])) {
    $itemCount = count($order['items']);
    foreach ($order['items'] as $idx => $item) {
        $qty = isset($item['quantity']) ? (int)$item['quantity'] : 1;
        $name = htmlspecialchars(isset($item['menuItem']['name']) ? $item['menuItem']['name'] : 'Meal');
        $itemTotal = 'R' . number_format((float)(isset($item['itemTotal']) ? $item['itemTotal'] : 0), 2);
        
        $details = [];
        if (!empty($item['customization']['flavour'])) {
            $details[] = 'Flavour: <strong style="color: #f59e0b;">' . htmlspecialchars($item['customization']['flavour']) . '</strong>';
        }
        if (!empty($item['customization']['side'])) {
            $details[] = 'Side: <strong style="color: #e4e4e7;">' . htmlspecialchars($item['customization']['side']) . '</strong>';
        }
        if (!empty($item['customization']['extras']) && is_array($item['customization']['extras'])) {
            $extraNames = array_map(function($e) { return htmlspecialchars($e['name']); }, $item['customization']['extras']);
            $details[] = 'Extras: <em>' . implode(', ', $extraNames) . '</em>';
        }
        if (!empty($item['customization']['notes'])) {
            $details[] = 'Note: <em>' . htmlspecialchars($item['customization']['notes']) . '</em>';
        }
        $detailsHtml = !empty($details) ? '<div style="font-size: 12px; color: #a1a1aa; margin-top: 3px; line-height: 16px;">' . implode(' &bull; ', $details) . '</div>' : '';

        $borderStyle = ($idx === $itemCount - 1) ? '' : 'border-bottom: 1px solid #27272a;';
        $itemsRows .= "
        <tr style=\"{$borderStyle}\">
          <td style=\"padding: 10px 8px; text-align: center; vertical-align: top;\">
            <span style=\"display: inline-block; background-color: #27272a; color: #f59e0b; font-weight: 800; font-size: 12px; padding: 2px 7px; border-radius: 4px;\">{$qty}x</span>
          </td>
          <td style=\"padding: 10px 10px; vertical-align: top;\">
            <div style=\"color: #ffffff; font-size: 14px; font-weight: 700; line-height: 18px;\">{$name}</div>
            {$detailsHtml}
          </td>
          <td style=\"padding: 10px 10px; text-align: right; vertical-align: top; color: #ffffff; font-size: 14px; font-weight: 700; white-space: nowrap;\">
            {$itemTotal}
          </td>
        </tr>";
    }
}

$notesHtml = !empty($notes) ? "
<tr style=\"background-color: #18181b;\">
  <td style=\"padding: 10px 12px; color: #f59e0b; font-size: 12px; font-weight: 700; text-transform: uppercase;\">Instructions</td>
  <td style=\"padding: 10px 12px; color: #fef3c7; font-size: 13px; font-style: italic; background-color: #27200d;\">\"{$notes}\"</td>
</tr>" : "";

$deliveryFeeHtml = ($orderMode === 'Delivery') ? "
<tr>
  <td style=\"padding: 6px 4px; color: #a1a1aa; font-size: 13px;\">Delivery Fee:</td>
  <td align=\"right\" style=\"padding: 6px 4px; color: #ffffff; font-size: 13px; font-weight: 600;\">{$deliveryFee}</td>
</tr>" : "";

$tipHtml = !empty($order['tip']) ? "
<tr>
  <td style=\"padding: 6px 4px; color: #a1a1aa; font-size: 13px;\">Driver Tip:</td>
  <td align=\"right\" style=\"padding: 6px 4px; color: #ffffff; font-size: 13px; font-weight: 600;\">{$tip}</td>
</tr>" : "";

$htmlContent = "<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <title>New Order #{$orderId}</title>
</head>
<body style=\"margin: 0; padding: 10px 4px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\">
  <table role=\"presentation\" width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width: 580px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;\">
    <tr><td height=\"4\" style=\"background: #ea580c; line-height: 4px; font-size: 4px;\">&nbsp;</td></tr>
    <tr>
      <td align=\"center\" style=\"padding: 22px 16px 18px 16px; background-color: #121215; border-bottom: 1px solid #27272a;\">
        <div style=\"font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #f59e0b; margin-bottom: 6px;\">🌯 WRAP &amp; WINGS CO.</div>
        <h1 style=\"margin: 0 0 8px 0; font-size: 21px; line-height: 26px; font-weight: 800; color: #ffffff;\">Someone just submitted their order!</h1>
        <div style=\"display: inline-block; background-color: #27272a; color: #e4e4e7; font-size: 13px; font-weight: 700; padding: 5px 14px; border-radius: 9999px; border: 1px solid #3f3f46;\">Order #{$orderId} - {$orderMode}</div>
      </td>
    </tr>
    <tr>
      <td style=\"padding: 16px;\">
        <table role=\"presentation\" width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse: collapse; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; margin-bottom: 20px;\">
          <tr style=\"border-bottom: 1px solid #27272a; background-color: #1c1c20;\">
            <td width=\"28%\" style=\"padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;\">Customer</td>
            <td style=\"padding: 10px 12px; color: #ffffff; font-size: 14px; font-weight: 700;\">{$customerName}</td>
          </tr>
          <tr style=\"border-bottom: 1px solid #27272a; background-color: #18181b;\">
            <td style=\"padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;\">Phone</td>
            <td style=\"padding: 10px 12px; color: #ffffff; font-size: 14px;\"><a href=\"tel:{$customerPhone}\" style=\"color: #60a5fa; text-decoration: none; font-weight: 600;\">{$customerPhone}</a></td>
          </tr>
          <tr style=\"border-bottom: 1px solid #27272a; background-color: #1c1c20;\">
            <td style=\"padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;\">Fulfillment</td>
            <td style=\"padding: 10px 12px; color: #ffffff; font-size: 14px;\">{$orderMode} - {$preferredTime}</td>
          </tr>
          <tr style=\"border-bottom: 1px solid #27272a; background-color: #18181b;\">
            <td style=\"padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;\">Address</td>
            <td style=\"padding: 10px 12px; color: #e4e4e7; font-size: 13px;\">{$address}</td>
          </tr>
          <tr style=\"border-bottom: 1px solid #27272a; background-color: #1c1c20;\">
            <td style=\"padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase;\">Payment</td>
            <td style=\"padding: 10px 12px; color: #22c55e; font-size: 13px; font-weight: 700;\">{$paymentLabel}</td>
          </tr>
          {$notesHtml}
        </table>

        <div style=\"font-size: 12px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #ea580c; margin-bottom: 8px;\">🛒 Order Items</div>
        <table role=\"presentation\" width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse: collapse; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; margin-bottom: 16px; background-color: #18181b;\">
          <thead>
            <tr style=\"background-color: #202024; border-bottom: 1px solid #27272a;\">
              <th width=\"42\" style=\"padding: 8px; font-size: 11px; font-weight: 700; color: #a1a1aa; text-align: center;\">Qty</th>
              <th style=\"padding: 8px 10px; font-size: 11px; font-weight: 700; color: #a1a1aa; text-align: left;\">Item</th>
              <th width=\"75\" style=\"padding: 8px 10px; font-size: 11px; font-weight: 700; color: #a1a1aa; text-align: right;\">Total</th>
            </tr>
          </thead>
          <tbody>{$itemsRows}</tbody>
        </table>

        <table role=\"presentation\" width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin-bottom: 12px;\">
          <tr>
            <td style=\"padding: 6px 4px; color: #a1a1aa; font-size: 13px;\">Subtotal:</td>
            <td align=\"right\" style=\"padding: 6px 4px; color: #ffffff; font-size: 13px; font-weight: 600;\">{$subtotal}</td>
          </tr>
          {$deliveryFeeHtml}
          {$tipHtml}
        </table>

        <table role=\"presentation\" width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #121215; border: 1px solid #ea580c; border-radius: 8px; margin-bottom: 16px;\">
          <tr>
            <td style=\"padding: 12px 14px; color: #e4e4e7; font-size: 15px; font-weight: 800;\">GRAND TOTAL:</td>
            <td align=\"right\" style=\"padding: 12px 14px; color: #ea580c; font-size: 22px; font-weight: 900;\">{$grandTotal}</td>
          </tr>
        </table>

        <div style=\"text-align: center; font-size: 11px; color: #71717a;\">Order Placed: {$createdAt} &bull; Wrap &amp; Wings Co. Pine Crest Centre</div>
      </td>
    </tr>
  </table>
</body>
</html>";

$subject = "🌯 [NEW ORDER] #{$orderId} - " . strtoupper($orderMode) . " - {$customerName} ({$grandTotal})";
$sent = send_hostinger_smtp('orders@wrapandwings.co.za', $subject, $htmlContent, 'Wrap & Wings Co Orders', 'orders@wrapandwings.co.za', isset($order['customer']['email']) ? $order['customer']['email'] : '');

if ($sent) {
    http_response_code(200);
    echo json_encode(['success' => true, message => 'Order email sent via Hostinger PHP SMTP']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email via Hostinger PHP']);
}
