Ext.define('SamosAdmin.movimentos.romaneiosconstrucao.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formromaneiosconstrucao', 

    mixins: {
        status: 'SamosAdmin.movimentos.romaneiosconstrucao.form.mixins.Status'
    },

    validarPedidoEAbrirItens: function(txt, record) {
        const txtItem = txt.up('form').down('textfield[reference^="itens"]');
        const selection = this.lookup('pedidos').getSelection();

        if(record.get('MOVIMENTOS_ROMANEIOS').length > 0) {
            txtItem.onTextSearch(txtItem, { keyCode: 113 });
        } else {
            const txtNumero = txt.up('form').down('textfield[reference^="numero"]');

            Ext.Note('warning', 'Todos os produtos deste pedido já foram entregues');
            Ext.defer(txtNumero.setValue, 300, txtNumero, ['']);
            Ext.defer(txtNumero.focus,    400, txtNumero, ['']);
        }

        if(selection){
            setTimeout(() => {
                txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
            }, 300);
        }
    },    

    onNovoClick: async function () {
        try {
            const form = await this.callParent(arguments);
            const nomeDocumento = this.getListView().title.split(' ')[0] + ' Entrega';
            await Romaneioconstrucao.services.Model.definirValoresPadrao(form, nomeDocumento);
            return form;
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falhar ao criar novo documento');
        }
    },

    onPedidosClick: function(btn, e) {
        const vm = this.getViewModel();

        btn.up('samoswidgets-dinamicbutton').openSearch({
            title: 'Pedidos',
            tabela: 'movimentos',
            proximoFoco: 'pessoa',
            multi: false,
            valueStatus: 5,
            situacao: 1,
            permitirApenasDeUmaPessoa: true,
            permitirApenasDeUmaEmpresa: true
        })
        .then(Movimento.services.ImportacaoExportacao.obterMovimentosCompletos)
        .then(records => {
            const todosItens = records.reduce((result, movimento) => {

                const idMovimento = movimento.get('MOVIMENTOS_ID');
                const empresaMovimento = movimento.get('MOVIMENTOS_ID_EMPRESAS');
                const pessoaMovimento = movimento.get('MOVIMENTOS_ID_PESSOAS');
                const documentoMovimento = ((parseInt(movimento.get('MOVIMENTOS_ID_EMPRESAS')) * 10000) + 10);
                const numeroMovimento = movimento.get('MOVIMENTOS_NUMERO');
                const serieMovimento =  movimento.get('MOVIMENTOS_SERIE');
                const nomeMovimento = movimento.get('MOVIMENTOS_NOME');
                const foneMovimento = movimento.get('PESSOAS_TELEFONE');
                const celMovimento = movimento.get('MOVIMENTOS_CELULAR');
                const munMovimento = movimento.get('CIDADES_NOME');
                const ufMovimento = movimento.get('CIDADES_ESTADO');
                const emailMovimento = movimento.get('MOVIMENTOS_EMAIL');
                const obsMovimento = movimento.get('MOVIMENTOS_OBSERVACOES');

                vm.set('model.ROMANEIOS_ID_EMPRESAS', empresaMovimento);
                vm.set('model.ROMANEIOS_ID_DOCUMENTOS', documentoMovimento);
                vm.set('model.ROMANEIOS_ID_MOVIMENTOS', idMovimento);
                vm.set('model.ROMANEIOS_ID_PESSOAS', pessoaMovimento);
                vm.set('model.MOVIMENTOS_NUMERO', numeroMovimento);
                vm.set('model.MOVIMENTOS_SERIE', serieMovimento);
                vm.set('model.MOVIMENTOS_NOME', nomeMovimento);
                vm.set('model.PESSOAS_TELEFONE', foneMovimento);
                vm.set('model.PESSOAS_CELULAR', celMovimento);
                vm.set('model.CIDADES_NOME', munMovimento);
                vm.set('model.CIDADES_ESTADO', ufMovimento);
                vm.set('model.MOVIMENTOS_EMAIL', emailMovimento);
                vm.set('model.ROMANEIOS_OBSERVACOES', obsMovimento);

                const itensDoPedido = (movimento.get('MOVIMENTOS_ROMANEIOS') || []).map(item => {
                    return Ext.create('SamosAdmin.movimentos.romaneiosconstrucao.ModelItens', {
                        'ROMANEIOSITENS_ID_MOVIMENTOS':       movimento.get('MOVIMENTOS_ID'),
                        'ROMANEIOSITENS_ID_ITEM':             item['MOVIMENTOSITENS_ID'],
                        'ROMANEIOSITENS_QUANTIDADE':          item['ITENS_ENTREGAR'],
                        'MOVIMENTOS_NUMERO':                  movimento.get('MOVIMENTOS_NUMERO'),
                        'MOVIMENTOS_SERIE':                   movimento.get('MOVIMENTOS_SERIE'),
                        'MOVIMENTOS_NOME':                    movimento.get('MOVIMENTOS_NOME'),
                        'MOVIMENTOS_ROMANEIOS':               movimento.get('MOVIMENTOS_ROMANEIOS'),
                        'MOVIMENTOSITENS_ID_PRODUTOS':        item['MOVIMENTOSITENS_ID_PRODUTOS'],
                        'MOVIMENTOSITENS_ENTREGUE':           item['MOVIMENTOSITENS_ENTREGUE'],
                        'MOVIMENTOSITENS_DEPOSITO':           item['MOVIMENTOSITENS_DEPOSITO'],
                        'MOVIMENTOSITENS_IMEDIATA':           item['MOVIMENTOSITENS_IMEDIATA'],
                        'MOVIMENTOSITENS_EMROMANEIOORIGINAL': item['MOVIMENTOSITENS_EMROMANEIO'],
                        'MOVIMENTOSITENS_EMROMANEIO':         item['MOVIMENTOSITENS_EMROMANEIO'],
                        'ITENS_ENTREGAR':                     item['ITENS_ENTREGAR'],
                        'MOVIMENTOSITENS_QUANTIDADE':         item['MOVIMENTOSITENS_QUANTIDADE'],
                        'PRODUTOS_NOME':                      item['PRODUTOS_NOME'],
                    });
                });

                return result.concat(itensDoPedido);
            }, []);

            vm.set('model.ROMANEIOS_ITENS', todosItens);

            if(todosItens.length == 0){  
                Ext.Note('warning', 'Todos os itens deste(s) pedido(s) já foram entregues');
            }
        });
    },

    onExcluirClick: function (btn, event) {
        const model = this.getRecord();

        if(!this.permiteExclusao && !configs.getUsuario().privilegiado){
            const nivel = 1;

            Ext.create({ xtype: 'samoswidgets-senhanivel' })
                .iniciar(nivel)
                .then(() => {
                    this.permiteExclusao = true;
                    model.getProxy().setExtraParam('senhaNivel', 'true');
                    this.onExcluirClick();
                })
                .catch(() => {/*acao ao sair*/});
        } else {
            delete this.permiteExclusao;

            const id      = model.get('MOVIMENTOS_ID');
            const numero  = model.get('MOVIMENTOS_NUMERO');
            const serie   = model.get('MOVIMENTOS_SERIE');
            const empresa = model.get('MOVIMENTOS_ID_EMPRESAS');

            Ext.Msg.confirmDelete(btn => {
                if (btn == 'yes') {
                    this.getView().initGauge('Excluindo...');
                    this.colocarFilhosNoModel(model);
                    
                    model.getProxy().setExtraParam('log', `DELETE /romaneiosconstrucao/${id} (${numero}|${serie}|${empresa})`);
                    
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
        }
    },

    onFecharClick: function(btn, e) {  
        this.getView().initGauge();

        setTimeout(() => {
            const form = this.getView();
            const txtObservacoes = this.lookup('observacoes');
    
            txtObservacoes.up('samoswidgets-defaultform').expand();
    
            form.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());

            this.validarCabecalho()
                .then(async () => {
                    const storePedidos = this.lookup('pedidos').getStore();
                    return await Romaneioconstrucao.services.Model.removerItensNaoEntregues(form, storePedidos);
                })
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

    onGravarClick: function (btn, event) {
        setTimeout(() => {        
            const model = this.getRecord();
        
            this.validarCabecalho()
                .then(() => {
                    Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                        if (btn == 'yes') {
                            this.getView().initGauge('Gravando...');
                            this.colocarFilhosNoModel(model);
                            model.save()
                                .then(this.onGravacaoSucesso.bind(this))
                                .catch(this.onGravacaoFalha.bind(this))
                                .finally(this.aposGravar.bind(this));
                        }
                    });
                });
        }, 100);            
    },

    onComprovanteClick: async function () {
        const view = this.getView();
        const model = this.getRecord();

        if(
            !this.getViewModel().get('isSupervisor') && 
            model.get('ROMANEIOS_CONTADOR') && 
            parseInt(model.get('ROMANEIOS_CONTADOR')) > 0
        ) {
            const nivel = 1;
            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)
        }
        
        try {
            if(!model.get('DOCUMENTOS_LAYOUT')) {
                throw 'Informe o layout de impressão em Documentos > Layout';
            }

            delete this.permiteImpressao;

            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');
    
                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/comprovante${model.get('DOCUMENTOS_LAYOUT')}`,
                    method: 'GET',
                    query: {
                        id         : model.get('ROMANEIOS_ID'),
                        empresa    : model.get('ROMANEIOS_ID_EMPRESAS'),
                        empresacnpj: configs.getEmpresa().cnpj,
                        documento  : model.get('ROMANEIOS_ID_DOCUMENTOS'),
                        numero     : model.get('ROMANEIOS_NUMERO'),
                        serie      : model.get('ROMANEIOS_SERIE'),
                        transporte : model.get('ROMANEIOS_ID_TRANSPORTES')
                    }
                });
    
                await SamosUtils.Utils.sleep(500);
    
                SamosUtils.Pdf.exibir({
                    local: 'tab',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
            }

            const countImpressao = parseInt(model.get('ROMANEIOS_CONTADOR') || 0);
            const tipoRomaneio = model.get('ROMANEIOS_STATUS') == 'N' ? 'E' :
                                    model.get('ROMANEIOS_STATUS') == 'I' ? 'J' :
                                    model.get('ROMANEIOS_STATUS')
            model.set({
                'ROMANEIOS_IMPRESSAO': SamosUtils.Info.getLog(),
                'ROMANEIOS_CONTADOR': countImpressao + 1,
                'ROMANEIOS_STATUS': tipoRomaneio
            });

            await model.save();
            
            Ext.Note('success', 'Log de impressão salvo com sucesso!');
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    changeCpfCnpj: function(txt) {
        const cpfCnpj = SamosUtils.String.onlyNumbers(txt.getValue());

        if(cpfCnpj.length == 11) {
            txt.setTextMask('___.___.___-__', cpfCnpj);
            txt.setFieldLabel('CPF');
        } else {
            txt.setTextMask('__.___.___/____-__', cpfCnpj);            
            txt.setFieldLabel('CNPJ');
        }
    },

    calcularRomaneio: function() {
        setTimeout(() => {
            const model    = this.getRecord(); 
            const frete    = cents(model.get('ROMANEIOS_FRETE'));
            const seguro   = cents(model.get('ROMANEIOS_SEGURO'));
            const despesas = cents(model.get('ROMANEIOS_DESPESAS'));
    
            model.set('ROMANEIOS_TOTAL', (frete + seguro + despesas) / 100);
        }, 300);
    },
    
    verificarQuantidade: function(txt, griditems) {

        const selection = griditems.getSelection();
        
        if(!selection){ return; }

        const produto = selection.getValues();

        const qtdeIncompleta =  produto['ROMANEIOSITENS_QUANTIDADE'].toString().slice(-1) == '.' ||
                                produto['ROMANEIOSITENS_QUANTIDADE'].toString().slice(-2) == '.0' ||
                                produto['ROMANEIOSITENS_QUANTIDADE'].toString().slice(-3) == '.00';


        if(qtdeIncompleta) { return; } 

        const qtdecomprada = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
        const entregue     = grams(produto['MOVIMENTOSITENS_EMROMANEIO']) || 0;
        const aretirar     = grams(produto['ROMANEIOSITENS_QUANTIDADE']);

        if(aretirar > (qtdecomprada - entregue)){
            Ext.Note('warning', 'Quantidade a entregar maior que o permitido');
            produto['ROMANEIOSITENS_QUANTIDADE'] = (qtdecomprada - entregue) / 1000;
        }

        selection.setValues(produto);

    },

    focarItens: function(txt, record) {
        const txtObservacoes = this.lookup('observacoes');
        const gridItems = this.lookup('pedidos');
        const pedidos = this.lookup('pedidos').getStore().getData().items;
        
        if(pedidos.length > 0) {
            txtObservacoes.focus(true);
        } else {
            gridItems.focarNovoItem();
        }
    }
});
