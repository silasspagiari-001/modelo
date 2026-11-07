Ext.define('SamosAdmin.movimentos.movimento.form.impostositens.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentosimpostositens',

    initViewModel: function(vm) {
        this.valorreq = 0;

        Ext.asap(async () => {
            const form = Ext.$('formmovimentos')[0] || [];

            if(
                form.getViewModel().get('isNotaComRequisicao') && 
                form.getViewModel().get('temNumeroOrigem')
            ) {
                this.getView().initGauge();

                try {
                    const model    = vm.get('model');
                    const empresa  = configs.getEmpresa().id;
                    const numero   = form.getViewModel().get('model.MOVIMENTOS_NUMEROORIGEM') || '';
                    const serie    = form.getViewModel().get('model.MOVIMENTOS_SERIEORIGEM') || '';
                    const pessoa   = form.getViewModel().get('model.MOVIMENTOS_ID_PESSOAS');
                    const produto  = model.get('MOVIMENTOSITENS_ID_PRODUTOS');
        
                    const custoRequisicao = await SamosUtils.Request.nodeApi({
                        url: `/consultas/getcustoprodutorequisicao`,
                        method: 'GET',
                        query: {
                            empresa: empresa,
                            pessoa : pessoa,
                            numero : numero,
                            serie  : serie,
                            produto: produto
                        }
                    });
    
                    this.valorreq = cents(custoRequisicao) || 0;

                } catch(error){
                    this.valorreq = 0;
                    console.error(error);
                }
    
                this.getView().stopGauge();    
            }

            this.calcularPreco();
        });
    },

    calcularPreco: function(txt) {
        if(txt && txt.readOnly) { return true; }

        setTimeout(async() => {
            const vm = this.getViewModel();
            const isPedidoCompra = vm.get('isPedidoCompra') ? true : false;
            const isNotaEntrada = vm.get('isNotaEntrada') ? true : false;
            const model      = vm.get('model');

            const form = Ext.$('formmovimentos')[0] || [];
            const modelMovimentos = form.getViewModel().get('model');
            const codigoPessoa = modelMovimentos.get('MOVIMENTOS_ID_PESSOAS');

            if(isPedidoCompra) {
                const valorItem = model.get('MOVIMENTOSITENS_TOTAL');
                const percIpi   = model.get('MOVIMENTOSITENS_IPI');
                const valorIpi = (valorItem / 100) * percIpi;
                model.set('MOVIMENTOSITENS_VALORIPI' , valorIpi);

                const percFrete   = model.get('MOVIMENTOSITENS_ALIQUOTAPIS');
                const valorFrete = (valorItem / 100) * percFrete;
                model.set('MOVIMENTOSITENS_FRETE' , valorFrete);

                const percSeguro   = model.get('MOVIMENTOSITENS_ALIQUOTACOFINS');
                const valorSeguro = (valorItem / 100) * percSeguro;
                model.set('MOVIMENTOSITENS_SEGURO' , valorSeguro);

                const form = Ext.$('formmovimentos')[0] || [];
                const ctrlMovimento = form.getController();
        
                ctrlMovimento.mixins.produtos.calcularPedidoCompra.call(ctrlMovimento);
            }

            const qtde        = model.get('MOVIMENTOSITENS_QUANTIDADE')   || 1;
            const preco       = cents(model.get('MOVIMENTOSITENS_PRECO')) || 0;
            const ipi         = parseInt((cents(model.get('MOVIMENTOSITENS_VALORIPI')) || 0) / (qtde || 1));
            const subst       = parseInt((cents(model.get('MOVIMENTOSITENS_VALORST'))  || 0) / (qtde || 1));
            const frete       = parseInt((cents(model.get('MOVIMENTOSITENS_FRETE'))    || 0) / (qtde || 1));
            const seguro      = configs.getMovimentos().usarMarkup ? 0 : parseInt((cents(model.get('MOVIMENTOSITENS_SEGURO'))   || 0) / (qtde || 1));
            const despesa     = parseInt((cents(model.get('MOVIMENTOSITENS_DESPESAS')) || 0) / (qtde || 1));
            const descontos   = parseInt((cents(model.get('MOVIMENTOSITENS_DESCONTOS')) || 0) / (qtde || 1));
            const complemento = parseInt((cents(model.get('MOVIMENTOSITENS_DEPOSITO')) || 0) / (qtde || 1));
            const margem      = model.get('NOVO_MARGEM');//usado no eval abaixo

            let cte           = parseInt((cents(model.get('MOVIMENTOSITENS_IMPOSTO'))  || 0) / (qtde || 1));

            if(configs.getClientName() == 'prudenmoveis' ||
               configs.getClientName() == 'organoplant' ||
               configs.getClientName() == 'biomart' ||
               configs.getClientName() == 'pinguim') {
               cte = 0;
            };

            const custoPadrao = preco + ipi + subst + seguro + despesa + complemento + frete + cte;
            const custoRaca   = preco + ipi + subst + seguro + despesa + frete + cte - descontos;
            
            let custo = 0;

            if(configs.getClientName() == 'racaforte') {  // Considera o desconto do fornecedor
                custo = custoRaca;
            } else {
                if(configs.getClientName() == 'hermes' &&
                    isNotaEntrada &&
                    (codigoPessoa == 41 || codigoPessoa == 4934)) { //Específico MHM/NAUT
                    custo = (custoPadrao / 0.95);
                } else {
                    custo = custoPadrao;
                }
            }
   
            const compra     = cents(model.get('MOVIMENTOSITENS_PRECO')) || cents( model.get('SALDOS_COMPRA') );
            const vista      = parseInt(eval(configs.getProdutos().calculoPreco.vista));
            const precoPrazo = parseInt(eval(configs.getProdutos().calculoPreco.prazo));

            model.set({
                'NOVO_CUSTO':  custo / 100,
                'NOVO_PRECO':  vista / 100,
                'NOVO_PRAZO':  precoPrazo / 100
            });

            model.set({
                'NOVO_COMPRA': preco / 100
            });
            
        }, 200);
    },

    calcularValorIcms: function(txt) {
        setTimeout(() => {
            const vm = this.getViewModel();
            const model = vm.get('model');
            const valorIpi = cents(model.get('MOVIMENTOSITENS_VALORIPI'));
            const excecao = model.get('MOVIMENTOSITENS_EXCECAO');
            const base = cents(model.get('MOVIMENTOSITENS_BASEICMS'));
            const baseICMS = excecao == 1 ? (base + valorIpi) : base;
            const aliquota = model.get('MOVIMENTOSITENS_ICMS');
            const valor = baseICMS * aliquota / 100 / 100;
    
            if(!vm.get('isComplementar')) {
                model.set('MOVIMENTOSITENS_VALORICMS', valor);
            }

        }, 200);
    },

    calcularValorIpi: function(txt) {
        setTimeout(() => {
            const model = this.getViewModel().get('model');
            const totalProduto = cents(model.get('MOVIMENTOSITENS_TOTAL'));
            const aliquota = model.get('MOVIMENTOSITENS_IPI');
            const valor = totalProduto * aliquota / 100 / 100;
            model.set('MOVIMENTOSITENS_VALORIPI', valor);
            Ext.defer(this.calcularPreco, 200, this);
        }, 200);
    },

    calcularValorPis: function(txt) {
        setTimeout(() => {
            const model = this.getViewModel().get('model');
            const base = cents(model.get('MOVIMENTOSITENS_BASEPIS'));
            const aliquota = model.get('MOVIMENTOSITENS_ALIQUOTAPIS');
            const aliquotaCofins = model.get('MOVIMENTOSITENS_ALIQUOTACOFINS');
            const valor = base * aliquota / 100 / 100;
            const valorCofins = base * aliquotaCofins / 100 / 100;
            model.set('MOVIMENTOSITENS_CSTCOFINS', model.get('MOVIMENTOSITENS_CSTPIS'));
            model.set('MOVIMENTOSITENS_BASECOFINS', model.get('MOVIMENTOSITENS_BASEPIS'));
            model.set('MOVIMENTOSITENS_VALORPIS', valor);
            model.set('MOVIMENTOSITENS_VALORCOFINS', valorCofins);

        }, 200);
    },

    calcularValorCofins: function(txt) {
        setTimeout(() => {
            const model = this.getViewModel().get('model');
            const base = cents(model.get('MOVIMENTOSITENS_BASECOFINS'));
            const aliquota = model.get('MOVIMENTOSITENS_ALIQUOTACOFINS');
            const aliquotaPis = model.get('MOVIMENTOSITENS_ALIQUOTAPIS');
            const valor = base * aliquota / 100 / 100;
            const valorPis = base * aliquotaPis / 100 / 100;

            model.set('MOVIMENTOSITENS_BASEPIS', model.get('MOVIMENTOSITENS_BASECOFINS'));
            model.set('MOVIMENTOSITENS_VALORCOFINS', valor);
            model.set('MOVIMENTOSITENS_VALORPIS', valorPis);

        }, 200);
    },

    focarProximoCampo: function(txt, pessoa){
        this.lookup('icms').focus(true);
    },

    setarCSTProduto: function(txt) {
        setTimeout(() => {
            const model = this.getViewModel().get('model');
            const idOrigem = model.get('TABELA_ORIGEM').trim() || '';
            const idLocal  = model.get('TABELA_LOCAL').trim() || '';
            if(idOrigem && idLocal) {
                model.set('MOVIMENTOSITENS_CST', (idOrigem+idLocal));
            }
        }, 200);
    },

    onConfirmarClick: async function (btn, e) {
        const formMovimentos = Ext.$('formmovimentos')[0];
        const vm = this.getViewModel();
        const model = vm.get('model');
        
        if( await SamosUtils.Msg.confirm('Deseja realmente confirmar?') ) {
            const baseIcmsItem  = model.get('MOVIMENTOSITENS_BASEICMS');
            const aliqIcmsItem  = model.get('MOVIMENTOSITENS_ICMS');
            const valorIcmsItem = model.get('MOVIMENTOSITENS_VALORICMS');
            const codigoItem    = model.get('MOVIMENTOSITENS_ID_PRODUTOS');
            const produtoLote   = model.get('LOTES_ID_PRODUTOS');
            const loteIdProduto = model.get('LOTES_ID_PRODUTOS');
            const semLote       = model.get('PRODUTOS_DERIVADO').match(/T|F/);

            let impostosConfere = true;

            if(!vm.get('isComplementar') && vm.get('isNotaEntrada')) {
                if(baseIcmsItem > 0) {
                    if(aliqIcmsItem == 0 || valorIcmsItem == 0) {
                        Ext.Note('warning', 'Informe a alíquota e o valor do ICMS do item');
                        impostosConfere = false;
                    }
                } else {
                    if(aliqIcmsItem > 0 || valorIcmsItem > 0) {
                        Ext.Note('warning', 'Informe a Base de Cálculo do ICMS do item');
                        impostosConfere = false;
                    }
                }    
            }

            if(model.get('PRODUTOS_DERIVADO') == 'P' && !semLote) { // Lote de produção própria
                if(cents(produtoLote) > 0 && (cents(produtoLote) != cents(codigoItem))) {
                    Ext.Note('warning', 'Produto do lote não confere com o item - corrigir');
                    impostosConfere = false;
                }    
            }

            if(model.get('PRODUTOS_DERIVADO') != 'P' && !semLote) { // Lote de revenda
                if(cents(loteIdProduto) > 0 && loteIdProduto != 999999 && (cents(loteIdProduto) != cents(codigoItem))) {
                    Ext.Note('warning', 'Produto do lote não confere com o item - corrigir');
                    impostosConfere = false;
                }    
            }

            if(impostosConfere) {
                const proximoFoco = formMovimentos.lookup('produto' + (parseInt(vm.get('lineIndex')) + 1));
                formMovimentos.getController().iniciarEdicao();
                this.getView().formItem.setValues(vm.get('model').data);
                proximoFoco.focus(true);
                this.onSairClick();
            }
        }
        
    },

    onCancelarClick: function(btn, event) {
        const vm = this.getViewModel();
        const previousModel = vm.get('previousModel');

        if (previousModel) {
            vm.get('model').set(previousModel);
        }

        this.onSairClick();
    }
});
