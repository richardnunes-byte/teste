// ===== Navegação entre as telas (seções) =====

// Pega todas as seções e todos os links do menu
const secoes = document.querySelectorAll(".secao")
const linksMenu = document.querySelectorAll(".link-menu")

// Mostra só a seção escolhida e esconde as outras
function mostrarSecao(id) {
    for (let secao of secoes) {
        if (secao.id === id) {
            secao.classList.remove("d-none")
        } else {
            secao.classList.add("d-none")
        }
    }

    // Destaca o link do menu da seção atual
    for (let link of linksMenu) {
        if (link.dataset.secao === id) {
            link.classList.add("ativo")
        } else {
            link.classList.remove("ativo")
        }
    }
}

// Ao clicar num link do menu, troca de seção
for (let link of linksMenu) {
    link.addEventListener("click", function () {
        mostrarSecao(link.dataset.secao)
    })
}

// Ao abrir a página, mostra a seção que está na URL (#clientes, por exemplo)
function secaoInicial() {
    let id = window.location.hash.replace("#", "")
    let existe = document.getElementById(id)

    if (id !== "" && existe) {
        mostrarSecao(id)
    } else {
        mostrarSecao("dashboard")
    }
}

secaoInicial()
