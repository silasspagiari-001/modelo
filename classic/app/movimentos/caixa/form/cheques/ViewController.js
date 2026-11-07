Ext.define('SamosAdmin.movimentos.caixa.form.cheques.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.formcaixacheques',

    initViewModel: function(vm) {
        this.callParent(arguments);
        setTimeout(() => {
            const caixa = this.getView().up('formcaixa').getViewModel().get('model');
            const cpfPessoa = caixa.get('PESSOAS_CPFCNPJ');
            vm.set('model.CHEQUES_CPFCNPJ', SamosUtils.String.onlyNumbers(cpfPessoa));
        }, 500);
    },

    onAlterarClick: function() {
        this.getViewModel().set('readOnly', false);
    },

    onConfirmarClick: function(btn, e) {
        var titulos = this.getView().down('grid').getStore().data.items,
            formCaixa = this.getView().up('formcaixa'),
            ctrlCaixa = formCaixa.getController(),
            vmCaixa = formCaixa.getViewModel(),
            caixa = vmCaixa.get('model'),
            jsonItems = [],
            callback = typeof e == 'function' ? e : undefined;
        
        this.localData = [];

        jsonItems = titulos.map((cheques, index) => {
            cheques.getFields()
                .filter(field => field.type == 'nodejsdate')
                .map(field => {
                    cheques.set(field.name, momentTz(cheques.get(field.name)).format('YYYY-MM-DD'));
                });

            return SamosUtils.Json.trocarAspasDuplasPorDuasSimples(cheques.data);
        });

        caixa.set({
            'MOVIMENTOSCAIXA_CHEQUES': jsonItems,
            'MOVIMENTOSCAIXA_ID_PRAZOS': this.getViewModel().get('model.MOVIMENTOSCAIXA_ID_PRAZOS'),
            'PRAZOS_NOME': this.getViewModel().get('model.PRAZOS_NOME'),
            'PRAZOS_PARCELAS': this.getViewModel().get('model.PRAZOS_PARCELAS')
        });

        vmCaixa.set('chequesLocalData', this.localData);
        
        if(btn.getText() == 'Gravar'){
            callback();
        } else {
            this.onSairClick();
        }
    },

    onGravarClick: function(btn, e) {
        const formCaixa = this.getView().up('formcaixa');
        const ctrlCaixa = formCaixa.getController();
        const caixa = ctrlCaixa.getRecord();
            
        this.onConfirmarClick(btn, () => {
            Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                if (btn == 'yes') {
                    this.getView().initGauge('Gravando...');
                    ctrlCaixa.colocarFilhosNoModel.call(ctrlCaixa, caixa);
                    caixa.save()
                        .then(ctrlCaixa.onGravacaoSucesso.bind(ctrlCaixa))
                        .catch(ctrlCaixa.onGravacaoFalha.bind(ctrlCaixa))
                        .finally(() => {
                            ctrlCaixa.aposGravar.call(ctrlCaixa);
                            this.onSairClick();
                        });
                }
            });
        });
    },

    loadCheques: function() {
        var loader = setInterval(() => {
            let vm = this.getViewModel(),
                store = vm.getStore('main'),
                data = vm.get('dataCheques'),
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
                    this.getView().focus();
                }
            }  
        }, 200);
    },
    
    gerarCheques: function(txt, modelPrazo) {
        var rowediting = this.getView().down('grid').getPlugins()[0],
            formCaixa = this.getView().up('formcaixa'),
            formCheque = this.getView(),
            caixa = formCaixa.getViewModel().get('model'),
            cheque = formCheque.getViewModel().get('model'),
            parcelas = modelPrazo.get('PRAZOS_PARCELAS'),
            parcelamento = modelPrazo.get('PRAZOS_PARCELAMENTO') ? modelPrazo.get('PRAZOS_PARCELAMENTO').split('#') : undefined,
            valor = cents(caixa.get('MOVIMENTOSCAIXA_CHEQUE')),
            store = this.getViewModel().getStore('main'),  
            bancoCheque = cheque.get('CHEQUES_ID_BANCOS'),
            agencCheque = cheque.get('CHEQUES_AGENCIA'),
            contaCheque = cheque.get('CHEQUES_CONTA'),
            numCheque   = parseInt(cheque.get('CHEQUES_NUMERO')),
            cpfCheque   = cheque.get('CHEQUES_CPFCNPJ'),
            dataCheques;
        
        if(!parcelamento) {
            parcelamento = [];
            for (let i = 0; i < parcelas; i++) {
                parcelamento.push(i * 30);
            }
        }

        const resto = valor % parcelamento.length;

        dataCheques = parcelamento.map((days, index) => {
            const hoje        = momentServer().hours(0).minutes(0).seconds(0);
            const vcto        = momentTz(hoje).add(days, 'days');
            const geraBaixado = momentTz(vcto.format()).isSameOrBefore(hoje);
            const original    = parseInt(valor / parcelas) / 100 + (index === 0 ? resto / 100 : 0);

            return Ext.create('SamosFinanceiros.cheques.Model', {
                'CHEQUES_ID':            (index + 1) * -1,
                'CHEQUES_ID_EMPRESAS':   caixa.get('MOVIMENTOSCAIXA_ID_EMPRESAS'),
                'CHEQUES_ID_DOCUMENTOS': 999,
                'CHEQUES_ID_BANCOS':     bancoCheque,
                'CHEQUES_AGENCIA':       agencCheque,
                'CHEQUES_CONTA':         contaCheque,
                'CHEQUES_NUMERO':        ("000000" + (index + numCheque).toString()).slice(-6),
                'CHEQUES_ORIGEM':        caixa.get('MOVIMENTOSCAIXA_ID_PESSOAS'),
                'CHEQUES_SERIE':         'CX', 
                'CHEQUES_ID_MOVIMENTOS': caixa.get('MOVIMENTOSCAIXA_ID'), 
                'CHEQUES_CPFCNPJ':       cpfCheque,
                'CHEQUES_NOME':          caixa.get('PESSOAS_NOME'),
                'CHEQUES_ENDERECO':      caixa.get('PESSOAS_ENDERECO'),
                'CHEQUES_NRORESIDENCIA': caixa.get('PESSOAS_NUMERO'),
                'CHEQUES_BAIRRO':        caixa.get('PESSOAS_BAIRRO'),
                'CHEQUES_CEP':           caixa.get('PESSOAS_CEP'),
                'CHEQUES_TELEFONE':      caixa.get('PESSOAS_TELEFONE'),
                'CHEQUES_CELULAR':       caixa.get('PESSOAS_CELULAR'),
                'CHEQUES_ID_CIDADES':    caixa.get('PESSOAS_ID_CIDADES'),
                'CHEQUES_LOG':           SamosUtils.Info.getLog(),
                'CHEQUES_VENCIMENTO':    vcto.format('YYYY-MM-DD'),
                'CHEQUES_DEPOSITO':      '1899-12-30',
                'CHEQUES_BAIXA':         geraBaixado ? vcto.format('YYYY-MM-DD') : '1899-12-30',
                'CHEQUES_VALOR':         original,
                'CHEQUES_STATUS':        geraBaixado ? 'B' : 'A'
            });
        });

        store.setData(dataCheques);
        rowediting.startEdit(0, 0);
    },

    getRecord: function() {
        return this.getViewModel().get('model');
    },

    validateModel: function() {
        var ctrlCaixa = this.getView().up('formcaixa').getController();
        
        return ctrlCaixa.validateModel(arguments);
    }
});
