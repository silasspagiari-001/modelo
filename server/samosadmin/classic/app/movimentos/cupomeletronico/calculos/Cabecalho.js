Ext.define('SamosAdmin.movimentos.cupomeletronico.calculos.Cabecalho', {
    alternateClassName: 'CupomEletronico.calculos.Cabecalho',
    singleton: true,

    createFnCabecalho: function(options) {
        const { movimento } = options;
        
        //classe que gerencia alterações em toda a a lista de produtos
        const fnLista = CupomEletronico.calculos.ListaProdutos.createFnLista(options);

        function calcular() {
            const result = {};
            
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
                //CupomEletronico.services.Descontos.itemECabecalho.somarTotaisParaCabecalho(deps);
            }

            ratear();

            CupomEletronico.services.Recuperacao.salvar(movimento, movimento['MOVIMENTOS_ITENS']);
    
            return result;
        }
    
        function ratear() {
            //caso seja desconto dado no cabecalho ou caso tenha alterado algum campo do cabecalho
            if(movimento['DOCUMENTOS_DESCONTOITEM'] == 'F' || !options.produto) {
                const descontoMaximo = cents(fnLista.getTotalBruto()) - cents(fnLista.getPrecoMinimo())

                movimento['MOVIMENTOS_ITENS'].forEach(produto => {
                    const fnProduto = CupomEletronico.calculos.Produto.createFnProduto(options, produto);
                    const preco              = cents(fnProduto.getPreco());
                    //const precoOriginal      = cents(fnProduto.getPrecoOriginal());
                    const precoMinimo        = cents(fnProduto.getPrecoMinimo());
                    const qtde               = grams(produto['MOVIMENTOSITENS_QUANTIDADE']) || 0;
                    const maxDescontoItem    = (preco - precoMinimo) * qtde / 1000;
                    const ratioDesconto      = maxDescontoItem / descontoMaximo;//ratio feito com base no preco minimo para nao deixar o produto abaixo do precominimo
                    const totalBruto         = preco * qtde / 1000;
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
                });
            }

            if(movimento['MOVIMENTOS_ITENS'][0]){
                somarSobraAoPrimeiroProduto();
            }
        }

        function selecionarProduto (sobraDesconto, i = 0) {
            const fnProduto = CupomEletronico.calculos.Produto.createFnProduto(options, movimento['MOVIMENTOS_ITENS'][i]);
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
            const total        = cents(movimento['MOVIMENTOS_TOTAL']);
            const totalLiquido = total;
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
                const qtde = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
                
                const liquidoAjustado      = (totalLiquido + parseInt(cents(produto['TOTAL_LIQUIDO']) * qtde / 1000) - parseInt(cents(fnLista.getTotalLiquido()))) / qtde * 1000;
                const descontoAjustado     = cents(produto['MOVIMENTOSITENS_DESCONTOS']) + sobraDesconto;
                const totalLiquidoAjustado = cents(produto['TOTAL_LIQUIDO']) + sobraTotalLiquido;
                
                produto['MOVIMENTOSITENS_DESCONTOS'] = descontoAjustado     / 100;
                produto['VALOR_LIQUIDO']             = liquidoAjustado      / 100;
                produto['TOTAL_LIQUIDO']             = totalLiquidoAjustado / 100;
            }
        }

        return {
            calcular
        }
    }
});
