<?php
session_start();
?>

<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cadastro e Pagamento</title>
    
    <link rel="stylesheet" href="../assets/css/pagamentos.css?v=<?php echo md5_file('../assets/css/pagamentos.css'); ?>"> 
</head>

<body>

    <div id="registrationContainer" class="container" style="background-color:  #000d1e;">
        <img src="../assets/img/New Max Buscas.png" alt="Logo do Cliente" class="logo">
        <h1>Cadastro de Usuário</h1>
        <form id="registrationForm">
            <div class="form-group">
                <label for="username">Usuário:</label>
                <input type="text" id="username" placeholder="Digite seu nome de usuário" required>
            </div>
            <div class="form-group">
                <label for="password">Senha:</label>
                <input type="password" id="password" placeholder="Digite sua senha" required>
            </div>
            <button type="submit" id="registerButton">Cadastrar</button>
            <div id="registrationMessage" class="message-area">
            </div>
            <div class="copy">
                <p>New Max Pay | Tecnologia de Pagamento</p>
            </div>
        </form>
    </div>

    <div id="paymentContainer" class="container" style="display: none;">
        <img src="../assets/img/New Max Buscas.png" alt="Logo do Cliente" class="logo">
        <h1>Pagamento</h1>
        <label>Selecione seu plano:
            <select id="dep_valor">
                <option value="120">Plano Simples: R$120,00</option>
                <option value="200">Plano Básico: R$200,00</option>
                <option value="300">Plano Premium: R$300,00</option>
                <option value="2520">Plano Premium Anual: R$2.520,00</option>
            </select>
        </label>
        <button id="depositButton">Assinar PLano</button>
        <div id="dep_result">
        </div>
        <div class="copy">
            <p>New Max Pay | Tecnologia de Pagamento</p>
        </div>
        <p id="loggedInUser" style="margin-top: 15px; font-size: 0.9em;"></p>
    </div>

    <script>
        const vendedorId = <?= json_encode($_SESSION['vendedor_id'] ?? null); ?>;
        console.log("ID do vendedor:", vendedorId);
    </script>

    <script src="../assets/js/pagamento.js?v=<?php echo md5_file('../assets/js/pagamento.js'); ?>"></script> 
</body>

</html>