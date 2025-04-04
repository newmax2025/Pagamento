// --- Elementos do DOM ---
// Elementos do Cadastro (NOVOS)
const registrationContainer = document.getElementById("registrationContainer");
const registrationForm = document.getElementById("registrationForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const registerButton = document.getElementById("registerButton");
const registrationMessage = document.getElementById("registrationMessage");

// Elementos do Pagamento (Existentes + ID adicionado)
const paymentContainer = document.getElementById("paymentContainer");
const selectValor = document.getElementById("dep_valor");
const depositButton = document.getElementById("depositButton");
const resultDiv = document.getElementById("dep_result");
const loggedInUserP = document.getElementById("loggedInUser");

// --- Variáveis Globais ---
let pessoaSelecionada = {};
let currentUser = null;

// -----------------------------------------------------------------------------
let token = "";

async function fetchToken() {
  try {
    const response = await fetch("../backend/get_token.php");
    const data = await response.json();
    
    if (data.success && data.token) {
      token = data.token;
    } else {
      console.error("Erro ao obter o token:", data.error || "Erro desconhecido");
    }
  } catch (error) {
    console.error("Erro ao buscar token do backend:", error);
  }
}

// Chamar fetchToken no início
fetchToken();

// -----------------------------------------------------------------------------

// --- Funções ---

// NOVO: Função para lidar com o cadastro
async function handleRegistration(event) {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  // Limpa mensagens anteriores e remove classes
  registrationMessage.textContent = "";
  registrationMessage.className = "message-area";

  // Validação básica no cliente
  if (!username || !password) {
    registrationMessage.textContent =
      "Por favor, preencha o usuário e a senha.";
    registrationMessage.classList.add("error");
    return;
  }

  // Desabilita botão e mostra feedback
  registerButton.disabled = true;
  registerButton.textContent = "Cadastrando...";

  const dataToSend = {
    username: username,
    password: password,
    vendedor_id: vendedorId, // ID do vendedor da URL
  };

  try {
    const response = await fetch("../backend/cadastro.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(dataToSend),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Sucesso no Cadastro
      registrationMessage.textContent = result.message;
      registrationMessage.classList.add("success");
      currentUser = username; // Armazena o usuário atual

      // Esconde cadastro, mostra pagamento após um pequeno delay
      setTimeout(() => {
        registrationContainer.style.display = "none";
        paymentContainer.style.display = "flex"; // Usa 'flex' pois .container tem display: flex
        if (loggedInUserP) {
          loggedInUserP.textContent = `Usuário: ${currentUser}`; // Mostra usuário logado
        }
      }, 1500);
    } else {
      // Falha no Cadastro (PHP retornou success: false ou erro HTTP)
      registrationMessage.textContent =
        result.message || "Erro desconhecido ao cadastrar.";
      registrationMessage.classList.add("error");
      // Reabilita o botão imediatamente em caso de erro
      registerButton.disabled = false;
      registerButton.textContent = "Cadastrar";
    }
  } catch (error) {
    // Erro na comunicação (rede, JSON inválido do PHP, etc.)
    console.error("Erro ao fazer fetch para cadastro.php:", error);
    registrationMessage.textContent =
      "Erro de comunicação com o servidor. Tente novamente.";
    registrationMessage.classList.add("error");
    // Reabilita o botão imediatamente em caso de erro
    registerButton.disabled = false;
    registerButton.textContent = "Cadastrar";
  }
  // Nota: O botão só é reabilitado em caso de erro. Se sucesso, o formulário some.
}

async function carregarPessoaAleatoria() {
  try {
    const response = await fetch("../assets/json/pessoas.json");
    if (!response.ok) {
      throw new Error(
        `Erro ao carregar ${response.url}: ${response.statusText}`
      );
    }
    const data = await response.json();

    if (data.pessoa && Array.isArray(data.pessoa) && data.pessoa.length > 0) {
      pessoaSelecionada =
        data.pessoa[Math.floor(Math.random() * data.pessoa.length)];
      
    } else {
      console.error("Nenhuma pessoa encontrada ou formato inválido no JSON.");
      pessoaSelecionada = {};
      // Informar erro na área de pagamento, não na de cadastro
      resultDiv.innerHTML =
        "<p style='color: red;'>Erro: Não foi possível carregar dados essenciais para o depósito (pessoas.json).</p>";
    }
  } catch (error) {
    console.error("Erro ao carregar o JSON de pessoas:", error);
    pessoaSelecionada = {};
    resultDiv.innerHTML = `<p style='color: red;'>Erro ao carregar dados de depósito: ${error.message}. Verifique o console.</p>`;
  }
}

// Função existente para depositar (sem alterações na lógica principal)
async function depositar() {
  const amount = selectValor.value;

  if (!pessoaSelecionada.cpf || !pessoaSelecionada.nome) {
    resultDiv.innerHTML =
      "<p style='color: red;'>Erro: Dados necessários para o depósito não foram carregados. Recarregue a página.</p>";
    return;
  }

  const data = {
    name: pessoaSelecionada.nome,
    description: `Deposito para usuario: ${currentUser || "N/A"}`,
    document: pessoaSelecionada.cpf,
    amount: amount,
  };

  resultDiv.innerHTML = "Processando seu depósito...";
  depositButton.disabled = true;

  try {
    const response = await fetch(
      "https://virtualpay.online/api/v1/transactions/deposit",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      let errorDetails = `Erro ${response.status}: ${response.statusText}`;
      try {
        const errorResult = await response.json();
        errorDetails += `<br>${
          errorResult.message || JSON.stringify(errorResult)
        }`;
      } catch (jsonError) {}
      throw new Error(errorDetails);
    }

    const result = await response.json();
    exibirResultado(result);

    // Inicia a checagem de pagamento com 0 tentativas
    checarPagamento(result.id, 0);
  } catch (error) {
    console.error("Erro ao processar depósito:", error);
    resultDiv.innerHTML = `<p style='color: red;'>Ocorreu um erro no depósito: ${error.message}</p>`;
  } finally {
    depositButton.disabled = false;
  }
}

// Função existente para exibir resultado (sem alterações)
// Função existente para exibir resultado (ATUALIZADA)

function exibirResultado(result) {
  let output = `<div class="resultado-container" style="text-align: center;">
                      <div><strong>ID:</strong> ${result.id || "N/A"}</div>
                      <div><strong>Valor:</strong> R$ ${
    parseFloat(result.amount).toFixed(2) || "N/A"
  } (${result.currency || "BRL"})</div>
                      <div id="statusPagamento"><strong>Status:</strong> ${
    result.status || "Pendente"
  }</div>`;

  if (result.qr_code) {
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      result.qr_code
    )}`;
    output += `
                  <div class='qr-container' style="margin-top: 20px;">
                    <p><strong>Escaneie ou copie o código PIX:</strong></p>
                    <img src='${qrImageUrl}' alt='QR Code PIX' style="max-width: 100%; height: auto;">
                    <br>
                    <input type='text' id='qr_code_text' value='${result.qr_code}' readonly style="width: 90%; max-width: 400px; text-align: center; margin-top: 10px;">
                    <br>
                    <button id='copyButton' style="margin-top: 10px;">Copiar</button>
                    <span id='copyFeedback' style='margin-left: 10px; color: green; display: none;'>Copiado!</span>
                  </div>`;
  } else {
    output += "<p style='color: orange;'>Código QR não disponível.</p>";
  }

  output += `</div>`; // Fecha resultado-container

  resultDiv.innerHTML = output;

  const copyButton = document.getElementById("copyButton");
  if (copyButton) {
    copyButton.removeEventListener("click", copiarCodigo);
    copyButton.addEventListener("click", copiarCodigo);
  }
}

// Função existente para copiar código (adaptada levemente para feedback)
function copiarCodigo() {
  const qrText = document.getElementById("qr_code_text");
  const copyFeedback = document.getElementById("copyFeedback");

  if (!qrText) return;

  qrText.select();
  qrText.setSelectionRange(0, 99999);

  try {
    navigator.clipboard
      .writeText(qrText.value)
      .then(() => {
        if (copyFeedback) {
          copyFeedback.style.display = "inline";
          setTimeout(() => {
            copyFeedback.style.display = "none";
          }, 2000);
        }
      })
      .catch((err) => {
        console.warn(
          "Falha ao usar Clipboard API, tentando método legado:",
          err
        );
        legacyCopy(qrText, copyFeedback); // Chama fallback
      });
  } catch (e) {
    console.warn("Clipboard API não disponível, tentando método legado.");
    legacyCopy(qrText, copyFeedback); // Chama fallback
  }
}

// Função legado para copiar (sem alterações)
function legacyCopy(inputElement, feedbackElement) {
  try {
    const successful = document.execCommand("copy");
    if (successful) {
      if (feedbackElement) {
        feedbackElement.style.display = "inline";
        setTimeout(() => {
          feedbackElement.style.display = "none";
        }, 2000);
      }
    } else {
      throw new Error('document.execCommand("copy") falhou.');
    }
  } catch (err) {
    console.error("Erro ao copiar código PIX (método legado):", err);
    alert("Erro ao copiar o código. Por favor, copie manualmente.");
  }
}

// Função para checar status do pagamento repetidamente

async function checarPagamento(transacaoId, tentativas = 0) {
  if (!transacaoId) {
    console.error("ID da transação é inválido.");
    return;
  }

  try {
    const response = await fetch(
      `https://virtualpay.online/api/v1/transactions/${transacaoId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    const statusDiv = document.getElementById("statusPagamento");

    if (statusDiv && result.status) {
      statusDiv.innerHTML = `<strong>Status do Pagamento:</strong> ${result.status}`;

      if (result.status.toLowerCase() === "paid") {
        statusDiv.innerHTML += `<p style='color: green;'><strong>Pagamento confirmado!</strong></p>`;
        setTimeout(() => {
          statusForm();
          window.location.href = "pagamento_confirmado.php";
        }, 2000);
      } else {
        if (tentativas < 60) {
          setTimeout(() => checarPagamento(transacaoId, tentativas + 1), 5000);
        } else {
          statusDiv.innerHTML += `<p style='color: red;'>Tempo limite para pagamento atingido. Recarregue a página.</p>`;
        }
      }
    } else {
      resultDiv.innerHTML += `<p style='color: red;'>Erro ao buscar status do pagamento.</p>`;
    }
  } catch (error) {
    console.error("Erro ao verificar pagamento:", error);
    resultDiv.innerHTML += `<p style='color: red;'>Erro ao verificar pagamento: ${error.message}</p>`;
  }
}

// Alterar Status do Usuário
async function statusForm() {
  const username = loggedInUserP;
  const status = ativo;
  mensagemStatus.textContent = "";

  try {
    const response = await fetch("../backend/alterar_status.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, status }),
    });

    const result = await response.json();
  } catch (error) {
    handleFetchError(error, mensagemStatus, "alteração de status");
  }
}

// --- Inicialização e Event Listeners ---

// Adiciona listener para o formulário de CADASTRO
if (registrationForm) {
  registrationForm.addEventListener("submit", handleRegistration);
} else {
  console.error("Formulário de cadastro não encontrado no DOM.");
}

// Adiciona listener para o botão de DEPÓSITO
if (depositButton) {
  depositButton.addEventListener("click", depositar);
} else {
  console.error("Botão de depósito não encontrado no DOM.");
}

// Carrega a pessoa aleatória quando o script é executado
carregarPessoaAleatoria();
