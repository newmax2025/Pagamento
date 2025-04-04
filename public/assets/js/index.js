function onCaptchaSuccess(token) {
    const messageArea = document.getElementById('messageArea');
    messageArea.textContent = "Verificando...";
    messageArea.className = "message-loading";

    fetch('../../backend/verificar_turnstile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                messageArea.textContent = "Verificação concluída!";
                messageArea.className = "message-success";
                setTimeout(() => { window.location.href = '../../views/pagamento.php'; }, 1000);
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