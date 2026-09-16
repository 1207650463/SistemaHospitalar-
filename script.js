// ==========================================
// SISTEMA HOSPITALAR HOSPITAL VIDA+
// ==========================================


// Dados salvos no navegador
let pacientes = JSON.parse(
    localStorage.getItem("pacientesHospital")
) || [];

let historico = JSON.parse(
    localStorage.getItem("historicoHospital")
) || [];

let numeroSenha =
    Number(localStorage.getItem("numeroSenhaHospital")) || 0;


// Elementos da página
const formCadastro = document.getElementById("formCadastro");

const nomeInput = document.getElementById("nome");

const cpfInput = document.getElementById("cpf");

const tipoAtendimento =
    document.getElementById("tipoAtendimento");

const listaPacientes =
    document.getElementById("listaPacientes");

const historicoElemento =
    document.getElementById("historico");

const senhaAtual =
    document.getElementById("senhaAtual");

const nomeAtual =
    document.getElementById("nomeAtual");

const proximaSenha =
    document.getElementById("proximaSenha");

const contador =
    document.getElementById("contador");

const notificacao =
    document.getElementById("notificacao");


// ==========================================
// MÁSCARA DE CPF
// ==========================================

cpfInput.addEventListener("input", function () {

    let cpf = this.value.replace(/\D/g, "");

    cpf = cpf.substring(0, 11);

    if (cpf.length > 9) {

        cpf = cpf.replace(
            /(\d{3})(\d{3})(\d{3})(\d{1,2})/,
            "$1.$2.$3-$4"
        );

    } else if (cpf.length > 6) {

        cpf = cpf.replace(
            /(\d{3})(\d{3})(\d{1,3})/,
            "$1.$2.$3"
        );

    } else if (cpf.length > 3) {

        cpf = cpf.replace(
            /(\d{3})(\d{1,3})/,
            "$1.$2"
        );
    }

    this.value = cpf;
});


// ==========================================
// CADASTRAR PACIENTE
// ==========================================

formCadastro.addEventListener("submit", function (evento) {

    evento.preventDefault();

    const nome = nomeInput.value.trim();

    const cpf = cpfInput.value.trim();

    const tipo = tipoAtendimento.value;


    if (nome.length < 3) {

        alert("Digite o nome completo do paciente.");

        return;
    }


    if (cpf.replace(/\D/g, "").length !== 11) {

        alert("Digite um CPF válido.");

        return;
    }


    // Verifica CPF duplicado
    const cpfExiste = pacientes.some(
        paciente => paciente.cpf === cpf
    );


    if (cpfExiste) {

        alert("Este CPF já está cadastrado.");

        return;
    }


    // Gera nova senha
    numeroSenha++;

    const senha = "A" +
        String(numeroSenha).padStart(3, "0");


    const novoPaciente = {

        id: Date.now(),

        senha: senha,

        nome: nome,

        cpf: cpf,

        tipo: tipo,

        status: "Aguardando",

        horario: obterHora()

    };


    pacientes.push(novoPaciente);


    salvarDados();

    atualizarTela();


    // Limpar formulário
    formCadastro.reset();


    mostrarNotificacao(
        `Paciente cadastrado! Senha ${senha}`
    );
});


// ==========================================
// CHAMAR PRÓXIMA SENHA
// ==========================================

document
    .getElementById("chamarBtn")
    .addEventListener("click", chamarProximaSenha);


function chamarProximaSenha() {

    const paciente = pacientes.find(
        p => p.status === "Aguardando"
    );


    if (!paciente) {

        alert("Não existem pacientes aguardando atendimento.");

        return;
    }


    paciente.status = "Atendido";

    paciente.horarioChamada = obterHora();


    // Atualiza painel
    senhaAtual.textContent = paciente.senha;

    nomeAtual.textContent = paciente.nome;


    // Adiciona ao histórico
    historico.unshift({

        senha: paciente.senha,

        nome: paciente.nome,

        horario: paciente.horarioChamada

    });


    // Mantém somente as 10 últimas chamadas
    historico = historico.slice(0, 10);


    salvarDados();

    atualizarTela();


    // Voz do sistema
    falarChamada(paciente);
}


// ==========================================
// VOZ DO SISTEMA
// ==========================================

