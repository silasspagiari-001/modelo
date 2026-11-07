Ext.define('SamosAdmin.atualizacao.pessoas.form.propriedades.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formpropriedades',
    
    onNovoClick: async function (btn, event) {
        const propriedade = this.getRecord();        
        const record = Ext.create('SamosAdmin.atualizacao.pessoas.form.propriedades.Model'); 
        
        record.set({
            'PROPRIEDADES_ID_PESSOAS'  : propriedade.get('PROPRIEDADES_ID_PESSOAS'),
            'PROPRIEDADES_NOME'  : propriedade.get('PROPRIEDADES_NOME'),
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

        this.getView().lookup('cpf').focus(true);
    },

    onNaturezaChange: function (combo, nv, ov) {
        var txtCpf = this.getReferences()['cpf'],
            cpfCnpj = this.getViewModel().get('model.PROPRIEDADES_CPFCNPJ'),
            natureza = nv ? nv.toUpperCase() : undefined;

        if (natureza == 'FISICA') {
            txtCpf.setTextMask('___.___.___-__', cpfCnpj);

        } else {
            txtCpf.setTextMask('__.___.___/____-__', cpfCnpj);
        }
    },

    verificarCPFCNPJExistente: async function (txt, event) {
        if (!SamosUtils.Events.isTab(event) && !SamosUtils.Events.isEnter(event)) {
            return;
        }

        const view = this.getView();

        try {
            const model = this.getRecord();
            const txtCpf = this.lookup('cpf');
            const proximoFoco = this.lookup(txt.proximoFoco);
            const cpfCnpjInformado = SamosUtils.String.onlyNumbers(txtCpf.value);
    
            if (model.getValidation(true).get('PROPRIEDADES_CPFCNPJ') !== true) {
                Ext.defer(txtCpf.focus, 100, txtCpf, [true]);
                throw model.getValidation(true).get('PROPRIEDADES_CPFCNPJ');
            }
            
            if (!model.phantom || this.ignoreDocument(model)) {
                return
            }
            
            view.initGauge('Verificando disponibilidade CPF/CNPJ...');

            const queryCPF = await SamosUtils.Request.nodeApi({
                url: `/consultas/existe`,
                method: 'GET',
                query: {
                    tabela: 'PROPRIEDADES',
                    campo: 'PROPRIEDADES_CPFCNPJ',
                    conteudo: cpfCnpjInformado
                }
            });

            if (queryCPF.results[0]) {
                const propriedadesId = queryCPF.results[0]['PROPRIEDADES_ID'];

                Propriedade.services.Model.carregarCpfExistente(propriedadesId);                        
            } else {
                Ext.defer(proximoFoco.focus, 100, proximoFoco, [true]);
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao checar CPF/CNPJ');
        }

        view.stopGauge(true);
    },

    ignoreDocument: function (model) {
        const cpfcnpj = model.get('PROPRIEDADES_CPFCNPJ');

        return cpfcnpj == '99999999000191' || this.getViewModel().get('cadastroCpfDuplicadoLiberado');
    },

    setarCep: function(txt) {
        const ref = txt.reference;
        const value = txt.getValue();

        if(ref == 'cep') {
            this.lookup('cep').setValue(value);
            this.lookup('cep').setSearchedId(value);
        }
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
            const listPropriedades = Ext.$('propriedades')[0];
            const vm               = listPropriedades.getViewModel();
            const records          = listPropriedades.down('grid').getSelectionModel().getSelection();
    
            if (!records.length) {
                throw 'Selecione pelo menos uma propriedade';
            }

            const model = records[0];
    
            const msgCmp = Ext.create({
                xtype: 'component',
                style: 'margin:15px 0px;font-weight:bold;font-size:16px;color:red',
                html:  'Deseja realmente excluir?'
            });
    
            const ids = records.map(record => record.get('PROPRIEDADES_ID'))
    
            if(await SamosUtils.Msg.confirm(msgCmp)) {
                view.initGauge('Excluindo...');

                model.getProxy().setExtraParams({
                    ids: ids.join(',')
                });

                await model.erase();
                Ext.Note('success', 'Registro excluído');
                this.onSairClick();
/*                await SamosUtils.Utils.sleep(500);
                vm.get('main').load();*/
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao excluir documento(s)');
        }

        view.stopGauge();

    },


    onGravarClick: async function () {
        const view = this.getView();

        try {
            const model            = this.getRecord();
            const listPropriedades = Ext.$('propriedades')[0];
            const vm               = listPropriedades.getViewModel();

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
