Ext.define('SamosAdmin.movimentos.movimento.form.caixa.cartoes.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.formmovimentoscaixacartoes',

    onAlterarClick: function() {
        this.getViewModel().set('readOnly', false);
    },

    onConfirmarClick: function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        
        if(this.getView().down('grideditable').validarItens(true)) {
            if(ctrlMovimento.mixins.cartoes.validarCartoes()){
                this.getView().destroy();
            }
        }
    },

    onGravarClick: function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = ctrlMovimento.getRecord();
        
        if(this.getView().down('grideditable').validarItens(true)) {
            if(ctrlMovimento.mixins.cartoes.validarCartoes()){
                if(btn.getText() == 'Gravar'){
                    Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                        if (btn == 'yes') {
                            this.getView().initGauge('Gravando...');
                            ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento);

                            if(
                                Movimento.services.Caixa.receberObrigatorio() &&
                                Movimento.services.Caixa.financeiroValido()
                            ) {
                                if(!formMovimento.getViewModel().get('isNotaEletronica')) {
                                    movimento.set({
                                        'MOVIMENTOS_LOG': SamosUtils.Info.getLog(),
                                        'MOVIMENTOS_STATUS': 'F'
                                    });
                                }

                                const btnCaixa = formMovimento.down('button[text="Caixa"]');
        
                                if(btnCaixa) {
                                    btnCaixa.getEl().dom.style.backgroundColor = '';
                                    btnCaixa.getEl().dom.querySelector('.x-btn-inner').style.color = '';
                                }
    
                                if(!formMovimento.getViewModel().get('isNotaEletronica')) {
                                    const temEntradaSaida = momentTz(movimento.get('MOVIMENTOS_ENTRADASAIDA') || '1899-12-30').isAfter('1900-01-01');
        
                                    if(!formMovimento.getViewModel().get('isNotaEntrada') && !temEntradaSaida) {
                                        movimento.set('MOVIMENTOS_ENTRADASAIDA', momentServer().format('YYYY-MM-DD'));
                                    }
                                }
                            }

                            const btnCartoes = Ext.$('formmovimentoscaixa')[0].down('button[text="Cartões"]');
        
                            if(btnCartoes) {
                                btnCartoes.getEl().dom.style.backgroundColor = '';
                                btnCartoes.getEl().dom.querySelector('.x-btn-inner').style.color = '';
                            }

                            movimento.save()
                                .then(ctrlMovimento.onGravacaoSucesso.bind(ctrlMovimento))
                                .catch(ctrlMovimento.onGravacaoFalha.bind(ctrlMovimento))
                                .finally(() => {
                                    ctrlMovimento.aposGravar.call(ctrlMovimento);
                                    ctrlMovimento.setReadOnly.call(this, true);
                                    setTimeout(() => {
                                        this.onSairClick();
                                    }, 200);                                    
                                    this.getView().stopGauge();
                                });
                        }
                    });
                }
            }
        }
    },

    setCartaoDefaults: function(grid, model) {
        var movimento = this.getView().up('formmovimentos').getViewModel().get('model');

        model.set({
            'CARTOES_ID_DOCUMENTOS': movimento.get('MOVIMENTOS_ID_DOCUMENTOS'),
            'CARTOES_ORIGEM':        movimento.get('MOVIMENTOS_NUMERO'),
            'CARTOES_SERIE':         movimento.get('MOVIMENTOS_SERIE')
        });
    },

    openDetail: async function(grid, rowIndex, colIndex) {
        const record = grid.getStore().getAt(rowIndex);
        await this.createForm(record);
    },

    createForm: async function (record) {
        const formMovimento = this.getView().up('formmovimentos');
        const newForm = Ext.create({
            xtype: 'formmovimentoscaixaformcartoes'
        });

        const formCartaoController = newForm.getController();

        formMovimento.add(newForm);

        newForm.getViewModel().set({
            'readOnly':       this.getViewModel().get('readOnly'),
            'initialValues':  record.isNew() ? {} : record.getData(),
            'previousModel':  undefined,
            'editionClosed':  true,
            'model':          record,
            'movimento': formMovimento.getViewModel().get('model')
        });

        formCartaoController.doDefaultFocus();
        formMovimento.applyTextSearches();
        
        return formMovimento;
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
            txtOperadora = this.lookupReference('operadorasId'),
            txtParcelas = this.lookupReference('parcelas');
            txtAutorizacao = this.lookupReference('autorizacao');

        if(txtTipo.getValue() == 'D') {
            if(configs.getClientName() == 'pinguim') {
                cartao.set('CARTOES_ID_OPERADORAS', 4);
                txtOperadora.setValue(4);             
                cartao.set('CARTOES_CONVENIO', 'PagBank');   
                cartao.set('CARTOES_AUTORIZACAO', 'D');
                cartao.set('OPERADORAS_AVISTA', 1);
                cartao.set('OPERADORAS_PARCELADO', 1);
            }
            cartao.set('CARTOES_PARCELAS', 1);
            txtParcelas.setValue(1);
            txtParcelas.setReadOnly(true);
            txtParcelas.setUi('field-readonly');
            txtAutorizacao.proximoFoco = 'valor';
        } else {
            if(configs.getClientName() == 'pinguim') {
                cartao.set('CARTOES_ID_OPERADORAS', 1);
                txtOperadora.setValue(1);                
                cartao.set('CARTOES_CONVENIO', 'PagBank');   
                cartao.set('CARTOES_AUTORIZACAO', 'C');
                cartao.set('OPERADORAS_AVISTA', 1);
                cartao.set('OPERADORAS_PARCELADO', 1);
            }
            txtParcelas.setReadOnly(false);
            txtParcelas.setUi('textbold-' + tema);
            txtAutorizacao.proximoFoco = 'parcelas';
        }
    },

    getRecord: function() {
        var ctrlMovimento = this.getView().up('formmovimentos').getController();
        
        return ctrlMovimento.getRecord(arguments);
    },

    validateModel: function() {
        var ctrlMovimento = this.getView().up('formmovimentos').getController();
        
        return ctrlMovimento.validateModel.apply(ctrlMovimento, arguments);
    }
});
