Ext.define('SamosAdmin.movimentos.notaconsumidor.form.caixa.cheques.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.formnotaconsumidorcaixacheques',

    initViewModel: function(vm) {
        this.callParent(arguments);
        setTimeout(() => {
            const movimento = this.getView().up('formnotaconsumidor').getViewModel().get('model');
            const cpfPessoa = movimento.get('MOVIMENTOS_CPFCNPJ');
            vm.set('model.CHEQUES_CPFCNPJ', SamosUtils.String.onlyNumbers(cpfPessoa));
        }, 500);
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

    onAlterarClick: function() {
        this.getViewModel().set('readOnly', false);
    },
    
    gerarCheques: function(txt, modelPrazo) {
        const formMovimento = this.getView().up('formnotaconsumidor');
        const janelaCaixa = formMovimento.down('formnotaconsumidorcaixa');
        const caixa = janelaCaixa.getViewModel().get('model');
        const parcelas = modelPrazo.get('PRAZOS_PARCELAS');
        const store = this.getViewModel().getStore('main');
        const movimento = formMovimento.getViewModel().get('model');
        const valor = cents(caixa.get('MOVIMENTOSCAIXA_CHEQUE'));
        const cheque = this.getViewModel().get('model');
        const banco   = cheque.get('CHEQUES_ID_BANCOS');
        const agencia = cheque.get('CHEQUES_AGENCIA');
        const conta   = cheque.get('CHEQUES_CONTA');
        const numero   = cheque.get('CHEQUES_NUMERO');
        const cpfcnpj = cheque.get('CHEQUES_CPFCNPJ');

        if(!banco) {
            Ext.Note('warning', 'Informe o banco');
            this.lookup('banco').focus(true);
            Ext.defer(this.lookup('prazo').setValue, 100, this.lookup('prazo'), [''])

        } else if(!agencia) {
            Ext.Note('warning', 'Informe a agência');
            this.lookup('agencia').focus(true);
            Ext.defer(this.lookup('prazo').setValue, 100, this.lookup('prazo'), [''])

        } else if(!conta) {
            Ext.Note('warning', 'Informe a conta');
            this.lookup('conta').focus(true);
            Ext.defer(this.lookup('prazo').setValue, 100, this.lookup('prazo'), [''])

        } else if(!numero || parseInt(numero) == 0) {
            Ext.Note('warning', 'Informe o número do cheque');
            this.lookup('numero').focus(true);
            Ext.defer(this.lookup('prazo').setValue, 100, this.lookup('prazo'), [''])

        } else if(!cpfcnpj) {
            Ext.Note('warning', 'Informe o CPF/CNPJ');
            this.lookup('cpfcnpj').focus(true);
            Ext.defer(this.lookup('prazo').setValue, 100, this.lookup('prazo'), [''])

        } else {
            let parcelamento = modelPrazo.get('PRAZOS_PARCELAMENTO') ? modelPrazo.get('PRAZOS_PARCELAMENTO').split('#') : undefined;
            
            if(!parcelamento) {
                parcelamento = [];
                for (let i = 0; i < parcelas; i++) {
                    parcelamento.push(i * 30);
                }
            }
    
            const resto = valor % parcelamento.length;
    
            const dataCheques = parcelamento.map((days, index) => {
                const hoje = momentServer().hours(0).minutes(0).seconds(0);
                const vcto = momentTz(hoje).add(days, 'days');
                const geraBaixado = momentTz(vcto.format().isSameOrBefore(hoje));
                const original = parseInt(valor / parcelas) / 100 + (index === 0 ? resto / 100 : 0);
    
                return Ext.create('SamosFinanceiros.cheques.Model', {
                    'CHEQUES_ID':            (index + 1) * -1,
                    'CHEQUES_ID_EMPRESAS':   movimento.get('MOVIMENTOS_ID_EMPRESAS'),
                    'CHEQUES_ID_BANCOS':     banco,
                    'CHEQUES_AGENCIA':       agencia,
                    'CHEQUES_CONTA':         conta,
                    'CHEQUES_NUMERO':        ("000000" + (index + parseInt(numero)).toString()).slice(-6),
                    'CHEQUES_ORIGEM':        movimento.get('MOVIMENTOS_NUMERO'), 
                    'CHEQUES_SERIE':         movimento.get('MOVIMENTOS_SERIE'), 
                    'CHEQUES_ID_MOVIMENTOS': movimento.get('MOVIMENTOS_ID'), 
                    'CHEQUES_ID_DOCUMENTOS': movimento.get('MOVIMENTOS_ID_DOCUMENTOS'), 
                    'CHEQUES_CPFCNPJ':       cpfcnpj,
                    'CHEQUES_NOME':          movimento.get('MOVIMENTOS_NOME'),
                    'CHEQUES_ENDERECO':      movimento.get('PESSOAS_ENDERECO'),
                    'CHEQUES_NRORESIDENCIA': movimento.get('PESSOAS_NUMERO'),
                    'CHEQUES_BAIRRO':        movimento.get('PESSOAS_BAIRRO'),
                    'CHEQUES_CEP':           movimento.get('PESSOAS_CEP'),
                    'CHEQUES_TELEFONE':      movimento.get('PESSOAS_TELEFONE'),
                    'CHEQUES_CELULAR':       movimento.get('MOVIMENTOS_CELULAR'),
                    'CHEQUES_ID_CIDADES':    movimento.get('PESSOAS_ID_CIDADES'),
                    'CIDADES_NOME':          movimento.get('CIDADES_NOME'),
                    'CIDADES_ESTADO':        movimento.get('CIDADES_ESTADO'),
                    'CHEQUES_LOG':           SamosUtils.Info.getLog(),
                    'CHEQUES_EMISSAO':       momentServer().format('YYYY-MM-DD'),
                    'CHEQUES_LANCADO':       momentServer().format('YYYY-MM-DD'),
                    'CHEQUES_VENCIMENTO':    vcto.format('YYYY-MM-DD'),
                    'CHEQUES_DEPOSITO':      '1899-12-30',
                    'CHEQUES_BAIXA':         geraBaixado ? vcto.format('YYYY-MM-DD') : '1899-12-30',
                    'CHEQUES_VALOR':         original,
                    'CHEQUES_STATUS':        geraBaixado ? 'P' : 'A'
                });
            });
    
            store.setData(dataCheques);
    
            setTimeout(() => {
                this.lookup('numero0').focus(true);
            }, 250);
        }
    },

    onConfirmarClick: function(btn, e) {
        callback = typeof e == 'function' ? e : undefined;

        const formMovimento = this.getView().up('formnotaconsumidor');
        const cheques = this.lookup('cheques').getStore().data.items;
        const vmMovimento = formMovimento.getViewModel();
        const movimento = vmMovimento.get('model');
        
        this.localData = [];

        if(cheques.some(cheque => {
            return cheque.get('CHEQUES_ID_BANCOS') == 0 ||
                  !cheque.get('CHEQUES_AGENCIA')        ||
                  !cheque.get('CHEQUES_CONTA')          ||
                  !cheque.get('CHEQUES_NUMERO')   
        }, 0)) {
            Ext.Note('warning', 'Preencha as informações de todos os cheques');
            return false;
        }
        
        const jsonItems = cheques.map((cheque, index) => {
            cheque.getFields()
                .filter(field => field.type == 'nodejsdate')
                .map(field => {
                    cheque.set(field.name, momentTz(cheque.get(field.name)).format('YYYY-MM-DD'));
                });
            cheque.set('CHEQUES_CEP', (cheque.get('CHEQUES_CEP') || '').replace(/-/ig, ''));
            return SamosUtils.Json.trocarAspasDuplasPorDuasSimples(cheque.data);
        });

        movimento.set({
            'MOVIMENTOS_CHEQUES': jsonItems,
            'MOVIMENTOS_ID_PRAZOS': this.getViewModel().get('model.MOVIMENTOS_ID_PRAZOS'),
            'PRAZOS_NOME': this.getViewModel().get('model.PRAZOS_NOME'),
            'PRAZOS_PARCELAS': this.getViewModel().get('model.PRAZOS_PARCELAS')
        });

        vmMovimento.set('chequesLocalData', this.localData);
        
        if(btn.getText() == 'Gravar'){
            callback();
        } else {
            this.onSairClick();
        }
    },

    onGravarClick: function(btn, e) {
        const formMovimento = this.getView().up('formnotaconsumidor');
        const ctrlMovimento = formMovimento.getController();
        const movimento = ctrlMovimento.getRecord();
            
        this.onConfirmarClick(btn, () => {
            Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                if (btn == 'yes') {
                    this.getView().initGauge('Gravando...');
                    ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento);

                    if(
                        NotaConsumidor.services.Caixa.financeiroValido()
                    ) {
                        movimento.set({
                            'MOVIMENTOS_LOG': SamosUtils.Info.getLog(),
                            'MOVIMENTOS_STATUS': 'F'
                        });

                        const btnCaixa = formMovimento.down('button[text="Caixa"]');
        
                        if(btnCaixa) {
                            btnCaixa.getEl().dom.style.backgroundColor = '';
                            btnCaixa.getEl().dom.querySelector('.x-btn-inner').style.color = '';
                        }

                        const temEntradaSaida = momentTz(movimento.get('MOVIMENTOS_ENTRADASAIDA') || '1899-12-30').isAfter('1900-01-01');

                        if(!temEntradaSaida) {
                            movimento.set('MOVIMENTOS_ENTRADASAIDA', momentServer().format('YYYY-MM-DD'));
                        }
                    }

                    const btnCheques = Ext.$('formnotaconsumidorcaixa')[0].down('button[text="Cheques"]');
        
                    if(btnCheques) {
                        btnCheques.getEl().dom.style.backgroundColor = '';
                        btnCheques.getEl().dom.querySelector('.x-btn-inner').style.color = '';
                    }
                    
                    movimento.save()
                        .then(ctrlMovimento.onGravacaoSucesso.bind(ctrlMovimento))
                        .catch(ctrlMovimento.onGravacaoFalha.bind(ctrlMovimento))
                        .finally(() => {
                            ctrlMovimento.aposGravar.call(ctrlMovimento);
                            this.onSairClick();
                        });
                }
            });
        });
    },

    getRecord: function() {
        return this.getViewModel().get('model');
    },

    validateModel: function() {
        const ctrlMovimento = this.getView().up('formnotaconsumidor').getController();
        
        return ctrlMovimento.validateModel(arguments);
    }
});