function falarChamada(paciente) {

    if (!("speechSynthesis" in window)) {
        return;
    }


    const texto =
        `Senha ${paciente.senha.split("").join(" ")},
         paciente ${paciente.nome},
         dirigir-se ao guichê 01.`;


    const fala = new SpeechSynthesisUtterance(texto);


    fala.lang = "pt-BR";

    fala.rate = 0.85;

    fala.pitch = 1;


    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(fala);
}


// ==========================================
// ATUALIZAR INTERFACE
// ==========================================

function atualizarTela() {

    renderizarPacientes();

    renderizarHistorico();

    atualizarProximaSenha();

    contador.textContent = pacientes.length;
}


// ==========================================
// LISTA DE PACIENTES
// ==========================================

function renderizarPacientes() {

    listaPacientes.innerHTML = "";


    if (pacientes.length === 0) {

        listaPacientes.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    Nenhum paciente cadastrado.
                </td>
            </tr>
        `;

        return;
    }


    pacientes.forEach(paciente => {

        const tr = document.createElement("tr");


        const statusClass =
            paciente.status === "Aguardando"
                ? "status-fila"
                : "status-atendido";


        tr.innerHTML = `

            <td>
                <span class="senha-tabela">
                    ${paciente.senha}
                </span>
            </td>

            <td>
                <strong>
                    ${escaparHTML(paciente.nome)}
                </strong>
            </td>

            <td>
                ${paciente.cpf}
            </td>

            <td>
                ${paciente.tipo}
            </td>

            <td>
                <span class="${statusClass}">
                    ${paciente.status}
                </span>
            </td>

            <td>
                <button
                    class="btn-excluir"
                    onclick="excluirPaciente(${paciente.id})"
                >
                    Excluir
                </button>
            </td>

        `;


        listaPacientes.appendChild(tr);
    });
}


// ==========================================
// PRÓXIMA SENHA
// ==========================================

function atualizarProximaSenha() {

    const proximo = pacientes.find(
        paciente => paciente.status === "Aguardando"
    );


    if (proximo) {

        proximaSenha.textContent =
            proximo.senha;

    } else {

        proximaSenha.textContent = "---";
    }
}


// ==========================================
// HISTÓRICO
// ==========================================

function renderizarHistorico() {

    historicoElemento.innerHTML = "";


    if (historico.length === 0) {

        historicoElemento.innerHTML = `
            <div class="vazio">
                Nenhuma senha chamada ainda.
            </div>
        `;

        return;
    }


    historico.forEach(item => {

        const div =
            document.createElement("div");


        div.className = "historico-item";


        div.innerHTML = `

            <div>
                <div class="historico-senha">
                    ${item.senha}
                </div>

                <div class="historico-nome">
                    ${escaparHTML(item.nome)}
                </div>
            </div>

            <div class="historico-hora">
                ${item.horario}
            </div>

        `;


        historicoElemento.appendChild(div);
    });
}


// ==========================================
// EXCLUIR PACIENTE
// ==========================================

function excluirPaciente(id) {

    const confirmar =
        confirm(
            "Deseja realmente excluir este cadastro?"
        );


    if (!confirmar) {
        return;
    }


    pacientes = pacientes.filter(
        paciente => paciente.id !== id
    );


    salvarDados();

    atualizarTela();

    mostrarNotificacao("Cadastro excluído.");
}


// ==========================================
// SALVAR DADOS
// ==========================================

function salvarDados() {

    localStorage.setItem(
        "pacientesHospital",
        JSON.stringify(pacientes)
    );


    localStorage.setItem(
        "historicoHospital",
        JSON.stringify(historico)
    );


    localStorage.setItem(
        "numeroSenhaHospital",
        numeroSenha
    );
}


// ==========================================
// HORÁRIO
// ==========================================

function obterHora() {

    const agora = new Date();

    return agora.toLocaleTimeString(
        "pt-BR",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ==========================================
// NOTIFICAÇÃO
// ==========================================

function mostrarNotificacao(mensagem) {

    notificacao.textContent = mensagem;

    notificacao.classList.add("ativa");


    setTimeout(() => {

        notificacao.classList.remove("ativa");

    }, 3000);
}


// ==========================================
// PROTEÇÃO CONTRA HTML INJETADO
// ==========================================

function escaparHTML(texto) {

    const div = document.createElement("div");

    div.textContent = texto;

    return div.innerHTML;
}


// ==========================================
// INICIALIZAÇÃO
// ==========================================

atualizarTela();
