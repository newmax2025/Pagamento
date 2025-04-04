<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    $stmt = $conexao->prepare("SELECT valor FROM config WHERE chave_bank = 'token'");
    $stmt->execute();
    $stmt->bind_result($token);
    $stmt->fetch();
    $stmt->close();

    if ($token) {
        echo json_encode(['success' => true, 'token' => $token]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Token não encontrado.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
