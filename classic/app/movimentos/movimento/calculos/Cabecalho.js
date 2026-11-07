Ext.define('SamosAdmin.movimentos.movimento.calculos.Cabecalho', {
    alternateClassName: 'Movimento.calculos.Cabecalho',
    singleton: true,

    createFnCabecalho: function(options) {
        const { movimento } = options;
        
        //classe que gerencia alterações em toda a a lista de produtos
        const fnLista = Movimento.calculos.ListaProdutos.createFnLista(options);

        function calcular() {
            const result = {};

            if(
                movimento['DOCUMENTOS_NOME'] != 'Nota Entrada' ||
                (
                    movimento['DOCUMENTOS_NOME'] == 'Nota Entrada'  && 
                    configs.getMovimentos().rateiaDescontoNotaEntrada
                )
            ) {
                if(movimento['DOCUMENTOS_DESCONTOITEM'] == 'T') {
                    //TESTAR
                    const descontoCalculado = fnLista.somarDescontosItens();
    
                    result.mensagem   = descontoCalculado.mensagem;
                    result.senhaNivel = descontoCalculado.senhaNivel;
                
                } else if(movimento['DOCUMENTOS_DESCONTOITEM'] == 'F') {
                    const descontoCalculado = fnLista.calcularDescontoCabecalho();
    
                    result.mensagem   = descontoCalculado.mensagem;
                    result.senhaNivel = descontoCalculado.senhaNivel;
    
                } else if(movimento['DOCUMENTOS_DESCONTOITEM'] == 'A') {
                    //Movimento.services.Descontos.itemECabecalho.somarTotaisParaCabecalho(deps);
                }

// O peso da NF-e é tratado pelo mixin Produtos.
// Não recalcular aqui porque pode sobrescrever peso informado manualmente.                
//              fnLista.calcularPeso();
                fnLista.calcularMontagem();
            }
    
            fnLista.calcularMargem();

            ratear();

            Movimento.services.Recuperacao.salvar(movimento, movimento['MOVIMENTOS_ITENS']);
    
            return result;
        }
    
        function ratear() {
            const ratios = obterRatios();
    
            if(
                movimento['DOCUMENTOS_NOME'] == 'Pedidos Compra' ||
                (
                    movimento['DOCUMENTOS_NOME'] == 'Nota Entrada'  && 
                    !configs.getMovimentos().rateiaDescontoNotaEntrada
                )
            ) {
                const foiDigitado = field => movimento['MOVIMENTOS_ITENS'].some(produto => cents(produto[field]) / 100 != 0);
                const baseStDigitada   = foiDigitado('MOVIMENTOSITENS_BASEST');
                const valorStDigitado  = foiDigitado('MOVIMENTOSITENS_VALORST');
                const impostoDigitado  = foiDigitado('MOVIMENTOSITENS_IMPOSTO');
                const freteDigitado    = foiDigitado('MOVIMENTOSITENS_FRETE');
                const seguroStDigitado = foiDigitado('MOVIMENTOSITENS_SEGURO');
                const despesaDigitada  = foiDigitado('MOVIMENTOSITENS_DESPESAS');
                
                movimento['MOVIMENTOS_ITENS'].forEach(produto => {
                    const itemTotal = cents(produto['MOVIMENTOSITENS_TOTAL']);
                    
                    produto['MOVIMENTOSITENS_BASEST']   = baseStDigitada   ? cents(produto['MOVIMENTOSITENS_BASEST'])   : parseInt(itemTotal * ratios.baseSt);
                    produto['MOVIMENTOSITENS_VALORST']  = valorStDigitado  ? cents(produto['MOVIMENTOSITENS_VALORST'])  : parseInt(itemTotal * ratios.valorSt);
                    produto['MOVIMENTOSITENS_IMPOSTO']  = impostoDigitado  ? cents(produto['MOVIMENTOSITENS_IMPOSTO'])  : parseInt(itemTotal * ratios.imposto);
                    produto['MOVIMENTOSITENS_FRETE']    = freteDigitado    ? cents(produto['MOVIMENTOSITENS_FRETE'])    : parseInt(itemTotal * ratios.frete);
                    produto['MOVIMENTOSITENS_SEGURO']   = seguroStDigitado ? cents(produto['MOVIMENTOSITENS_SEGURO'])   : parseInt(itemTotal * ratios.seguro);
                    produto['MOVIMENTOSITENS_DESPESAS'] = despesaDigitada  ? cents(produto['MOVIMENTOSITENS_DESPESAS']) : parseInt(itemTotal * ratios.despesas);
                });
    
                if(configs.getMovimentos().rateiaFreteNfe != false){
                    somarSobraAoPrimeiroProduto();
                }

                movimento['MOVIMENTOS_ITENS'].forEach(produto => {
                    const qtde         = produto['MOVIMENTOSITENS_QUANTIDADE'] || 1;
                    const preco        = cents(produto['MOVIMENTOSITENS_PRECO']) || 0;
                    const totalProduto = cents(produto['MOVIMENTOSITENS_TOTAL']);
                    const aliquota     = produto['MOVIMENTOSITENS_IPI'];
                    const ipi          = cents(totalProduto * aliquota / 100 / 100);
                    const ipiRateado   = parseInt((ipi || 0) / qtde);
                    const subst        = parseInt((cents(produto['MOVIMENTOSITENS_VALORST'])  || 0) / qtde);
                    const frete        = parseInt((cents(produto['MOVIMENTOSITENS_FRETE'])    || 0) / qtde);
                    const seguro       = parseInt((cents(produto['MOVIMENTOSITENS_SEGURO'])   || 0) / qtde);
                    const despesa      = parseInt((cents(produto['MOVIMENTOSITENS_DESPESAS']) || 0) / qtde);
                    const complemento  = parseInt((cents(produto['MOVIMENTOSITENS_DEPOSITO']) || 0) / qtde);
                    const cte          = configs.getClientName() == 'prudenmoveis' ? 0 : parseInt((cents(produto['MOVIMENTOSITENS_IMPOSTO'])  || 0) / qtde);
                    const margem       = produto['NOVO_MARGEM'];//usado no eval abaixo
                    const precoPrazo   = parseInt(eval(configs.getProdutos().calculoPreco.prazo));
                    const custo        = preco + ipiRateado + subst + frete + seguro + despesa + complemento + cte;
                    const vista        = parseInt(eval(configs.getProdutos().calculoPreco.vista));
                    const ipiDigitado  = (cents(produto['MOVIMENTOSITENS_VALORIPI']) > 0);
        
                    if(!ipiDigitado) {
                        produto['MOVIMENTOSITENS_VALORIPI'] = ipi / 100;
                    }

                    produto['NOVO_CUSTO']  = custo      / 100;
                    produto['NOVO_PRECO']  = vista      / 100;
                    produto['NOVO_PRAZO']  = precoPrazo / 100;
                    produto['NOVO_COMPRA'] = preco      / 100;

                });
                
            } else {
                movimento['MOVIMENTOS_ITENS'].forEach(produto => {
                    const itemTotal = cents(produto['MOVIMENTOSITENS_TOTAL']);

                    produto['MOVIMENTOSITENS_FRETE']    = parseInt(itemTotal * ratios.frete)    / 100;
                    produto['MOVIMENTOSITENS_DESPESAS'] = parseInt(itemTotal * ratios.despesas) / 100;
    
                    if(!configs.getMovimentos().usarMarkup){
                        produto['MOVIMENTOSITENS_SEGURO'] = parseInt(itemTotal * ratios.seguro) / 100;
                    }
                });
    
                //caso seja desconto dado no cabecalho ou caso tenha alterado algum campo do cabecalho
                if(movimento['DOCUMENTOS_DESCONTOITEM'] == 'F' || !options.produto) {
                    const descontoMaximo = cents(fnLista.getTotalBruto()) - cents(fnLista.getPrecoMinimo())

                    movimento['MOVIMENTOS_ITENS'].forEach(produto => {
                        const fnProduto = Movimento.calculos.Produto.createFnProduto(options, produto);
                        
                        if(
                            (
                                movimento['DOCUMENTOS_NOME'] == 'Nota Entrada'  && 
                                configs.getMovimentos().rateiaDescontoNotaEntrada
                            ) || 
                            (
                                movimento['DOCUMENTOS_NOME'] == 'Requisições' && 
                                movimento['MOVIMENTOS_ID_OPERACOES'] < 500000  && 
                                configs.getMovimentos().rateiaDescontoRequisicaoEntrada
                            )
                        ) {
                            const qtde               = grams(produto['MOVIMENTOSITENS_QUANTIDADE']) || 0;
                            const totalBruto         = cents(fnProduto.getTotalBruto());
                            const ratioDesconto      = totalBruto / cents(fnLista.getTotalBruto());
                            const desconto           = Math.floor(ratioDesconto * cents(movimento['MOVIMENTOS_DESCONTOS']));
                            const totalLiquido       = totalBruto - desconto;
                            const liquido            = Math.round(totalLiquido / (qtde || 1) * 1000);
                            const percentual         = parseInt(desconto / totalBruto * 100 * 1000);

                            produto['MOVIMENTOSITENS_DESCONTOS']  = parseInt(desconto)     / 100;
                            produto['MOVIMENTOSITENS_PERCENTUAL'] = parseInt(percentual)   / 1000;
                            produto['TOTAL_LIQUIDO']              = parseInt(totalLiquido) / 100;
                            produto['VALOR_LIQUIDO']              = parseInt(liquido)      / 100;
    
                        } else {
                            const precoOriginal      = cents(fnProduto.getPrecoOriginal());
                            const precoMinimo        = cents(fnProduto.getPrecoMinimo());
                            const qtde               = grams(produto['MOVIMENTOSITENS_QUANTIDADE']) || 0;
                            const maxDescontoItem    = (precoOriginal - precoMinimo) * qtde / 1000;
                            const ratioDesconto      = maxDescontoItem / descontoMaximo;//ratio feito com base no preco minimo para nao deixar o produto abaixo do precominimo
                            const totalBruto         = precoOriginal * qtde / 1000;
                            const desconto           = Math.floor(ratioDesconto * cents(movimento['MOVIMENTOS_DESCONTOS']));
                            const totalLiquido       = totalBruto - desconto;
                            const totalLiquidoValido = totalLiquido >= (precoMinimo * qtde / 1000) ? totalLiquido : (precoMinimo * qtde / 1000);
                            const liquido            = Math.round(totalLiquidoValido / (qtde || 1) * 1000);
                            const percentual         = parseInt(desconto / totalBruto * 100 * 1000);
                            const descontoValido     = totalBruto - totalLiquidoValido;
                            
                            produto['MOVIMENTOSITENS_DESCONTOS']  = parseInt(descontoValido)     / 100;
                            produto['MOVIMENTOSITENS_PERCENTUAL'] = parseInt(percentual)         / 1000;
                            produto['TOTAL_LIQUIDO']              = parseInt(totalLiquidoValido) / 100;
                            produto['VALOR_LIQUIDO']              = parseInt(liquido)            / 100;
                        }
                    });
                }
    
                if(movimento['MOVIMENTOS_ITENS'][0]){
                    somarSobraAoPrimeiroProduto();
                }
            }
        }
    
        function obterRatios() {   
            const frete    = cents(movimento['MOVIMENTOS_FRETE']);
            const seguro   = configs.getMovimentos().usarMarkup ? 0 : cents(movimento['MOVIMENTOS_SEGURO']);
            const despesas = cents(movimento['MOVIMENTOS_DESPESAS']);
            const baseSt   = cents(movimento['MOVIMENTOS_BASEST']);
            const valorSt  = cents(movimento['MOVIMENTOS_VALORST']);
            const imposto  = cents(movimento['MOVIMENTOS_IMPOSTO']);
            const total    = cents(movimento['MOVIMENTOS_PRODUTOS']);
            const desconto = movimento['DOCUMENTOS_DESCONTOITEM'] == 'F' ? cents(movimento['MOVIMENTOS_DESCONTOS']) : 0
            const totalLiquido = total - (frete + seguro + despesas + valorSt);
    
            return {
                descontos    : desconto     / total,
                totalLiquido : totalLiquido / total,
                baseSt       : baseSt       / total,
                valorSt      : valorSt      / total,
                imposto      : imposto      / total,
                frete        : frete        / total,
                seguro       : seguro       / total,
                despesas     : despesas     / total
            }
        }

        function selecionarProduto (sobraDesconto, i = 0) {
            const fnProduto = Movimento.calculos.Produto.createFnProduto(options, movimento['MOVIMENTOS_ITENS'][i]);
            const precoOriginal = cents(fnProduto.getPrecoOriginal());
            const precoMinimo   = cents(fnProduto.getPrecoMinimo());
            const descontos     = cents(movimento['MOVIMENTOS_ITENS'][i]['MOVIMENTOSITENS_DESCONTOS']);
            const maxDescontoItem  = precoOriginal - precoMinimo;
            const descontoAjustado = descontos + sobraDesconto;
    
            if(descontoAjustado > maxDescontoItem) {
                if(movimento['MOVIMENTOS_ITENS'][i + 1]){
                    return selecionarProduto(sobraDesconto, ++i);
                } else {
                    return undefined;
                }
            } else {
                return movimento['MOVIMENTOS_ITENS'][i];
            }
        }
    
        function somarSobraAoPrimeiroProduto() {
            const frete        = cents(movimento['MOVIMENTOS_FRETE']);
            const seguro       = configs.getMovimentos().usarMarkup ? 0 : cents(movimento['MOVIMENTOS_SEGURO']);
            const despesas     = cents(movimento['MOVIMENTOS_DESPESAS']);
            const valorst      = cents(movimento['MOVIMENTOS_VALORST']);
            const total        = cents(movimento['MOVIMENTOS_TOTAL']);
            const totalLiquido = total - (frete + seguro + despesas + valorst);
            const desconto     = movimento['DOCUMENTOS_DESCONTOITEM'] == 'F' ? cents(movimento['MOVIMENTOS_DESCONTOS']) : 0
            
            let sobraDesconto     = desconto - cents(fnLista.getDescontos());
            let sobraTotalLiquido = totalLiquido - cents(fnLista.getTotalLiquido());            
    
            const produto = selecionarProduto(sobraDesconto);
    
            //significa que nenhum produto poderia sozinho assumir as sobras de desconto
            //entao rateia as sobras tambem
            if(!produto){
                movimento['MOVIMENTOS_ITENS'].forEach(produto => {
                    const qtde = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
                    let sobraLiquido = parseInt(totalLiquido / qtde * 1000) - parseInt(cents(fnLista.getTotalLiquido()) / qtde * 1000);
    
                    if(sobraDesconto > 0){
                        const descontos = cents(produto['MOVIMENTOSITENS_DESCONTOS']);
                        const descontoAjustado = descontos + 1;
                        sobraDesconto--;
                        produto['MOVIMENTOSITENS_DESCONTOS'] = descontoAjustado / 100;
                    }
                    if(sobraLiquido < 0){
                        const liquido = cents(produto['VALOR_LIQUIDO']);
                        const liquidoAjustado = liquido - 1;
                        sobraLiquido++;
                        produto['VALOR_LIQUIDO'] = liquidoAjustado / 100;
                    }
                    if(sobraTotalLiquido < 0){
                        const totalLiquidoItem = cents(produto['TOTAL_LIQUIDO']);
                        const totalLiquidoAjustado = totalLiquidoItem - 1;
                        sobraTotalLiquido++;
                        produto['TOTAL_LIQUIDO'] = totalLiquidoAjustado / 100;
                    }
                });
            } else {
                const qtde    = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
                const basest  = cents(produto['MOVIMENTOS_BASEST']);
                const valorst = cents(produto['MOVIMENTOS_VALORST']);
                const imposto = cents(produto['MOVIMENTOS_IMPOSTO']);
                
                const liquidoAjustado      = (totalLiquido + parseInt(cents(produto['TOTAL_LIQUIDO']) * qtde / 1000) - parseInt(cents(fnLista.getTotalLiquido()))) / qtde * 1000;
                const descontoAjustado     = cents(produto['MOVIMENTOSITENS_DESCONTOS']) + sobraDesconto;
                const totalLiquidoAjustado = cents(produto['TOTAL_LIQUIDO']) + sobraTotalLiquido;
                const basestAjustada       = basest   + cents(produto['MOVIMENTOSITENS_BASEST'])   - cents(fnLista.getBaseSt());
                const valorstAjustado      = valorst  + cents(produto['MOVIMENTOSITENS_VALORST'])  - cents(fnLista.getValorSt());
                const impostoAjustado      = imposto  + cents(produto['MOVIMENTOSITENS_IMPOSTO'])  - cents(fnLista.getImposto());
                const freteAjustado        = frete    + cents(produto['MOVIMENTOSITENS_FRETE'])    - cents(fnLista.getFrete());
                const seguroAjustado       = seguro   + cents(produto['MOVIMENTOSITENS_SEGURO'])   - cents(fnLista.getSeguro());
                const despesaAjustada      = despesas + cents(produto['MOVIMENTOSITENS_DESPESAS']) - cents(fnLista.getDespesas());
        
                if(
                    movimento['DOCUMENTOS_NOME'] == 'Nota Entrada'  && 
                    !configs.getMovimentos().rateiaDescontoNotaEntrada
                ) {
                    produto['MOVIMENTOSITENS_BASEST']   = basestAjustada   / 100
                    produto['MOVIMENTOSITENS_VALORST']  = valorstAjustado  / 100
                    produto['MOVIMENTOSITENS_IMPOSTO']  = impostoAjustado  / 100
                    produto['MOVIMENTOSITENS_FRETE']    = freteAjustado    / 100
                    produto['MOVIMENTOSITENS_SEGURO']   = seguroAjustado   / 100
                    produto['MOVIMENTOSITENS_DESPESAS'] = despesaAjustada  / 100
                } else {
                    produto['MOVIMENTOSITENS_DESCONTOS'] = descontoAjustado     / 100;
                    produto['VALOR_LIQUIDO']             = liquidoAjustado      / 100;
                    produto['TOTAL_LIQUIDO']             = totalLiquidoAjustado / 100;
                    produto['MOVIMENTOSITENS_FRETE']     = freteAjustado        / 100;
                    produto['MOVIMENTOSITENS_DESPESAS']  = despesaAjustada      / 100;

                    if(valorst > 0) {
                        produto['MOVIMENTOSITENS_BASEST']   = basestAjustada / 100;
                        produto['MOVIMENTOSITENS_VALORST']  = valorstAjustado / 100;
                    }
    
                    if(!configs.getMovimentos().usarMarkup) {
                        produto['MOVIMENTOSITENS_SEGURO'] = seguroAjustado / 100;
                    }
                }
            }
        }

        return {
            calcular
        }
    }
});
