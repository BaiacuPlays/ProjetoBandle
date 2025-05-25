<?php
// Script para servir arquivos de áudio na Hostinger
// Criado para contornar restrições de acesso direto

// Configurar headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Responder a requisições OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Obter o arquivo solicitado
$file = isset($_GET['file']) ? $_GET['file'] : '';

if (empty($file)) {
    http_response_code(400);
    echo 'Arquivo não especificado';
    exit();
}

// Sanitizar o caminho do arquivo
$file = str_replace(['../', '..\\', '\\'], '', $file);
$filePath = __DIR__ . '/audio/' . $file;

// Verificar se o arquivo existe
if (!file_exists($filePath)) {
    http_response_code(404);
    echo 'Arquivo não encontrado: ' . htmlspecialchars($file);
    exit();
}

// Verificar se é um arquivo de áudio válido
$allowedExtensions = ['mp3', 'wav', 'ogg'];
$fileExtension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

if (!in_array($fileExtension, $allowedExtensions)) {
    http_response_code(403);
    echo 'Tipo de arquivo não permitido';
    exit();
}

// Configurar headers para o tipo de arquivo
$mimeTypes = [
    'mp3' => 'audio/mpeg',
    'wav' => 'audio/wav',
    'ogg' => 'audio/ogg'
];

$mimeType = $mimeTypes[$fileExtension] ?? 'application/octet-stream';

// Configurar headers para streaming
header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($filePath));
header('Accept-Ranges: bytes');
header('Cache-Control: public, max-age=3600');

// Suporte para Range requests (para permitir seek no áudio)
if (isset($_SERVER['HTTP_RANGE'])) {
    $range = $_SERVER['HTTP_RANGE'];
    $fileSize = filesize($filePath);
    
    // Parse do range header
    if (preg_match('/bytes=(\d+)-(\d*)/', $range, $matches)) {
        $start = intval($matches[1]);
        $end = !empty($matches[2]) ? intval($matches[2]) : $fileSize - 1;
        
        if ($start < $fileSize && $end < $fileSize && $start <= $end) {
            header('HTTP/1.1 206 Partial Content');
            header("Content-Range: bytes $start-$end/$fileSize");
            header('Content-Length: ' . ($end - $start + 1));
            
            $file = fopen($filePath, 'rb');
            fseek($file, $start);
            echo fread($file, $end - $start + 1);
            fclose($file);
            exit();
        }
    }
}

// Servir o arquivo completo
readfile($filePath);
exit();
?>
