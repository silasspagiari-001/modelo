Ext.define('SamosAdmin.movimentos.ordens.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formordens',

    mixins: {
        produtos: 'SamosAdmin.movimentos.ordens.form.mixins.Produtos',
        servicos: 'SamosAdmin.movimentos.ordens.form.mixins.Servicos'
    },
    
    onNovoClick: async function () {
        try {
            const form = await this.callParent(arguments);
            const nomeDocumento = this.getListView().title;
            await Ordem.services.Model.definirValoresPadrao(form, nomeDocumento);
            return form;
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falhar ao criar novo documento');
        }
    },

    onAlterarClick: function (btn, event) {
        const model   = this.getRecord();
        const id      = model.get('ORDENS_ID');
        const numero  = model.get('ORDENS_NUMERO');
        const serie   = model.get('ORDENS_SERIE');
        const empresa = model.get('ORDENS_ID_EMPRESAS');

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

        const id      = model.get('ORDENS_ID');
        const numero  = model.get('ORDENS_NUMERO');
        const serie   = model.get('ORDENS_SERIE');
        const empresa = model.get('ORDENS_ID_EMPRESAS');

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
                    this.lookup('observacoes').focus(true);
                    this.finalizarEdicao();
                    this.getView().stopGauge(true);
                })
                .catch(e => {
                    console.error(e);
                    this.getView().stopGauge(true);
                });
        }, 100);
    },

    onReativarClick: async function(btn, e) {
        const view = this.getView();

        try {
            const ordem = this.getRecord();
            const id = ordem.get('ORDENS_ID_ORDENSROTAS');// ID do MOVIMENTOS vinculado à OS
            const emissao = momentTz(ordem.get('ORDENS_EMISSAO')).format('YYYY-MM-DD');
    
            if(momentTz(emissao).isBefore('2021-04-01')) {
                throw 'OS anterior a 01.04.2021 - Contate suporte';
            }

            if(await SamosUtils.Msg.confirm('Deseja realmente reativar?')) {
                view.initGauge('Reativando...');

                await SamosUtils.Utils.sleep(300);
                
                if(configs.getClientName().match(/prudente|turbotec/) /*turbotec*/) {
                    //apaga a requisição associada
                    if(parseInt(id) > 0) {
                        try {
                            await SamosUtils.Request.nodeApi({
                                url: `/movimentos/${id}`,
                                method: 'DELETE',
                            });            
                        } catch(error) {
                            throw 'Não foi possível remover Requisição - Verifique';
                        }    
                    }
                } 

                ordem.set({
                    'ORDENS_STATUS': 'N',
                    'ORDENS_REABERTURA': '1899-12-30',
                    'ORDENS_LOG': SamosUtils.Info.getLog()
                });

                await ordem.save();

                await SamosUtils.Utils.sleep(300);

                Ext.Note('success', 'Ordem de serviço reativada com sucesso');
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao reativar ordem de serviço');
        }

        view.stopGauge();
    },

    onImprimirClick: Ext.emptyFn,
    onOpcoesClick  : Ext.emptyFn,

    onServicosClick: async function(impressora, layout) {

        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const etiqueta = this.getViewModel().get('model');                
/*                let impLayout = impressora.toUpperCase() == 'VISUALIZAR' ? '' : impressora;

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/etiquetaOS${impLayout}`,
                    method: 'GET',
                    query: {
                        id     : etiqueta.get('ORDENS_ID'),
                        layout : layout
                    }
                });
*/
                SamosUtils.Request.nodeApi({
                    url: `/processos/movimentosredis`,
                    method: 'POST',
                    data: {
                        'MOVIMENTOSREDIS_ID'         : etiqueta.get('ORDENS_ID'),
                        'MOVIMENTOSREDIS_TABELA'     : 'ORDENS', 
                        'MOVIMENTOSREDIS_IMPRESSORA' : impressora,
                        'MOVIMENTOSREDIS_LAYOUT'     : layout,
                        'MOVIMENTOSREDIS_PAGINAS'    : 1,
                        'MOVIMENTOSREDIS_PARAMETROS' : 'SERVICOS'
                    }
                });

                Ext.Note('success', 'Enviado para impressora');
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    onOrdemClick: async function() {
        const view = this.getView();
        const model = this.getRecord();

        if(configs.getMovimentos().senhaImpressao && model.get('ORDENS_IMPORTADA') == 'T') {
            const nivel = 3;
            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel);
        }
        
        try {
            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/ordens`,
                method: 'GET',
                query: {
                    id       : model.get('ORDENS_ID'),
                    empresa  : configs.getEmpresa(),
                    documento: model.get('ORDENS_ID_DOCUMENTOS'),
                    numero   : model.get('ORDENS_NUMERO'),
                    start    : 0,
                    limit    : 1
                }
            });

            await SamosUtils.Utils.sleep(500);

            SamosUtils.Pdf.exibir({
                local: 'tab',
                caminho: queryPDF.results[0]['name'], 
                serverType: 'nodejs'
            });

            if(configs.getMovimentos().senhaImpressao){
                model.set({ 'ORDENS_IMPORTADA': 'T' });
                await model.save(); 
                Ext.Note('success', 'Log de impressão salvo com sucesso!');                      
            } 

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }
    
        view.stopGauge();
    },

    onEspelhoClick: async function() {
        const view  = this.getView();
        const model = this.getRecord();

        if(configs.getMovimentos().senhaImpressao && model.get('ORDENS_IMPORTADA') == 'T') {
            const nivel = 3;
            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)
        }
        
        try {
            delete this.permiteImpressao;
            
            view.initGauge('Gerando impressão...');
    
            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/espelho`,
                method: 'GET',
                query: {
                    id       : model.get('ORDENS_ID'),
                    empresa  : configs.getEmpresa(),
                    documento: model.get('ORDENS_ID_DOCUMENTOS'),
                    numero   : model.get('ORDENS_NUMERO'),
                    start    : 0,
                    limit    : 1
                }
            });

            await SamosUtils.Utils.sleep(500);

            SamosUtils.Pdf.exibir({
                local: 'tab',
                caminho: queryPDF.results[0]['name'], 
                serverType: 'nodejs'
            });

            if(configs.getMovimentos().senhaImpressao){
                model.set({ 'ORDENS_IMPORTADA': 'T' });
                await model.save();  
                Ext.Note('success', 'Log de impressão salvo com sucesso!');                            
            }    

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }
        
        view.stopGauge();
    },

    onGarantiaClick: async function() {
        const view = this.getView();

        try {
            const model = this.getRecord();

            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/garantia`,
                method: 'GET',
                query: {
                    id       : model.get('ORDENS_ID'),
                    empresa  : configs.getEmpresa(),
                    documento: model.get('ORDENS_ID_DOCUMENTOS'),
                    numero   : model.get('ORDENS_NUMERO'),
                    start    : 0,
                    limit    : 1
                }
            });

            await SamosUtils.Utils.sleep(500);

            SamosUtils.Pdf.exibir({
                local: 'tab',
                caminho: queryPDF.results[0]['name'], 
                serverType: 'nodejs'
            });

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }
    
        view.stopGauge();
    },

    onFinalizarClick: async function (btn, event) {
        const view = this.getView();

        try {
            const ordem = this.getRecord();

            if(await SamosUtils.Msg.confirm('Deseja realmente finalizar?')) {
                view.initGauge('Finalizando...');
                
                await SamosUtils.Utils.sleep(200);

                if(configs.getClientName().match(/prudente|turbotec/)/*turbotec*/)  {
                    try {
                        const queryFinalizar = await SamosUtils.Request.nodeApi({
                            url: `/processos/exportaordemservico`,
                            method: 'POST',
                            query: {
                                idOrdem: ordem.get('ORDENS_ID'),
                                empresa: configs.getEmpresa().id
                            }
                        });  
                        
                        ordem.set(queryFinalizar.results);
                    } catch(error) {
                        throw 'Não foi possível gerar Requisição - Verifique';
                    }
                
                } else {
                    ordem.set({ 'ORDENS_STATUS': 'E' });
                    await ordem.save();
                }

                Ext.Note('success', 'Ordem de serviço finalizada com sucesso');
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao finalizada ordem de serviço');
        }

        view.stopGauge();
    },

    onSairClick: function (btn, e) {
        if(this.getListView()) {
            this.getListView().getController( ).onBuscarClick();
        }
        this.getView().destroy();
    },

    updateLog: function(txt, record) {
        const time   = momentServer().format('HH:mm:ss');
        const login  = configs.getUsuario().login;
        const result = login + ' ' + time;
        
        this.getRecord().set('ORDENS_LOG', result);
    
        const proximoFoco = this.lookup(txt.proximoFoco);
        Ext.defer(proximoFoco.focus, 200, proximoFoco);
    },

    aposBuscarPessoa: async function(txt, record) {
        const txtUsuario = this.lookup('usuario');
        const txtCep = this.lookup('cep');
        const txtCidade = this.lookup('cidade');

        txtCep.setSearchedId(record.get('PESSOAS_CEP'));
        txtCidade.setSearchedId(record.get('CIDADES_NOME'));
        txtUsuario.focus(true);
    },

    fazerSomasERateios: function(txt) {
        const movimento = this.getRecord();
        const vm = this.getViewModel();
        const produtos = vm.getStore('produtos').data.items;
        const servicos = vm.getStore('servicos').data.items;

        this.iniciarEdicao();
            
        const somaTotalBrutoProdutos = produtos.reduce((total, produto) => {
            return total + cents(produto.get('ORDENSPRODUTOS_TOTAL'));
        }, 0);
            
        const somaTotalBrutoServicos = servicos.reduce((total, servico) => {
            return total + cents(servico.get('ORDENSSERVICOS_TOTAL'));
        }, 0);

        movimento.set({
            'ORDENS_PRODUTOS'        : somaTotalBrutoProdutos / 100,
            'ORDENS_SERVICOS'        : somaTotalBrutoServicos / 100,
            'ORDENS_TOTAL'           : (somaTotalBrutoProdutos + somaTotalBrutoServicos) / 100,
            'CONTAGEM_ITENSPRODUTOS' : this.lookup('produtos').getStore().data.items.length,
            'CONTAGEM_ITENSSERVICOS' : this.lookup('servicos').getStore().data.items.length
        });
    }
});