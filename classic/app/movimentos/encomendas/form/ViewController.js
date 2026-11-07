Ext.define('SamosAdmin.movimentos.encomendas.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formencomendas',

    mixins: {
        produtos: 'SamosAdmin.movimentos.encomendas.form.mixins.Produtos',
    },

    onNovoClick: async function () {
        try {
            const form = await this.callParent(arguments);
            const nomeDocumento = this.getListView().title;
            await Encomenda.services.Model.definirValoresPadrao(form, nomeDocumento);
            return form;
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falhar ao criar novo documento');
        }
    },

    onAlterarClick: function (btn, event) {
        const model = this.getRecord();

        if(!this.permiteAlteracao &&
           !configs.getMovimentos().desativaSenha &&   
           !configs.getUsuario().privilegiado){
            const nivel = 1;

            Ext.create({ xtype: 'samoswidgets-senhanivel' })
                .iniciar(nivel)
                .then(() => {
                    this.permiteAlteracao = true;
                    model.getProxy().setExtraParam('senhaNivel', 'true');
                    this.onAlterarClick();
                })
                .catch(() => {/*acao ao sair*/});
        } else  {
            const id      = model.get('MOVIMENTOS_ID');
            const numero  = model.get('MOVIMENTOS_NUMERO');
            const serie   = model.get('MOVIMENTOS_SERIE');
            const empresa = model.get('MOVIMENTOS_ID_EMPRESAS');

            model.getProxy().setExtraParam('log', `PUT /encomendas/${id} (${numero}|${serie}|${empresa})`);
            this.callParent(arguments);
            delete this.permiteAlteracao;
        }
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

    onExcluirClick: async function (btn, event) {
        const view = this.getView();
        
        try {
            const model = this.getRecord();
    
            if(!configs.getUsuario().privilegiado &&
               !configs.getMovimentos().desativaSenha){
                const nivel = 1;
                await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)
                model.getProxy().setExtraParam('senhaNivel', 'true');
            }
            
            const id      = model.get('MOVIMENTOS_ID');
            const numero  = model.get('MOVIMENTOS_NUMERO');
            const serie   = model.get('MOVIMENTOS_SERIE');
            const empresa = model.get('MOVIMENTOS_ID_EMPRESAS');
            
            if(await SamosUtils.Msg.confirm('Deseja realmente excluir?')){
                view.initGauge('Excluindo...');
                this.colocarFilhosNoModel(model);
    
                model.getProxy().setExtraParam('log', `Exclusão Encomenda ${id} (${numero}|${serie}|${empresa})`);
    
                await model.erase();

                this.getListView().down('grid').getStore().load();
                Ext.Note('success', 'Registro excluído');
                await SamosUtils.Utils.sleep(500);
                this.onSairClick();
                this.getListView().down('toolbar').focus(true);
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao excluir');
        }
        
        try { view.stopGauge(); } catch(e) {}
    },

    onFecharClick: async function(btn, e) {  
        const view = this.getView();
        
        try {
            view.initGauge();

            await SamosUtils.Utils.sleep(100);
            const txtObservacoes = this.lookup('observacoes');
            txtObservacoes.up('samoswidgets-defaultform').expand();
            view.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());

            await this.validarCabecalho()
            this.mixins.produtos.fazerSomasERateios();
            this.lookup('observacoes').focus(true);
            this.finalizarEdicao();
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao fechar');
        }
        
        view.stopGauge();
    },

    onGravarClick: async function (btn, event) {
        const view = this.getView();

        try {
            const model = this.getRecord();
    
            await this.validarCabecalho();

            if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
                view.initGauge('Gravando...');
                this.colocarFilhosNoModel(model);
                const encomenda = await model.save();

                //cria notificações em background
                this.notificarUsuarios(encomenda);
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao gravar encomenda');
        }

        view.stopGauge();
    },
    
    notificarUsuarios: async function(encomenda) {
        try {
            const usuarios = configs.getMovimentos().usuariosNotificarEncomenda || [];
            const serie = encomenda.get('MOVIMENTOS_SERIE');
            const numero = encomenda.get('MOVIMENTOS_NUMERO');
            const listaProdutos = (encomenda.get('MOVIMENTOS_ITENS') || []).map(produto => produto['MOVIMENTOSITENS_ID_PRODUTOS']);
            const notificacoes = usuarios.map((usuario, index) => {
                return Ext.create('SamosAdmin.movimentos.notificacao.Model', {
                    'NOTIFICACAO_ID'         : (index + 1) * -1,
                    'NOTIFICACAO_ID_DESTINO' : usuario,
                    'NOTIFICACAO_NOME'       : 'Nova Encomenda',
                    'NOTIFICACAO_HORAAVISAR' : momentServer().format('HH:mm'),
                    'NOTIFICACAO_MENSAGEM'   : `${serie} ${numero} criada para o(s) produto(s) ${listaProdutos.join(', ')}`
                }).data;
            });
    
            await SamosUtils.Request.nodeApi({
                url: '/notificacao/lote',
                method: 'POST',
                data: notificacoes
            });

        } catch(error) {
            console.error(error);
        }
    },
    
    onImprimirClick: async function() {
        const view = this.getView();
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
                        id: model.get('MOVIMENTOS_ID')
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

    aposBuscarPessoa: async function(txt, record) {
        const txtVendedor = this.lookup('vendedor');
        const gridItems = this.lookup('produtos');
        
        if(configs.getMovimentos().carregaVendedor){
            Ext.defer(gridItems.focarNovoItem, 200, gridItems);
        } else {
            txtVendedor.focus(true);
        }
    },

    updateLog: function(txt, record) {
        const time = momentServer().format('HH:mm:ss');
        const logon = record.get('USUARIOS_LOGIN');
        const result = logon + ' ' + time;
        
        this.getRecord().set('MOVIMENTOS_LOG', result);
        
        if(!configs.getMovimentos().carregaVendedor){
            const gridItems = this.lookup('produtos');
            Ext.defer(gridItems.focarNovoItem, 200, gridItems);
        }
    }
});
