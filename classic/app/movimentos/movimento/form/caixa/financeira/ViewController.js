Ext.define('SamosAdmin.movimentos.movimento.form.caixa.financeira.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.formmovimentoscaixafinanceira',

    onAlterarClick: function() {
        this.getViewModel().set('readOnly', false);
    },

    onConfirmarClick: function(btn, e) {
        const financeira = this.getViewModel().get('model');

        if(this.validarFinanceira(financeira)) {
            const movimento       = this.getViewModel().get('movimento');
            const dataFinanceiro  = movimento.get('MOVIMENTOS_FINANCEIROS') || [];
            const titulos = dataFinanceiro.filter(titulo => {
                return (
                    titulo['PESSOAS_TIPO'] != configs.getFinanceiros().tipoFinanceira &&
                    titulo['FINANCEIROS_ID_PESSOAS'] != '999999'
                );
            });
            const callback = typeof e == 'function' ? e : undefined;
    
            financeira.set({
                'FINANCEIROS_PARCELA': financeira.get('FINANCEIROS_PARCELAS'),
                'FINANCEIROS_ABERTO' : financeira.get('FINANCEIROS_ORIGINAL')
            });
    
            financeira.getFields()
                .filter(field => field.type == 'nodejsdate')
                .map(field => {
                    financeira.set(field.name, momentTz(financeira.get(field.name)).format('YYYY-MM-DD'));
                });
    
            titulos.push(financeira.data);
            movimento.set('MOVIMENTOS_FINANCEIROS', titulos);
            movimento.set('MOVIMENTOS_BASEST', financeira.get('FINANCEIROS_ORIGINAL'));
            
            if(btn.getText() == 'Gravar'){
                callback();
            } else {
                this.onSairClick();
            }
        }
    },

    validarFinanceira: function(financeira){
        const idFinanceira = financeira.get('FINANCEIROS_ID_PESSOAS');
        const nomeFinanceira = (financeira.get('PESSOAS_NOME') || '').toUpperCase();
        const tipoPessoa = financeira.get('PESSOAS_TIPO');
        const nomePesquisado = (this.lookup('pessoa').getSearchedId() || '').toString().toUpperCase();

        if (!idFinanceira || idFinanceira == '999999' || (nomeFinanceira != nomePesquisado)) {
            Ext.Note('warning', 'Pesquise a financeira');
            this.lookup('pessoa').focus(true);
            return false;
        } else if(tipoPessoa != configs.getFinanceiros().tipoFinanceira) {
            Ext.Note('warning', 'Pesquisa uma pessoa do tipo "Financeira"');
            this.lookup('pessoa').focus(true);
            return false;
        } else if(financeira.get('FINANCEIROS_PARCELAS') < 1) {
            Ext.Note('warning', 'Informe o número de parcelas');
            this.lookup('parcelas').focus(true);
            return false;
        } else if(
            momentTz(this.lookup('vcto').getValue()).hours(0).minutes(0).seconds(0)
            .isBefore(momentServer().hours(0).minutes(0).seconds(0))
        ) {
            Ext.Note('warning', 'Informe um vencimento válido');
            this.lookup('vcto').focus(true);
            return false;
        } else if(financeira.get('FINANCEIROS_ORIGINAL') > financeira.get('FINANCEIROS_TOTAL')){
            Ext.Note('warning', 'A partida deve ser menor que o valor total');
            this.lookup('partida').setValue(financeira.get('FINANCEIROS_TOTAL'))
            this.lookup('partida').focus(true);
            return false;
        } else if(financeira.get('FINANCEIROS_OBSERVACOES') == '') {    
            Ext.Note('warning', 'Informe o número do contrato');
            this.lookup('observacoes').focus(true);
        } else {
            return true;
        }
    },

    onGravarClick: function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento     = ctrlMovimento.getRecord();
            
        this.onConfirmarClick(btn, () => {
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

                    const btnFinanceira = Ext.$('formmovimentoscaixa')[0].down('button[text="Financeira"]');
        
                    if(btnFinanceira) {
                        btnFinanceira.getEl().dom.style.backgroundColor = '';
                        btnFinanceira.getEl().dom.querySelector('.x-btn-inner').style.color = '';
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
    }
});
