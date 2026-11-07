Ext.define('SamosAdmin.movimentos.caixa.form.cartoes.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.formcaixacartoes',

    onAlterarClick: function() {
        this.getViewModel().set('readOnly', false);
    },

    onConfirmarClick: function(btn, e) {
        const formCaixa = this.getView().up('formcaixa');
        const ctrlCaixa = formCaixa.getController();
        
        if(ctrlCaixa.mixins.cartoes.validarCartoes()){
            this.getView().destroy();
        }

    },

    onGravarClick: function(btn, e) {
        const formCaixa = this.getView().up('formcaixa');
        const ctrlCaixa = formCaixa.getController();
        const caixa = ctrlCaixa.getRecord();
        
        if(this.getView().down('grideditable').validarItens(true)) {
            if(ctrlCaixa.mixins.cartoes.validarCartoes()){
                if(btn.getText() == 'Gravar'){
                    Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                        if (btn == 'yes') {
                            this.getView().initGauge('Gravando...');
                            ctrlCaixa.colocarFilhosNoModel.call(ctrlCaixa, caixa);
                            caixa.save()
                                .then(ctrlCaixa.onGravacaoSucesso.bind(ctrlCaixa))
                                .catch(ctrlCaixa.onGravacaoFalha.bind(ctrlCaixa))
                                .finally(() => {
                                    ctrlCaixa.aposGravar.call(ctrlCaixa);
                                    ctrlCaixa.setReadOnly.call(this, true);
                                    this.getView().stopGauge();
                                });
                        }
                    });
                }
            }
        }
    },

    setCartaoDefaults: function(grid, model) {
        const caixa = this.getView().up('formcaixa').getViewModel().get('model');

        model.set({
            'CARTOES_ID_DOCUMENTOS': 999,  // Caixa Diário
            'CARTOES_ORIGEM':        caixa.get('MOVIMENTOSCAIXA_ID'),
            'CARTOES_SERIE':         'CX'
        });
    },

    openDetail: async function(grid, rowIndex, colIndex) {
        const record = grid.getStore().getAt(rowIndex);
        await this.createForm(record);
    },

    createForm: async function (record) {
        const formCaixa = this.getView().up('formcaixa');
        const newForm = Ext.create({
            xtype: 'formcaixaformcartoes'
        });

        const formCartaoController = newForm.getController();

        formCaixa.add(newForm);

        newForm.getViewModel().set({
            'readOnly':       this.getViewModel().get('readOnly'),
            'initialValues':  record.isNew() ? {} : record.getData(),
            'previousModel':  undefined,
            'editionClosed':  true,
            'model':          record,
            'caixa': formCaixa.getViewModel().get('model')
        });

        formCartaoController.doDefaultFocus();
        formCaixa.applyTextSearches();

        return formCaixa;
    },

    loadCartoes: function() {
        var loader = setInterval(() => {
            let vm = this.getViewModel(),
                store = vm.getStore('main'),
                rowediting = this.getView().down('grid').getPlugins()[0],
                data = vm.get('dataCartoes'),
                localData = vm.get('localData');

            if(store) {
                clearTimeout(loader);

                if(localData && localData[0]){
                    for (let i in localData[0]) {
                        for (let j in localData[0][i]) {
                            data[i][j] = localData[0][i][j];
                        }
                    }
                }

                store.setData(data);

                if(!vm.get('readOnly')){
                    rowediting.startEdit(0, 0);
                }
            }  
        }, 200);
    },
    
    setTaxaParcelas: function (txt, record) {
        var cartao = this.getView().down('grideditable').getSelectionModel().getSelection()[0],
            parcelas = parseInt(this.lookupReference('parcelas').getValue()),
            taxa;

        if(parcelas > 1) {
            taxa = cartao.get('OPERADORAS_PARCELADO') || record.get('OPERADORAS_PARCELADO');
        } else {
            taxa = cartao.get('OPERADORAS_AVISTA')    || (record.get ? record.get('OPERADORAS_AVISTA') : null);
        }

        if(taxa != null) {
            cartao.set('CARTOES_TAXA', taxa);
        }

        this.checkParcelas();
    },

    checkParcelas: function (grid, model) {
        const tema = configs.getTema();

        var cartao = (model && model.get) ? model : this.getView().down('grideditable').getSelectionModel().getSelection()[0],
            txtTipo = this.lookupReference('tipo'),
            txtParcelas = this.lookupReference('parcelas');

        if(txtTipo.getValue() == 'D') {
            cartao.set('CARTOES_PARCELAS', 1);
            txtParcelas.setValue(1);
            txtParcelas.setReadOnly(true);
            txtParcelas.setUi('field-readonly');
        } else {
            txtParcelas.setReadOnly(false);
            txtParcelas.setUi('textbold-' + tema);
        }
    },

    getRecord: function() {
        var ctrlCaixa = this.getView().up('formcaixa').getController();
        
        return ctrlCaixa.getRecord(arguments);
    },

    validateModel: function() {
        var ctrlCaixa = this.getView().up('formcaixa').getController();
        
        return ctrlCaixa.validateModel(arguments);
    }
});
