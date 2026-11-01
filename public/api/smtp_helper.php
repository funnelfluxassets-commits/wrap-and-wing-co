<?php
// Hostinger SMTP Socket Mailer
function send_hostinger_smtp($to, $subject, $htmlContent, $fromName = 'Wrap & Wings Co Orders', $fromEmail = 'orders@wrapandwings.co.za', $replyTo = '') {
    $host = 'ssl://smtp.hostinger.com';
    $port = 465;
    $user = 'orders@wrapandwings.co.za';
    $pass = 'Orders_3858-!';

    $socket = @fsockopen($host, $port, $errno, $errstr, 15);
    if (!$socket) {
        // Fallback to PHP native mail()
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $headers .= "From: \"{$fromName}\" <{$fromEmail}>\r\n";
        if (!empty($replyTo)) {
            $headers .= "Reply-To: {$replyTo}\r\n";
        }
        return @mail($to, $subject, $htmlContent, $headers);
    }

    function read_smtp($s) {
        $data = '';
        while ($str = fgets($s, 515)) {
            $data .= $str;
            if (substr($str, 3, 1) === ' ') { break; }
        }
        return $data;
    }

    read_smtp($socket);
    fputs($socket, "EHLO wrapandwings.co.za\r\n");
    read_smtp($socket);
    fputs($socket, "AUTH LOGIN\r\n");
    read_smtp($socket);
    fputs($socket, base64_encode($user) . "\r\n");
    read_smtp($socket);
    fputs($socket, base64_encode($pass) . "\r\n");
    read_smtp($socket);
    fputs($socket, "MAIL FROM:<{$user}>\r\n");
    read_smtp($socket);
    fputs($socket, "RCPT TO:<{$to}>\r\n");
    read_smtp($socket);
    fputs($socket, "DATA\r\n");
    read_smtp($socket);

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $msg = "From: \"{$fromName}\" <{$fromEmail}>\r\n";
    $msg .= "To: <{$to}>\r\n";
    if (!empty($replyTo)) {
        $msg .= "Reply-To: <{$replyTo}>\r\n";
    }
    $msg .= "Subject: {$encodedSubject}\r\n";
    $msg .= "MIME-Version: 1.0\r\n";
    $msg .= "Content-Type: text/html; charset=UTF-8\r\n";
    $msg .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $msg .= $htmlContent . "\r\n.\r\n";

    fputs($socket, $msg);
    read_smtp($socket);
    fputs($socket, "QUIT\r\n");
    read_smtp($socket);
    fclose($socket);
    return true;
}
