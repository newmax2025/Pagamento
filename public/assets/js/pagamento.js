// --- Elementos do DOM ---
// Elementos do Cadastro (NOVOS)
const registrationContainer = document.getElementById("registrationContainer");
const registrationForm = document.getElementById("registrationForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const registerButton = document.getElementById("registerButton"); // Referência ao botão
const registrationMessage = document.getElementById("registrationMessage");

// Elementos do Pagamento (Existentes + ID adicionado)
const paymentContainer = document.getElementById("paymentContainer"); // ID adicionado
const selectValor = document.getElementById("dep_valor");
const depositButton = document.getElementById("depositButton");
const resultDiv = document.getElementById("dep_result");
const loggedInUserP = document.getElementById("loggedInUser"); // Parágrafo para usuário logado

// --- Variáveis Globais ---
let pessoaSelecionada = {}; // Objeto para armazenar a pessoa aleatória do JSON
let currentUser = null; // Para armazenar o nome do usuário cadastrado (NOVO)

// -----------------------------------------------------------------------------
// ⚠️ ALERTA DE SEGURANÇA CRÍTICO - Token de API de Pagamento! ⚠️
// Este token AINDA está exposto no Frontend. Isso é MUITO INSEGURO.
// Mova a chamada da API de DEPÓSITO para um Backend.
const token = "108|MqJWTU0DWwIuviMGnIUKyPBvyWyfhggAEngx5hqT6611b86d";
// -----------------------------------------------------------------------------

// --- Funções ---

// NOVO: Função para lidar com o cadastro
async function handleRegistration(event) {
  event.preventDefault(); // Impede o envio padrão do formulário

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  // Limpa mensagens anteriores e remove classes
  registrationMessage.textContent = "";
  registrationMessage.className = "message-area"; // Reseta as classes

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
  };

  try {
    // Certifique-se que 'cadastro.php' está no local correto (mesma pasta ou caminho relativo)
    const response = await fetch("../backend/cadastro.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json", // Indica que esperamos JSON de volta
      },
      body: JSON.stringify(dataToSend),
    });

    // Mesmo que a resposta não seja 'ok' (e.g., 400, 500), ainda pode ter um corpo JSON com erro
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
        // Carrega dados para pagamento (se ainda não carregou ou precisa recarregar)
        // A chamada original já está no fim do script, talvez não precise chamar de novo aqui
        // carregarPessoaAleatoria(); // Descomente se necessário
      }, 1500); // Delay de 1.5 segundos para o usuário ler a msg
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

// Função existente para carregar pessoa aleatória (ajustar caminho se necessário)
async function carregarPessoaAleatoria() {
  try {
    // Confirme se este caminho está correto para sua estrutura
    
    const response = await fetch("../assets/json/pessoas.json"); // ou '../json/pessoas.json' ou 'pessoas.json'
    if (!response.ok) {
      throw new Error(
        `Erro ao carregar ${response.url}: ${response.statusText}`
      );
    }
    const data = await response.json();

    if (data.pessoa && Array.isArray(data.pessoa) && data.pessoa.length > 0) {
      pessoaSelecionada =
        data.pessoa[Math.floor(Math.random() * data.pessoa.length)];
      console.log(
        "Pessoa aleatória para depósito carregada:",
        pessoaSelecionada.nome
      );
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
    description: `Deposito para usuario: ${currentUser || "N/A"}`, // Inclui usuário na descrição (opcional)
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
          // ⚠️ TOKEN INSEGURO AQUI! Mover para Backend! ⚠️
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
  } catch (error) {
    console.error("Erro ao processar depósito:", error);
    resultDiv.innerHTML = `<p style='color: red;'>Ocorreu um erro no depósito: ${error.message}</p>`;
  } finally {
    depositButton.disabled = false;
  }
}

// Função existente para exibir resultado (sem alterações)
function exibirResultado(result) {
  // Usa textContent para segurança onde possível, mas innerHTML é necessário para tags HTML
  let output = `<strong>ID:</strong> ${result.id || "N/A"} <br>
                  <strong>Valor:</strong> R$ ${
                    parseFloat(result.amount).toFixed(2) || "N/A"
                  } (${result.currency || "BRL"}) <br>
                  <strong>Status:</strong> ${result.status || "Pendente"} <br>`;

  if (result.qr_code) {
    // Usa um serviço externo para gerar o QR Code. Considere gerar no backend se possível.
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      result.qr_code
    )}`;
    output += `<div class='qr-container'>
                       <p><strong>Escaneie ou copie o código PIX:</strong></p>
                       <img src='${qrImageUrl}' alt='QR Code PIX'>
                       <br>
                       <input type='text' id='qr_code_text' value='${result.qr_code}' readonly>
                       <button id='copyButton'>Copiar</button>
                       <span id='copyFeedback' style='margin-left: 10px; color: green; display: none;'>Copiado!</span>
                   </div>`;
  } else {
    output += "<p style='color: orange;'>Código QR não disponível.</p>";
  }
  resultDiv.innerHTML = output; // Insere o HTML construído na div

  // Adiciona o listener para o botão copiar APÓS ele ser adicionado ao DOM
  const copyButton = document.getElementById("copyButton");
  if (copyButton) {
    // Remove listener antigo se existir (caso deposite várias vezes)
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

// Carrega a pessoa aleatória quando o script é executado (necessário para o pagamento depois)
// Garanta que o caminho para 'pessoas.json' está correto aqui!
carregarPessoaAleatoria(); // Ex: ('data/pessoas.json') ou ('../json/pessoas.json')
