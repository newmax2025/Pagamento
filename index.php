<?php
session_start();

if (isset($_GET['v'])) {
    $_SESSION['vendedor_id'] = $_GET['v'];
}
?>
<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificando Acesso</title>
    <link rel="stylesheet" href="public/assets/css/index.css?v=<?php echo md5_file('public/assets/css/index.css'); ?>"> 
</head>

<body>

    <h1>Verificando seu acesso...</h1>
    <p>Por favor, complete a verificação abaixo para continuar.</p>

    <div id="turnstileWidget" class="cf-turnstile" data-sitekey="0x4AAAAAABDh4JE-w5e88_Qn" data-callback="onCaptchaSuccess"
        data-error-callback="onCaptchaError">
    </div>

    <div id="messageArea" aria-live="polite"></div>

    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <script>
        function onCaptchaSuccess(token) {
            const messageArea = document.getElementById('messageArea');
            messageArea.textContent = "Verificando...";
            messageArea.className = "message-loading";

            fetch('public/backend/verificar_turnstile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ token })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        messageArea.textContent = "Verificação concluída!";
                        messageArea.className = "message-success";
                        setTimeout(() => { window.location.href = 'public/views/pagamento.php'; }, 1000);
                    } else {
                        messageArea.textContent = "Falha na verificação. Tente novamente.";
                        messageArea.className = "message-error";
                    }
                })
                .catch(() => {
                    messageArea.textContent = "Erro ao validar. Tente novamente.";
                    messageArea.className = "message-error";
                });
        }
    </script>


</body>

</html>