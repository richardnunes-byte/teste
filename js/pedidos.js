// ===== Novo pedido (carrinho) e lista de pedidos =====

// Regra do desconto automático (R13): subtotal MAIOR que R$ 50,00 ganha 10%
const VALOR_MINIMO_DESCONTO = 50
const PERCENTUAL_DESCONTO = 0.10

let pedidos = lerDados("pedidos")
let carrinho = []   // itens do pedido que está sendo montado (ainda não salvo)

const formPedido = document.getElementById("formPedido")
const selectCliente = document.getElementById("pedidoCliente")
const selectProduto = document.getElementById("pedidoProduto")
const campoQuantidade = document.getElementById("pedidoQuantidade")
const btnAdicionarItem = document.getElementById("btnAdicionarItem")
const selectPagamento = document.getElementById("pedidoPagamento")
const tabelaItensPedido = document.getElementById("tabelaItensPedido")
const textoDesconto = document.getElementById("pedidoDesconto")
const textoTotal = document.getElementById("pedidoTotal")

const tabelaPedidos = document.getElementById("tabelaPedidos")
const buscaPedido = document.getElementById("buscaPedido")
const filtroStatus = document.getElementById("filtroStatus")
const filtroPagamento = document.getElementById("filtroPagamento")
const ordenarPedidos = document.getElementById("ordenarPedidos")


// ----- Funções de apoio -----

// Arredonda para 2 casas (evita resultados como 4.499999 nas contas com dinheiro)
function arredondar(valor) {
    return Math.round(valor * 100) / 100
}

// Soma quantidade x preço de todos os itens do carrinho
function calcularSubtotal() {
    let subtotal = 0

    for (let item of carrinho) {
        subtotal += item.quantidade * item.precoUnitario
    }
    return arredondar(subtotal)
}

// R13: devolve o valor do desconto (10% se o subtotal passar de R$ 50,00)
function calcularDesconto(subtotal) {
    if (subtotal > VALOR_MINIMO_DESCONTO) {
        return arredondar(subtotal * PERCENTUAL_DESCONTO)
    }
    return 0
}

// Procura o nome do cliente pelo id (o pedido guarda só o clienteId)
function nomeDoCliente(clienteId) {
    let cliente = buscarPorId(clientes, clienteId)

    if (cliente === null) {
        return "Cliente removido"
    }
    return cliente.nome
}


// ----- Selects de cliente e produto -----

// Preenche os dois selects da tela "Novo pedido" com os dados cadastrados.
// É chamada toda vez que a seção é aberta (ver app.js).
function atualizarSelects() {
    let clienteAtual = selectCliente.value
    let produtoAtual = selectProduto.value

    let htmlClientes = `<option value="">Selecione...</option>`
    for (let cliente of clientes) {
        htmlClientes += `<option value="${cliente.id}">${escapar(cliente.nome)}</option>`
    }
    selectCliente.innerHTML = htmlClientes
    selectCliente.value = clienteAtual

    let htmlProdutos = `<option value="">Selecione...</option>`
    for (let produto of produtos) {
        let texto = produto.nome + " - " + formatarMoeda(produto.preco) + " (estoque: " + produto.estoque + ")"
        let desabilitado = ""

        if (produto.estoque === 0) {
            texto = produto.nome + " (esgotado)"
            desabilitado = "disabled"
        }
        htmlProdutos += `<option value="${produto.id}" ${desabilitado}>${escapar(texto)}</option>`
    }
    selectProduto.innerHTML = htmlProdutos
    selectProduto.value = produtoAtual
}


// ----- Carrinho -----

// Desenha os itens do carrinho e atualiza desconto e total
function desenharCarrinho() {
    let html = ""

    for (let i = 0; i < carrinho.length; i++) {
        let item = carrinho[i]

        html += `
            <tr>
                <td>${escapar(item.nome)}</td>
                <td>${item.quantidade}</td>
                <td>${formatarMoeda(item.quantidade * item.precoUnitario)}</td>
                <td class="text-end">
                    <button type="button" class="btn btn-sm btn-outline-danger" data-indice="${i}">Remover</button>
                </td>
            </tr>`
    }

    if (html === "") {
        html = `<tr><td colspan="4" class="text-muted">Nenhum item adicionado.</td></tr>`
    }
    tabelaItensPedido.innerHTML = html

    // R13: o desconto e o total são recalculados a cada mudança no carrinho
    let subtotal = calcularSubtotal()
    let desconto = calcularDesconto(subtotal)
    textoDesconto.textContent = formatarMoeda(desconto)
    textoTotal.textContent = formatarMoeda(arredondar(subtotal - desconto))
}

// Quanto desse produto já está no carrinho (0 se não estiver)
function quantidadeNoCarrinho(produtoId) {
    for (let item of carrinho) {
        if (item.produtoId === produtoId) {
            return item.quantidade
        }
    }
    return 0
}

