Ext.define('SamosAdmin.movimentos.cupomeletronico.calculos.Produto', {
    alternateClassName: 'CupomEletronico.calculos.Produto',
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
    
        function calcularDescontoItem() {
            const descontoCalculado = calcularDesconto();
    
            //caso o campo digitado não afete o desconto, não prossegue
            if(!descontoCalculado) { return; }
    
            const descontoValido = validarDesconto(descontoCalculado);
    
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
                //não valida ao digitar, apenas ao sair do campo
                if(event == 'blur') {
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
                    } else if(liquido < precoMinimo && !configs.getMovimentos().desativaSenha) {
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
            const precoMinimo = cents(produto['SALDOS_PRECOMINIMO'])

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
    
        return {
            calcular,
            getTotalBruto,
            getPreco,
            getPrecoOriginal,
            getPrecoMinimo,
            getPrecoMinimoSupervisor,
            getPrecoMinimoGerente
        }
    }
});
