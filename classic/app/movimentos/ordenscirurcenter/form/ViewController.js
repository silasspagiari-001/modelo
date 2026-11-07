Ext.define('SamosAdmin.movimentos.ordenscirurcenter.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formordenscirurcenter',

    mixins: {
        produtos: 'SamosAdmin.movimentos.ordenscirurcenter.form.mixins.Produtos',
        servicos: 'SamosAdmin.movimentos.ordenscirurcenter.form.mixins.Servicos'
    },
    
    onAfterConstructor: async function(){
        //Contorna o problema do botao pagamento nao aparecer, usa o o botao Pagar com o texto Pagamento
        Ext.$('formordenscirurcenter')[0].down('button[text="Pagar"]').setText('Pagamento');
    },

    onNovoClick: async function () {
        try {
            const form = await this.callParent(arguments);
            const nomeDocumento = 'Ordem Serviço';
            await Ordemcirurcenter.services.Model.definirValoresPadrao(form, nomeDocumento);
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

        model.getProxy().setExtraParam('log', `PUT /ordenscirurcenter/${id} (${numero}|${serie}|${empresa})`);

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

                model.getProxy().setExtraParam('log', `DELETE /ordenscirurcenter/${id} (${numero}|${serie}|${empresa})`);

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

    /*
    onPagamentoClick: function (btn, e) {
        Ordemcirurcenter.services.Caixa.criarJanelaPagar();
    },*/

    onPagarClick: function(){
        Ordemcirurcenter.services.Caixa.criarJanelaReceber();
    },

    onGravarClick: function (btn, event) {
        const movimento = this.getRecord();

        this.validarCabecalho()
            .then(() => {
                Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                    if (btn == 'yes') {
                        const obs = movimento.get('ORDENS_OBSERVACOES') || '';
                        this.getView().initGauge('Gravando...');

                        this.colocarFilhosNoModel(movimento);

                         movimento.set({'ORDENS_OBSERVACOES': obs + '|' + momentTz(movimento.get('ORDENS_REABERTURA')).format('DD/MM/YYYY') + 
                               ' A ' + momentTz(movimento.get('ORDENS_FECHAMENTO')).format('DD/MM/YYYY') 
                              });
                        
                        movimento.save()
                            .then(this.onGravacaoSucesso.bind(this))
                            .catch(this.onGravacaoFalha.bind(this))
                            .finally(this.aposGravar.bind(this));


                    }
                });
            });
    },

    onGravacaoSucesso: function (record) {
        Ext.Note('success', 'Gravado com sucesso');
        this.finalizarEdicao();
        Ext.defer(this.getViewModel().set, 600, this.getViewModel(), ['forceChangeId', Math.random()]);

        this.getViewModel().set('initialValues', Object.assign({}, record.data));
        record.store = true;//para mostrar que ja esta gravado
        
        //Gera o financeiro caso a operação for gerar financeiro
        setTimeout( async() => {
            this.setReadOnly(true);

            //Solicita o pagamento
            const consultaValorRestante = await SamosUtils.Request.nodeApi({
                url: `/processos/executasql`,
                method: 'GET',
                query: {
                    nomeSql: 'verifica_valorrestante_ordem',
                    parametroSql: record.get('ORDENS_ID')     
                }
            }); 
    
            let valorRestanteSQL = 0;
    
            if(consultaValorRestante.results.length > 0) {
                valorRestanteSQL = cents(consultaValorRestante.results[0].VALORRESTANTE);
            }
            
            const valorMovimento   = cents(record.get('ORDENS_TOTAL'));
    
            //Se for um nova nota eletronica, Pede pro usuario colocar a forma de pagamento
            //Caso a variavel movimentosOriginais nao exista, ele ignora essa condicao, abrindo o caixa
            const geraNovoCaixa = record.get('OPERACOES_FINANCEIRO') != 'N' && valorRestanteSQL != valorMovimento;

            console.log('geraNovoCaixa: ', geraNovoCaixa);

            //Se a operação gera financeiro
            if( geraNovoCaixa  && record.get('ORDENS_ISSRETIDO') != 'R' ) {
                record.set({'ORDENS_STATUS': 'N'});
                const thisController = this;
                thisController.getView().initGauge('Solicitando pagamento ...');
    
                Ext.defer( ()=>{
                    //Ext.$('formordenscirurcenter')[0].down('button[text="Pagamento"]').el.dom.click();
                    Ext.$('formordenscirurcenter')[0].down('button[text="Pagamento"]').el.dom.click();
                    thisController.getView().stopGauge();

                    //Se tiver o callback depoisQueGravou, ele roda
                    if( thisController.getView().depoisQueGravou ){
                        thisController.getView().depoisQueGravou.bind(thisController)( thisController.getView(), record );
                    }
                    
                }, 1000, this );
            }

           record.set({'ORDENS_ISSRETIDO': 'N'});

            //Gera o financeiro da renovação
            if(record.get('ORDENS_FINANCEIROS').length > 0 && record.get('ORDENS_STATUS') == 'F') {
                await SamosUtils.Request.nodeApi({
                    url: `/financeiros`,
                    method: 'POST',
                       data: {
                            'FINANCEIROS_ID_EMPRESAS':      configs.getEmpresa().id,
                            'FINANCEIROS_ID_DOCUMENTOS':    configs.getEmpresa().id.toString() + '0007',
                            'FINANCEIROS_ID_ORDENS':        record.get('ORDENS_ID'),
                            'FINANCEIROS_ID_PESSOAS':       record.get('ORDENS_ID_PESSOAS'),
                            'FINANCEIROS_ID_PORTADORES':    1,
                            'FINANCEIROS_ID_PRAZOS':        130,
                            'FINANCEIROS_PARCELA':          record.get('ORDENS_FINANCEIROS').length+1,
                            'FINANCEIROS_PARCELAS':         record.get('ORDENS_FINANCEIROS').length+1,
                            'FINANCEIROS_EMISSAO':          record.get('ORDENS_REABERTURA'),
                            'FINANCEIROS_VENCIMENTO':       record.get('ORDENS_FECHAMENTO'),
                            'FINANCEIROS_ORIGINAL':         record.get('ORDENS_TOTAL'),    
                            'FINANCEIROS_ABERTO':           record.get('ORDENS_TOTAL'),  
                            'FINANCEIROS_TOTAL':            record.get('ORDENS_TOTAL'),
                            'FINANCEIROS_NUMERO':           record.get('ORDENS_NUMERO'),
                            'FINANCEIROS_SERIE':            record.get('ORDENS_SERIE')
                        }
                }); 
            }   
                        
    
        }, 100);
    },

    onFecharClick: function(btn, e) {  
        const form = this.getView();
        var campoData = form.lookupReference('aluguelinicio');

        if (!campoData.isValid()) {
            campoData.focus();      // coloca o foco
            Ext.Msg.alert('Atenção', 'Informe uma data válida para Aluguel Inicial.');
            return;                 // aborta a gravação
        }            

        var campoData = form.lookupReference('aluguelfinal');

        if (!campoData.isValid()) {
            campoData.focus();      // coloca o foco
            Ext.Msg.alert('Atenção', 'Informe uma data válida para Aluguel Final.');
            return;                 // aborta a gravação
        }            

        this.getView().initGauge();

        setTimeout(() => {
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

    onRenovacaoClick: async function(btn, e) {
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
             
                ordem.set({
                    'ORDENS_STATUS': 'F',
                    'ORDENS_REABERTURA': '1899-12-30',
                    'ORDENS_FECHAMENTO': '1899-12-30',
                    'ORDENS_ISSRETIDO' : 'R', // marcamos como renovacao
                    'ORDENS_LOG': SamosUtils.Info.getLog()
                });

                await ordem.save();

                await SamosUtils.Utils.sleep(300);

                this.onAlterarClick();
                Ext.Note('success', 'Ordem de serviço reativada com sucesso');
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao reativar ordem de serviço');
        }

        view.stopGauge();
    },

//    onImprimirClick: Ext.emptyFn,

    onOpcoesClick  : Ext.emptyFn,

    onImprimirClick: async function(impressora, layout) {

        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                const model = this.getRecord();
                view.initGauge('Gerando impressão...');
                  
                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/aluguel`,
                    method: 'GET',
                    query: {
                        id            : model.get('ORDENS_ID'),
                        numero        : model.get('ORDENS_NUMERO'),
                        empresa       : configs.getEmpresa().id,
                        empresacnpj   : configs.getEmpresa().cnpj,
                        empresanome   : configs.getEmpresa().nome,        
                        documento     : model.get('ORDENS_ID_DOCUMENTOS'),
                        start         : 0,
                        limit         : 1,
                        titledocumento: view.title,
                        diasvctorodape: configs.getMovimentos().exibirDiasVctoRodape
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

    calcularDescontoDinheiro: function(txt) {
        const movimento = this.getRecord();
        const vm = this.getViewModel();
        const produtos = vm.getStore('produtos').data.items;

        this.iniciarEdicao();
                       
        const somaTotalBrutoProdutos = produtos.reduce((total, produtoItem) => {
            return total + cents(produtoItem.get('ORDENSPRODUTOS_TOTAL'));
        }, 0);

        const descontoDinheiro = cents(txt.value);

        if(descontoDinheiro > 0) {
            descontoPercentual = ((descontoDinheiro / somaTotalBrutoProdutos) * 100)
        } else {
            descontoPercentual = 0;
        }           

        const totalDescontos = descontoDinheiro;

        movimento.set({
            'DESCONTO_PERCENTUAL' : descontoPercentual,
            'ORDENS_TOTAL'        : (somaTotalBrutoProdutos - totalDescontos) / 100,
        });
    },


  onEncerramentoClick: async function (btn, event) {
        const view = this.getView();

        try {
            const ordem = this.getRecord();

            if(await SamosUtils.Msg.confirm('Deseja realmente finalizar?')) {
                view.initGauge('Finalizando...');
                
                await SamosUtils.Utils.sleep(200);

                ordem.set({ 'ORDENS_STATUS': 'E'});
                await ordem.save();

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