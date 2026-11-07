Ext.define('SamosAdmin.movimentos.cupomeletronico.calculos.ListaProdutos', {
    alternateClassName: 'CupomEletronico.calculos.ListaProdutos',
    singleton: true,

    createFnLista: function (options) {
        const { movimento, fieldName, event } = options;

        function somarDescontosItens() {
            const totalBrutoProdutos = cents(getTotalBruto());
            const descontosProdutos  = cents(getDescontos());

            movimento['MOVIMENTOS_PERCENTUAL'] = grams(descontosProdutos / totalBrutoProdutos * 100) / 1000;
            movimento['MOVIMENTOS_DESCONTOS']  = descontosProdutos  / 100;
            movimento['MOVIMENTOS_PRODUTOS']   = totalBrutoProdutos / 100;
            movimento['MOVIMENTOS_TOTAL']      = (totalBrutoProdutos - descontosProdutos) / 100;
        }

        function calcularDescontoCabecalho() {
            const descontoCalculado = calcularDesconto();
            const descontoValido = validarDesconto(descontoCalculado);     

            const { dinheiro, percentual, totalLiquido, totalBruto } = descontoValido;
            
            movimento['MOVIMENTOS_PERCENTUAL'] = percentual   / 1000;
            movimento['MOVIMENTOS_DESCONTOS']  = dinheiro     / 100;
            movimento['MOVIMENTOS_PRODUTOS']   = totalBruto   / 100;
            movimento['MOVIMENTOS_TOTAL']      = totalLiquido / 100;

            //TODO Ext.defer(this.atualizarItens, 110, this, [deps]); // antes 110

            return descontoValido;
        }

        function calcularDesconto() {
            const totalBruto = cents(getTotalBruto());

            let digitouEmDinheiro   = fieldName == 'MOVIMENTOS_DESCONTOS'  || fieldName == 'MOVIMENTOSITENS_DESCONTOS';
            let digitouEmPercentual = fieldName == 'MOVIMENTOS_PERCENTUAL' || fieldName == 'MOVIMENTOSITENS_PERCENTUAL';
            
            let percentual = grams(movimento['MOVIMENTOS_PERCENTUAL']) || 0;
            let dinheiro   = cents(movimento['MOVIMENTOS_DESCONTOS'])  || 0;

            if(!digitouEmDinheiro && !digitouEmPercentual) {
                /*const matchDinheiro   = dinheiro.toString().replace(/\D/, '').match(/0+$/);
                const matchPercentual = percentual.toString().replace(/\D/, '').match(/0+$/);
                
                let zerosDinheiro = 0;
                let zerosPercentual = 0;

                if(matchDinheiro) {
                    zerosDinheiro = matchDinheiro[0].length;
                }

                if(matchPercentual) {
                    zerosPercentual = matchPercentual[0].length;
                }

                digitouEmDinheiro   = zerosDinheiro > zerosPercentual;
                digitouEmPercentual = !digitouEmDinheiro;*/
                
                digitouEmDinheiro = true;//tentativa de deixar o desconto em dinheiro como padrão
            }
    
            if(digitouEmDinheiro){
                percentual = grams(dinheiro / totalBruto * 100);
            } else if(digitouEmPercentual){
                dinheiro = cents((percentual * totalBruto) / 100 / 100 / 1000);
            }

            const totalLiquido = totalBruto - dinheiro;

            return { 
                dinheiro    : dinheiro, 
                percentual  : percentual, 
                totalLiquido: totalLiquido, 
                totalBruto  : totalBruto
            }
        }

        function validarDesconto(descontoCalculado) {
            const { dinheiro, percentual, totalLiquido, totalBruto } = descontoCalculado;

            const precoMinimo            = cents(getPrecoMinimo());
            const precoMinimoSupervisor  = cents(getPrecoMinimoSupervisor());
            const precoMinimoGerente     = cents(getPrecoMinimoGerente());
                
            if((totalBruto - dinheiro) < precoMinimo){
                if((totalBruto - dinheiro) < precoMinimoGerente){
                    return {
                        mensagem    : 'Desconto máximo atingido',
                        dinheiro    : 0,
                        percentual  : 0,
                        totalLiquido: totalBruto,
                        totalBruto  : totalBruto,
                    }

                //não pede senha nível ao digitar, apenas ao sair do campo
                } else if(event == 'blur') {
                    if((totalBruto - dinheiro) < precoMinimoSupervisor){
                        return senhaPrecoMinimo({ nivel: 2 });
                    } else {
                        return senhaPrecoMinimo({ nivel: 1 });
                    }
                }
            }

            function senhaPrecoMinimo({ nivel }) {
                return {
                    dinheiro    : dinheiro,
                    percentual  : percentual,
                    totalLiquido: totalLiquido,
                    totalBruto  : totalBruto,
                    senhaNivel   : {
                        nivel: nivel,
                        autorizar: (options) => {
                            const { movimento } = options;

                            movimento['MOVIMENTOS_ITENS'].forEach(produto => {
                                const fnProduto = CupomEletronico.calculos.Produto.createFnProduto(options, produto);
                                const precoOriginal = cents(fnProduto.getPrecoOriginal());
                                const qtde = grams(produto['MOVIMENTOSITENS_QUANTIDADE'] || 1);
                                const ratio = cents(produto['MOVIMENTOSITENS_TOTAL']) / totalBruto;
                                const descontoMaximoUnitario = Math.ceil((dinheiro * ratio) / (qtde / 1000));
                                const novoPrecoMinimo = (precoOriginal - descontoMaximoUnitario)  / 100;

                                produto['SALDOS_PRECOMINIMO'] = novoPrecoMinimo;
                            });
                            
                            //this.atualizarItens(deps);

                            return options;
                        },
                        rejeitar: (options) => {
                            const { movimento } = options;

                            const totalLiquido = totalBruto;
                            
                            movimento['MOVIMENTOS_PERCENTUAL'] = 0;
                            movimento['MOVIMENTOS_DESCONTOS']  = 0;
                            movimento['MOVIMENTOS_PRODUTOS']   = totalBruto   / 100;
                            movimento['MOVIMENTOS_TOTAL']      = totalLiquido / 100;
                            //this.atualizarItens(deps);

                            return options;
                        }
                    }
                }
            }

            return descontoCalculado;
        }
        
        function getDescontos() {
            return (movimento['MOVIMENTOS_ITENS'] || []).reduce((total, produto) => {
                const fnProduto = CupomEletronico.calculos.Produto.createFnProduto(options, produto);

                if(configs.getMovimentos().alteraLiquido){
                    const totalBruto   = cents(fnProduto.getTotalBruto());
                    const totalLiquido = cents(produto['TOTAL_LIQUIDO']);
                    const desconto     = totalBruto - totalLiquido;
                    return total += desconto;
                } else {
                    const desconto = cents(produto['MOVIMENTOSITENS_DESCONTOS']) || 0
                    return total += desconto
                }
            }, 0) / 100;
        }

        function getTotalLiquido() {
            return (movimento['MOVIMENTOS_ITENS'] || []).reduce((total, produto) => {
                return total += cents(produto['TOTAL_LIQUIDO']) || 0
            }, 0) / 100;
        }

        function getTotalBruto() {
            return (movimento['MOVIMENTOS_ITENS'] || []).reduce((total, produto) => {
                const fnProduto = CupomEletronico.calculos.Produto.createFnProduto(options, produto);
                return total + cents(fnProduto.getTotalBruto());
            }, 0) / 100;
        }

        function getImposto() {
            return (movimento['MOVIMENTOS_ITENS'] || []).reduce((total, produto) => {
                return total += cents(produto['MOVIMENTOSITENS_IMPOSTO']) || 0
            }, 0) / 100;
        }

        function getPrecoMinimo() {
            return (movimento['MOVIMENTOS_ITENS'] || []).reduce((total, produto) => {
                const fnProduto = CupomEletronico.calculos.Produto.createFnProduto(options, produto);

                const precoOriginal = cents(fnProduto.getPrecoOriginal());
                const precoMinimo = cents(produto['SALDOS_PRECOMINIMO']);
                const qtde = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);

                if(precoMinimo > precoOriginal) {
                    //caso o preco minimo seja maior que o preco, o mínimo é o próprio preço
                    return total + precoOriginal * qtde / 1000
                } else {
                    return total + precoMinimo * qtde / 1000
                }
            }, 0) / 100;
        }

        function getPrecoMinimoSupervisor() {
            return (movimento['MOVIMENTOS_ITENS'] || []).reduce((total, produto) => {
                const fnProduto = CupomEletronico.calculos.Produto.createFnProduto(options, produto);

                const precoMinimo = cents(fnProduto.getPrecoMinimo());
                const precoOriginal = cents(fnProduto.getPrecoOriginal());
                const qtde = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
        
                if(configs.getMovimentos().descontoMaximoSupervisor == 'SALDOS_PRECOMINIMO') {
                    return total + (precoMinimo * qtde / 1000);
        
                } else {
                    //caso o config descontoMaximoSupervisor seja um percentual
                    //calcula o preço mínimo do supervisor
                    const descontoMaximo = parseInt(precoOriginal * (configs.getMovimentos().descontoMaximoSupervisor || 100) / 100);
                    return total + ((precoOriginal - descontoMaximo) * qtde / 1000);
                }
            }, 0) / 100;
        }

        function getPrecoMinimoGerente() {
            return (movimento['MOVIMENTOS_ITENS'] || []).reduce((total, produto) => {
                const fnProduto = CupomEletronico.calculos.Produto.createFnProduto(options, produto);

                const precoMinimo  = cents(fnProduto.getPrecoMinimo());
                const precoOriginal = cents(fnProduto.getPrecoOriginal());
                const qtde = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
        
                if(configs.getMovimentos().descontoMaximoGerente == 'SALDOS_PRECOMINIMO') {
                    return total + (precoMinimo * qtde / 1000);
        
                } else {
                    //caso o config descontoMaximoGerente seja um percentual
                    //calcula o preço mínimo do gerente
                    const descontoMaximo = parseInt(precoOriginal * (configs.getMovimentos().descontoMaximoGerente || 100) / 100);
                    return total + ((precoOriginal - descontoMaximo) * qtde / 1000);
                }
            }, 0) / 100;
        }

        return {
            getDescontos,
            getTotalLiquido,
            getTotalBruto,
            getPrecoMinimo,
            getImposto,
            somarDescontosItens,
            calcularDescontoCabecalho
        }
    }
});
