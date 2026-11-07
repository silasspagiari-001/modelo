Ext.define('SamosAdmin.movimentos.ordensveiculos.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formordensveiculos',

    mixins: {
        produtos: 'SamosAdmin.movimentos.ordensveiculos.form.mixins.Produtos',
        servicos: 'SamosAdmin.movimentos.ordensveiculos.form.mixins.Servicos'
    },
 
    onFotosClick: async function() {
        const view = this.getView(),
              vm   = this.getViewModel();

        const listFotos = new SamosAdmin.movimentos.ordensveiculos.fotos.View();
        listFotos.modelOrdensVeiculo = vm.get('model');
        listFotos.getController().onBuscarClick();
    },

    onNovoClick: async function () {
        try {
            const form = await this.callParent(arguments);
            const nomeDocumento = this.getListView().title;

            await Ordemveiculos.services.Model.definirValoresPadrao(form, nomeDocumento);
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

        model.getProxy().setExtraParam('log', `PUT /ordensveiculos/${id} (${numero}|${serie}|${empresa})`);

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

                model.getProxy().setExtraParam('log', `DELETE /ordensveiculos/${id} (${numero}|${serie}|${empresa})`);

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

        if(configs.getClientName() == 'prudenveiculos' && !this.validarPessoaOrdem()) {
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
            xtype: 'formordensveiculosbaixar'
        });

        view.ordemveiculos = this.getRecord()

        this.getView().add(view);
    },

    onImprimirClick: async function() {
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

    onExecutarClick: function (btn, event) {
        const ordemveiculo = this.getRecord();
        const id = ordemveiculo.get('ORDENS_ID');
        const valorServico = cents(ordemveiculo.get('ORDENS_TOTAL'));
    
        Ext.Msg.confirm('Confirmação', 'Deseja realmente executar?', btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Executando...');
                
                setTimeout(() => {
                    if(valorServico == 0){ 
                        ordemveiculo.set({
                            'ORDENS_STATUS': 'F'
                        });
                    } else {
                        ordemveiculo.set('ORDENS_STATUS', 'E');
                    }

                    ordemveiculo.save()
                        .then(ordemveiculo => {
                            SamosUtils.Request.nodeApi({
                                url: `/relatorios/${configs.getClientName()}/ordens`,
                                method: 'GET',
                                query: {
                                    id       : id,
                                    empresa  : configs.getEmpresa(),
                                    documento: ordemveiculo.get('ORDENS_ID_DOCUMENTOS'),
                                    numero   : ordemveiculo.get('ORDENS_NUMERO'),
                                    start    : 0,
                                    limit    : 1                
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

    calcularDescontoPercentual: function(txt) {
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

        const descontoPercentual = cents(txt.value);

        if(descontoPercentual > 0) {
            descontoDinheiro = (((somaTotalBrutoProdutos + somaTotalBrutoServicos) * descontoPercentual) / 10000)
        } else {
            descontoDinheiro = 0;
        }           
        
        const totalDescontos = descontoDinheiro;

        movimento.set({
            'ORDENS_DESCONTOS'       : totalDescontos / 100,
            'ORDENS_TOTAL'           : (somaTotalBrutoProdutos + somaTotalBrutoServicos - totalDescontos) / 100,
        });
    },

    calcularDescontoDinheiro: function(txt) {
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

        const descontoDinheiro = cents(txt.value);

        if(descontoDinheiro > 0) {
            descontoPercentual = ((descontoDinheiro / (somaTotalBrutoProdutos + somaTotalBrutoServicos)) * 100)
        } else {
            descontoPercentual = 0;
        }           

        const totalDescontos = descontoDinheiro;

        movimento.set({
            'DESCONTO_PERCENTUAL' : descontoPercentual,
            'ORDENS_TOTAL'        : (somaTotalBrutoProdutos + somaTotalBrutoServicos - totalDescontos) / 100,
        });
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

        const totalDescontos = cents(movimento.get('ORDENS_DESCONTOS'));

        movimento.set({
            'ORDENS_PRODUTOS'        : somaTotalBrutoProdutos / 100,
            'ORDENS_SERVICOS'        : somaTotalBrutoServicos / 100,
            'ORDENS_TOTAL'           : (somaTotalBrutoProdutos + somaTotalBrutoServicos - totalDescontos) / 100,
            'CONTAGEM_ITENSPRODUTOS' : this.lookup('produtos').getStore().data.items.length,
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
        Ordemveiculos.services.Documento.iniciarOSConsumidor(this.getView());
        Ext.defer(txt.focus, 100, txt, [true]);
    },

    onPessoasCloseClick: function(txt) {
        Ordemveiculos.services.Documento.cancelarOSConsumidor(this.getView());
        Ext.defer(txt.focus, 100, txt, [true]);
    },

    onPessoasChange: function(){
        Ordemveiculos.services.Documento.checkOSConsumidor(this.getView());
    }

});