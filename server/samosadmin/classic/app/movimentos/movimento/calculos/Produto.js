Ext.define('SamosAdmin.movimentos.movimento.calculos.Produto', {
    alternateClassName: 'Movimento.calculos.Produto',
    singleton: true,

    createFnProduto: function (options, produto) {
        const { movimento, fieldName, event } = options;

        produto = produto || options.produto;

        function calcular() {
            const result = {};
            
            //caso o id do produto tenha sido apagado
            if(fieldName == 'MOVIMENTOSITENS_ID_PRODUTOS' && options.produto[fieldName] == '') {
                //pega o índice do produto
                const indexItem = movimento['MOVIMENTOS_ITENS'].findIndex(item => {
                    return item['MOVIMENTOSITENS_ID'] == options.produto['MOVIMENTOSITENS_ID']
                });
                
                //remove o produto do model
                movimento['MOVIMENTOS_ITENS'].splice(indexItem, 1);
    
                //apaga o produto dos parametros
                options.produto = null;
                return {}
            }
            
            const totalBruto = cents(getTotalBruto());
            
            produto['MOVIMENTOSITENS_TOTAL'] = totalBruto / 100;

            if(movimento['DOCUMENTOS_NOME'] == 'Pedidos Compra') {
                const perFrete  = movimento['PERCENTUAL_FRETE']  || 0;
                const perIpi    = movimento['PERCENTUAL_IPI']    || 0;
                const perSeguro = movimento['PERCENTUAL_SEGURO'] || 0;
    
                produto['MOVIMENTOSITENS_IPI']      = perIpi;
                produto['MOVIMENTOSITENS_VALORIPI'] = (((totalBruto / 100) * perIpi)    / 100);
                produto['MOVIMENTOSITENS_FRETE']    = (((totalBruto / 100) * perFrete)  / 100);
                produto['MOVIMENTOSITENS_SEGURO']   = (((totalBruto / 100) * perSeguro) / 100);
            }

            //calcula os novos custos, caso sejam afetados
            calcularNovosCustos();

            //por enquanto está entrando aqui em todos os casos
            //se o desconto pode ser dado no item
            /*if(
                movimento['DOCUMENTOS_DESCONTOITEM'] == 'T' ||
                movimento['DOCUMENTOS_DESCONTOITEM'] == 'A'
            ) {*/
                const descontoCalculado = calcularDescontoItem();

                result.mensagem   = descontoCalculado.mensagem;
                result.senhaNivel = descontoCalculado.senhaNivel;

            //se o desconto pode ser dado apenas no cabecalho...
            /*} else if(movimento['DOCUMENTOS_DESCONTOITEM'] == 'F') {
                const descontoCalculado = calcularDescontoItem();

                result.mensagem   = descontoCalculado.mensagem;
                result.senhaNivel = descontoCalculado.senhaNivel;
            }*/

            //caso a atualizacao seja no produto atualiza os itens do cabecalho tambem
            //precisa estar sincronizado porque o que vale para os calculos é o que ta no cabecalho
            atualizarItemNoModel(options);
    
            return result;
        }
    
        function atualizarItemNoModel() {
            const { movimento, produto } = options;
       
            //procura o produto nos itens do cabecalho
            const itemAtualizar = movimento['MOVIMENTOS_ITENS'].find(item => {
                return item['MOVIMENTOSITENS_ID'] == produto['MOVIMENTOSITENS_ID']
            });
    
            Object.keys(itemAtualizar || {}).map(field => {
                //atualiza nos itens do cabecalho cada campo que tenha valor calculado
                if(produto[field] !== undefined)  {
                    itemAtualizar[field] = produto[field];
                }
            });
        }
    
        function calcularNovosCustos() {

            if(
                movimento['DOCUMENTOS_NOME'] == 'Nota Entrada' || 
                (
                    movimento['DOCUMENTOS_NOME'] == 'Requisições' && 
                    movimento['MOVIMENTOS_ID_OPERACOES'] < 500000
                )
            ) {
                const preco       = getPreco();
                const ipi         = cents(produto['MOVIMENTOSITENS_VALORIPI']) || 0;
                const subst       = cents(produto['MOVIMENTOSITENS_VALORST'])  || 0;
                const frete       = cents(produto['MOVIMENTOSITENS_FRETE'])    || 0;
                const seguro      = configs.getMovimentos().usarMarkup ? 0 : cents(produto['MOVIMENTOSITENS_SEGURO']) || 0;
                const despesa     = cents(produto['MOVIMENTOSITENS_DESPESAS']) || 0;
                const complemento = cents(produto['MOVIMENTOSITENS_DEPOSITO']) || 0;
                let cte           = cents(produto['MOVIMENTOSITENS_IMPOSTO']) || 0;
                const margem      = produto['NOVO_MARGEM'];//usado no eval abaixo

                if(configs.getClientName() == 'prudenmoveis' ||
                   configs.getClientName() == 'biomart' ||
                   configs.getClientName() == 'organoplant') {
                   cte = 0; // Zerar para não afetar custo, usa o cte pra informar o financeiro real.
                }

                const custo       = cents(preco) + ipi + subst + seguro + despesa + complemento + frete + cte;
                const vista       = parseInt(eval(configs.getProdutos().calculoPreco.vista));
                const precoPrazo  = parseInt(eval(configs.getProdutos().calculoPreco.prazo));
        
                produto['NOVO_CUSTO']  = custo / 100;
                produto['NOVO_PRECO']  = vista / 100;
                produto['NOVO_PRAZO']  = precoPrazo / 100;
                produto['NOVO_COMPRA'] = cents(preco) / 100;
            }
        }
    
        function calcularDescontoItem() {
            const descontoCalculado = calcularDesconto();
    
            //caso o campo digitado não afete o desconto, não prossegue
            if(!descontoCalculado) { return; }
    
            let descontoValido = descontoCalculado;
    
            if(movimento['DOCUMENTOS_NOME'] != 'Nota Eletrônica') {
                descontoValido = validarDesconto(descontoCalculado);
            }
    
            const { totalDesconto, totalLiquido, liquido, percentual, preco, totalBruto } = descontoValido;
            
            produto['TOTAL_LIQUIDO']              = totalLiquido  / 100;
            produto['VALOR_LIQUIDO']              = liquido       / 100;
            produto['MOVIMENTOSITENS_DESCONTOS']  = totalDesconto / 100;
            produto['MOVIMENTOSITENS_PERCENTUAL'] = percentual    / 1000;
    
            //esses campos só mexe se forem alterados
            if(preco >= 0) {
                produto['MOVIMENTOSITENS_PRECO'] = preco;//o preco ja vem com as casas decimais
            }
    
            if(totalBruto >= 0) {
                produto['MOVIMENTOSITENS_TOTAL'] = totalBruto / 100;
            }
    
            return descontoValido;
        }
    
        function calcularDesconto() {
            const qtde = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
            const preco = cents(getPreco());
            const totalBruto = cents(getTotalBruto());
    
            if(fieldName == 'MOVIMENTOSITENS_DESCONTOS'){
                const totalDesconto = cents(produto['MOVIMENTOSITENS_DESCONTOS']) || 0;
                const totalLiquido  = totalBruto - totalDesconto;
                const liquido       = parseInt(totalLiquido / (qtde || 1) * 1000);
                const percentual    = parseInt(totalDesconto / totalBruto * 100000);
    
                return { 
                    totalDesconto: totalDesconto, 
                    totalLiquido : totalLiquido, 
                    liquido      : liquido, 
                    percentual   : percentual 
                };
            }
            
            if(fieldName == 'VALOR_LIQUIDO'){
                const liquido       = cents(produto['VALOR_LIQUIDO']) || 0;
                const totalDesconto = parseInt((preco - liquido) * qtde / 1000);
                const percentual    = parseInt((totalDesconto > 0 ? totalDesconto : 0) / totalBruto * 100000);
                const totalLiquido  = totalBruto - (totalDesconto > 0 ? totalDesconto : 0);
                
                return { 
                    totalDesconto: totalDesconto, 
                    totalLiquido : totalLiquido, 
                    liquido      : liquido, 
                    percentual   : percentual 
                };
            }
            
            if(
                fieldName == 'MOVIMENTOSITENS_QUANTIDADE' ||
                fieldName == 'MOVIMENTOSITENS_PRECO'      ||
                fieldName == 'MOVIMENTOSITENS_PERCENTUAL'
            ){
                const percentual    = grams(produto['MOVIMENTOSITENS_PERCENTUAL']) || 0;
                const desconto      = preco * percentual / 1000 / 100;
                const totalDesconto = parseInt(qtde * desconto / 1000);
                const totalLiquido  = totalBruto - totalDesconto;
                const liquido       = parseInt(totalLiquido / (qtde || 1) * 1000);
    
                return { 
                    totalDesconto: totalDesconto, 
                    totalLiquido : totalLiquido, 
                    liquido      : liquido, 
                    percentual   : percentual 
                };
            }
            
            if(
                fieldName == 'MOVIMENTOSITENS_ID_PRODUTOS' || 
                fieldName == 'TOTAL_LIQUIDO'
            ){
                const totalLiquido  = cents(produto['TOTAL_LIQUIDO']) || 0;
                const totalDesconto = totalBruto - totalLiquido;
                const liquido       = parseInt(totalLiquido / (qtde || 1) * 1000);
                const percentual    = parseInt(totalDesconto / totalBruto * 100000);
    
                return { 
                    totalDesconto: totalDesconto, 
                    totalLiquido : totalLiquido, 
                    liquido      : liquido, 
                    percentual   : percentual 
                };
            }
        }
    
        function validarDesconto(descontoCalculado) {
            const { totalDesconto, totalLiquido, liquido, percentual } = descontoCalculado;
    
            const qtde = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
    
            const preco = getPreco();
            const totalBruto = cents(getTotalBruto());
    
            const precoOriginal = cents(getPrecoOriginal());
            const totalBrutoOriginal = qtde * precoOriginal / 1000;
    
            const precoMinimo           = cents(getPrecoMinimo());
            const precoMinimoSupervisor = cents(getPrecoMinimoSupervisor());
            const precoMinimoGerente    = cents(getPrecoMinimoGerente());
    
            const promocao = cents(produto['VALOR_PROMOCAO']);
    
            if(totalDesconto < 0) {
                return {
                    mensagem     : 'O desconto não pode ser negativo',
                    preco        : preco,
                    totalBruto   : totalBruto,
                    totalDesconto: 0,
                    percentual   : 0,
                    totalLiquido : totalBruto,
                    liquido      : parseInt(totalBruto / (qtde || 1) * 1000)
                }
            }
    
            if(promocao && liquido < promocao) {
                return {
                    mensagem     : 'Preço mínimo atingido',
                    preco        : preco,
                    totalBruto   : totalBruto,
                    totalDesconto: 0,
                    percentual   : 0,
                    totalLiquido : totalBruto,
                    liquido      : parseInt(totalBruto / (qtde || 1) * 1000)
                }
            }
    
            if(!promocao) {
                if(liquido < precoMinimoGerente) {
                    return {
                        mensagem     : 'Preço mínimo atingido',
                        preco        : precoOriginal      / 100,
                        totalBruto   : totalBrutoOriginal / 100,
                        totalDesconto: 0,
                        percentual   : 0,
                        totalLiquido : totalBrutoOriginal / 100,
                        liquido      : precoOriginal      / 100
                    }
    
                //não pede senha nível ao digitar, apenas ao sair do campo
                } else if(event == 'blur') {
                    if(liquido < precoMinimo && !configs.getMovimentos().desativaSenha) {
                        if(liquido < precoMinimoSupervisor) {
                            return senhaPrecoMinimo({ nivel: 2 });
                        } else {
                            return senhaPrecoMinimo({ nivel: 1 });
                        }
                    }
                }
            }
    
            function senhaPrecoMinimo({ nivel }) {
                return {
                    preco        : preco,
                    totalBruto   : totalBruto,
                    totalDesconto: totalDesconto,
                    percentual   : percentual,
                    totalLiquido : totalLiquido,
                    liquido      : liquido,
                    senhaNivel   : {
                        nivel: nivel,
                        autorizar: (options) => {
                            const { produto } = options;
                            produto['SALDOS_PRECOMINIMO'] = liquido / 100;
                            return options;
                        },
                        rejeitar: (options) => {
                            const { produto, fieldName } = options;
    
                            if(fieldName == 'MOVIMENTOSITENS_PRECO') {
                                produto['MOVIMENTOSITENS_PRECO'] = precoOriginal / 100;
                            }
            
                            produto['TOTAL_LIQUIDO']              = totalBrutoOriginal  / 100;
                            produto['MOVIMENTOSITENS_TOTAL']      = totalBruto          / 100;
                            produto['MOVIMENTOSITENS_DESCONTOS']  = 0;
                            produto['VALOR_LIQUIDO']              = precoOriginal / 100;
                            produto['MOVIMENTOSITENS_PERCENTUAL'] = 0;
            
                            return options;
                        }
                    }
                }
            }
    
            //se chegar aqui o desconto calculado e válido
            return descontoCalculado;
        }
    
        function getPreco() {
            const tipoPreco = configs.getMovimentos().tipoPreco;
            const campoPreco = tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO';
            const permitidoAlterarPreco = movimento['DOCUMENTOS_ALTERAPRECO'] == 'T';
                
            return produto[permitidoAlterarPreco ? 'MOVIMENTOSITENS_PRECO' : campoPreco];
        }
    
        function getPrecoOriginal() {
            const tipoPreco = configs.getMovimentos().tipoPreco;
            const campoPreco = tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO';
                
            return produto[campoPreco];
        }
    
        function getPrecoMinimo() {
            const precoOriginal = cents(getPrecoOriginal());
            const precoMinimo = cents(produto['PRECOMINIMO_DB']);  // cents(produto['SALDOS_PRECOMINIMO'])

            if(precoMinimo > precoOriginal) {
                //caso o preco minimo seja maior que o preco, o mínimo é o próprio preço
                return precoOriginal / 100;
            } else {
                return precoMinimo / 100;
            }
        }
    
        function getPrecoMinimoSupervisor() {
            const precoMinimo = cents(getPrecoMinimo());
            const precoOriginal = cents(getPrecoOriginal());
    
            if(configs.getMovimentos().descontoMaximoSupervisor == 'SALDOS_PRECOMINIMO') {
                return precoMinimo / 100;
    
            } else {
                //caso o config descontoMaximoSupervisor seja um percentual
                //calcula o preço mínimo do supervisor
                const descontoMaximo = parseInt(precoOriginal * (configs.getMovimentos().descontoMaximoSupervisor || 100) / 100);
                return (precoOriginal - descontoMaximo) / 100;
            }
        }
    
        function getPrecoMinimoGerente() {
            const precoMinimo  = cents(getPrecoMinimo());
            const precoOriginal = cents(getPrecoOriginal());
    
            if(configs.getMovimentos().descontoMaximoGerente == 'SALDOS_PRECOMINIMO') {
                return precoMinimo / 100;
    
            } else {
                //caso o config descontoMaximoGerente seja um percentual
                //calcula o preço mínimo do gerente
                const descontoMaximo = parseInt(precoOriginal * (configs.getMovimentos().descontoMaximoGerente || 100) / 100);
                return (precoOriginal - descontoMaximo) / 100;
            }
        }
    
        function getTotalBruto() {
            const preco = getPreco();
            const qtde = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
            const casasDecimaisPreco = configs.getMovimentos().casasDecimaisPreco || 2;
    
            //converte o preco para inteiro, ex: R$ 1,234567 fica 1234567 (para bater os calculos no javascript)
            const precoInt = toPrecision(preco, casasDecimaisPreco);
            //após calcular divide pelas casas decimais novamente
            return Math.round(precoInt * qtde / 1000 / Math.pow(10, (casasDecimaisPreco - 2))) / 100;
        }

        function getPesoBruto() {

            let qtde = 0;
            let peso = 0;

            if(configs.getClientName() == 'prudenaco') {
                if(produto['PRODUTOS_UNIDADE'] == 'KG') {
                    qtde = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
                    peso = grams(produto['PRODUTOS_PESOBRUTO']);        
                }
            } else {
                qtde = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
                peso = grams(produto['PRODUTOS_PESOBRUTO']);    
            }

            return (qtde * peso) / 1000 / 1000;
        }

        function getPesoLiquido() {

            let qtde = 0;
            let peso = 0;

            if(configs.getClientName() == 'prudenaco') {
                if(produto['PRODUTOS_UNIDADE'] == 'KG') {
                    qtde = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
                    peso = grams(produto['PRODUTOS_PESOLIQUIDO']);
                }
            } else {
                qtde = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
                peso = grams(produto['PRODUTOS_PESOLIQUIDO']);    
            }
            return (qtde * peso) / 1000 / 1000;
        }

        function getMontagem() {
            const qtde  = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
            const valor = cents(produto['MONTAGENS_VALOR']);
            return (qtde * valor) / 100 / 1000;
        }

        function getCusto() {
            const custo = cents(produto['MOVIMENTOSITENS_CUSTO']) || cents(produto['MOVIMENTOSITENS_PRECO']) * 0.65;
            const qtde  = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
            return custo * qtde / 100 / 1000;
        }
    
        return {
            calcular,
            getTotalBruto,
            getPrecoOriginal,
            getPrecoMinimo,
            getPrecoMinimoSupervisor,
            getPrecoMinimoGerente,
            getPesoBruto,
            getPesoLiquido,
            getMontagem,
            getCusto
        }
    }
});
