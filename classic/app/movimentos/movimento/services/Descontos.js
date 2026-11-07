Ext.define('SamosAdmin.movimentos.movimento.services.Descontos', {
    alternateClassName: 'Movimento.services.Descontos',
    singleton: true,

    cabecalho: {
        calcularTotaisCabecalho: function(deps) {
            const isNotaEletronica = deps.vm.get('isNotaEletronica');
            const isRequisicaoEntrada = deps.vm.get('isRequisicaoEntrada');
            const isNotaEntrada = deps.vm.get('isNotaEntrada');

            if(deps.txtPercentual) deps.txtPercentual.suspendEvents();
            if(deps.txtDinheiro)   deps.txtDinheiro.suspendEvents();
            
            const somaTotalBrutoProdutos    = cents(Movimento.services.Descontos.somarTotalBrutoProdutos(deps));
            let digitouEmDinheiro           = Movimento.services.Descontos.digitouEmDinheiro(deps.txt);
            let digitouEmPercentual         = Movimento.services.Descontos.digitouEmPercentual(deps.txt);
            const haviaDigitadoEmDinheiro   = deps.vm.get('digitouDescontoCabecalhoEmDinheiro');
            const haviaDigitadoEmPercentual = deps.vm.get('digitouDescontoCabecalhoEmPercentual');
            const frete                     = cents(Movimento.services.Descontos.getFreteCabecalho(deps.movimento));
            const seguro                    = cents(Movimento.services.Descontos.getSeguroCabecalho(deps.movimento));
            const despesas                  = cents(Movimento.services.Descontos.getDespesasCabecalho(deps.movimento));
            const valorst                   = cents(Movimento.services.Descontos.getValorStCabecalho(deps.movimento));
            const valoripi                  = cents(Movimento.services.Descontos.getValorIpiCabecalho(deps.movimento));            
            const descontoMaximo            = cents(Movimento.services.Descontos.descontoMaximo(deps));
            const descontoMaximoSupervisor  = cents(Movimento.services.Descontos.descontoMaximoSupervisor(deps));
            const descontoMaximoGerente     = cents(Movimento.services.Descontos.descontoMaximoGerente(deps));
            
            let percentual   = 0;
            let dinheiro     = 0;
            let totalLiquido = 0;
    
            if(digitouEmDinheiro) {
                dinheiro   = cents(deps.txtDinheiro.getValue());
                percentual = grams(dinheiro / somaTotalBrutoProdutos * 100);
            } else if(digitouEmPercentual){
                percentual = grams(deps.txtPercentual.getValue());
                dinheiro   = cents((percentual * somaTotalBrutoProdutos) / 100 / 100 / 1000);
            } else if(haviaDigitadoEmDinheiro){
                digitouEmDinheiro = haviaDigitadoEmDinheiro;
                dinheiro   = cents(Movimento.services.Descontos.getDescontoCabecalho(deps.movimento));
                percentual = grams(dinheiro / somaTotalBrutoProdutos * 100);
            } else if(haviaDigitadoEmPercentual){
                digitouEmPercentual = haviaDigitadoEmPercentual;
                percentual = grams(Movimento.services.Descontos.getPercentualCabecalho(deps.movimento));
                dinheiro   = cents((percentual * somaTotalBrutoProdutos) / 100 / 100 / 1000);
            }

            if(dinheiro == 0 && percentual == 0){
                totalLiquido = somaTotalBrutoProdutos - dinheiro + frete + seguro + despesas + valorst + valoripi;
                if(deps.vm.get('readOnly')) {

                } else {   // Zerar só se estiver em edição
                    this.zerarDescontosCabecalho(deps, somaTotalBrutoProdutos, totalLiquido);
                }                
            } else if(
                !isNotaEntrada &&
                !isRequisicaoEntrada && 
                !isNotaEletronica && 
                dinheiro > descontoMaximo
            ){
                let nivel = 1;

                if(dinheiro > descontoMaximoGerente){
                    nivel = 0;
                    Ext.Note('warning', 'Desconto máximo atingido' + descontoMaximoGerente.toString() + '/' + dinheiro.toString());
                    dinheiro = 0;
                    totalLiquido = somaTotalBrutoProdutos - dinheiro + frete + seguro + despesas + valorst;
                    this.zerarDescontosCabecalho(deps, somaTotalBrutoProdutos, totalLiquido);
                    Ext.defer(deps.txt.focus, 100, deps.txt, [true]);
                    this.atualizarMovimento(deps, somaTotalBrutoProdutos, dinheiro, frete, seguro, despesas, valorst, valoripi, percentual, digitouEmDinheiro, digitouEmPercentual);

                } else if(dinheiro > descontoMaximoSupervisor){
                    nivel = 2;
                }

                let nomeCliente = '';

                if(deps.vm.get('model.MOVIMENTOS_ID_PESSOAS')) {
                    nomeCliente = deps.vm.get('model.MOVIMENTOS_NOME');
                } else {
                    nomeCliente = 'NÃO INFORMADO';
                }

                if(nivel != 0) { 
                    if(cofigs.getMovimentos().liberacaoViaRedis) {// liberacao via redis (usuário remoto)
                        let nome = `Liberação para: ${deps.vm.get('model.USUARIOS_LOGIN')} - DESCONTO - Doc: ${vm.get('model.MOVIMENTOS_NUMERO')} - Emissao: ${momentTz(vm.get('model.MOVIMENTOS_EMISSAO')).format('DD/MM/YYYY')} - Para: ${nomeCliente}`.slice(0, 50);
                        let mensagem = `Desconto de ${Ext.util.Format.MoneyMask.setMask('R$ #9.999.990,00').mask(deps.vm.get('model.MOVIMENTOS_DESCONTOS'))} NO DOCUMENTO: ${vm.get('model.MOVIMENTOS_NUMERO')} ${vm.get('model.MOVIMENTOS_SERIE')}\nPessoa: ${nomeCliente} `;
                        Ext.create({ xtype: 'samoswidgets-liberaredis' })
                        .iniciar(nome, mensagem)
                        .then(async () => {
                            const produtos = deps.vm.getStore('produtos').data.items;
                            const grid = deps.ctrl.lookup('produtos');

                            produtos.forEach(produto => {
                                const precoOriginal = cents(produto.get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'));
                                const qtde = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE') || 1);
                                const ratio = cents(produto.get('MOVIMENTOSITENS_TOTAL')) / somaTotalBrutoProdutos;
                                const descontoMaximoUnitario = Math.ceil((dinheiro * ratio) / (qtde / 1000));
                                const novoPrecoMinimo = (precoOriginal - descontoMaximoUnitario)  / 100;

                                produto.set('SALDOS_PRECOMINIMO', novoPrecoMinimo);
                            
                                grid.atualizarCampo({
                                    field: 'SALDOS_PRECOMINIMO', 
                                    value: novoPrecoMinimo,
                                    chave: {
                                        field: 'MOVIMENTOSITENS_ID_PRODUTOS',
                                        value: produto.get('MOVIMENTOSITENS_ID_PRODUTOS')
                                    }
                                });
                            });

                            this.atualizarMovimento(deps, somaTotalBrutoProdutos, dinheiro, frete, seguro, despesas, valorst, valoripi, percentual, digitouEmDinheiro, digitouEmPercentual);
                            this.atualizarItens(deps);
                        })
                        .catch(() => {
                            dinheiro = 0;
                            totalLiquido = somaTotalBrutoProdutos - dinheiro + frete + seguro + despesas + valorst;
                            this.zerarDescontosCabecalho(deps, somaTotalBrutoProdutos, totalLiquido);
                            Ext.defer(deps.txt.focus, 100, deps.txt, [true]);
                            this.atualizarItens(deps);
                        });
                    } else { // senhaNível padrão 3 dezenas
                        Ext.create({ xtype: 'samoswidgets-senhanivel' })
                        .iniciar(nivel)
                        .then(async () => {
                            const produtos = deps.vm.getStore('produtos').data.items;
                            const grid = deps.ctrl.lookup('produtos');

                            produtos.forEach(produto => {
                                const precoOriginal = cents(produto.get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'));
                                const qtde = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE') || 1);
                                const ratio = cents(produto.get('MOVIMENTOSITENS_TOTAL')) / somaTotalBrutoProdutos;
                                const descontoMaximoUnitario = Math.ceil((dinheiro * ratio) / (qtde / 1000));
                                const novoPrecoMinimo = (precoOriginal - descontoMaximoUnitario)  / 100;

                                produto.set('SALDOS_PRECOMINIMO', novoPrecoMinimo);
                            
                                grid.atualizarCampo({
                                    field: 'SALDOS_PRECOMINIMO', 
                                    value: novoPrecoMinimo,
                                    chave: {
                                        field: 'MOVIMENTOSITENS_ID_PRODUTOS',
                                        value: produto.get('MOVIMENTOSITENS_ID_PRODUTOS')
                                    }
                                });
                            });

                            this.atualizarMovimento(deps, somaTotalBrutoProdutos, dinheiro, frete, seguro, despesas, valorst, valoripi, percentual, digitouEmDinheiro, digitouEmPercentual);
                            this.atualizarItens(deps);
                        })
                        .catch(() => {
                            dinheiro = 0;
                            totalLiquido = somaTotalBrutoProdutos - dinheiro + frete + seguro + despesas + valorst;
                            this.zerarDescontosCabecalho(deps, somaTotalBrutoProdutos, totalLiquido);
                            Ext.defer(deps.txt.focus, 100, deps.txt, [true]);
                            this.atualizarItens(deps);
                        });
                    }

                    return;
                }
            } else {
                this.atualizarMovimento(deps, somaTotalBrutoProdutos, dinheiro, frete, seguro, despesas, valorst, valoripi, percentual, digitouEmDinheiro, digitouEmPercentual);
            }

            Ext.defer(this.atualizarItens, 110, this, [deps]); // antes 110
        },
//Pedido de compra
        calcularTotaisPedidoCompra: function(deps) {
            
            if(deps.txtPercentual) deps.txtPercentual.suspendEvents();
            if(deps.txtDinheiro)   deps.txtDinheiro.suspendEvents();
            
            const somaTotalBrutoProdutos    = cents(Movimento.services.Descontos.somarTotalBrutoProdutos(deps));
            let digitouEmDinheiro           = Movimento.services.Descontos.digitouEmDinheiro(deps.txt);
            let digitouEmPercentual         = Movimento.services.Descontos.digitouEmPercentual(deps.txt);
            const haviaDigitadoEmDinheiro   = deps.vm.get('digitouDescontoCabecalhoEmDinheiro');
            const haviaDigitadoEmPercentual = deps.vm.get('digitouDescontoCabecalhoEmPercentual');
            const frete                     = cents(Movimento.services.Descontos.somarFreteItens(deps));
            const seguro                    = cents(Movimento.services.Descontos.somarSeguroItens(deps));
            const valoripi                  = cents(Movimento.services.Descontos.somarIpiItens(deps));            
            const despesas                  = cents(Movimento.services.Descontos.somarDespesasItens(deps));
            const valorst                   = cents(Movimento.services.Descontos.somarValorStItens(deps));
            
            let percentual   = 0;
            let dinheiro     = 0;
            let totalLiquido = 0;

            if(digitouEmDinheiro) {
                dinheiro   = cents(deps.txtDinheiro.getValue());
                percentual = grams(dinheiro / somaTotalBrutoProdutos * 100);
            } else if(digitouEmPercentual){
                percentual = grams(deps.txtPercentual.getValue());
                dinheiro   = cents((percentual * somaTotalBrutoProdutos) / 100 / 100 / 1000);
            } else if(haviaDigitadoEmDinheiro){
                digitouEmDinheiro = haviaDigitadoEmDinheiro;
                dinheiro   = cents(Movimento.services.Descontos.getDescontoCabecalho(deps.movimento));
                percentual = grams(dinheiro / somaTotalBrutoProdutos * 100);
            } else if(haviaDigitadoEmPercentual){
                digitouEmPercentual = haviaDigitadoEmPercentual;
                percentual = grams(Movimento.services.Descontos.getPercentualCabecalho(deps.movimento));
                dinheiro   = cents((percentual * somaTotalBrutoProdutos) / 100 / 100 / 1000);
            }

            if(dinheiro == 0 && percentual == 0){
                totalLiquido = somaTotalBrutoProdutos - dinheiro + valoripi + frete + seguro + despesas + valorst;
                this.zerarDescontosCabecalho(deps, somaTotalBrutoProdutos, totalLiquido);                
            } else {
                this.atualizarMovimento(deps, somaTotalBrutoProdutos, dinheiro, frete, seguro, despesas, valorst, valoripi, percentual, digitouEmDinheiro, digitouEmPercentual);
            }

            Ext.defer(this.atualizarItens, 110, this, [deps]); // antes 110
        },
// Fim do pedido de compra
        zerarDescontosCabecalho: function(deps, somaTotalBrutoProdutos, totalLiquido) {
            deps.movimento.set({
                'MOVIMENTOS_PRODUTOS'  : somaTotalBrutoProdutos / 100,
                'MOVIMENTOS_TOTAL'     : totalLiquido           / 100,
                'MOVIMENTOS_DESCONTOS' : 0,
                'MOVIMENTOS_PERCENTUAL': 0
            });

            if(deps.txtPercentual) deps.txtPercentual.setValue(0);
            if(deps.txtDinheiro)   deps.txtDinheiro.setValue(0);

            setTimeout(() => {
                deps.vm.set({
                    'digitouDescontoCabecalho'            : false,
                    'digitouDescontoCabecalhoEmDinheiro'  : false,
                    'digitouDescontoCabecalhoEmPercentual': false
                });
            }, 100); 
        },

        atualizarMovimento: function(deps, somaTotalBrutoProdutos, dinheiro, frete, seguro, despesas, valorst, valoripi, percentual, digitouEmDinheiro, digitouEmPercentual) {

            deps.movimento.set({
                'MOVIMENTOS_PRODUTOS'  : somaTotalBrutoProdutos / 100,
                'MOVIMENTOS_TOTAL'     : (somaTotalBrutoProdutos - dinheiro + frete + seguro + despesas + valorst + valoripi) / 100,
                'MOVIMENTOS_DESCONTOS' : dinheiro  / 100,
                'MOVIMENTOS_PERCENTUAL': percentual / 1000
            });

            deps.vm.set({
                'digitouDescontoCabecalho'            : true,
                'digitouDescontoCabecalhoEmDinheiro'  : digitouEmDinheiro,
                'digitouDescontoCabecalhoEmPercentual': digitouEmPercentual
            });
        },

        atualizarItens: function(deps) {
            setTimeout(() => {
                if(deps.txtPercentual) deps.txtPercentual.resumeEvents();
                if(deps.txtDinheiro)   deps.txtDinheiro.resumeEvents();
            }, 1);

            Movimento.services.Descontos.cabecalho.ratearCabecalhoPelosProdutos(deps);
    
            Ext.defer(deps.ctrl.calcularMargem, 100, deps.ctrl);  // 100
            Ext.defer(deps.ctrl.ratearCabecalhoPelosProdutos, 500, deps.ctrl); // 500
        },

        ratearCabecalhoPelosProdutos: function(deps) {
            const isRequisicaoEntrada = deps.vm.get('isRequisicaoEntrada');
            const isNotaEntrada = deps.vm.get('isNotaEntrada');
            const isNotaEletronica = deps.vm.get('isNotaEletronica');
            const isPedidoCompra = deps.vm.get('isPedidoCompra');
            const produtos = deps.vm.getStore('produtos').data.items;
            const totalDescontoCabecalho = cents(deps.movimento.get('MOVIMENTOS_DESCONTOS'));
            const descontoMaximo = cents(Movimento.services.Descontos.descontoMaximo(deps));
            const casasDecimaisPreco = configs.getMovimentos().casasDecimaisPreco || 2;
            const somaTotalBrutoProdutos = cents(Movimento.services.Descontos.somarTotalBrutoProdutos(deps));
            
            let somaDescontoRateado = 0;
            let somaTotalLiquidoRateado = 0;

            produtos.map(produto => {
                if(
                    (isRequisicaoEntrada && !configs.getMovimentos().rateiaDescontoRequisicaoEntrada) ||
                    isPedidoCompra
                ){
                    //converte o preco para inteiro, ex: R$ 1,234567 fica 1234567 (para bater os calculos no javascript)
                    const precoInt = toPrecision(produto.get('MOVIMENTOSITENS_PRECO'), casasDecimaisPreco);
                    const qtde     = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE')) || 0;
                    
                    //após calcular divide pelas casas decimais novamente e arredonda o total para centavos
                    const totalLiquido = Math.round(precoInt * qtde / 1000 / Math.pow(10, (casasDecimaisPreco - 2)));

                    somaTotalLiquidoRateado += totalLiquido;

                } else if(
                    (isRequisicaoEntrada && configs.getMovimentos().rateiaDescontoRequisicaoEntrada) ||
                    (isNotaEntrada       && configs.getMovimentos().rateiaDescontoNotaEntrada) ||
                    isNotaEletronica
                ) {
                    const precoOriginal      = cents(produto.get('MOVIMENTOSITENS_PRECO'));
                    const qtde               = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE')) || 0;
                    const totalBruto         = precoOriginal * qtde / 1000;
                    const ratioDesconto      = totalBruto / somaTotalBrutoProdutos;
                    const desconto           = Math.floor(ratioDesconto * totalDescontoCabecalho);
                    const totalLiquido       = totalBruto - desconto;
                    const liquido            = Math.round(totalLiquido / (qtde || 1000) * 1000);
                    const percentual         = parseInt(desconto / totalBruto * 100 * 1000);

                    somaDescontoRateado     += desconto;
                    somaTotalLiquidoRateado += totalLiquido;
                    
                    produto.set({
                        'MOVIMENTOSITENS_DESCONTOS'  : parseInt(desconto)     / 100,
                        'TOTAL_LIQUIDO'              : parseInt(totalLiquido) / 100,
                        'VALOR_LIQUIDO'              : parseInt(liquido)            / 100,
                        'MOVIMENTOSITENS_PERCENTUAL' : parseInt(percentual)         / 1000
                    });

                } else {
                    const precoOriginal      = cents(produto.get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'));
                    const precoMinimo        = cents(produto.get('SALDOS_PRECOMINIMO'));
                    const qtde               = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE')) || 0;
                    const maxDescontoItem    = (precoOriginal - precoMinimo) * qtde / 1000;
                    const ratioDesconto      = maxDescontoItem / descontoMaximo;//ratio feito com base no preco minimo para nao deixar o produto abaixo do precominimo
                    const totalBruto         = precoOriginal * qtde / 1000;
                    const desconto           = Math.floor(ratioDesconto * totalDescontoCabecalho);
                    const totalLiquido       = totalBruto - desconto;
                    const totalLiquidoValido = totalLiquido >= (precoMinimo * qtde / 1000) ? totalLiquido : (precoMinimo * qtde / 1000);
                    const liquido            = Math.round(totalLiquidoValido / (qtde || 1000) * 1000);
                    const percentual         = parseInt(desconto / totalBruto * 100 * 1000);
                    const descontoValido     = totalBruto - totalLiquidoValido;

                    somaDescontoRateado     += descontoValido;
                    somaTotalLiquidoRateado += totalLiquidoValido;
                    
                    produto.set({
                        'MOVIMENTOSITENS_DESCONTOS'  : parseInt(descontoValido)     / 100,
                        'TOTAL_LIQUIDO'              : parseInt(totalLiquidoValido) / 100,
                        'VALOR_LIQUIDO'              : parseInt(liquido)            / 100,
                        'MOVIMENTOSITENS_PERCENTUAL' : parseInt(percentual)         / 1000
                    });
                }
            });

            if(
                !isRequisicaoEntrada && 
                !isNotaEntrada && 
                totalDescontoCabecalho > descontoMaximo &&
                descontoMaximo > 0
            ){
                this.calcularTotaisCabecalho(deps);
            }
            
            return {
                somaDescontoRateado:     somaDescontoRateado,
                somaTotalLiquidoRateado: somaTotalLiquidoRateado
            };
        }
    },

    item: {
        calcularDescontoEPercentualItens: async function(deps, validarLiquidoItem, senhaNivel) {
            const isNotaEletronica = deps.vm.get('isNotaEletronica');
            const isPedidoStilo    = deps.vm.get('isOrcPedStilo');
            const isMovimentoInterno = deps.vm.get('isMovimentoInterno');
            const selection = deps.txt.up('form').getForm();
            const produto = selection.getValues();
            const permitidoAlterarPreco = deps.vm.get('permitidoAlterarPreco');
            const qtde = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
            const formaPagto = deps.vm.get('model.MOVIMENTOS_ID_APLICACOES');
            const abaterMontagem = (deps.vm.get('model.MOVIMENTOS_NFE') || '').trim() == 'ABA';
            const valorMontagem = cents(produto['MONTAGENS_VALOR']);
            const percentualMaximo = cents(deps.vm.get('model.PESSOAS_DESCONTO')) > 0 ? cents(deps.vm.get('model.PESSOAS_DESCONTO')) : 0;
            
            //preco com as casas decimais originais
            const campoPreco = configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO';
            const preco = produto[permitidoAlterarPreco ? 'MOVIMENTOSITENS_PRECO' : campoPreco];
            
            //converte o preco para inteiro, ex: R$ 1,234567 fica 1234567 (para bater os calculos no javascript)
            const casasDecimaisPreco = configs.getMovimentos().casasDecimaisPreco || 2;
            const precoInt = toPrecision(preco, casasDecimaisPreco);

            const precoCentavos = cents(preco);
            const precoOriginal = cents(produto[campoPreco]);
            
            //após calcular divide pelas casas decimais novamente e arredonda o totalBruto para centavos
            const totalBruto = Math.round(precoInt * qtde / 1000 / Math.pow(10, (casasDecimaisPreco - 2)));
            
            const totalBrutoOriginal = qtde * precoOriginal / 1000;
            let promocao = formaPagto == 620 ? cents(produto['VALOR_PROMOCAOB']) : // Pago em cartão
                           formaPagto == 619 ? cents(produto['VALOR_PROMOCAOB']) : // Pago em Carnê
                           formaPagto == 617 ? cents(produto['VALOR_PROMOCAO']) :  // Pago em Pix, financeira, etc.
                                               cents(produto['VALOR_PROMOCAOB'])   // Demais formas

            if(abaterMontagem) { // Permite transferir o valor da montagem pro desconto
                promocao = (promocao - valorMontagem);
            }
                                                                  
            const precoMinimo = cents(produto['SALDOS_PRECOMINIMO']);
            let precoMinimoValido = precoMinimo < precoCentavos ? precoMinimo : precoCentavos;
            const usaPrecoMinimoSupervisor = configs.getMovimentos().descontoMaximoSupervisor == 'SALDOS_PRECOMINIMO';
            const usaPrecoMinimoGerente    = configs.getMovimentos().descontoMaximoGerente == 'SALDOS_PRECOMINIMO';
            const precoMinimoSupervisor    = usaPrecoMinimoSupervisor ? cents(produto['PRECOMINIMO_DB']) : precoOriginal - parseInt(precoOriginal * (percentualMaximo || configs.getMovimentos().descontoMaximoSupervisor || 100) / 100);
            const precoMinimoGerente       = usaPrecoMinimoGerente    ? cents(produto['PRECOMINIMO_DB']) : precoOriginal - parseInt(precoOriginal * (percentualMaximo || configs.getMovimentos().descontoMaximoGerente    || 100) / 100);

            let totalDesconto;
            let totalLiquido;
            let liquido;
            let percentual;

            if(deps.txt.xtype == 'combobox'){
                return;
    
            } else if(deps.txt.name == 'MOVIMENTOSITENS_DESCONTOS'){
                totalDesconto = cents(produto['MOVIMENTOSITENS_DESCONTOS']) || 0;
                totalLiquido  = totalBruto - totalDesconto;
                liquido       = parseInt(totalLiquido / (qtde || 1000) * 1000);
                percentual    = parseInt(totalDesconto / totalBruto * 100000);
    
            } else if(deps.txt.name == 'VALOR_LIQUIDO'){
                liquido       = cents(produto['VALOR_LIQUIDO']) || 0;
                totalDesconto = parseInt((precoCentavos - liquido) * qtde / 1000);
                if(configs.getMovimentos().percentualInteiro) { // % Sem decimais
//                  percentual = (parseInt((totalDesconto > 0 ? totalDesconto : 0) / totalBruto * 100000) * 1000);
                  percentual = Math.round(produto['MOVIMENTOSITENS_PERCENTUAL'] * 1000) || 0;
                  precoMinimoValido = precoMinimoSupervisor;                  
                } else {
                    percentual = parseInt((totalDesconto > 0 ? totalDesconto : 0) / totalBruto * 100000);
                }

                totalLiquido  = totalBruto - (totalDesconto > 0 ? totalDesconto : 0);
    
            } else if(
                deps.txt.name == 'MOVIMENTOSITENS_QUANTIDADE' ||
                deps.txt.name == 'MOVIMENTOSITENS_PRECO'      ||
                deps.txt.name == 'MOVIMENTOSITENS_PERCENTUAL'
            ){
                let desconto = 0;
                if(configs.getMovimentos().percentualInteiro) {  // % Sem decimais
/*                    if(cents(deps.vm.get('model.PESSOAS_DESCONTO')) > 0) { // Se tem desconto % no cadastro de pessoas
                        produto['MOVIMENTOSITENS_PERCENTUAL'] = cents(deps.vm.get('model.PESSOAS_DESCONTO')) / 100000; 
                    }*/
                    percentual = grams(produto['MOVIMENTOSITENS_PERCENTUAL']);
                    desconto = cents(precoCentavos * percentual) / 10000;
                } else {
                    percentual     = grams(produto['MOVIMENTOSITENS_PERCENTUAL']) || 0;
                    desconto = precoCentavos * percentual / 1000 / 100;
                }

                totalDesconto     = parseInt(qtde * desconto / 1000);
                totalLiquido   = totalBruto - totalDesconto;
                liquido        = cents(parseInt(totalLiquido / (qtde || 1000) * 1000)) / 100;
            } else if(
                deps.txt.name == 'MOVIMENTOSITENS_ID_PRODUTOS' || 
                deps.txt.name == 'TOTAL_LIQUIDO'
            ){
                totalLiquido  = cents(produto['TOTAL_LIQUIDO']) || 0;                
                totalDesconto = totalBruto - totalLiquido;
                liquido       = parseInt((totalLiquido / (qtde || 1000)) * 1000);
                if(configs.getMovimentos().percentualInteiro) {
                    percentual    = parseInt(totalDesconto / totalBruto * 100);
                } else {
                    percentual    = parseInt(totalDesconto / totalBruto * 100000);                    
                }
                if(cents(deps.vm.get('model.PESSOAS_DESCONTO')) > 0) { // Se tem desconto % no cadastro de pessoas
                    produto['MOVIMENTOSITENS_PERCENTUAL'] = cents(deps.vm.get('model.PESSOAS_DESCONTO')) / 100000; 
                    precoMinimoValido = precoMinimoSupervisor;
                }
            } else {
                return;
            }

            if(
                (!(isNotaEletronica || isPedidoStilo)) && 
                (
                    totalDesconto < 0 ||
                    (
                        promocao &&
                        liquido < promocao && 
                        (
                            validarLiquidoItem ||
                            (
                                deps.txt.name != 'MOVIMENTOSITENS_PRECO' &&
                                deps.txt.name != 'VALOR_LIQUIDO' &&
                                deps.txt.name != 'TOTAL_LIQUIDO'
                            ) 
                        )
                    )
                )
            ) {
                if(totalDesconto < 0) {
                    Ext.Note('warning', 'Valor Líquido não pode ser maior que Preço');
                } else {
                    Ext.Note('warning', 'Preço mínimo atingido');
                }
                totalLiquido = totalBruto;
                totalDesconto = 0;
                percentual = 0;
                liquido = parseInt(totalLiquido / (qtde || 1) * 1000);

                Ext.defer(deps.txt.focus, 100, deps.txt, [true]);

                Ext.asap(() => {
                    const somaDescontosProdutos = cents(Movimento.services.Descontos.somarDescontosProdutos(deps));
                    deps.vm.set({
                        'digitouDescontoCabecalho': false,
                        'digitouDescontoItem':      somaDescontosProdutos != 0
                    });
                    // add publicarModel abaixo, em teste
                    deps.txt.up('samoswidgets-griditems').publicarModel(deps.txt, deps.txt.up('form'));
                });
            } else if(
                !promocao &&
                !window.winSenhaNivel &&
                (
                    validarLiquidoItem ||
                    (
                        deps.txt.name != 'MOVIMENTOSITENS_PRECO' &&
                        deps.txt.name != 'VALOR_LIQUIDO' &&
                        deps.txt.name != 'TOTAL_LIQUIDO'
                    ) 
                )
            ) {
                let nivel;

                if(isNotaEletronica || isMovimentoInterno || isPedidoStilo || configs.getUsuario().privilegiado) {
                    nivel = 0;
                    
                } else if(liquido < precoMinimoGerente && !configs.getMovimentos().senhaDesconto) {
                    Ext.Note('warning','Preço mínimo atingido');
                    Ext.defer(deps.txt.focus, 100, deps.txt, [true]);

                    Ext.asap(() => {
                        const somaDescontosProdutos = cents(Movimento.services.Descontos.somarDescontosProdutos(deps));
                        deps.vm.set({
                            'digitouDescontoCabecalho': false,
                            'digitouDescontoItem':      somaDescontosProdutos != 0
                        });

                        // add publicarModel abaixo, em teste
                        deps.txt.up('samoswidgets-griditems').publicarModel(deps.txt, deps.txt.up('form'));
                    });

                    produto['TOTAL_LIQUIDO']              = totalBrutoOriginal / 100;
                    produto['MOVIMENTOSITENS_TOTAL']      = totalBrutoOriginal / 100;
                    produto['VALOR_LIQUIDO']              = precoOriginal      / 100;
                    produto['MOVIMENTOSITENS_PRECO']      = precoOriginal      / 100;
                    produto['MOVIMENTOSITENS_PERCENTUAL'] = 0;
                    produto['MOVIMENTOSITENS_DESCONTOS']  = 0;
            
                    selection.setValues(produto);
                    return;
                } else if((liquido + 1) < precoMinimoValido && (liquido + 1) < precoMinimoSupervisor){ // +1 por questão de arred terceira casa
                    nivel = 2;
                } else if((liquido + 1) < precoMinimoValido){
                    nivel = 1;
                } else {
                    nivel = 0;
                }

                if(nivel != 0 && senhaNivel) { 
                    try {
                        //atualiza provisoriamente os produtos
                        produto['TOTAL_LIQUIDO']              = totalLiquido  / 100;
                        produto['MOVIMENTOSITENS_TOTAL']      = totalBruto    / 100;
                        produto['MOVIMENTOSITENS_DESCONTOS']  = totalDesconto / 100;
                        produto['VALOR_LIQUIDO']              = liquido       / 100;
                        produto['MOVIMENTOSITENS_PRECO']      = preco;
                        produto['MOVIMENTOSITENS_PERCENTUAL'] = percentual    / 1000;
                
                        selection.setValues(produto);

                        if(configs.getMovimentos().liberacaoViaRedis) {
                            let nome = `Liberação para: ${deps.vm.get('model.USUARIOS_LOGIN')} - Cliente: ${deps.vm.get('model.PESSOAS_NOME')}`.slice(0, 50);
                            let mensagem = `Cliente: ${deps.vm.get('model.MOVIMENTOS_ID_PESSOAS')} ${deps.vm.get('model.PESSOAS_NOME')}\nProduto: ${produto['MOVIMENTOSITENS_ID_PRODUTOS']} ${produto['PRODUTOS_NOME']}\nTotal do Produto: ${Ext.util.Format.MoneyMask.setMask('R$ #9.999.990,00').mask(produto['MOVIMENTOSITENS_TOTAL'])}\nPercentual de Desconto: ${configs.getMovimentos().percentualInteiro ? grams(produto['MOVIMENTOSITENS_PERCENTUAL']).toString().slice(0, 2) : grams(produto['MOVIMENTOSITENS_PERCENTUAL'])} %\nTotal com Desconto: ${Ext.util.Format.MoneyMask.setMask('R$ #9.999.990,00').mask(produto['TOTAL_LIQUIDO'])}`; 
                            await Ext.create({ xtype: 'samoswidgets-liberaredis' }).iniciar(nome, mensagem);
                        } else {
                            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel);
                        }
                        
                        //após autorizar, atualiza o novo mínimo
                        produto['SALDOS_PRECOMINIMO'] = liquido / 100;
                        selection.setValues(produto);

                    } catch(error) {
                        //caso não autorize, retorna os valores originais
                        produto['TOTAL_LIQUIDO']              = totalBrutoOriginal  / 100;
                        produto['MOVIMENTOSITENS_TOTAL']      = totalBruto          / 100;
                        produto['MOVIMENTOSITENS_DESCONTOS']  = 0;
                        produto['VALOR_LIQUIDO']              = precoOriginal / 100;
                        produto['MOVIMENTOSITENS_PRECO']      = preco;
                        produto['MOVIMENTOSITENS_PERCENTUAL'] = 0;
                
                        selection.setValues(produto);

                        Ext.asap(() => {
                            const somaDescontosProdutos = cents(Movimento.services.Descontos.somarDescontosProdutos(deps));
                            deps.vm.set({
                                'digitouDescontoCabecalho': false,
                                'digitouDescontoItem':      somaDescontosProdutos != 0
                            });

                            deps.txt.up('samoswidgets-griditems').publicarModel(deps.txt, deps.txt.up('form'));
                        });

                        Ext.defer(() => deps.txt.focus(true), 100);
                    }

                    return;
                }
            }
            
            //atualiza os produtos
            produto['TOTAL_LIQUIDO']              = totalLiquido  / 100;
            produto['MOVIMENTOSITENS_TOTAL']      = totalBruto    / 100;
            produto['MOVIMENTOSITENS_DESCONTOS']  = totalDesconto / 100;
            produto['VALOR_LIQUIDO']              = liquido       / 100;
            produto['MOVIMENTOSITENS_PRECO']      = preco;
            produto['MOVIMENTOSITENS_PERCENTUAL'] = percentual    / 1000;

            selection.setValues(produto);
        },

        somarTotaisParaCabecalho: async function(deps) {
            const frete    = cents(Movimento.services.Descontos.getFreteCabecalho(deps.movimento));
            const seguro   = cents(Movimento.services.Descontos.getSeguroCabecalho(deps.movimento));
            const despesas = cents(Movimento.services.Descontos.getDespesasCabecalho(deps.movimento));
            const valorst  = cents(Movimento.services.Descontos.getValorStCabecalho(deps.movimento));
            
            const somaTotalBrutoProdutos = cents(Movimento.services.Descontos.somarTotalBrutoProdutos(deps));
            const somaDescontosProdutos  = cents(Movimento.services.Descontos.somarDescontosProdutos(deps));
            const percentualTotal        = grams(somaDescontosProdutos / somaTotalBrutoProdutos * 100) / 1000;
            const totalLiquido           = (somaTotalBrutoProdutos - somaDescontosProdutos + frete + seguro + despesas + valorst) / 100;
            
            deps.movimento.set({
                'MOVIMENTOS_PERCENTUAL': percentualTotal,
                'MOVIMENTOS_DESCONTOS':  somaDescontosProdutos  / 100,
                'MOVIMENTOS_PRODUTOS':   somaTotalBrutoProdutos / 100,
                'MOVIMENTOS_TOTAL':      totalLiquido
            });
        }
    },

    itemECabecalho: {
        somarTotaisParaCabecalho: function(deps) {            
            const totalDescontoCabecalho    = cents(Movimento.services.Descontos.getDescontoCabecalho(deps.movimento));
            const somaDescontosProdutos     = cents(Movimento.services.Descontos.somarDescontosProdutos(deps));
            const somaTotalBrutoProdutos    = cents(Movimento.services.Descontos.somarTotalBrutoProdutos(deps));
            const digitouDescontoCabecalho  = deps.vm.get('digitouDescontoCabecalho');
            const haviaDigitadoEmDinheiro   = deps.vm.get('digitouDescontoCabecalhoEmDinheiro');
            const haviaDigitadoEmPercentual = deps.vm.get('digitouDescontoCabecalhoEmPercentual');
            const digitouNaGrid             = Movimento.services.Descontos.digitouNaGrid(deps.txt)
            const digitouEmPercentual       = Movimento.services.Descontos.digitouEmPercentual(deps.txt)
            const digitouEmDinheiro         = Movimento.services.Descontos.digitouEmDinheiro(deps.txt)
            const frete                     = cents(Movimento.services.Descontos.getFreteCabecalho(deps.movimento));
            const seguro                    = cents(Movimento.services.Descontos.getSeguroCabecalho(deps.movimento));
            const despesas                  = cents(Movimento.services.Descontos.getDespesasCabecalho(deps.movimento));
            const valorst                   = cents(Movimento.services.Descontos.getValorStCabecalho(deps.movimento));

            let desconto = 0;
            let percentual = 0

            if(!deps.txt){
                desconto = digitouDescontoCabecalho ? totalDescontoCabecalho : somaDescontosProdutos;
                percentual = grams(desconto / somaTotalBrutoProdutos * 100);
            } else if(digitouNaGrid) {
                if(digitouEmDinheiro || digitouEmPercentual) {
                    // Ajuste 03-07-2024 - antes era: desconto = somaDescontosProdutos;
                    desconto = somaDescontosProdutos / 1000;
                    percentual = grams(desconto / somaTotalBrutoProdutos * 100);
                    deps.vm.set({
                        'digitouDescontoCabecalho': false,
                        'digitouDescontoItem':      somaDescontosProdutos != 0
                    });
                } else if(haviaDigitadoEmDinheiro) {
                    desconto   = totalDescontoCabecalho;
                    percentual = grams(desconto / somaTotalBrutoProdutos * 100);
                } else if(haviaDigitadoEmPercentual) {
                    percentual = grams(Movimento.services.Descontos.getPercentualCabecalho(deps.movimento));
                    desconto   = cents((percentual * somaTotalBrutoProdutos) / 100 / 100 / 1000);
                } else {
                    desconto   = somaDescontosProdutos;
                    percentual = grams(desconto / somaTotalBrutoProdutos * 100);
                }
            } else {
                desconto   = totalDescontoCabecalho;
                percentual = grams(desconto / somaTotalBrutoProdutos * 100);

                if(digitouEmDinheiro || digitouEmPercentual) {
                    deps.vm.set({
                        'digitouDescontoCabecalho': totalDescontoCabecalho != 0,
                        'digitouDescontoItem':      false
                    });
                }
            }
            

            deps.movimento.set({
                'MOVIMENTOS_PERCENTUAL': percentual             / 1000,
                'MOVIMENTOS_DESCONTOS':  desconto               / 100,
                'MOVIMENTOS_PRODUTOS':   somaTotalBrutoProdutos / 100,
                'MOVIMENTOS_TOTAL':      (somaTotalBrutoProdutos - desconto + frete + seguro + despesas + valorst) / 100
            });
        }
    },

    atualizarControlesDesconto: function(movimento, form){
        const tipoDesconto = movimento.get('DOCUMENTOS_DESCONTOITEM');
        const digitouDescontoCabecalho = tipoDesconto == 'F' || tipoDesconto == 'A';

        form.getViewModel().set({
            digitouDescontoCabecalho:             digitouDescontoCabecalho,
            digitouDescontoCabecalhoEmDinheiro:   digitouDescontoCabecalho,
            digitouDescontoCabecalhoEmPercentual: false,
            digitouDescontoItem:                  tipoDesconto == 'T'
        });
    },

    digitouEmPercentual: function(txt) {
        return txt && (txt.fieldLabel == '% Desc' || txt.title == '% Dsc' || txt.forcarRecalculo);
    },

    digitouEmDinheiro: function(txt) {
        return txt && (txt.fieldLabel == 'R$ Desc' || txt.title == 'Vlr Dsc' || txt.forcarRecalculo);
    },

    digitouNaGrid: function(txt) {
        return !!(txt && txt.up && txt.up('samoswidgets-griditems')) || (txt && txt.forcarRecalculo);
    },

    getFreteCabecalho: function(movimento){
        return movimento.get('MOVIMENTOS_FRETE');
    },

    getSeguroCabecalho: function(movimento){
        return configs.getMovimentos().usarMarkup ? 0 : movimento.get('MOVIMENTOS_SEGURO');
    },

    getDespesasCabecalho: function(movimento){
        return movimento.get('MOVIMENTOS_DESPESAS');
    },

    getValorStCabecalho: function(movimento){
        return movimento.get('MOVIMENTOS_VALORST');
    },

    getValorIpiCabecalho: function(movimento){
        return movimento.get('MOVIMENTOS_VALORIPI');
    },

    getDescontoCabecalho: function(movimento){
        return movimento.get('MOVIMENTOS_DESCONTOS');
    },

    getPercentualCabecalho: function(movimento){
        return movimento.get('MOVIMENTOS_PERCENTUAL');
    },

    somarDescontosProdutos: function(deps) {
        const produtos = deps.vm.getStore('produtos').data.items;
        const permitidoAlterarPreco = deps.vm.get('permitidoAlterarPreco');

        const result = produtos.reduce((total, produto) => {
            const preco = cents(produto.get([permitidoAlterarPreco ? 'MOVIMENTOSITENS_PRECO' : configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO']));
            const qtde  = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE')) || 0;
            
            if(configs.getMovimentos().alteraLiquido){
                const desconto = cents(produto.get('MOVIMENTOSITENS_TOTAL')) - cents(produto.get('TOTAL_LIQUIDO'));
                return total += desconto;
            } else {
                const percentual = grams(produto.get('MOVIMENTOSITENS_PERCENTUAL')) || 0;
                const desconto = parseInt(preco * percentual / 100);
                return total += (desconto * qtde / 1000);
            }
        }, 0);

        return result / 100;
    },

    somarTotalBrutoProdutos: function(deps) {
        const produtos = deps.vm.getStore('produtos').data.items;

        return produtos.reduce((total, produto) => {
            return total + cents(produto.get('MOVIMENTOSITENS_TOTAL'));
        }, 0) / 100;
    },

    somarIpiItens: function(deps) {
        const produtos = deps.vm.getStore('produtos').data.items;

        return produtos.reduce((total, produto) => {
            return total + cents(produto.get('MOVIMENTOSITENS_VALORIPI'));
        }, 0) / 100;
    },

    somarFreteItens: function(deps) {
        const produtos = deps.vm.getStore('produtos').data.items;

        return produtos.reduce((total, produto) => {
            return total + cents(produto.get('MOVIMENTOSITENS_FRETE'));
        }, 0) / 100;
    },

    somarSeguroItens: function(deps) {
        const produtos = deps.vm.getStore('produtos').data.items;

        return configs.getMovimentos().usarMarkup ? 0 : produtos.reduce((total, produto) => {
            return total + cents(produto.get('MOVIMENTOSITENS_SEGURO'));
        }, 0) / 100;
    },

    somarIpiItens: function(deps) {
        const produtos = deps.vm.getStore('produtos').data.items;

        return produtos.reduce((total, produto) => {
            return total + cents(produto.get('MOVIMENTOSITENS_VALORIPI'));
        }, 0) / 100;
    },

    somarDespesasItens: function(deps) {
        const produtos = deps.vm.getStore('produtos').data.items;

        return produtos.reduce((total, produto) => {
            return total + cents(produto.get('MOVIMENTOSITENS_DESPESAS'));
        }, 0) / 100;
    },

    somarValorStItens: function(deps) {
        const produtos = deps.vm.getStore('produtos').data.items;

        return produtos.reduce((total, produto) => {
            return total + cents(produto.get('MOVIMENTOSITENS_VALORST'));
        }, 0) / 100;
    },

    descontoMaximo: function(deps) {
        const isNotaEletronica = deps.vm.get('isNotaEletronica');
        const produtos = deps.vm.getStore('produtos').data.items;
        const usaPrecoMinimo = configs.getMovimentos().descontoMaximo == 'SALDOS_PRECOMINIMO';
        const usaPercentual = configs.getMovimentos().descontoMaximo < 100;

        if(isNotaEletronica) {
            return Infinity;
        } else if(usaPrecoMinimo){
            return produtos.reduce((total, produto) => {
                const preco = cents(produto.get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'));
                const precoMinimo = cents(produto.get('PRECOMINIMO_DB'));
                const qtde = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE')) || 0;
    
                return total + ((preco - precoMinimo) * qtde / 1000);
            }, 0) / 100;
        } else if(usaPercentual) {
            return produtos.reduce((total, produto) => {
                const preco = cents(produto.get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'));
                const precoMinimo = cents(produto.get('SALDOS_PRECOMINIMO'));
                const qtde = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE')) || 0;
    
                return total + ((preco - precoMinimo) * qtde / 1000);
            }, 0) / 100;
        } else {
            return produtos.reduce((total, produto) => {
                const preco = cents(produto.get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'));
                const qtde = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE')) || 0;
    
                return total + (preco * qtde / 1000);
            }, 0) / 100;
        }
    },

    descontoMaximoSupervisor: function(deps) {
        const isNotaEletronica = deps.vm.get('isNotaEletronica');
        
        const produtos = deps.vm.getStore('produtos').data.items;
        const usaPrecoMinimo = configs.getMovimentos().descontoMaximoSupervisor == 'SALDOS_PRECOMINIMO';
        const usaPercentual = configs.getMovimentos().descontoMaximoSupervisor < 100;
        
        if(isNotaEletronica) {
            return Infinity;
        } else if(usaPrecoMinimo){
            return produtos.reduce((total, produto) => {
                const preco = cents(produto.get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'));
                const precoMinimo = cents(produto.get('PRECOMINIMO_DB'));
                const qtde = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE')) || 0;
    
                return total + ((preco - precoMinimo) * qtde / 1000);
            }, 0) / 100;
        } else if(usaPercentual) {
            return produtos.reduce((total, produto) => {
                const preco = cents(produto.get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'));
                const precoMinimo = cents(produto.get('SALDOS_PRECOMINIMO'));
                const qtde = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE')) || 0;
    
                return total + ((preco - precoMinimo) * qtde / 1000);
            }, 0) / 100;
        } else {
            return produtos.reduce((total, produto) => {
                const preco = cents(produto.get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'));
                const descontoMaximoSupervisor = parseInt(preco * (configs.getMovimentos().descontoMaximoSupervisor || 100) / 100);
                const qtde = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE')) || 0;
    
                return total + (descontoMaximoSupervisor * qtde / 1000);
            }, 0) / 100;
        }
    },

    descontoMaximoGerente: function(deps) {
        const isNotaEletronica = deps.vm.get('isNotaEletronica');
        const produtos = deps.vm.getStore('produtos').data.items;
        const usaPrecoMinimo = configs.getMovimentos().descontoMaximoGerente == 'SALDOS_PRECOMINIMO';
        const usaPercentual = configs.getMovimentos().descontoMaximoGerente < 100;
        
        if(isNotaEletronica) {
            return Infinity;
        } else if(usaPrecoMinimo){
            return produtos.reduce((total, produto) => {
                const preco = cents(produto.get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'));
                const precoMinimo = cents(produto.get('PRECOMINIMO_DB'));
                const qtde = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE')) || 0;
    
                return total + ((preco - precoMinimo) * qtde / 1000);
            }, 0) / 100;
        } else if(usaPercentual) {
            return produtos.reduce((total, produto) => {
                const preco = cents(produto.get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'));
                const precoMinimo = cents(produto.get('SALDOS_PRECOMINIMO'));
                const qtde = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE')) || 0;
    
                return total + ((preco - precoMinimo) * qtde / 1000);
            }, 0) / 100;
        } else {
            return produtos.reduce((total, produto) => {
                const preco = cents(produto.get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'));
                const descontoMaximoGerente = parseInt(preco * (configs.getMovimentos().descontoMaximoGerente || 100) / 100);
                const qtde = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE')) || 0;

                return total + (descontoMaximoGerente * qtde / 1000);
            }, 0) / 100;
        }
    }
});