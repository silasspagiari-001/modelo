Ext.define('SamosAdmin.movimentos.ordensmoveis.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formordensmoveis',

    mixins: {
        produtos: 'SamosAdmin.movimentos.ordensmoveis.form.mixins.Produtos',
        servicos: 'SamosAdmin.movimentos.ordensmoveis.form.mixins.Servicos'
    },

    onNovoClick: async function () {
        try {
            const form = await this.callParent(arguments);
            const nomeDocumento = this.getListView().title;

            if(configs.getClientName() == 'prudenmoveis' && !configs.getUsuario().privilegiado) { // Na pruden checa sempre se o caixa está aberto, em qualquer movimento
                this.getView().initGauge('Verificando caixa diário...');
        
                const data = momentServer().format('YYYY-MM-DD');
                const statusCaixa = await Caixa.services.Model.getStatus(data);
        
                this.getView().stopGauge(true);
        
                if(statusCaixa == 'F') {
                    Ext.Note('warning', 'O caixa diário está fechado!');
                    return;
                } else if(!statusCaixa) {
                    Ext.Note('warning', 'O caixa diário não foi aberto!');                    
                    return;
                }
            }

            await Ordemmoveis.services.Model.definirValoresPadrao(form, nomeDocumento);
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

        model.getProxy().setExtraParam('log', `PUT /ordensmoveis/${id} (${numero}|${serie}|${empresa})`);

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

                model.getProxy().setExtraParam('log', `DELETE /ordensmoveis/${id} (${numero}|${serie}|${empresa})`);

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

        if(configs.getClientName() == 'prudenmoveis' && !this.validarPessoaOrdem()) {
            Ext.Note('warning', 'Tipo de Pessoa inválido - Corrigir Código Pessoa');
        } else {
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
            }
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

    onBaixarClick: function(btn, e) {
        const view = Ext.create({ 
            xtype: 'formordensmoveisbaixar'
        });

        view.ordemmoveis = this.getRecord()

        this.getView().add(view);
    },

    onOrdemClick: async function() {
        const view  = this.getView();
        const model = this.getRecord();

        if(configs.getMovimentos().senhaImpressao && model.get('ORDENS_ID_ORDENSROTAS') == 1) {
            const nivel = 3;
            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)
        }
        
        try {
            delete this.permiteImpressao;
            
            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/ordensmoveis`,
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
                model.set({ 'ORDENS_ID_ORDENSROTAS': 1 });
                await model.save();
                Ext.Note('success', 'Log de impressão salvo com sucesso!');                            
            }                                    
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    onReativarClick: function (btn, event) {
        const ordem = this.getRecord();
    
        Ext.Msg.confirm('Confirmação', 'Deseja realmente reativar?', btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Reativando...');
                
                setTimeout(() => {
                    ordem.set('ORDENS_STATUS', 'N');
                    ordem.save()
                    .then(res => {Ext.Note('success', 'Ordem de serviço reativada com sucesso!');})
                    .catch(this.onGravacaoFalha.bind(this))
                    .finally(this.aposGravar.bind(this));
                }, 200);
            }
        });
    },

    onSolicitacaoClick: async function() {
        const view  = this.getView();
        const model = this.getRecord();

        if(configs.getMovimentos().senhaImpressao && model.get('ORDENS_IDSKY') > 0) {
            const nivel = 3;
            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)
        }
        
        try {
            delete this.permiteImpressao;
            
            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/comprovanteordemmoveis`,
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
                model.set({ 'ORDENS_IDSKY': 1 });
                await model.save(); 
                Ext.Note('success', 'Log de impressão salvo com sucesso!');                            
            }                                    
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    onExecutarClick: function (btn, event) {
        const ordemmoveis = this.getRecord();
        const id = ordemmoveis.get('ORDENS_ID');
        const valorServico = cents(ordemmoveis.get('ORDENS_TOTAL'));
    
        Ext.Msg.confirm('Confirmação', 'Deseja realmente executar?', btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Executando...');
                
                setTimeout(() => {
                    if(valorServico == 0){ 
                        ordemmoveis.set({
                            'ORDENS_STATUS': 'F'
                        });
                    } else {
                        ordemmoveis.set('ORDENS_STATUS', 'E');
                    }

                    ordemmoveis.save()
                        .then(ordemmoveis => {
                            SamosUtils.Request.nodeApi({
                                url: `/relatorios/${configs.getClientName()}/comprovanteordemmoveisexecutado`,
                                method: 'GET',
                                query: {
                                    id: id,
                                    nomedocumento: ordemmoveis.get('DOCUMENTOS_NOME')
                                }
                            })
                            .done(res => {
                                setTimeout(() => {
                                    SamosUtils.Pdf.exibir({
                                        local: 'window',
                                        caminho: res.results[0]['name'], 
                                        serverType: 'nodejs'
                                    });
                                    setTimeout(() => {
                                        Ext.Note('success', 'Ordem de serviço executada com sucesso');
                                    }, 100);
                                }, 300);
                            })
                            .fail(err => {
                                Ext.Note('error', 'Erro no servidor');
                                console.error(err);
                            })
                        })
                        .catch(this.onGravacaoFalha.bind(this))
                        .finally(this.aposGravar.bind(this));
                }, 200);
            }
        });
    },

    onAgendamentoClick: function() {
        const ordem       = this.getRecord();
        const avariados   = ordem.get('ORDENS_AVARIADOS') || [];
        
        if(avariados.length == 0) {
            Ext.Note('warning', 'Adicione pelo menos um serviço a executar');
            return;
        }

        const observacoes = ordem.get('ORDENS_OBSERVACOES');
        const linhasObs   = (observacoes || '').split('|');
        const contato     = (linhasObs.find(linha => (linha || '').match(/Contato:\s/))    || '').replace(/Contato:\s/,    '');
        const celular     = (linhasObs.find(linha => (linha || '').match(/Celular:\s/))    || '').replace(/Celular:\s/,    '');
        const referencia  = (linhasObs.find(linha => (linha || '').match(/Referência:\s/)) || '').replace(/Referência:\s/, '');

        const view = Ext.create({
            xtype: 'ordensformagendamento'
        });

        view.getViewModel().set({
            'ordem': ordem,
            'agendamento': {
                'ORDENS_STATUS'               : ordem.get('ORDENS_STATUS'),
                'ORDENS_ID_USUARIOS'          : ordem.get('ORDENS_ID_USUARIOS'),
                'USUARIOS_NOME'               : ordem.get('USUARIOS_NOME'),
                'referencia'                  : referencia,
                'contato'                     : contato,
                'celular'                     : celular,
                'observacoes'                 : '',
                'ORDENSAVARIADOS_SITUACAO'    : avariados[0]['ORDENSAVARIADOS_SITUACAO'],
                'ORDENSAVARIADOS_AGENDADA'    : avariados[0]['ORDENSAVARIADOS_AGENDADA'],
                'ORDENSAVARIADOS_HORAAGENDADA': avariados[0]['ORDENSAVARIADOS_HORAAGENDADA'],
                'ORDENSAVARIADOS_EXECUCAO'    : avariados[0]['ORDENSAVARIADOS_EXECUCAO'],
                'ORDENSAVARIADOS_HORAEXECUCAO': avariados[0]['ORDENSAVARIADOS_HORAEXECUCAO']
            }
        });

        view.focus(true);

        view.lookup('usuario').setSearchedId(ordem.get('USUARIOS_NOME'));

        this.getView().add(view);
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
    },

    validarPessoaOrdem: function() {
        const ordem = this.getRecord();

        if(ordem.get('MONTADORES_TIPO') != 'M' && ordem.get('MONTADORES_TIPO') != 'F') {
            return false;
        }

        if(ordem.get('PESSOAS_TIPO') != 'A' && ordem.get('PESSOAS_TIPO') != 'U') {
            return false;
        }

        return true;

    }

});