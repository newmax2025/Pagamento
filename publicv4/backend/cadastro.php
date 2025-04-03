<?php
// Define o tipo de conteúdo como JSON
header('Content-Type: application/json');
// Inicia o buffer de saída para evitar saídas acidentais antes do JSON
ob_start();

// Inclui a configuração do banco de dados e outras configurações
// Isso fornecerá a variável $conexao
require 'config.php';

try {
    // Recebendo os dados via POST com corpo JSON
    $data = json_decode(file_get_contents("php://input"), true);

    // Verifica se os dados foram recebidos e decodificados corretamente
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new InvalidArgumentException("Erro ao decodificar JSON recebido.");
    }

    // Verifica se os campos esperados existem
    if (!isset($data["username"]) || !isset($data["password"])) {
         throw new InvalidArgumentException("Campos 'username' e 'password' são obrigatórios.");
    }

    $user = trim($data["username"]);
    $pass = trim($data["password"]);

    // Validação básica dos campos
    if (empty($user) || empty($pass)) {
         // Note: Usamos echo/exit em vez de die para consistência
        echo json_encode(["success" => false, "message" => "Preencha todos os campos!"]);
        exit();
    }

    // Verifica se o usuário já existe
    $sqlCheck = "SELECT id FROM clientes WHERE usuario = ?";
    $stmtCheck = $conexao->prepare($sqlCheck);
    $stmtCheck->bind_param("s", $user);
    $stmtCheck->execute();
    $resultCheck = $stmtCheck->get_result();

    if ($resultCheck->num_rows > 0) {
        $stmtCheck->close(); // Fecha o statement antes de sair
        echo json_encode(["success" => false, "message" => "Usuário já cadastrado."]);
        exit();
    }
    $stmtCheck->close(); // Fecha mesmo se não encontrou

    // Criptografar a senha antes de salvar
    $hashed_password = password_hash($pass, PASSWORD_DEFAULT);
    if ($hashed_password === false) {
         throw new RuntimeException("Erro ao gerar hash da senha.");
    }

    // Insere no banco de dados
    $sqlInsert = "INSERT INTO clientes (usuario, senha) VALUES (?, ?)";
    $stmtInsert = $conexao->prepare($sqlInsert);
    // Verifica se a preparação foi bem-sucedida
     if ($stmtInsert === false) {
        throw new RuntimeException("Erro ao preparar a inserção no banco de dados: " . $conexao->error);
     }
    $stmtInsert->bind_param("ss", $user, $hashed_password);

    if ($stmtInsert->execute()) {
        echo json_encode(["success" => true, "message" => "Usuário cadastrado com sucesso!"]);
    } else {
        // Não lança exceção aqui, apenas reporta falha na execução
        echo json_encode(["success" => false, "message" => "Erro ao cadastrar usuário."]);
    }

    $stmtInsert->close();

} catch (mysqli_sql_exception $e) {
    // Captura erros específicos do MySQL (lançados por mysqli_report)
    ob_end_clean(); // Limpa buffer caso algo tenha sido ecoado antes
    error_log("Erro de Banco de Dados (cadastro.php): " . $e->getMessage()); // Loga o erro real
    echo json_encode(["success" => false, "message" => "Erro interno no servidor [DB]."]); // Mensagem genérica para o usuário

} catch (InvalidArgumentException $e) {
    // Captura erros de dados de entrada inválidos
     ob_end_clean();
     echo json_encode(["success" => false, "message" => $e->getMessage()]); // Mensagem específica da validação

} catch (Exception $e) {
    // Captura outros erros gerais
    ob_end_clean();
    error_log("Erro Geral (cadastro.php): " . $e->getMessage()); // Loga o erro real
    echo json_encode(["success" => false, "message" => "Erro interno no servidor."]); // Mensagem genérica

} finally {
     // Garante que a conexão seja fechada se estiver aberta (opcional, PHP geralmente cuida disso)
     if (isset($conexao) && $conexao instanceof mysqli && $conexao->thread_id) {
       // $conexao->close(); // Descomente se quiser fechar explicitamente
     }
     ob_end_flush(); // Envia o buffer de saída (o JSON)
}
?>