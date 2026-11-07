Ext.define('SamosAdmin.movimentos.movimento.form.mixins.Produtos', {
    extend: 'Ext.app.ViewController',

    validarAlteracaoPrecoItem: async function(txt) {
        const vm = this.getViewModel();
        const model = this.getRecord();
        const isAbastecimento = (model.get('OPERACOES_NOME') || '').match(/ABASTECI/);

        if(
            txt && 
            txt.readOnly || 
            isAbastecimento ||
            vm.get('isRequisicaoEntrada') ||
            vm.get('isPedidoCompra') ||
            vm.get('isNotaEntrada')
        ){ 
            return true; 
        }

        const isNotaEletronica = vm.get('isNotaEletronica');
        const isMovimentoInterno = vm.get('isMovimentoInterno');
        
        const selection         = txt.up('form').getForm();
        const produto           = selection.getValues();
        const promocao          = configs.getClientName() == 'prudenmoveis' ? cents(produto['VALOR_PROMOCAOB']) : cents(produto['VALOR_PROMOCAO']);
        const precoOriginal     = promocao ? promocao : cents(produto[configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO']);
        const precoMinimo       = cents(produto['SALDOS_PRECOMINIMO']);
        const precoMinimoValido = promocao || (precoMinimo < precoOriginal ? precoMinimo : precoOriginal);
        const precoDigitado     = cents(txt.getValue());

        if(!(isNotaEletronica || isMovimentoInterno)) { // Nota ou transferencia entre filiais
            if(
                precoDigitado != precoOriginal && 
                configs.getMovimentos().senhaAlterarPrecoMinimo
            ) {
                try {
                    const nivel = 1;
                    await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)

                } catch(error) {
                    await SamosUtils.Utils.sleep(200);
                    txt.setValue(precoOriginal / 100);
                    txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
                    vm.set('editionClosed', false);
                }

            } else if(precoDigitado < precoMinimoValido) {
                if(configs.getMovimentos().senhaDesconto) {
                    try {
                        const nivel = 1;
                        await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)
                    } catch(error) {
                        Ext.Note('warning','Preço não autorizado');                        
                        await SamosUtils.Utils.sleep(200);
                        txt.setValue(precoOriginal / 100);
                        txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
                        vm.set('editionClosed', false);
                    }    
                } else {
                    Ext.Note('warning','Preço mínimo atingido');
                    await SamosUtils.Utils.sleep(200);
                    txt.setValue(precoOriginal / 100);
                    txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
                    vm.set('editionClosed', false);    
                }
            }
        }
        
        await this.validarLiquidoItem(txt);
    },

    prepararProduto: function(txt, record) {
        const selection = this.lookup('produtos').getSelection();

        if(!selection){ return; }

        const vm = this.getViewModel();
        const movimento = this.getRecord();
        const txtQtde = txt.up('form').down('field[reference^="movimentositensquantidade"]');
        const isNotaEntrada = vm.get('isNotaEntrada');
        const produto = selection.getValues();
        const finalidadeNormal = vm.get('finalidadeNormal'); 
        const ufConsumidor = movimento.get('CIDADES_ESTADO');
        const ufEmpresa = configs.getPermissao()['CIDADES_ESTADO'];
        const cst = ufConsumidor == ufEmpresa ? 'CSTLOCAL' : 'CSTOUTROS';
        const simplesNacional = configs.getPermissao()['EMPRESAS_SIMPLES'] == 'T' ||
                                configs.getPermissao()['EMPRESAS_SIMPLES'] == '0';
        if(isNotaEntrada){
            txtQtde.suspendEvents();

            const compra     = cents(produto['MOVIMENTOSITENS_PRECO']) || cents(record.get('SALDOS_COMPRA'));
            const custo      = cents(produto['MOVIMENTOSITENS_PRECO']) || cents(record.get('SALDOS_CUSTO'));
            const custoAtual = cents(record.get('SALDOS_CUSTO'));
            const margem     = record.get('SALDOS_MARGEM') || 60;
            const vista      = parseInt(eval(configs.getProdutos().calculoPreco.vista));
            const precoPrazo = parseInt(eval(configs.getProdutos().calculoPreco.prazo));

            produto['MOVIMENTOSITENS_ID_OPERACOES'] = produto['MOVIMENTOSITENS_ID_OPERACOES'] || movimento.get('MOVIMENTOS_ID_OPERACOES');
            produto['OPERACOES_NOME']               = produto['OPERACOES_NOME'] || movimento.get('OPERACOES_NOME');
            produto['MOVIMENTOSITENS_CST']          = finalidadeNormal ? record.get(`SALDOS_${cst}`) : simplesNacional ? '0900' : '090';
            produto['TABELA_ORIGEM']                = produto['MOVIMENTOSITENS_CST'].trim().slice(0, 1);
            produto['TABELA_LOCAL']                 = produto['MOVIMENTOSITENS_CST'].trim().slice(1, 4);
            produto['MOVIMENTOSITENS_ESCRITURACAO'] = produto['MOVIMENTOSITENS_ESCRITURACAO'] || record.get('SALDOS_ESCRITURACAO');
            produto['MOVIMENTOSITENS_EXCECAO']      = produto['MOVIMENTOSITENS_EXCECAO'] || record.get('SALDOS_EXCECAO');
            produto['MOVIMENTOSITENS_QUANTIDADE']   = (produto['MOVIMENTOSITENS_QUANTIDADE'] == 0 ? 1 : produto['MOVIMENTOSITENS_QUANTIDADE']);
            produto['NOVO_MARGEM']                  = margem;
            produto['NOVO_PRECO']                   = vista  / 100;
            produto['NOVO_PRAZO']                   = precoPrazo  / 100;
            produto['NOVO_COMPRA']                  = custo  / 100;
            produto['NOVO_CUSTO']                   = custoAtual / 100;
            produto['MOVIMENTOSITENS_CUSTO']        = custoAtual / 100;
            produto['MOVIMENTOSITENS_PRECO']        = produto['MOVIMENTOSITENS_PRECO'] || (compra / 100);
            produto['MOVIMENTOSITENS_TOTAL']        = produto['MOVIMENTOSITENS_TOTAL'] || (compra / 100);
            produto['TOTAL_LIQUIDO']                = produto['TOTAL_LIQUIDO'] || (compra / 100);

            if(configs.getClientName() == 'racaforte') { // Ajuste CST PIS Entrada
                if((produto['PRODUTOS_DESCRICAO'] || '').slice(0, 2).match(/04|06/)) {
                    produto['MOVIMENTOSITENS_CSTPIS'] = '73';
                }
                if((produto['PRODUTOS_DESCRICAO'] || '').slice(0, 2) ==  '05') {
                    produto['MOVIMENTOSITENS_CSTPIS'] = '75';
                }                       
            }
        } else {
            const isRequisicao        = (vm.get('isRequisicao') ? true : false);
            const isRequisicaoEntrada = (vm.get('isRequisicaoEntrada') ? true : false);
            const isPedidoCompra      = (vm.get('isPedidoCompra') ? true : false);
            const isPedido            = (vm.get('isPedido') ? true : false);
            const isOrcamento         = (vm.get('isOrcamento') ? true : false);
            const isDevolucao         = (vm.get('isDevolucao') ? true : false);
            const isTransferencia     = movimento.get('OPERACOES_NOME').match(/TRANSFER/);
            const isAbastecimento     = movimento.get('OPERACOES_NOME').match(/ABASTECI/);
            const isNotaEletronica    = (vm.get('isNotaEletronica') ? true : false);

            let preco = 0;

            if(isTransferencia || isPedidoCompra) {
                preco = cents(record.get('SALDOS_COMPRA'));
            } else {
                if(isRequisicaoEntrada || isAbastecimento) {
                    if(configs.getClientName() == 'stilomoveis') {
                        preco = cents(record.get('SALDOS_COMPRA'));
                    } else {
                        preco = cents(record.get('SALDOS_CUSTO'));
                    }

                } else {
                    if(configs.getMovimentos().promocaoBasica && configs.getMovimentos().carregaPrecoPromocao && cents(record.get('VALOR_PROMOCAO')) > 0) {
                        preco = cents(record.get('VALOR_PROMOCAO'));
                    } else {
                        preco = cents(record.get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'));
                    }
                }    
            }

            if((isPedido || isNotaEletronica) && configs.getClientName() == 'turbotec') {
                if(record.get('PRODUTOS_ID_GRUPOS') == 1 || record.get('PRODUTOS_ID_GRUPOS') == 10) {
                    // Esses grupos exigem informar casco sim ou não
                } else {
                    produto['MOVIMENTOSITENS_ESCRITURACAO'] = '0'; // Opção 0 - Nã se aplica
                }
            } else {
                produto['MOVIMENTOSITENS_ESCRITURACAO'] = record.get('SALDOS_ESCRITURACAO');
            }

            if((isPedido || isOrcamento) && configs.getClientName() == 'prudenmoveis') {
                const tabelaMontagem = (movimento.get('EMPRESAS_CNAE') || '').split('|')[2];
                let valorMontagem = 0;
                if(tabelaMontagem == 'A') { valorMontagem = (record.get('MONTAGENS_PRECOS') || '').split('|')[0]};
                if(tabelaMontagem == 'B') { valorMontagem = (record.get('MONTAGENS_PRECOS') || '').split('|')[1]};
                if(tabelaMontagem == 'C') { valorMontagem = (record.get('MONTAGENS_PRECOS') || '').split('|')[2]};

                produto['MOVIMENTOSITENS_IMEDIATA'] = ((cents(valorMontagem) / 100) || record.get('MONTAGENS_VALOR'));
            } 

            if(isPedidoCompra) {
                produto['MOVIMENTOSITENS_IPI'] = movimento.get('PERCENTUAL_IPI');
                produto['MOVIMENTOSITENS_ALIQUOTAPIS'] = movimento.get('PERCENTUAL_FRETE');
                produto['MOVIMENTOSITENS_ALIQUOTACOFINS'] = movimento.get('PERCENTUAL_SEGURO');
            }

            if(isPedido || isDevolucao) {
                produto['MOVIMENTOSITENS_VALORPISST'] = record.get('PRECOMINIMO_DB');
            }

            if(isTransferencia || isAbastecimento) {
                produto['MOVIMENTOSITENS_EXCECAO'] = produto['MOVIMENTOSITENS_EXCECAO'] || 'L';
            } else {
                produto['MOVIMENTOSITENS_EXCECAO'] = produto['MOVIMENTOSITENS_EXCECAO'] || '1'
            }

            if((isPedido || isOrcamento || isRequisicao) && 
                configs.getClientName() == 'prudenaco' &&
                record.get('PRODUTOS_UNIDADE') == 'KG') {
                if(cents(record.get('SALDOS_TRANSFERENCIA')) == 0) {
                    preco = cents(record.get('SALDOS_PRECO'));  // Preço por kg
                } else {
                    preco = cents(record.get('SALDOS_TRANSFERENCIA'));  // Preço por barra
                }
            }
            
            if((isPedido || isOrcamento) && configs.getClientName() == 'hospitalar') {
                const semLote = record.get('PRODUTOS_DERIVADO').match(/T|F/);
                if(!semLote) { // Se lote obrigatório
                    if(record.get('LOTES').length > 0) {
                        const idLote = record.get('LOTES')[0]['LOTES_ID'];
                        const numeroLote = record.get('LOTES')[0]['LOTES_REFERENCIA'];
                        const fabricacaoLote = record.get('LOTES')[0]['LOTES_FABRICACAO'];
                        const validadeLote = record.get('LOTES')[0]['LOTES_VALIDADE'];
        
                        produto['MOVIMENTOSITENS_ID_LOTES'] = idLote;
                        produto['LOTES_REFERENCIA'] = numeroLote;
                        produto['LOTES_FABRICACAO'] = fabricacaoLote;
                        produto['LOTES_VALIDADE'] = validadeLote;
                    }
                } else {
                    produto['MOVIMENTOSITENS_ID_LOTES'] = 0;
                    produto['LOTES_REFERENCIA'] = '';
                    produto['LOTES_FABRICACAO'] = '';
                    produto['LOTES_VALIDADE'] = '';
                }
            }

            if((isPedido || isOrcamento) && cents(movimento.get('PESSOAS_DESCONTO') > 0) ) {
                produto['MOVIMENTOSITENS_PERCENTUAL'] = cents(movimento.get('PESSOAS_DESCONTO')) / 100000;
            }

            produto['MOVIMENTOSITENS_CST']          = record.get(`SALDOS_${cst}`); //produto['MOVIMENTOSITENS_CST'] || record.get(`SALDOS_${cst}`);
            produto['TABELA_ORIGEM']                = produto['MOVIMENTOSITENS_CST'].trim().slice(0, 1);
            produto['TABELA_LOCAL']                 = produto['MOVIMENTOSITENS_CST'].trim().slice(1, 4);
            produto['MOVIMENTOSITENS_ID_OPERACOES'] = movimento.get('MOVIMENTOS_ID_OPERACOES');
            produto['OPERACOES_NOME']               = movimento.get('OPERACOES_NOME');
            produto['NOVO_MARGEM']                  = record.get('SALDOS_MARGEM');
            produto['MOVIMENTOSITENS_QUANTIDADE']   = (produto['MOVIMENTOSITENS_QUANTIDADE'] == 0 ? 1 : produto['MOVIMENTOSITENS_QUANTIDADE']);
            produto['MOVIMENTOSITENS_PRECO']        = preco / 100;
            produto['MOVIMENTOSITENS_TOTAL']        = preco / 100;
            produto['VALOR_LIQUIDO']                = preco / 100;            
            produto['TOTAL_LIQUIDO']                = preco / 100;

            txtQtde.suspendEvents();
        }

        //se recalculoSync, ja cria o id do item caso ele ainda não exista
        if(configs.getMovimentos().recalculoSync) {
            movimento.data['MOVIMENTOS_ITENS'] = movimento.data['MOVIMENTOS_ITENS'] || [];

            const produtos = movimento.data['MOVIMENTOS_ITENS'];
            const indexProduto = produtos.findIndex(item => item['MOVIMENTOSITENS_ID'] == produto['MOVIMENTOSITENS_ID']);

            if(indexProduto == -1) {
                //vai incrementando valores negativos a partir de -2 e salvando no localstorage
                //novos produtos tem sempre MOVIMENTOSITENS_ID negativos e consecutivos
                produto['MOVIMENTOSITENS_ID'] = localStorage.getItem('idNovoProduto') || -2;
                localStorage.setItem('idNovoProduto', produto['MOVIMENTOSITENS_ID'] - 1);
            }
        }

        selection.setValues(produto);

        txt.up('form').query('field').forEach(field => {
            if(record.get('VALOR_PROMOCAO') > 0 || 
               (configs.getClientName() == 'racaforte' && record.get('PRODUTOS_DERIVADO') == 'V')) {
                field.setUi('gridtextblue');
            } else {
                field.setUi('gridtext-' + configs.getTema());
            }
        });

        setTimeout(async () => {
            txtQtde.resumeEvents();
    
            const txtDescricao = txt.up('form').down('field[reference^="nomedoProduto"]');
            txtDescricao.setReadOnly(record.get('PRODUTOS_EDITAVEL') != 'T');
    
            if(record.get('PRODUTOS_EDITAVEL') == 'T') {
                txtDescricao.suspendEvents();
                txtDescricao.setValue(txtDescricao.getValue() + ' ');
                Ext.defer(() => txtDescricao.resumeEvents(), 50);
                txtDescricao.focus();                                            
            } else {
                txtQtde.focus(true);
            }
            
            if(!configs.getMovimentos().recalculoSync) {
                txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
            }
        }, 200);

        //se recalculoSync, insere o produto nos itens do model
        setTimeout(() => {
            if(configs.getMovimentos().recalculoSync) {
                movimento.data['MOVIMENTOS_ITENS'] = movimento.data['MOVIMENTOS_ITENS'] || [];
                
                const produto = selection.getValues();//para pegar o produto completo
                const produtos = movimento.data['MOVIMENTOS_ITENS'];
                const indexProduto = produtos.findIndex(item => item['MOVIMENTOSITENS_ID'] == produto['MOVIMENTOSITENS_ID']);
    
                if(indexProduto != -1) {
                    movimento.data['MOVIMENTOS_ITENS'][indexProduto] = produto;
                } else {
                    movimento.data['MOVIMENTOS_ITENS'].push(produto);
                }

                this.atualizarCalculos(txt);
            }
        }, 1000);
    },

    calcularProduto: async function(txt, griditems) {
        const formMovimentos = Ext.$('formmovimentos')[0],
              modelMovimentos = formMovimentos.model,
              vmMovimentos = formMovimentos.getViewModel(),
              isNotaEntrada = vmMovimentos.get('isNotaEntrada'),
              isNotaEntradaComChave = (isNotaEntrada && !!String(vmMovimentos.get('model.MOVIMENTOS_NFE') || '').trim());
              isNotaLislais = vmMovimentos.get('isNotaLislais');             

        //Se nao for nota de entrada com chave, ele nao atualiza o total ao alterar o total
        if(isNotaEntradaComChave || isNotaLislais){
            //Deixa passar
        }else{
            if(txt && txt.name == 'MOVIMENTOSITENS_TOTAL'){ return true; }
        }

        const selection = griditems.getSelection();

        if(!selection){ return; }

        const produto = selection.getValues();
        const qtdeIncompleta =  produto['MOVIMENTOSITENS_QUANTIDADE'].toString().slice(-1) == '.'   ||
                                produto['MOVIMENTOSITENS_QUANTIDADE'].toString().slice(-2) == '.0'  ||
                                produto['MOVIMENTOSITENS_QUANTIDADE'].toString().slice(-3) == '.00';
        const naoImplementado = produto['MOVIMENTOSITENS_ID_PRODUTOS'] == 999999;

        if(qtdeIncompleta || naoImplementado) { return; }
        
        const vm = this.getViewModel();
        const isPedidoCompra = vm.get('isPedidoCompra') ? true : false;
        const permitidoAlterarPreco = this.getViewModel().get('permitidoAlterarPreco');

        const qtde       = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
        const campoPreco = configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO';
        
        const preco = produto[permitidoAlterarPreco ? 'MOVIMENTOSITENS_PRECO' : campoPreco];
        
        //converte o preco para inteiro, ex: R$ 1,234567 fica 1234567 (para bater os calculos no javascript)
        const casasDecimaisPreco = configs.getMovimentos().casasDecimaisPreco || 2;
        const precoInt = toPrecision(preco, casasDecimaisPreco);
        
        //após calcular divide pelas casas decimais novamente e arredonda o totalBruto para centavos
        const totalBruto = Math.round(precoInt * qtde / 1000 / Math.pow(10, (casasDecimaisPreco - 2)));

        if(isPedidoCompra) {
            const perFrete  = vm.get('model.PERCENTUAL_FRETE')  || 0;
            const perIpi    = vm.get('model.PERCENTUAL_IPI')    || 0; /// Pedido de compra cobra frete sobre o IPI
            const perSeguro = vm.get('model.PERCENTUAL_SEGURO') || 0;
            const valorIpi  = (((totalBruto / 100) * perIpi) / 100);

            produto['MOVIMENTOSITENS_IPI']      = perIpi;
            produto['MOVIMENTOSITENS_VALORIPI'] = (((totalBruto / 100) * perIpi)    / 100);
            produto['MOVIMENTOSITENS_FRETE']    = (((((totalBruto) / 100) + valorIpi) * perFrete) / 100);
            produto['MOVIMENTOSITENS_SEGURO']   = (((totalBruto / 100) * perSeguro) / 100);
        }

        const ipi         = cents(produto['MOVIMENTOSITENS_VALORIPI']) || 0;
        const subst       = cents(produto['MOVIMENTOSITENS_VALORST'])  || 0;
        const frete       = cents(produto['MOVIMENTOSITENS_FRETE'])    || 0;
        const seguro      = configs.getMovimentos().usarMarkup ? 0 : cents(produto['MOVIMENTOSITENS_SEGURO']) || 0;
        const despesa     = cents(produto['MOVIMENTOSITENS_DESPESAS']) || 0;
        const complemento = isNotaEntrada ? (cents(produto['MOVIMENTOSITENS_DEPOSITO']) || 0) : 0;
        const cte         = cents(produto['MOVIMENTOSITENS_IMPOSTO']) || 0;
        const descontos   = cents(produto['MOVIMENTOSITENS_DESCONTOS']) || 0;
        const margem      = produto['NOVO_MARGEM'];//usado no eval abaixo

        const codigoPessoa = modelMovimentos.get('MOVIMENTOS_ID_PESSOAS');
        const custoPadrao = cents(preco) + ipi + subst + seguro + despesa + complemento + frete + cte;
        const custoRaca   = cents(preco) + ipi + subst + seguro + despesa + frete + cte - descontos;

        let custo = 0;

        if(configs.getClientName() == 'racaforte') { // Considera desconto no custo
            custo = custoRaca;
        } else {
            if(configs.getClientName() == 'hermes' && isNotaEntrada && (codigoPessoa == 41 || codigoPessoa == 4934)) { //Específico MHM/NAUT
                custo = (custoPadrao / 0.95);
            } else {
                custo = custoPadrao;
            } 
        }
        
        const compra     = cents(produto['MOVIMENTOSITENS_PRECO']) || cents( produto['SALDOS_COMPRA'] );
        const vista      = parseInt(eval(configs.getProdutos().calculoPreco.vista));
        const precoPrazo = parseInt(eval(configs.getProdutos().calculoPreco.prazo));

        produto['NOVO_CUSTO'] = custo / 100;
        produto['NOVO_PRECO'] = vista / 100;
        produto['NOVO_PRAZO'] = precoPrazo / 100;

        if( isNotaEntradaComChave || (isNotaLislais && txt && txt.name == 'MOVIMENTOSITENS_TOTAL')){
            //Vai atualizar o PREÇO UNITARIO E NAO MEXER NO TOTAL
            const novoPrecoUnitario = produto['MOVIMENTOSITENS_TOTAL'] / produto['MOVIMENTOSITENS_QUANTIDADE'];
            if(!txt || txt.name !== 'MOVIMENTOSITENS_PRECO') {
                produto['MOVIMENTOSITENS_PRECO'] = novoPrecoUnitario;
            }

        }else{
            produto['MOVIMENTOSITENS_TOTAL'] = totalBruto / 100;
            produto['MOVIMENTOSITENS_PRECO'] = preco;//aqui usa o preco original com as casas decimais
        }
        
        produto['NOVO_MARGEM']           = margem;            
        produto['NOVO_COMPRA']           = cents(preco) / 100;

        selection.setValues(produto);

        const deps = {
            griditems: griditems,
            vm: vm,
            txt: txt
        }

        if(vm.get('isDescontoPorItem') || vm.get('isDescontoPorItemECabecalho')) {
            await Movimento.services.Descontos.item.calcularDescontoEPercentualItens(deps);
        }
    },

    validarDescontoItem: async function(txt, e) {
        const vm = this.getViewModel();

        const deps = {
            vm: vm,
            txt: txt
        }

        if(!vm.get('isNotaEntrada')) {
            if(vm.get('isDescontoPorItem') || vm.get('isDescontoPorItemECabecalho')) {
                await Movimento.services.Descontos.item.calcularDescontoEPercentualItens(deps, false, true);
            }    
        }

    },

    setarDefaultsJanelaDetalhes: function(griditems, model) {
        const baseIcms = model.get('MOVIMENTOSITENS_BASEICMS');
        const totalProduto = model.get('MOVIMENTOSITENS_TOTAL');
        const selection = griditems.getSelection();

        if(!baseIcms && selection) {
            selection.setValues({
                'MOVIMENTOSITENS_BASEICMS': totalProduto
            });
        }
    },

    checarOperacao: function() {
        if(this.getViewModel().get('isNota')){
            const txtsOperacao = Ext.$('formmovimentos')[0].query('textfield[reference^="operacao"]');
    
            setTimeout(() => {
                txtsOperacao.forEach(txt => txt.setSearchedId(txt.getValue()));
            }, 500);
        } else {
            const movimento = this.getRecord();
            const produtos = this.lookup('produtos').getStore().getData().items || [];

            if(configs.getClientName() == 'racaforte') {   // Ajuste CFOP movimento view unica
                if((movimento.get('MOVIMENTOS_ID_OPERACOES') || '').toString() == '400000') {
                    if((movimento.get('MOVIMENTOS_ID_DOCUMENTOS') || '').toString().slice(-4) == '0004') {  // PEN
                        movimento.set('MOVIMENTOS_ID_OPERACOES', 600000);
                    }
                    if((movimento.get('MOVIMENTOS_ID_DOCUMENTOS') || '').toString().slice(-4) == '0002') { // PED
                        movimento.set('MOVIMENTOS_ID_OPERACOES', 500000);
                    }
                }
            }
    
            if(movimento.get('OPERACOES_UNICA') == 'T' &&
               movimento.get('MOVIMENTOS_ID_OPERACOES') != '100000' &&  // Acertos de estoque
               movimento.get('MOVIMENTOS_ID_OPERACOES') != '200000'     // Nunca mudam          
               ) {
                const produtosAtualizados = produtos.map(produto => {
                    produto.set('MOVIMENTOSITENS_ID_OPERACOES', movimento.get('MOVIMENTOS_ID_OPERACOES'));
                    return produto.data;
                });

                movimento.set('MOVIMENTOS_ITENS', produtosAtualizados);
            }
        }
    },

    calcularMargem: function() {
        const vm = this.getViewModel();

        if(vm.get('isOrcamento') || vm.get('isPedido')) {
            const movimento = this.getRecord();
            const produtos = vm.getStore('produtos').data.items;
            let margem = 0;
            let markup = 0;

            const precoTotal = cents(movimento.get('MOVIMENTOS_PRODUTOS')) - cents(movimento.get('MOVIMENTOS_DESCONTOS'));
            const custoTotal = parseInt(produtos.reduce((result, produto) => {
                const custo = cents(produto.get('MOVIMENTOSITENS_CUSTO')) || cents(produto.get('MOVIMENTOSITENS_PRECO')) * 0.65;
                const qtde  = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE'));
                return result += custo * qtde;
            }, 0) / 1000);

            margem = cents(100 - (custoTotal / precoTotal * 100)) / 100;    
            markup = ((precoTotal / custoTotal)  - 1) * 100;
            movimento.set('MOVIMENTOS_MARGEM', margem);

            if(configs.getMovimentos().usarMarkup) {
                movimento.set('MOVIMENTOS_SEGURO', markup);
            }
        }
    },

    fazerSomasERateios: function(txt) {
        const vm = this.getViewModel();

        this.iniciarEdicao();

        if(
            !vm.get('isNotaEntrada') || 
            (vm.get('isNotaEntrada') && configs.getMovimentos().rateiaDescontoNotaEntrada)
        ) {
            const deps = {
                txt: txt,
                vm: vm,
                ctrl: this,
                movimento: this.getRecord()
            }
    
            if(vm.get('isDescontoCabecalho')){
                Movimento.services.Descontos.cabecalho.calcularTotaisCabecalho(deps);
            } else if(vm.get('isDescontoPorItem')){
                Movimento.services.Descontos.item.somarTotaisParaCabecalho(deps);
            } else if(vm.get('isDescontoPorItemECabecalho')) {
                Movimento.services.Descontos.itemECabecalho.somarTotaisParaCabecalho(deps);
            }

            this.somarPeso(txt);
            this.somarValorMontagem(txt);
        }
        
        Ext.defer(this.calcularMargem, 500, this);

        if(vm.get('isDescontoCabecalho')) { // Rateio desconto
            Ext.defer(this.ratearCabecalhoPelosProdutos, 250, this, [txt]);
        }    

    },

    calcularPedidoCompra: function(txt) {

        this.iniciarEdicao();

        const vm = this.getViewModel();
        const deps = {
            txt: txt,
            vm: vm,
            ctrl: this,
            movimento: this.getRecord()
        }

        Movimento.services.Descontos.cabecalho.calcularTotaisPedidoCompra(deps);
    },

    somarPeso: function(txt) {

        const vm = this.getViewModel();


        const transporte = vm.get('model.MOVIMENTOS_ENVIO');

       const nomeCampo = txt && txt.getName ? txt.getName() : (txt && txt.name);
       const alterouProdutos = nomeCampo === 'MOVIMENTOSITENS_QUANTIDADE';

        if(vm.get('isPedido') && alterouProdutos) {
            vm.set('entregaValida', false);
        }

        if(alterouProdutos &&
            transporte &&
            transporte[0] &&
            !vm.get('isNotaEmitida') &&
            !vm.get('pesoNfeInformadoManual') &&
            configs.getMovimentos().calculaPesoNfe) {

            const pesos = this.calcularPesoNfe();

            transporte[0]['MOVIMENTOSENVIO_PESOBRUTO'] = pesos.pesoBruto;
            transporte[0]['MOVIMENTOSENVIO_PESOLIQUIDO'] = pesos.pesoLiquido;

            vm.set('forcePesoBruto', new Date());
        }
    },    

    calcularPesoNfe: function() {

        console.log('===== CALCULAR PESO NFE =====');
        console.trace();

        const vm = this.getViewModel();
        const produtos = vm.getStore('produtos').data.items;

        const pesoBruto = produtos.reduce((total, produto) => {
            let peso = 0;
            let qtde = 0;

            if(configs.getClientName() == 'prudenaco') {
                if(produto.get('PRODUTOS_UNIDADE') == 'KG') {
                    qtde = cents(produto.get('MOVIMENTOSITENS_QUANTIDADE'));
                    peso = grams(produto.get('PRODUTOS_PESOBRUTO'));
                }
            } else {
                qtde = cents(produto.get('MOVIMENTOSITENS_QUANTIDADE'));
                peso = grams(produto.get('PRODUTOS_PESOBRUTO'));
            }

            return total + (qtde * peso);
        }, 0) / 100 / 1000;

        const pesoLiquido = produtos.reduce((total, produto) => {
            let peso = 0;
            let qtde = 0;

            if(configs.getClientName() == 'prudenaco') {
                if(produto.get('PRODUTOS_UNIDADE') == 'KG') {
                    qtde = cents(produto.get('MOVIMENTOSITENS_QUANTIDADE'));
                    peso = grams(produto.get('PRODUTOS_PESOLIQUIDO'));
                }
            } else {
                qtde = cents(produto.get('MOVIMENTOSITENS_QUANTIDADE'));
                peso = grams(produto.get('PRODUTOS_PESOLIQUIDO'));
            }

            return total + (qtde * peso);
        }, 0) / 100 / 1000;

        return {
            pesoBruto: pesoBruto,
            pesoLiquido: pesoLiquido
        };
    },

    somarValorMontagem: function() {
        const vm = this.getViewModel();
        const movimento = vm.get('model');
        const produtos = vm.getStore('produtos').data.items;
        const somaValorMontagem = produtos.reduce((total, produto) => {
            const qtde  = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE'));
            const valor = cents(produto.get('MONTAGENS_VALOR'));
            return total + (qtde * valor);
        }, 0) / 100;
        
        movimento.set('MONTAGENS_VALOR', somaValorMontagem / 1000);
    },

    ratearCabecalhoPelosProdutos: function(txt) {
        const vm = this.getViewModel();
        const model = this.getRecord();
        const totalDespesas = cents(model.get('MOVIMENTOS_DESPESAS')) || 0;
        const totalImposto = cents(model.get('MOVIMENTOS_IMPOSTO')) || 0;
        const codigoPessoa = model.get('MOVIMENTOS_ID_PESSOAS');

        const isNotaEntrada = vm.get('isNotaEntrada');
        const isPedidoCompra = vm.get('isPedidoCompra');
        const isRequisicaoEntrada = vm.get('isRequisicaoEntrada');
        const produtos = vm.getStore('produtos').data.items;
        const isDescontoCabecalho = vm.get('isDescontoCabecalho');
        const isDescontoPorItemECabecalho = vm.get('isDescontoPorItemECabecalho');
        const digitouDescontoCabecalho = isDescontoPorItemECabecalho && vm.get('digitouDescontoCabecalho');
        const totalMovimento = produtos.reduce((total, produto) => {
            return total + cents(produto.get('MOVIMENTOSITENS_TOTAL'));
        }, 0);
        const ratios = this.obterRatios(totalMovimento);

        if(
            ((isNotaEntrada || isRequisicaoEntrada) && !configs.getMovimentos().rateiaDescontoNotaEntrada) || 
            isPedidoCompra
        ){
            const estaPreenchida = field => produtos.some(produto => cents(produto.get(field)) / 100 != 0);
            const baseStPreenchida   = estaPreenchida('MOVIMENTOSITENS_BASEST');
            const valorStPreenchido  = estaPreenchida('MOVIMENTOSITENS_VALORST');
            const fretePreenchido    = estaPreenchida('MOVIMENTOSITENS_FRETE');
            const seguroStPreenchido = estaPreenchida('MOVIMENTOSITENS_SEGURO');
            
            produtos.map(produto => {
                const itemTotal    = cents(produto.get('MOVIMENTOSITENS_TOTAL'));
                const itemBaseSt   = baseStPreenchida   ? cents(produto.get('MOVIMENTOSITENS_BASEST'))   : parseInt(itemTotal * ratios.basest.rate);
                const itemValorSt  = valorStPreenchido  ? cents(produto.get('MOVIMENTOSITENS_VALORST'))  : parseInt(itemTotal * ratios.valorst.rate);

                const itemFrete    = fretePreenchido    ? cents(produto.get('MOVIMENTOSITENS_FRETE'))    : parseInt(itemTotal * ratios.frete.rate);
                const itemSeguro   = seguroStPreenchido ? cents(produto.get('MOVIMENTOSITENS_SEGURO'))   : parseInt(itemTotal * ratios.seguro.rate);
                const itemDespesas = parseInt(itemTotal * ratios.despesas.rate);
                const itemImposto  = parseInt(itemTotal * ratios.imposto.rate);
    
                ratios.basest.sum   += itemBaseSt;
                ratios.valorst.sum  += itemValorSt;
                ratios.frete.sum    += itemFrete;
                ratios.seguro.sum   += itemSeguro;
    
                if(totalDespesas > 0 && configs.getClientName() != 'lislais') { // Lislais não rateia despesas na NF Entrada
                    ratios.despesas.sum += itemDespesas;                    
                    produto.set({
                        'MOVIMENTOSITENS_DESPESAS': itemDespesas  / 100
                    });    
                }

                if(totalImposto > 0) {
                    ratios.imposto.sum += itemImposto;                    
                    produto.set({
                        'MOVIMENTOSITENS_IMPOSTO': itemImposto / 100
                    });    
                }

                produto.set({
                    'MOVIMENTOSITENS_BASEST':   itemBaseSt    / 100,
                    'MOVIMENTOSITENS_VALORST':  itemValorSt   / 100,
                    'MOVIMENTOSITENS_FRETE':    itemFrete     / 100,
                    'MOVIMENTOSITENS_SEGURO':   itemSeguro    / 100
                });
            });
            
        } else {
            produtos.map(produto => {
                const itemTotal    = cents(produto.get('MOVIMENTOSITENS_TOTAL'));
                const itemFrete    = parseInt(itemTotal * ratios.frete.rate);
                const itemSeguro   = parseInt(itemTotal * ratios.seguro.rate);
                const itemDespesas = parseInt(itemTotal * ratios.despesas.rate);
                const qtdeProduto  = produto.get('MOVIMENTOSITENS_QUANTIDADE');
    
                ratios.frete.sum    += itemFrete;
                ratios.seguro.sum   += itemSeguro;
                ratios.despesas.sum += itemDespesas;
    
                produto.set({
                    'MOVIMENTOSITENS_FRETE':    itemFrete    / 100,
                    'MOVIMENTOSITENS_DESPESAS': itemDespesas / 100
                });

                if(!configs.getMovimentos().usarMarkup){
                    produto.set({
                        'MOVIMENTOSITENS_SEGURO': itemSeguro / 100
                    });
                }

                if( configs.getMovimentos().reservaAutomatica ){
                    produto.set({
                        'MOVIMENTOSITENS_ENTREGUE': qtdeProduto
                    });
                }
            });

            if(isDescontoCabecalho || digitouDescontoCabecalho) {
                const deps = {
                    txt: txt,
                    ctrl: this,
                    vm: vm,
                    movimento: this.getRecord()
                };

                const somasRateios = Movimento.services.Descontos.cabecalho.ratearCabecalhoPelosProdutos(deps);

                ratios.descontos.sum    = somasRateios.somaDescontoRateado;
                ratios.totalLiquido.sum = somasRateios.somaTotalLiquidoRateado;

            } else if(isDescontoPorItemECabecalho) {
                ratios.descontos.sum = produtos.reduce((total, produto) => {
                    const itemDesconto = cents(produto.get('MOVIMENTOSITENS_DESCONTOS'));
                    return total + itemDesconto;
                }, 0);
                ratios.totalLiquido.sum = produtos.reduce((total, produto) => {
                    const itemTotal = cents(produto.get('MOVIMENTOSITENS_TOTAL'));
                    const itemDesconto = cents(produto.get('MOVIMENTOSITENS_DESCONTOS'));
                    return total + itemTotal - itemDesconto;
                }, 0);
            } else {
                ratios.descontos.sum = 0;
                ratios.totalLiquido.sum = produtos.reduce((total, produto) => {
                    const itemTotal = cents(produto.get('MOVIMENTOSITENS_TOTAL'));
                    const itemDesconto = cents(produto.get('MOVIMENTOSITENS_DESCONTOS'));
                    return total + itemTotal - itemDesconto;
                }, 0);
            }
        }

        if(
            (isNotaEntrada && !configs.getMovimentos().rateiaDescontoNotaEntrada) || 
            isPedidoCompra
        ){
            if(produtos[0]) {
                if(configs.getMovimentos().rateiaFreteNfe != false){
                    this.somarSobraAoPrimeiroProduto(produtos, ratios);
                }

                produtos.map(produto => {
                    const qtde         = produto.get('MOVIMENTOSITENS_QUANTIDADE')   || 1;
                    const preco        = cents(produto.get('MOVIMENTOSITENS_PRECO')) || 0;
                    const totalProduto = cents(produto.get('MOVIMENTOSITENS_TOTAL'));
                    const aliquota     = produto.get('MOVIMENTOSITENS_IPI');
                    const ipi          = cents(totalProduto * aliquota / 100 / 100);
                    const ipiRateado   = parseInt((ipi || 0) / qtde);
                    const subst        = parseInt((cents(produto.get('MOVIMENTOSITENS_VALORST'))   || 0) / qtde);
                    const frete        = parseInt((cents(produto.get('MOVIMENTOSITENS_FRETE'))     || 0) / qtde);
                    const seguro       = parseInt((cents(produto.get('MOVIMENTOSITENS_SEGURO'))    || 0) / qtde);
                    const despesa      = parseInt((cents(produto.get('MOVIMENTOSITENS_DESPESAS'))  || 0) / qtde);
                    const descontos    = parseInt((cents(produto.get('MOVIMENTOSITENS_DESCONTOS')) || 0) / qtde);                    
                    const complemento  = parseInt((cents(produto.get('MOVIMENTOSITENS_DEPOSITO'))  || 0) / qtde);
                    const cte          = configs.getClientName() == 'prudenmoveis' ? 0 : parseInt((cents(produto.get('MOVIMENTOSITENS_IMPOSTO'))  || 0) / qtde);
                    const margem       = produto.get('NOVO_MARGEM');//usado no eval abaixo

                    const compra       = cents(produto['MOVIMENTOSITENS_PRECO']) || cents( produto['SALDOS_COMPRA'] );
                    const custoPadrao  = preco + ipiRateado + subst + frete + seguro + despesa + complemento + cte;
                    const custoRaca    = preco + ipiRateado + subst + frete + seguro + despesa + cte - descontos;

                    let custo = 0

                    if(configs.getClientName() == 'racaforte') {
                        custo = custoRaca;
                    } else {
                        if(configs.getClientName() == 'hermes' && isNotaEntrada && (codigoPessoa == 41 || codigoPessoa == 4934)) { //Específico MHM/NAUT
                            custo = (custoPadrao / 0.95);
                        } else {
                            custo = custoPadrao;
                        } 
                    }

                    const vista = parseInt(eval(configs.getProdutos().calculoPreco.vista));
                    const precoPrazo   = parseInt(eval(configs.getProdutos().calculoPreco.prazo));
                    const ipiPreenchido = (cents(produto.get('MOVIMENTOSITENS_VALORIPI')) > 0);
        
                    if(!ipiPreenchido) {
                        produto.set({
                            'MOVIMENTOSITENS_VALORIPI': ipi / 100
                        });    
                    }

                    produto.set({
                        'NOVO_CUSTO' : custo / 100,
                        'NOVO_PRECO' : vista / 100,
                        'NOVO_PRAZO' : precoPrazo  / 100,
                        'NOVO_COMPRA': preco / 100,
                        'NOVO_FRETE' : frete / 100,
                        'NOVO_DESPESAS': despesa / 100
                    });
                });
            }
        } else {
            if(produtos[0]){
                this.somarSobraAoPrimeiroProduto(produtos, ratios, txt);
            }
        }
    },
    
    obterRatios: function(totalMovimento) {
        const model = this.getRecord();
        const isDescontoPorItem = this.getViewModel().get('isDescontoPorItem');
        const frete    = cents(model.get('MOVIMENTOS_FRETE'));
        const seguro   = configs.getMovimentos().usarMarkup ? 0 : cents(model.get('MOVIMENTOS_SEGURO'));
        const despesas = cents(model.get('MOVIMENTOS_DESPESAS'));

        const ratios = {
            descontos:    { sum: 0, value: !isDescontoPorItem ? cents(model.get('MOVIMENTOS_DESCONTOS')) : 0},
            totalLiquido: { sum: 0, value: cents(model.get('MOVIMENTOS_TOTAL')) - (frete + seguro + despesas)},
            basest:       { sum: 0, value: cents(model.get('MOVIMENTOS_BASEST'))},
            valorst:      { sum: 0, value: cents(model.get('MOVIMENTOS_VALORST'))},
            imposto:      { sum: 0, value: cents(model.get('MOVIMENTOS_IMPOSTO'))},
            frete:        { sum: 0, value: frete   },
            seguro:       { sum: 0, value: seguro  },
            despesas:     { sum: 0, value: despesas}
        };

        ratios.descontos.rate    = ratios.descontos.value    / totalMovimento;
        ratios.totalLiquido.rate = ratios.totalLiquido.value / totalMovimento;
        ratios.basest.rate       = ratios.basest.value       / totalMovimento;
        ratios.valorst.rate      = ratios.valorst.value      / totalMovimento;
        ratios.imposto.rate      = ratios.imposto.value      / totalMovimento;
        ratios.frete.rate        = ratios.frete.value        / totalMovimento;
        ratios.seguro.rate       = ratios.seguro.value       / totalMovimento;
        ratios.despesas.rate     = ratios.despesas.value     / totalMovimento;

        return ratios;
    },

    somarSobraAoPrimeiroProduto: function(produtos, ratios, txt) {
        const isNotaEntrada = this.getViewModel().get('isNotaEntrada');
        const isNotaEletronica = this.getViewModel().get('isNotaEletronica');
        
        let sobraDesconto     = ratios.descontos.value    - ratios.descontos.sum;
        let sobraTotalLiquido = ratios.totalLiquido.value - ratios.totalLiquido.sum;
        
        const usaPrecoMinimo = configs.getMovimentos().descontoMaximoSupervisor == 'SALDOS_PRECOMINIMO';
        const usaPercentual  = configs.getMovimentos().descontoMaximo < 100;

        const selecionarProduto = i => {
            const precoOriginal    = cents(produtos[i].get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'));
            const precoMinimo      = (usaPrecoMinimo || usaPercentual) ? cents(produtos[i].get('SALDOS_PRECOMINIMO')) : 0;
            const descontos        = cents(produtos[i].get('MOVIMENTOSITENS_DESCONTOS'));
            const maxDescontoItem  = configs.getClientName() == 'stilomoveis' ? 1000000 : (precoOriginal - precoMinimo);
            const descontoAjustado = descontos + sobraDesconto;
    
            if(descontoAjustado > maxDescontoItem) {
                if(produtos[i + 1]){
                    return selecionarProduto(++i);
                } else {
                    return undefined;
                }
            } else {
                return produtos[i];
            }
        };

        const produtoQueAssumeDesconto = isNotaEletronica ? produtos[0] : selecionarProduto(0);
        const primeiroProduto = produtos[0];

        //significa que nenhum produto poderia sozinho assumir as sobras de desconto, entao rateia as sobras de desconto tambem
        if(!produtoQueAssumeDesconto){
            produtos.forEach(produto => {
                const qtde = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE'));
                let sobraLiquido = parseInt(ratios.totalLiquido.value / qtde * 1000) - parseInt(ratios.totalLiquido.sum / qtde * 1000);

                if(sobraDesconto > 0){
                    const descontos = cents(produto.get('MOVIMENTOSITENS_DESCONTOS'));
                    const descontoAjustado = descontos + 1;
                    sobraDesconto--;
                    produto.set('MOVIMENTOSITENS_DESCONTOS', descontoAjustado / 100);
                }

                if(sobraLiquido < 0){
                    const liquido = cents(produto.get('VALOR_LIQUIDO'));
                    const liquidoAjustado = liquido - 1;
                    sobraLiquido++;
                    produto.set('VALOR_LIQUIDO', liquidoAjustado / 100);
                }

                if(sobraTotalLiquido < 0){
                    const totalLiquido = cents(produto.get('TOTAL_LIQUIDO'));
                    const totalLiquidoAjustado = totalLiquido - 1;
                    sobraTotalLiquido++;
                    produto.set('TOTAL_LIQUIDO', totalLiquidoAjustado / 100);
                }
            });

        //se conseguiu selecionar um produto para assumir o desconto, faz o ajuste
        } else {
            const qtde          = grams(produtoQueAssumeDesconto.get('MOVIMENTOSITENS_QUANTIDADE'));
            const descontos     = cents(produtoQueAssumeDesconto.get('MOVIMENTOSITENS_DESCONTOS'));
            const liquido       = cents(produtoQueAssumeDesconto.get('VALOR_LIQUIDO'));
            const totalLiquido  = cents(produtoQueAssumeDesconto.get('TOTAL_LIQUIDO'));

            const liquidoAjustado      = liquido      + parseInt(ratios.totalLiquido.value / qtde * 1000) - parseInt(ratios.totalLiquido.sum / qtde * 1000);
            const descontoAjustado     = descontos    + sobraDesconto;
            const totalLiquidoAjustado = totalLiquido + sobraTotalLiquido;

            if(!isNotaEntrada || configs.getMovimentos().rateiaDescontoNotaEntrada){
                produtoQueAssumeDesconto.set({
                    'MOVIMENTOSITENS_DESCONTOS': descontoAjustado     / 100,
                    'VALOR_LIQUIDO':             liquidoAjustado      / 100,
                    'TOTAL_LIQUIDO':             totalLiquidoAjustado / 100
                });
            }
        }
        
        const basest        = cents(primeiroProduto.get('MOVIMENTOSITENS_BASEST'));
        const valorst       = cents(primeiroProduto.get('MOVIMENTOSITENS_VALORST'));
        const imposto       = cents(primeiroProduto.get('MOVIMENTOSITENS_IMPOSTO'));
        const frete         = cents(primeiroProduto.get('MOVIMENTOSITENS_FRETE'));
        const seguro        = configs.getMovimentos().usarMarkup ? 0 : cents(primeiroProduto.get('MOVIMENTOSITENS_SEGURO'));
        const despesas      = cents(primeiroProduto.get('MOVIMENTOSITENS_DESPESAS'));
        
        const basestAjustada       = basest       + ratios.basest.value   - ratios.basest.sum;
        const valorstAjustado      = valorst      + ratios.valorst.value  - ratios.valorst.sum;
        const impostoAjustado      = imposto      + ratios.imposto.value  - ratios.imposto.sum;
        const freteAjustado        = frete        + ratios.frete.value    - ratios.frete.sum;
        const seguroAjustado       = seguro       + ratios.seguro.value   - ratios.seguro.sum;
        const despesaAjustada      = despesas     + ratios.despesas.value - ratios.despesas.sum;

        if(isNotaEntrada && !configs.getMovimentos().rateiaDescontoNotaEntrada){
            primeiroProduto.set({
                'MOVIMENTOSITENS_BASEST':    basestAjustada   / 100,
                'MOVIMENTOSITENS_VALORST':   valorstAjustado  / 100,
                'MOVIMENTOSITENS_IMPOSTO':   impostoAjustado  / 100,
                'MOVIMENTOSITENS_FRETE':     freteAjustado    / 100,
                'MOVIMENTOSITENS_SEGURO':    seguroAjustado   / 100,
                'MOVIMENTOSITENS_DESPESAS':  despesaAjustada  / 100,
            });
        } else {
            produtos[0].set({
                'MOVIMENTOSITENS_FRETE':    freteAjustado   / 100,
                'MOVIMENTOSITENS_DESPESAS': despesaAjustada / 100
            });

            if(!configs.getMovimentos().usarMarkup) {
                primeiroProduto.set({
                    'MOVIMENTOSITENS_SEGURO': seguroAjustado / 100
                });
            }
        }

        const isDescontoCabecalho = this.getViewModel().get('isDescontoCabecalho');
        const isDescontoPorItemECabecalho = this.getViewModel().get('isDescontoPorItemECabecalho');
        const digitouDescontoCabecalho = isDescontoPorItemECabecalho && this.getViewModel().get('digitouDescontoCabecalho');

        if(
            (//ajuste temporario para nao apagar sozinho o preco
                !txt ||
                (txt && txt.name != 'MOVIMENTOSITENS_PRECO')
            ) &&
            !isDescontoCabecalho && (
                digitouDescontoCabecalho || 
                cents(this.getRecord().get('MOVIMENTOS_DESCONTOS')) == 0
            )
        ) {
            this.lookup('produtos').carregarDaStore();
        }

        setTimeout(() => {
            const movimento = this.getRecord();
            const produtos = this.lookup('produtos').getStore().getData().items || [];

            Movimento.services.Recuperacao.salvar(movimento, produtos);
        }, 1000);
    }
});