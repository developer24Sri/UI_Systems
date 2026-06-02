<?php

require_once __DIR__ . "/../config/config.php";

function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function createJWT($payload, $expirySeconds) {
    $header = [
        "alg" => "HS256",
        "typ" => "JWT"
    ];

    $payload["exp"] = time() + $expirySeconds;

    $headerEncoded = base64UrlEncode(json_encode($header));
    $payloadEncoded = base64UrlEncode(json_encode($payload));

    $signature = hash_hmac(
        "sha256",
        $headerEncoded . "." . $payloadEncoded,
        JWT_SECRET,
        true
    );

    $signatureEncoded = base64UrlEncode($signature);

    return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
}

function verifyJWT($token) {
    $parts = explode(".", $token);

    if (count($parts) !== 3) return false;

    [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

    $expectedSignature = base64UrlEncode(
        hash_hmac(
            "sha256",
            $headerEncoded . "." . $payloadEncoded,
            JWT_SECRET,
            true
        )
    );

    if (!hash_equals($expectedSignature, $signatureEncoded)) {
        return false;
    }

    $payload = json_decode(base64UrlDecode($payloadEncoded), true);

    if ($payload["exp"] < time()) {
        return false;
    }

    return $payload;
}


/*
This file does two main things:
Create token
Verify token

A) base64URLEncode:
+ / - are not URL safe JWT requires URL safe encoding so + -> -, / -> _ and removes =

B) we createJWT():
i) header:
which says algorithm = HS256 and type as JWT 

ii) add expiry:
time() gives current UNIX timestamp and expirySeconds give future timestamp
i.e if now 17000000 + expiry(120 sec) then 17000000120 

iii) encode header and payload:
by doing this,
    $headerEncoded = base64UrlEncode(json_encode($header));
    $payloadEncoded = base64UrlEncode(json_encode($payload));
we get xxx.yyy

iv) signature:
we are doing HMAC_SHA256(
    header.payload,
    secret
)
HMAC means hash with secret key

v) encoding signature:
$signatureEncoded = base64UrlEncode($signature);

where the full token becomes header.payload.signature

C) verifyJWT():
i) checking the structure by doing,
$parts = explode(".", $token);
if (count($parts) !== 3) return false;

ii)signature check:
we re-calculate the signature:
$expectedSignature = base64UrlEncode(
    hash_hmac(
        "sha256",
        $headerEncoded . "." . $payloadEncoded,
        JWT_SECRET,
        true
    )
);
then,
if (!hash_equals($expectedSignature, $signatureEncoded)) {
    return false;
}
i.e if signature dose'nt match then token is tampered   

iii) expiry check:
if expired then invalid or if all good return payload which means 
return 
[
  "user_id" => 1,
  "username" => "vatsan",
  "role" => "user",
  "exp" => 1700000120
]
like this

*/