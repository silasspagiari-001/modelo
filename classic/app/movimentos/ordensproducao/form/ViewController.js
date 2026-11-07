Ext.define('SamosAdmin.movimentos.ordensproducao.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formordensproducao',

    initViewModel: function (vm) {
        Ext.asap(() => {
            try {
                const descricao = vm.get('model.PRODUTOS_DESCRICAO');
                const multiplos = grams(descricao.split('|')[2]) || 1000;
                vm.set('model.MULTIPLOS_PRODUTOS', multiplos / 1000);
            } catch (e) {}
        });
    },

    onNovoClick: async function () {
        const form = await this.callParent(arguments);

        try {
            const idEmpresa     = configs.getEmpresa().id;
            const nomeDocumento = this.getListView().title;
            const model         = form.model;
            const documento     = await Documento.services.Model.get(nomeDocumento, idEmpresa);
    
            model.set({
                'PRODUCOES_ID_DOCUMENTOS' : documento.get('DOCUMENTOS_ID'),
                'PRODUCOES_ID_PESSOAS'    : documento.get('DOCUMENTOS_ID_PESSOAS'),
                'PESSOAS_NOME'            : documento.get('PESSOAS_NOME'),
                'PESSOAS_ENDERECO'        : documento.get('PESSOAS_ENDERECO'),
                'CIDADES_NOME'            : documento.get('CIDADES_NOME'),
                'CIDADES_ESTADO'          : documento.get('CIDADES_ESTADO'),
                'PRODUCOES_ID_OPERACOES_S': documento.get('DOCUMENTOS_ID_OPERACOES'),
                'PRODUCOES_ID_OPERACOES_E': documento.get('DOCUMENTOS_LAYOUT'),
                'OPERACOESENTRADA_NOME'   : documento.get('OPERACOES_NOME')
            });

            this.lookup('pessoa').setSearchedId(documento.get('PESSOAS_NOME'));
            
        } catch (error) {
            form.destroy();
            SamosUtils.Msg.error(error, 'Erro ao criar novo documento');
        }

        return form;
    },
    
    aposSelecionarProdutoPrincipal: async function(txt, produto) {
        const view = this.getView();

        try {
            view.initGauge();
            
            let producao = this.getRecord();

            producao.set('PRODUCOES_QUANTIDADE', 1);

            let store = view.lookup('produtos').getStore();
            let qtdeCabecalho = grams(producao.get('PRODUCOES_QUANTIDADE'));
            let embalagemCabecalho = grams(produto['PRODUTOS_EMBALAGEM']);
            let multiploCabecalho = grams((produto['PRODUTOS_DESCRICAO'] || '').split('|')[2] || 1);

            producao.set({
                'PRODUCOES_ID_PRODUTOS': produto['PRODUTOS_ID'],
                'PRODUTOS_NOME'        : produto['PRODUTOS_NOME'],
                'PRODUTOS_UNIDADE'     : produto['PRODUTOS_UNIDADE'],
                'PRODUTOS_EMBALAGEM'   : embalagemCabecalho / 1000,
                'MULTIPLOS_PRODUTOS'   : multiploCabecalho / 1000
            });

            //limpa as fórmulas dos produtos anteriores
            store.removeAll();

            const queryFormula = await SamosUtils.Request.nodeApi({
                url: `/ordensproducaoformulas/${produto['PRODUTOS_ID']}`,
                method: 'GET'
            });

            if(queryFormula.results[0]['PRODUCOESFORMULAS_ITENS'].length == 0) {
                throw 'Produto sem fórmula';
            }

            const itens = queryFormula.results[0]['PRODUCOESFORMULAS_ITENS'].map((formula, index) => {
                const percentual = formula['FORMULASITENS_PERCENTUAL'] == 'T';
                const multiploItem = grams((formula['PRODUTOS_DESCRICAO'] || '').split('|')[2] || 1)

            const qtdeOriginal = configs.getClientName() === 'malacrida' ?
                                 formula['FORMULASITENS_QUANTIDADE']
                                 : grams(formula['FORMULASITENS_QUANTIDADE']);

            const qtde = percentual ? 
            Math.round(qtdeOriginal * qtdeCabecalho / 100 / 1000) / 1000 : 
            (qtdeOriginal * ((qtdeCabecalho / embalagemCabecalho) / (multiploCabecalho / multiploItem)));

                return {
                    'PRODUCOESITENS_ID'           : (index + 1) * -1,
                    'PRODUCOESITENS_ID_PRODUCOES' : producao.get('PRODUCOES_ID'),
                    'PRODUCOESITENS_ID_PRODUTOS'  : formula['FORMULASITENS_ID_PRODUTOS'],
                    'PRODUTOS_NOME'               : formula['PRODUTOS_NOME'],
                    'FORMULASITENS_QUANTIDADE'    : qtde,
                    'FORMULASITENS_PERCENTUAL'    : percentual,
                    'FORMULASITENS_CUSTO'         : formula['FORMULASITENS_CUSTO']
                }
            })

            store.setData(itens);
            this.aposAlterarQtdeCabecalho();
            view.stopGauge(true);

            await SamosUtils.Utils.sleep(500);
            view.lookup('lote').focus(true);

        } catch (error) {
            view.stopGauge();
            SamosUtils.Msg.error(error, 'Erro ao carregar fórmula');
        }
    },

    aposAlterarQtdeCabecalho: function(txt, nv) {
        if(txt && txt.readOnly) { return; }

        const gridProdutos  = this.lookup('produtos');
        const produtos      = gridProdutos.getStore().getData().items;

        let totalCabecalho = 0;

        produtos.forEach(produto => {
            const percentual    = produto.get('FORMULASITENS_PERCENTUAL');
            const custoProduto  = cents(produto.get('FORMULASITENS_CUSTO'));
            const isMalacrida = configs.getClientName() == 'malacrida';
            const multiplicador = isMalacrida ? 0.01 : 100000;

            let qtdeProducao    = 0;
            let custoProducao   = 0;
            let qtdeCabecalho =  toPrecision(nv || this.getRecord().get('PRODUCOES_QUANTIDADE'), 2);

            const qtdeFormula  = configs.getClientName() === 'malacrida' ? produto.get('FORMULASITENS_QUANTIDADE')
                                                                         : toPrecision(produto.get('FORMULASITENS_QUANTIDADE'), 4);

            if(percentual) {
                qtdeProducao  = ((qtdeFormula * qtdeCabecalho)/100);
                custoProducao = Math.round(qtdeCabecalho * custoProduto / 1000); //4 casas                
            } else {

                if(isMalacrida) {
                    qtdeProducao  = qtdeFormula * qtdeCabecalho / multiplicador; 
                } else { 
                    qtdeProducao  = Math.round(qtdeFormula * qtdeCabecalho / multiplicador)
                }

                custoProducao = Math.round(qtdeProducao * custoProduto / 100);
            }

            totalCabecalho += (custoProducao / 10000);

            produto.set({
                'PRODUCOESITENS_QUANTIDADE': qtdeProducao / 10000,
                'PRODUCOESITENS_CUSTO'     : custoProduto / 100,
                'VALOR_TOTAL'              : custoProducao / 10000,
            });
        });

        this.getRecord().set('VALOR_TOTAL', totalCabecalho);

        Ext.defer(() => gridProdutos.carregarDaStore(), 200);
    },

    onAlterarClick: function (btn, event) {
        const model   = this.getRecord();
        const id      = model.get('PRODUCOES_ID');
        const numero  = model.get('PRODUCOES_NUMERO');
        const serie   = model.get('PRODUCOES_SERIE');
        const empresa = model.get('PRODUCOES_ID_EMPRESAS');

        model.getProxy().setExtraParam('log', `PUT /ordens/${id} (${numero}|${serie}|${empresa})`);

        this.callParent(arguments);
    },

    cancelar: function() {
        const vm = this.getViewModel();
        const model = this.getRecord();
        const previousModel = this.getViewModel().get('previousModel');

        SamosUtils.Events.disableWarnReload();
        
        if (previousModel || (model && model.isNew && !model.isNew())) {
            if(previousModel) {
                vm.set('model', previousModel);
            } else {
                model.set(vm.get('initialValues'));
            }

            this.finalizarEdicao();
            this.setReadOnly(true);

            setTimeout(() => {
                this.lookup('sair').getEl().focus();
            }, 200);
            
        } else {
            this.onSairClick();
        }
    },

    onExcluirClick: function (btn, event) {
        const model = this.getRecord();

        const id      = model.get('PRODUCOES_ID');
        const numero  = model.get('PRODUCOES_NUMERO');
        const serie   = model.get('PRODUCOES_SERIE');
        const empresa = model.get('PRODUCOES_ID_EMPRESAS');

        Ext.Msg.confirmDelete(btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Excluindo...');
                this.colocarFilhosNoModel(model);

                model.getProxy().setExtraParam('log', `DELETE /ordens/${id} (${numero}|${serie}|${empresa})`);

                model.erase()
                    .then(() => {
                        this.getView().stopGauge();
                        this.getListView().down('grid').getStore().load();
                        Ext.Note('success', 'Registro excluído');
                        setTimeout(() => {
                            this.onSairClick();
                            this.getListView().down('toolbar').focus(true);
                        }, 500);
                    })
                    .catch(() => Ext.Note('error', 'Erro no servidor'))
                    .finally(() => this.getView().stopGauge())
            }
        });
    },

    onGravarClick: function (btn, event) {
        const movimento = this.getRecord();

        this.validarCabecalho()
            .then(() => {
                Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                    if (btn == 'yes') {
                        this.getView().initGauge('Gravando...');

                        this.colocarFilhosNoModel(movimento);

                        movimento.save()
                            .then(this.onGravacaoSucesso.bind(this))
                            .catch(this.onGravacaoFalha.bind(this))
                            .finally(this.aposGravar.bind(this));
                    }
                });
            });
    },

    onFecharClick: function(btn, e) {  
        this.getView().initGauge();

        setTimeout(() => {
            const form = this.getView();

            form.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());
    
            this.validarCabecalho()
                .then(() => {
                    this.finalizarEdicao();
                    this.getView().stopGauge(true);
                })
                .catch(e => {
                    console.error(e);
                    this.getView().stopGauge(true);
                });
        }, 100);
    },

    onOpcoesClick: Ext.emptyFn,

    onFinalizarClick: async function(btn, e) {
        const producao = this.getRecord();
        const finalizada = producao.get('PRODUCOES_FINALIZADA')

        const win = Ext.create({
            xtype: 'window',
            title: 'Data Finalização',
            autoShow: true,
            width: 200,
            heigth: 300,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            bodyPadding: 10,
            items: [
                {
                    xtype: 'datefield',
                    fieldLabel: 'Finalizada',
                    value: momentTz(finalizada).isSameOrBefore('1899-12-30') ?
                           momentServer().format('YYYY-MM-DD') : 
                           finalizada
                },
                {
                    xtype: 'container',
                    layout: {
                        type: 'hbox',
                        align: 'center',
                        pack: 'center'
                    },
                    items: [
                        {
                            xtype: 'button',
                            text: 'Gravar',
                            margin: '10 7 7 7',
                            ui: `primary-${configs.getTema()}`,
                            handler: gravar
                        },
                        {
                            xtype: 'button',
                            text: 'Cancelar',
                            margin: '10 7 7 0',
                            ui: `tertiary-${configs.getTema()}`,
                            handler: function() {
                                win.destroy();
                            }
                        }
                    ]
                }
            ]
        });

        async function gravar() {
            try {
                const producaoFinalizada = await SamosUtils.Request.nodeApi({
                    url: `/processos/ordensproducao/finalizar/${producao.get('PRODUCOES_ID')}`,
                    method: 'PUT',
                    data: {
                        finalizada: moment(win.down('datefield').getValue()).format('YYYY-MM-DD')
                    }
                });

                producao.set(producaoFinalizada);

                Ext.Note('success', 'Produção finalizada');

                win.destroy();
            } catch(error) {
                win.stopGauge(true);
                SamosUtils.Msg.error(error, 'Falha ao finalizar produção');
            }
        }
    },

    onReabrirClick: async function(btn, e) {
        const view = this.getView();
        
        try {
            const producao   = this.getRecord();
            const idProducao = producao.get('PRODUCOES_ID');

            if(await SamosUtils.Msg.confirm('Deseja realmente reabrir a produção?')) {
                view.initGauge();

                const producaoReaberta = await SamosUtils.Request.nodeApi({
                    url: `/processos/ordensproducao/reabrir/${idProducao}`,
                    method: 'PUT'
                });

                producao.set(producaoReaberta);

                Ext.Note('success', 'Produção reaberta');
            }    
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao reabrir produção');
        }

        view.stopGauge();
    },

    onCancelamentoClick: async function(btn, e) {
        const view = this.getView();
        
        try {
            const producao   = this.getRecord();
            const idProducao = producao.get('PRODUCOES_ID');

            if(await SamosUtils.Msg.confirm('Deseja realmente cancelar a produção?')) {
                view.initGauge();

                const producaoCancelada = await SamosUtils.Request.nodeApi({
                    url: `/processos/ordensproducao/cancelar/${idProducao}`,
                    method: 'PUT'
                });

                producao.set(producaoCancelada);

                Ext.Note('success', 'Produção cancelada');
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao cancelar produção');
        }

        view.stopGauge();
    },

    onImprimirClick: async function() {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const model = this.getRecord();

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/ordensproducao`,
                    method: 'GET',
                    query: {
                        id: model.get('PRODUCOES_ID'),
                        empresacnpj: configs.getEmpresa().cnpj
                    }
                });

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'tab',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    updateLog: function(txt, record) {
        const time   = momentServer().format('HH:mm:ss');
        const login  = configs.getUsuario().login;
        const result = login + ' ' + time;
        
        this.getRecord().set('PRODUCOES_LOG', result);
    
        const proximoFoco = this.lookup(txt.proximoFoco);
        Ext.defer(proximoFoco.focus, 200, proximoFoco);
    }
});