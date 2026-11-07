Ext.define('SamosAdmin.movimentos.telemarketing.detalhes.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formdetalhestelemarketing',
    
    onNovoClick: async function (btn, event) {

        const pessoa = this.getRecord();        
        const record = Ext.create('SamosAdmin.movimentos.telemarketing.Model'); 

        record.set({
            'TELEMARKETING_ID_PESSOAS'  : pessoa.get('PESSOAS_ID'),
            'PESSOAS_NOME'              : pessoa.get('PESSOAS_NOME'),
            'PESSOAS_TELEFONE'          : pessoa.get('PESSOAS_TELEFONE'),
            'PESSOAS_CELULAR'           : pessoa.get('PESSOAS_CELULAR'),            
        });

        this.getViewModel().set({
            'hideNovo':    true,
            'readOnly':       false,
            'initialValues':  {},
            'previousModel':  undefined,
            'editionClosed':  true,
            'model':          record,
            'listName':       'Propriedades'    
        });

        this.getView().lookup('contato').focus(true);
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
            const formTelemarketing = Ext.$('formtelemarketing')[0];
            const vm               = formTelemarketing.getViewModel();
            const records          = formTelemarketing.down('grid').getSelectionModel().getSelection();
    
            if (!records.length) {
                throw 'Selecione pelo menos um telemarketing';
            }

            const model = records[0];
    
            const msgCmp = Ext.create({
                xtype: 'component',
                style: 'margin:15px 0px;font-weight:bold;font-size:16px;color:red',
                html:  'Deseja realmente excluir?'
            });
    
            const ids = records.map(record => record.get('TELEMARKETING_ID'))
    
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
            SamosUtils.Msg.error(error, 'Falha ao excluir Telemarketing');
        }

        view.stopGauge();

    },


    onGravarClick: async function () { 
        const view = this.getView();

        try {
            const model              = this.getRecord();
            const formTelemarketing  = Ext.$('formtelemarketing')[0];
            const vm                 = formTelemarketing.getViewModel();

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