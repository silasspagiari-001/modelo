Ext.define('SamosAdmin.atualizacao.pessoas.form.assistencias.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formassistencias',
    
    onNovoClick: async function (btn, event) {
        const propriedade = this.getRecord();        
        const record = Ext.create('SamosAdmin.atualizacao.pessoas.form.assistencias.Model'); 
        
        record.set({
            'ASSISTENCIAS_ID_PESSOAS'  : propriedade.get('ASSISTENCIAS_ID_PESSOAS'),
            'ASSISTENCIAS_NOME'  : propriedade.get('ASSISTENCIAS_NOME'),
        });

        this.getViewModel().set({
            'hideNovo':    true,
            'readOnly':       false,
            'initialValues':  {},
            'previousModel':  undefined,
            'editionClosed':  true,
            'model':          record,
            'listName':       'Assistências'
        });

        this.getView().lookup('cpf').focus(true);
    },

    onImprimirClick: async function () {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const model = this.getRecord();
                console.log('model: ', model);
                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/assistencias`,
                    method: 'GET',
                    query: {
                        conteudo   : '.' + model.get('ORDENS_ID').toString(),
                        empresacnpj: configs.getEmpresa().cnpj
                    }
                });

                await this.onSairClick();
                await Ext.$('assistencias')[0].getController().onSairClick();

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

    onCancelarClick: function(btn, event) {
        if(this.getView().isWindow) {
            this.cancelar();
        } else {
            Ext.Msg.confirmCancel(btn => {
                if (btn == 'yes') {
                    this.cancelar();
                }
            });
        }
    },

    cancelar: function() {
        const vm = this.getViewModel();
        const model = this.getRecord();
        const previousModel = vm.get('previousModel');

        SamosUtils.Events.disableWarnReload();
        
        if (previousModel || (model && !model.isNew())) {
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

    onSairClick: function(btn, event) {
        if(this.getView().up('window')) {
            this.getView().up('window').destroy();
        }

        this.callParent(arguments);
        
        if(this.getListView() && this.getListView().down('grid')) {
            this.getListView().down('grid').focusSelectedItem();        
        }
    },

    onExcluirClick: async function(btn, e) {

        const view = this.getView();

        try {
            const listAssistencias = Ext.$('assistencias')[0];
            const vm               = listAssistencias.getViewModel();
            const records          = listAssistencias.down('grid').getSelectionModel().getSelection();
    
            if (!records.length) {
                throw 'Selecione pelo menos uma assistência técnica';
            }

            const model = records[0];
    
            const msgCmp = Ext.create({
                xtype: 'component',
                style: 'margin:15px 0px;font-weight:bold;font-size:16px;color:red',
                html:  'Deseja realmente excluir?'
            });
    
            const ids = records.map(record => record.get('ORDENS_ID'))
    
            if(await SamosUtils.Msg.confirm(msgCmp)) {
                view.initGauge('Excluindo...');

                model.getProxy().setExtraParams({
                    ids: ids.join(',')
                });

                await model.erase();
                Ext.Note('success', 'Registro excluído');
                this.onSairClick();
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao excluir assistência');
        }

        view.stopGauge();

    },

    onGravarClick: async function () {
        const view = this.getView();

        try {
            const model            = this.getRecord();
            const listAssistencias = Ext.$('assistencias')[0];
            const vm               = listAssistencias.getViewModel();

            await this.validarCabecalho();

            if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
                view.initGauge('Gravando...');
                this.colocarFilhosNoModel(model);
                await model.save();
                Ext.Note('success', 'Gravado com sucesso');
                vm.get('main').add(model);
                model.phantom = false;
                setTimeout(() => {
                    this.setReadOnly(true);
                }, 100);
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao gravar');
        }

        view.stopGauge(true);
    }

});
