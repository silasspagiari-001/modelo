Ext.define('SamosAdmin.movimentos.ordenssky.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formordenssky',

    mixins: {
        produtos: 'SamosAdmin.movimentos.ordenssky.form.mixins.Produtos',
        servicos: 'SamosAdmin.movimentos.ordenssky.form.mixins.Servicos'
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

        model.getProxy().setExtraParam('log', `PUT /ordenssky/ordem/${id} (${numero}|${serie}|${empresa})`);

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

                model.getProxy().setExtraParam('log', `DELETE /ordenssky/ordem/${id} (${numero}|${serie}|${empresa})`);

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

    onImprimirClick: async function() {
        const view  = this.getView();
        const model = this.getRecord();

        try {
            if(!model.get('DOCUMENTOS_LAYOUT')) {
                throw 'Informe o layout de impressão em Documentos > Layout';
            }

            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');
    
                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/${model.get('DOCUMENTOS_LAYOUT')}`,
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
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }
    
        view.stopGauge();
    },

    onLocalizacaoClick: function() {
        Ext.Note('warning', 'Em desenvolvimento');
    },

    onAgendamentoClick: function() {
        const ordem     = this.getRecord();
        const status    = ordem.get('ORDENS_STATUS');
        const avariados = ordem.get('ORDENS_AVARIADOS') || [];
        
        if(avariados.length == 0) {
            Ext.Note('warning', 'Adicione pelo menos um serviço a executar');
            return;
        }

        const diasSemana = {
            0: 'Segunda',
            1: 'Terça',
            2: 'Quarta',
            3: 'Quinta',
            4: 'Sexta',
            5: 'Sábado'
        };

        const observacoes = ordem.get('ORDENS_OBSERVACOES');
        const linhasObs   = (observacoes || '').split('|');
        const contato     = (linhasObs.find(linha => (linha || '').match(/Contato:\s/))    || '').replace(/Contato:\s/,    '');
        const celular     = (linhasObs.find(linha => (linha || '').match(/Celular:\s/))    || '').replace(/Celular:\s/,    '');
        const referencia  = (linhasObs.find(linha => (linha || '').match(/Referência:\s/)) || '').replace(/Referência:\s/, '');
        const obsAgenda   = (linhasObs.find(linha => (linha || '').match(/Obs:\s/))        || '').replace(/Obs:\s/, '');

        const view = Ext.create({
            xtype: 'ordensskyformagendamento'
        });

        view.getViewModel().set({
            'ordem': ordem,
            'isAberta': status == 2,
            'agendamento': {
                'ORDENS_STATUS'               : status,
                'ORDENS_ID_USUARIOS'          : ordem.get('ORDENS_ID_USUARIOS'),
                'ORDENS_ID_ORDENSROTAS'       : ordem.get('ORDENS_ID_ORDENSROTAS'),
                'DIA_SEMANA'                  : diasSemana[momentTz(avariados[0]['ORDENSAVARIADOS_AGENDADA']).day()],
                'ORDENSROTAS_NOME'            : ordem.get('ORDENSROTAS_NOME'),
                'USUARIOS_NOME'               : ordem.get('USUARIOS_NOME'),
                'referencia'                  : referencia,
                'contato'                     : contato,
                'celular'                     : celular,
                'observacoes'                 : obsAgenda,
                'ORDENSAVARIADOS_SITUACAO'    : avariados[0]['ORDENSAVARIADOS_SITUACAO'] == 'T',
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

    updateLog: function(txt, record) {
        const time = momentServer().format('HH:mm:ss');
        const login = configs.getUsuario().login;
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
            'ORDENS_PRODUTOS' : somaTotalBrutoProdutos / 100,
            'ORDENS_SERVICOS' : somaTotalBrutoServicos / 100,
            'ORDENS_TOTAL'    : (somaTotalBrutoProdutos + somaTotalBrutoServicos) / 100
        });
    },

    preencherReferencia: function(txt) {
        txt.on('focusenter', () => {
            if(txt.readOnly || txt.getValue()) { return; }
    
            const numeroOS = parseInt(this.getRecord().get('ORDENS_NUMERO'));
            const forms = txt.up('samoswidgets-griditems').query('form');
            const itemsOrdenados = forms.map(form => {
                return form.down('field[reference*="referencia"]').getValue();
            })
            .sort((refA, refB) => {
                const numA = isNaN(parseInt(refA)) ? 0 : parseInt(refA);
                const numB = isNaN(parseInt(refB)) ? 0 : parseInt(refB);
                return numB - numA;
            });
    
            const maiorNumeroItens = parseInt(itemsOrdenados[0]) || 0;
            const proximoNumero = (maiorNumeroItens >= numeroOS ? maiorNumeroItens + 1 : numeroOS);
    
            txt.setValue(isNaN(proximoNumero) ? '' : proximoNumero);
        });
    }
});