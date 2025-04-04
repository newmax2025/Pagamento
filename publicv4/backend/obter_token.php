<?php
header('Content-Type: application/json');
require 'config.php';

define('TOKEN_DB_KEY', 'token_bank');

try {
    $stmt = $conexao->prepare("SELECT valor FROM config WHERE chave = ?");
    $chave = TOKEN_DB_KEY;
    $stmt->bind_param("s", $chave);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        echo json_encode(['success' => true, 'token' => $row['valor']]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Token não encontrado.']);
    }

    $stmt->close();
    $conexao->close();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erro ao buscar token: ' . $e->getMessage()]);
}
?>