function adicionarItem() {
    let produtoId = Number(selectProduto.value)
    let quantidade = parseFloat(campoQuantidade.value)

    if (selectProduto.value === "") {
        mostrarAlerta("Escolha um produto para adicionar.", "danger")
        return
    }
    if (!Number.isInteger(quantidade) || quantidade < 1) {
        mostrarAlerta("A quantidade deve ser um número inteiro, de 1 para cima.", "danger")
        return
    }

    let produto = buscarPorId(produtos, produtoId)
    let jaNoCarrinho = quantidadeNoCarrinho(produtoId)

    // Regra de negócio: não vender mais do que existe em estoque
    if (jaNoCarrinho + quantidade > produto.estoque) {
        mostrarAlerta("Estoque insuficiente de " + produto.nome + ": há " + produto.estoque +
            " e já tem " + jaNoCarrinho + " no carrinho.", "danger")
        return
    }

    if (jaNoCarrinho > 0) {
        // Mesmo produto: só soma a quantidade
        for (let item of carrinho) {
            if (item.produtoId === produtoId) {
                item.quantidade += quantidade
            }
        }
    } else {
        carrinho.push({
            produtoId: produto.id,
            nome: produto.nome,
            quantidade: quantidade,
            precoUnitario: produto.preco
        })
    }

    selectProduto.value = ""
    campoQuantidade.value = 1
    desenharCarrinho()
}

function removerItem(indice) {
    carrinho.splice(indice, 1)
    desenharCarrinho()
}

// Confere o estoque atual de cada item do carrinho (o estoque pode ter mudado)
function carrinhoTemEstoque() {
    for (let item of carrinho) {
        let produto = buscarPorId(produtos, item.produtoId)

        if (produto === null) {
            mostrarAlerta("O produto " + item.nome + " não existe mais. Remova-o do carrinho.", "danger")
            return false
        }
        if (item.quantidade > produto.estoque) {
            mostrarAlerta("Estoque insuficiente de " + item.nome + ": há apenas " + produto.estoque + ".", "danger")
            return false
        }
    }
    return true
}


// ----- Finalizar pedido -----

function finalizarPedido(evento) {
    evento.preventDefault()
    limparErros(formPedido)

    let valido = true

    if (selectCliente.value === "") {
        marcarErro(selectCliente, "Escolha o cliente do pedido.")
        valido = false
    }
    if (selectPagamento.value === "") {
        marcarErro(selectPagamento, "Escolha a forma de pagamento.")
        valido = false
    }
    if (carrinho.length === 0) {
        mostrarAlerta("Adicione pelo menos um item ao pedido.", "danger")
        valido = false
    }
    if (!valido || !carrinhoTemEstoque()) {
        return
    }

    let subtotal = calcularSubtotal()
    let desconto = calcularDesconto(subtotal)

    let pedido = {
        id: gerarId(pedidos),
        clienteId: Number(selectCliente.value),
        itens: carrinho,
        pagamento: selectPagamento.value,
        subtotal: subtotal,
        desconto: desconto,
        total: arredondar(subtotal - desconto),
        status: "pendente",
        data: new Date().toISOString()
    }

    // Dá baixa no estoque de cada produto vendido
    for (let item of pedido.itens) {
        let produto = buscarPorId(produtos, item.produtoId)
        produto.estoque -= item.quantidade
    }

    pedidos.push(pedido)
    salvarDados("pedidos", pedidos)
    salvarDados("produtos", produtos)

    // Limpa a tela para o próximo pedido
    carrinho = []
    formPedido.reset()
    desenharCarrinho()
    atualizarSelects()
    listarProdutos()
    listarPedidos()

    mostrarAlerta("Pedido #" + pedido.id + " realizado com sucesso!", "success")
}


// ----- Estados do pedido (R11) -----

// pendente -> em preparo -> entregue. Devolve null se não há próximo passo.
function proximoStatus(status) {
    if (status === "pendente") {
        return "em preparo"
    }
    if (status === "em preparo") {
        return "entregue"
    }
    return null
}

// Cancelar só é permitido enquanto o pedido não foi entregue
function podeCancelar(status) {
    return status === "pendente" || status === "em preparo"
}

// Cor do badge do Bootstrap para cada status
function classeStatus(status) {
    if (status === "pendente") return "text-bg-warning"
    if (status === "em preparo") return "text-bg-info"
    if (status === "entregue") return "text-bg-success"
    return "text-bg-secondary"
}

// Devolve ao estoque os itens de um pedido
function devolverEstoque(pedido) {
    for (let item of pedido.itens) {
        let produto = buscarPorId(produtos, item.produtoId)

        if (produto !== null) {
            produto.estoque += item.quantidade
        }
    }
    salvarDados("produtos", produtos)
    listarProdutos()
}

function avancarStatus(id) {
    let pedido = buscarPorId(pedidos, id)
    let novoStatus = proximoStatus(pedido.status)

    if (novoStatus === null) {
        mostrarAlerta("Este pedido já está em um estado final.", "warning")
        return
    }

    pedido.status = novoStatus
    salvarDados("pedidos", pedidos)
    listarPedidos()
    mostrarAlerta("Pedido #" + pedido.id + " agora está: " + novoStatus + ".", "success")
}

