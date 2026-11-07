Ext.define('SamosAdmin.movimentos.ordenseleve.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formordenseleve',

    mixins: {
        servicos: 'SamosAdmin.movimentos.ordenseleve.form.mixins.Servicos'
    },
 
    onFotosClick: async function() {
        const view = this.getView(),
              vm   = this.getViewModel();

        const listFotos = new SamosAdmin.movimentos.ordenseleve.fotos.View();
        listFotos.modelOrdensVeiculo = vm.get('model');
        listFotos.getController().onBuscarClick();
    },

    onNovoClick: async function () {
        try {
            const form = await this.callParent(arguments);
            const nomeDocumento = this.getListView().title;

            await Ordemeleve.services.Model.definirValoresPadrao(form, nomeDocumento);
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

        model.getProxy().setExtraParam('log', `PUT /ordenseleve/${id} (${numero}|${serie}|${empresa})`);

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
                model.getProxy().setExtraParams({
                    log: `DELETE /ordenseleve/${id} (${numero}|${serie}|${empresa})`,
                    numeroos: numero,
                    serieos: serie
                });
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
                Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', async btn => {
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

            const stServicos = this.lookup('servicos').getStore(); 

//          this.checarAgenda(stServicos);
    
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
            xtype: 'formordenselevebaixar'
        });

        view.ordemeleve = this.getRecord()

        this.getView().add(view);
    },

    onImprimirClick: async function() {
        const view  = this.getView();
        const model = this.getRecord();
        
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
                
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    onEspelhoNFSeClick: async function() {
        const view  = this.getView();
        const model = this.getRecord();
        
        try {
            
            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/espelhonfse`,
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
    
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    onReativarClick: function (btn, event) {
        const ordem = this.getRecord();
    
        Ext.Msg.confirm('Confirmação', 'Deseja realmente reativar?', async btn => {
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

    onFinalizarClick: function (btn, event) {
        const ordemeleve = this.getRecord();
        const id = ordemeleve.get('ORDENS_ID');
        const valorServico = cents(ordemeleve.get('ORDENS_TOTAL'));

        if(valorServico == 0) {
            Ext.Note('warning', 'Não há valores de serviços a finalizar');
            return;
        }
        

        Ext.Msg.confirm('Confirmação', 'Deseja realmente finalizar?', btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Finalizando...');
                
                setTimeout(() => {
                    if(valorServico == 0){ 
                        ordemeleve.set({
                            'ORDENS_STATUS': 'E'
                        });
                    } else {
                        ordemeleve.set('ORDENS_STATUS', 'E');
                    }

                    ordemeleve.save()
                        .then(this.onGravacaoSucesso.bind(this))
                        .catch(this.onGravacaoFalha.bind(this))
                        .finally(this.aposGravar.bind(this)); 
                }, 200);
            }
        });
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

    calcularDescontoPercentual: function(txt) {
        const movimento = this.getRecord();
        const vm = this.getViewModel();
        const servicos = vm.getStore('servicos').data.items;

        this.iniciarEdicao();
                        
        const somaTotalBrutoServicos = servicos.reduce((total, servico) => {
            return total + cents(servico.get('ORDENSSERVICOS_TOTAL'));
        }, 0);

        const descontoPercentual = cents(txt.value);

        if(descontoPercentual > 0) {
            descontoDinheiro = ((somaTotalBrutoServicos * descontoPercentual) / 10000)
        } else {
            descontoDinheiro = 0;
        }           
        
        const totalDescontos = descontoDinheiro;

        movimento.set({
            'ORDENS_DESCONTOS'       : totalDescontos / 100,
            'ORDENS_TOTAL'           : (somaTotalBrutoServicos - totalDescontos) / 100,
        });
    },

    calcularDescontoDinheiro: function(txt) {
        const movimento = this.getRecord();
        const vm = this.getViewModel();
        const servicos = vm.getStore('servicos').data.items;

        this.iniciarEdicao();
                       
        const somaTotalBrutoServicos = servicos.reduce((total, servico) => {
            return total + cents(servico.get('ORDENSSERVICOS_TOTAL'));
        }, 0);

        const descontoDinheiro = cents(txt.value);

        if(descontoDinheiro > 0) {
            descontoPercentual = ((descontoDinheiro / somaTotalBrutoServicos) * 100)
        } else {
            descontoPercentual = 0;
        }           

        const totalDescontos = descontoDinheiro;

        movimento.set({
            'DESCONTO_PERCENTUAL' : descontoPercentual,
            'ORDENS_TOTAL'        : (somaTotalBrutoServicos - totalDescontos) / 100,
        });
    },


    fazerSomasERateios: function(txt) {
        const movimento = this.getRecord();
        const vm = this.getViewModel();
        const servicos = vm.getStore('servicos').data.items;

        this.iniciarEdicao();
            
        const somaTotalBrutoServicos = servicos.reduce((total, servico) => {
            return total + cents(servico.get('ORDENSSERVICOS_TOTAL'));
        }, 0);

        const totalDescontos = cents(movimento.get('ORDENS_DESCONTOS'));

        movimento.set({
            'ORDENS_SERVICOS'        : somaTotalBrutoServicos / 100,
            'ORDENS_TOTAL'           : (somaTotalBrutoServicos - totalDescontos) / 100,
            'CONTAGEM_ITENSSERVICOS' : this.lookup('servicos').getStore().data.items.length
        });
    },

    onOrdemClick: async function() {
        const view = this.getView();
        const model = this.getRecord();
        
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

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }
    
        view.stopGauge();
    },

    onPessoasEditClick: function(txt) {
        Ordemeleve.services.Documento.iniciarOSConsumidor(this.getView());
        Ext.defer(txt.focus, 100, txt, [true]);
    },

    onPessoasCloseClick: function(txt) {
        Ordemeleve.services.Documento.cancelarOSConsumidor(this.getView());
        Ext.defer(txt.focus, 100, txt, [true]);
    },

    onPessoasChange: function(){
        Ordemeleve.services.Documento.checkOSConsumidor(this.getView());
    },

    validarHoraLocal: async function(txt, event) {

        const view = this.getView();
        const servico  = txt.up('form').getForm().getValues();
        view.initGauge();

        const queryHorarios = await SamosUtils.Request.nodeApi({
            url: `/consultas/agendaveiculo`,
            method: 'GET',
            query: {
                empresa         : configs.getEmpresa().id,
                veiculo         : servico['ORDENSSERVICOS_ID_SERVICOS'],
                agendado        : servico['ITEM_DATA']
            }
        });

        view.stopGauge();

        if(txt.readOnly) { return; }

        return;
    },

    checarAgenda: async function(storeServicos) {

        const itemChecar = storeServicos.data.items[0];
        const veiculoId  = itemChecar.get('ORDENSSERVICOS_ID_SERVICOS');
        const dataChecar = itemChecar.get('ITEM_DATA');

        const agendaVeiculo = await SamosUtils.Request.nodeApi({
            url: `/consultas/agendaveiculo`,
            method: 'GET',
            query: {
                empresa: configs.getEmpresa().id,
                veiculo : veiculoId,
                agendado : dataChecar
            }
        });

        if((agendaVeiculo.results || []).length > 0) {
            let strAgendados = '';
            let modelAgenda = agendaVeiculo.results;
            for(let i in modelAgenda) {
                strAgendados += `${moment(modelAgenda[i]['DATA_AGENDADA']).format('DD/MM/YYYY')} ${modelAgenda[i]['HORA_AGENDADA']} - ${modelAgenda[i]['ORDENS_NOME']} \n`;
            }
            Ext.Msg.alert('Atenção', `Agendamentos no dia:\n${strAgendados}`);
        }

        return;
    },


});