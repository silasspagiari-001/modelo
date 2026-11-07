Ext.define('SamosAdmin.movimentos.promocoes.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formpromocoes',

    mixins: {
        produtos: 'SamosAdmin.movimentos.promocoes.form.mixins.Produtos',
    },

    initViewModel: function(vm){
        setTimeout(() => {
            const empresas = vm.get('model.PROMOCOES_EMPRESAS');
            const arrayEmpresas = empresas ? empresas.split('|') : [];
            
            this.lookup('empresasselecionadas').setValue(arrayEmpresas);
        }, 1000);
    },

    onNovoClick: async function(btn, event) {
        const cfgPromocao = configs.getMovimentos().promocao;

        const form = await this.callParent(arguments);

        if(cfgPromocao) {
            const model = form.model;
            const empresas = cfgPromocao['PROMOCOES_EMPRESAS'];
            const txtEmpresas = this.lookup('empresasselecionadas');

            model.set({
                'PROMOCOES_EMPRESAS'    : empresas,
                'PROMOCOES_CUSTOTECNICO': cfgPromocao['PROMOCOES_CUSTOTECNICO'],
                'PROMOCOES_DESCONTO'    : cfgPromocao['PROMOCOES_DESCONTO'],
                'PROMOCOES_DESCONTOA'   : cfgPromocao['PROMOCOES_DESCONTOA'],
                'PROMOCOES_DESCONTOB'   : cfgPromocao['PROMOCOES_DESCONTOB'],
                'PROMOCOES_DESCONTOC'   : cfgPromocao['PROMOCOES_DESCONTOC'],
                'PROMOCOES_INDICE'      : cfgPromocao['PROMOCOES_INDICE'],
                'PROMOCOES_PARCELAS'    : cfgPromocao['PROMOCOES_PARCELAS'],
            });

            const arrayEmpresas = empresas ? empresas.split('|') : [];
            
            txtEmpresas.clearValue();

            setTimeout(() => {
                txtEmpresas.setValue(arrayEmpresas);
            }, 100);
        }

        return form;
    },

    onProdutosClick: async function(btn, e) {
        this.iniciarEdicao();

        const promocao = this.getRecord();
        const produtosAtuais = this.lookup('produtos').getStore().data.items.map(produtos => produtos);
        const descontoCab  = grams(promocao.get('PROMOCOES_DESCONTO'));
        const descontoCabA = grams(promocao.get('PROMOCOES_DESCONTOA'));
        const descontoCabB = grams(promocao.get('PROMOCOES_DESCONTOB'));
        const descontoCabC = grams(promocao.get('PROMOCOES_DESCONTOC'));
        
        const custoTecnico = 0; //grams(promocao.get('PROMOCOES_CUSTOTECNICO'));
        const indice = promocao.get('PROMOCOES_INDICE');
        const parcelas = promocao.get('PROMOCOES_PARCELAS');

        const records = await btn.up('samoswidgets-dinamicbutton').openSearch({
            title: 'Produtos',
            tabela: 'produtos',
            proximoFoco: 'nome',
            multi: true,
            valueOrdem: 1,
            valueStatus: 'T'
        });

        const produtos = records.map(produto => {
            const preco = cents(produto.get('SALDOS_PRECO'));
            const precoMinimo = cents(produto.get('SALDOS_PRECOMINIMO'));
            let valor;
            let desconto;
            let valorA;
            let descontoA;
            let valorB;
            let descontoB;
            let valorC;
            let descontoC;

            if(custoTecnico > 0){
                valor     = parseInt((precoMinimo + ((precoMinimo * custoTecnico) / 1000 / 100)) / 100);
                desconto  = (100000 - grams((cents(produto.get('PROMOCOESITENS_VALOR')) / preco) * 100)) / 1000;

                valorA    = parseInt((precoMinimo + ((precoMinimo * custoTecnico) / 1000 / 100)) / 100);
                descontoA = (100000 - grams((cents(produto.get('PROMOCOESITENS_VALORA')) / preco) * 100)) / 1000;

                valorB    = parseInt((precoMinimo + ((precoMinimo * custoTecnico) / 1000 / 100)) / 100);
                descontoB = (100000 - grams((cents(produto.get('PROMOCOESITENS_VALORB')) / preco) * 100)) / 1000;

                valorC    = parseInt((precoMinimo + ((precoMinimo * custoTecnico) / 1000 / 100)) / 100);
                descontoC = (100000 - grams((cents(produto.get('PROMOCOESITENS_VALORC')) / preco) * 100)) / 1000;

            } else {
                valor  = parseInt((preco - (preco * descontoCab  / 1000 / 100)) / 100);
                valorA = parseInt((preco - (preco * descontoCabA / 1000 / 100)) / 100);
                valorB = parseInt((preco - (preco * descontoCabB / 1000 / 100)) / 100);
                valorC = parseInt((preco - (preco * descontoCabC / 1000 / 100)) / 100);

                if(cents(valor) < precoMinimo) {
                    valor    = precoMinimo / 100;
                    desconto = (100000 - grams(precoMinimo / preco * 100)) / 1000;
                } else {
                    desconto = descontoCab;
                }

                if(cents(valorA) < precoMinimo) {
                    valorA    = precoMinimo / 100;
                    descontoA = (100000 - grams(precoMinimo / preco * 100)) / 1000;
                } else {
                    descontoA = descontoCabA;
                }

                if(cents(valorB) < precoMinimo) {
                    valorB    = precoMinimo / 100;
                    descontoB = (100000 - grams(precoMinimo / preco * 100)) / 1000;
                } else {
                    descontoB = descontoCabB;
                }

                if(cents(valorC) < precoMinimo) {
                    valorC    = precoMinimo / 100;
                    descontoC = (100000 - grams(precoMinimo / preco * 100)) / 1000;
                } else {
                    descontoC = descontoCabC;
                }

            }

            return Ext.create('SamosAdmin.movimentos.promocoes.ModelItens', {
                'PROMOCOESITENS_ID'           : '',
                'PROMOCOESITENS_ID_PROMOCOES' : '',
                'PROMOCOESITENS_ID_PRODUTOS'  : produto.get('PRODUTOS_ID'),
                'PRODUTOS_NOME'               : produto.get('PRODUTOS_NOME'),
                'PRODUTOS_MARCA'              : produto.get('PRODUTOS_MARCA'),
                'PRODUTOS_APLICACAO'          : produto.get('PRODUTOS_APLICACAO'),
                'PRODUTOS_UNIDADE'            : produto.get('PRODUTOS_UNIDADE'),
                'SALDOS_PRECOMINIMO'          : precoMinimo / 100,
                'SALDOS_PRECO'                : preco / 100,
                'SALDOS_CUSTO'                : produto.get('SALDOS_CUSTO'),
                'PROMOCOES_EMPRESAS'          : '',
                'PROMOCOESITENS_VALOR'        : valor,
                'PROMOCOESITENS_VALORA'       : valorA,
                'PROMOCOESITENS_VALORB'       : valorB,
                'PROMOCOESITENS_VALORC'       : valorC,                
                'PROMOCOESITENS_CUSTOTECNICO' : 1, //custoTecnico / 1000,
                'PROMOCOESITENS_DESCONTO'     : desconto  > 0 ? desconto  / 1000 : 0,
                'PROMOCOESITENS_DESCONTOA'    : descontoA > 0 ? descontoA / 1000 : 0,
                'PROMOCOESITENS_DESCONTOB'    : descontoB > 0 ? descontoB / 1000 : 0,
                'PROMOCOESITENS_DESCONTOC'    : descontoC > 0 ? descontoC / 1000 : 0,
                'PROMOCOESITENS_INDICE'       : indice,
                'PROMOCOESITENS_PARCELAS'     : parcelas,
                'TOTALPARCELAS_ITENS'         : parseInt(valor * coefs(indice) * parseInt(parcelas) / 10000),
                'PROMOCOESITENS_EMPRESAS'     : promocao.get('PROMOCOES_EMPRESAS')
            });
        });

        this.getViewModel().get('model').set({
            'PROMOCOES_ITENS': produtosAtuais.concat(produtos)
        });
    },

    onCustoTecnicoChange: async function(txt, e) {
        if(SamosUtils.Events.isTab(e) || SamosUtils.Events.isEnter(e)) { return; }
        
        await SamosUtils.Utils.sleep(200);

        const descontos  = grams(this.getViewModel().get('model.PROMOCOES_DESCONTO'));
        const descontosA = grams(this.getViewModel().get('model.PROMOCOES_DESCONTOA'));
        const descontosB = grams(this.getViewModel().get('model.PROMOCOES_DESCONTOB'));        
        const descontosC = grams(this.getViewModel().get('model.PROMOCOES_DESCONTOC'));

        if(grams(txt.getValue()) > 0 && (descontos + descontosA + descontosB + descontosC)  > 0){
            Ext.Note('warning', 'Não é permitido Custo Técnico com Desconto(s) informado(s)');
            txt.setValue(0);
        }
    },

    onDescontoChange: async function(txt, e) {
        if(SamosUtils.Events.isTab(e) || SamosUtils.Events.isEnter(e)) { return; }

        await SamosUtils.Utils.sleep(200);

        const custoTecnico = grams(this.getViewModel().get('model.PROMOCOES_CUSTOTECNICO'));

        if(grams(txt.getValue()) > 0 && custoTecnico > 0){
            Ext.Note('warning', 'Não é permitido Desconto com Custo Técnico informado');
            txt.setValue(0);
        }
    },

    onDescontoAChange: async function(txt, e) {
        if(SamosUtils.Events.isTab(e) || SamosUtils.Events.isEnter(e)) { return; }

        await SamosUtils.Utils.sleep(200);

        const custoTecnico = grams(this.getViewModel().get('model.PROMOCOES_CUSTOTECNICO'));

        if(grams(txt.getValue()) > 0 && custoTecnico > 0){
            Ext.Note('warning', 'Não é permitido Desconto com Custo Técnico informado');
            txt.setValue(0);
        }
    },

    onDescontoBChange: async function(txt, e) {
        if(SamosUtils.Events.isTab(e) || SamosUtils.Events.isEnter(e)) { return; }

        await SamosUtils.Utils.sleep(200);

        const custoTecnico = grams(this.getViewModel().get('model.PROMOCOES_CUSTOTECNICO'));

        if(grams(txt.getValue()) > 0 && custoTecnico > 0){
            Ext.Note('warning', 'Não é permitido Desconto com Custo Técnico informado');
            txt.setValue(0);
        }
    },

    onDescontoCChange: async function(txt, e) {
        if(SamosUtils.Events.isTab(e) || SamosUtils.Events.isEnter(e)) { return; }

        await SamosUtils.Utils.sleep(200);

        const custoTecnico = grams(this.getViewModel().get('model.PROMOCOES_CUSTOTECNICO'));

        if(grams(txt.getValue()) > 0 && custoTecnico > 0){
            Ext.Note('warning', 'Não é permitido Desconto com Custo Técnico informado');
            txt.setValue(0);
        }
    },

    setarCustoTecnico: function(txt){
        const selection = this.lookup('produtos').getSelection();
        if(!selection){ return; }

        const produto      = selection.getValues();
        const valor        = cents(produto['PROMOCOESITENS_VALOR']);
        const valorA       = cents(produto['PROMOCOESITENS_VALORA']);
        const valorB       = cents(produto['PROMOCOESITENS_VALORB']);
        const valorC       = cents(produto['PROMOCOESITENS_VALORC']);        
        const preco        = cents(produto['SALDOS_PRECO']);
        const precoMinimo  = cents(produto['SALDOS_PRECOMINIMO']);
        const custoTecnico = 0; 
        const custo        = cents(produto['SALDOS_CUSTO']);

        produto['PROMOCOESITENS_DESCONTO']  = (100000 - grams(valor  / preco * 100)) / 1000;        
        produto['PROMOCOESITENS_DESCONTOA'] = (100000 - grams(valorA / preco * 100)) / 1000;        
        produto['PROMOCOESITENS_DESCONTOB'] = (100000 - grams(valorB / preco * 100)) / 1000;        
        produto['PROMOCOESITENS_DESCONTOC'] = (100000 - grams(valorC / preco * 100)) / 1000;        

        produto['DESCONTO_CALCULADO']  = (100000 - grams(valor  / preco * 100)) / 1000;        
        produto['DESCONTO_CALCULADOA'] = (100000 - grams(valorA / preco * 100)) / 1000;        
        produto['DESCONTO_CALCULADOB'] = (100000 - grams(valorB / preco * 100)) / 1000;        
        produto['DESCONTO_CALCULADOC'] = (100000 - grams(valorC / preco * 100)) / 1000;                

        if(valor < custo && !configs.getMovimentos().promocaoBasica){
            Ext.Note('warning', 'Promoção menor que custo');
            produto['PROMOCOESITENS_VALOR'] = preco / 100;
            setTimeout(() => {
                txt.focus(true);
            }, 200)
        } else {
            if(valor < precoMinimo && !configs.getMovimentos().promocaoBasica) {
                Ext.Note('warning', 'Promoção menor que preço');
            }    
        }

        selection.setValues(produto);

        setTimeout(() => {
            txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
        }, 200);
    },

    validarDatas: async function(txt) {
        this.iniciarEdicao();

        await SamosUtils.Utils.sleep(200);

        const model = this.getRecord();
        const inicio = model.get('PROMOCOES_EMISSAO');
        const final  = model.get('PROMOCOES_VALIDADE');

        try {
            if(!inicio || !final || momentTz(inicio).isAfter(momentTz(final))){
                Ext.Note('warning', 'A data final não pode ser antes da data inicial');
                txt.focus(true);
            }
        } catch(e) {}
    },

    onFecharClick: async function(btn, e) {  
        const view = this.getView();

        try {
            view.initGauge();
            await SamosUtils.Utils.sleep(100);
            await this.checarOutrasPromocoes();
            view.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());
            await this.validarCabecalho();
            this.finalizarEdicao();
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao fechar promoção');
        }

        view.stopGauge();
    },

    checarOutrasPromocoes: async function() {
        const promocaoAtual = this.getRecord();
        const produtos = this.lookup('produtos').getStore().data.items || [];
        const ids = produtos.reduce((ids, produto) => {
            return ids += produto.get('PROMOCOESITENS_ID_PRODUTOS') + ',';
        }, '').slice(0, -1);
        const arrayEmpresas = promocaoAtual.get('PROMOCOES_EMPRESAS');
        const empresas = typeof arrayEmpresas == 'string' ? arrayEmpresas : (arrayEmpresas || []).join('|');

        const queryOutrasPromocoes = await SamosUtils.Request.nodeApi({
            url: `/consultas/produtopromocao`,
            method: 'GET',
            data: {
                produtos: ids, 
                promocao: promocaoAtual.get('PROMOCOES_ID'),
                empresas: empresas, 
                inicio  : momentTz(promocaoAtual.get('PROMOCOES_EMISSAO')).format('DD/MM/YYYY'),
                final   : momentTz(promocaoAtual.get('PROMOCOES_VALIDADE')).format('DD/MM/YYYY')
            }
        });

        if(!configs.getMovimentos().promocaoBasica || configs.getMovimentos().carregaPrecoPromocao == true)
        {
            if(queryOutrasPromocoes && queryOutrasPromocoes.results && queryOutrasPromocoes.results[0]){
                const idsProdutosJaEmPromocao = queryOutrasPromocoes.results.map(result => result['PROMOCOESITENS_ID_PRODUTOS']);
                const remover = produtos.filter(produto => {
                    return idsProdutosJaEmPromocao.indexOf(parseInt(produto.get('PROMOCOESITENS_ID_PRODUTOS'))) != -1;
                });

                this.lookup('produtos').getStore().remove(remover);
                throw 'Produto(s) já em promoção: ' + SamosUtils.Array.uniques(idsProdutosJaEmPromocao).join(', ');
            }
        }
    },

    onGravarClick: async function() {
        const view = this.getView();

        try {
            const empresas = this.lookup('empresasselecionadas').getValue();
            const model    = this.getRecord();
    
            model.set('PROMOCOES_EMPRESAS', empresas.join('|'));
    
            await this.validarCabecalho();

            if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
                view.initGauge('Gravando...');

                this.colocarFilhosNoModel(model);
    
                const itens = model.get('PROMOCOES_ITENS').map(produto => {
                    produto['PROMOCOESITENS_EMPRESAS'] = empresas.join('|');
                    produto['PROMOCOESITENS_CUSTOTECNICO'] = produto['PROMOCOESITENS_CUSTOTECNICO'] || 0;
                    produto['PROMOCOESITENS_INDICE'] = produto['PROMOCOESITENS_INDICE'] || 0;
    
                    return produto;
                });
                    
                model.set('PROMOCOES_ITENS', itens);
    
                const record = await model.save();

                this.onGravacaoSucesso(record);

                //se a empresa logada nao estiver incluida na promocao gravada: sai do form e da o reload na store
                if(!(record.get('PROMOCOES_EMPRESAS') || '').match(configs.getEmpresa().id)){
                    this.onSairClick();
                }
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao salvar promoção');
        }

        if(view) {
            const empresas = this.getViewModel().get('model.PROMOCOES_EMPRESAS');
            const arrayEmpresas = empresas.split('|');
            arrayEmpresas.sort();
            this.lookup('empresasselecionadas').setValue(arrayEmpresas);
    
            view.stopGauge();
        }
    },

    onImprimirClick: async function(btn, e) {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')) {
                view.initGauge('Imprimindo...');
        
                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/promocoes`,
                    method: 'GET',
                    data: {
                        id: this.getRecord().get('PROMOCOES_ID'),
                        empresacnpj: configs.getEmpresa().cnpj 
                    }
                });
        
                view.stopGauge(true);

                await SamosUtils.Utils.sleep(500);
                
                SamosUtils.Pdf.exibir({
                    local: 'tab',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
            }

        } catch(error) {
            view.stopGauge();
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }
    }
});