function cancelarPedido(id) {
    let pedido = buscarPorId(pedidos, id)

    if (!podeCancelar(pedido.status)) {
        mostrarAlerta("Só é possível cancelar pedidos pendentes ou em preparo.", "warning")
        return
    }

    pedido.status = "cancelado"
    devolverEstoque(pedido)
    salvarDados("pedidos", pedidos)
    listarPedidos()
    mostrarAlerta("Pedido #" + pedido.id + " cancelado e estoque devolvido.", "success")
}

function excluirPedido(id) {
    let pedido = buscarPorId(pedidos, id)

    confirmarExclusao("Deseja excluir o pedido #" + pedido.id + "?", function () {
        // Pedido ainda "ativo" (pendente ou em preparo): o estoque volta
        if (podeCancelar(pedido.status)) {
            devolverEstoque(pedido)
        }

        pedidos = pedidos.filter(function (p) {
            return p.id !== id
        })
        salvarDados("pedidos", pedidos)
        listarPedidos()
        mostrarAlerta("Pedido excluído.", "success")
    })
}


// ----- Lista de pedidos (R09: busca + 2 filtros + ordenação) -----

function listarPedidos() {
    let termo = buscaPedido.value.trim().toLowerCase()
    let status = filtroStatus.value
    let pagamento = filtroPagamento.value
    let lista = []

    for (let pedido of pedidos) {
        let bateBusca = nomeDoCliente(pedido.clienteId).toLowerCase().includes(termo)
        let bateStatus = status === "" || pedido.status === status
        let batePagamento = pagamento === "" || pedido.pagamento === pagamento

        if (bateBusca && bateStatus && batePagamento) {
            lista.push(pedido)
        }
    }

    let ordem = ordenarPedidos.value
    lista.sort(function (a, b) {
        if (ordem === "data-asc") return new Date(a.data) - new Date(b.data)
        if (ordem === "valor-asc") return a.total - b.total
        if (ordem === "valor-desc") return b.total - a.total
        return new Date(b.data) - new Date(a.data)   // padrão: mais recentes primeiro
    })

    let html = ""
    for (let pedido of lista) {
        // Os botões só aparecem quando a ação é permitida (exibição condicional)
        let botoes = ""
        if (proximoStatus(pedido.status) !== null) {
            botoes += `<button class="btn btn-sm btn-outline-success" data-acao="avancar" data-id="${pedido.id}">Avançar status</button> `
        }
        if (podeCancelar(pedido.status)) {
            botoes += `<button class="btn btn-sm btn-outline-warning" data-acao="cancelar" data-id="${pedido.id}">Cancelar</button> `
        }
        botoes += `<button class="btn btn-sm btn-outline-danger" data-acao="excluir" data-id="${pedido.id}">Excluir</button>`

        html += `
            <tr>
                <td>${pedido.id}</td>
                <td>
                    ${escapar(nomeDoCliente(pedido.clienteId))}
                    <small class="text-muted d-block">${new Date(pedido.data).toLocaleString("pt-BR")}</small>
                </td>
                <td>${formatarMoeda(pedido.total)}</td>
                <td>${escapar(pedido.pagamento)}</td>
                <td><span class="badge ${classeStatus(pedido.status)}">${pedido.status}</span></td>
                <td class="text-end">${botoes}</td>
            </tr>`
    }

    if (html === "") {
        html = `<tr><td colspan="6" class="text-muted">Nenhum pedido encontrado.</td></tr>`
    }
    tabelaPedidos.innerHTML = html
}


// ----- Eventos -----

btnAdicionarItem.addEventListener("click", adicionarItem)
formPedido.addEventListener("submit", finalizarPedido)

// Um único listener na tabela do carrinho (botões "Remover")
tabelaItensPedido.addEventListener("click", function (evento) {
    let botao = evento.target.closest("button")
    if (botao === null) {
        return
    }
    removerItem(Number(botao.dataset.indice))
})

// Um único listener na tabela de pedidos (botões de ação)
tabelaPedidos.addEventListener("click", function (evento) {
    let botao = evento.target.closest("button")
    if (botao === null) {
        return
    }

    let id = Number(botao.dataset.id)
    if (botao.dataset.acao === "avancar") {
        avancarStatus(id)
    } else if (botao.dataset.acao === "cancelar") {
        cancelarPedido(id)
    } else {
        excluirPedido(id)
    }
})

buscaPedido.addEventListener("input", listarPedidos)
filtroStatus.addEventListener("change", listarPedidos)
filtroPagamento.addEventListener("change", listarPedidos)
ordenarPedidos.addEventListener("change", listarPedidos)

// Ao clicar em qualquer link do menu, recarrega os selects e a lista de pedidos,
// porque clientes, produtos e pedidos podem ter mudado em outra seção
for (let link of document.querySelectorAll(".link-menu")) {
    link.addEventListener("click", function () {
        atualizarSelects()
        listarPedidos()
    })
}

// Desenha tudo uma vez ao abrir a página
atualizarSelects()
desenharCarrinho()
listarPedidos()
