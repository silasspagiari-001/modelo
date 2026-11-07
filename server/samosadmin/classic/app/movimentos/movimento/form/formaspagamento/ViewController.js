Ext.define('SamosAdmin.movimentos.movimento.form.formaspagamento.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentosformaspagamento',
    
    getCoeficiente: function(parcelas){
        const coeficientes = configs.getMovimentos().partida.coeficiente.split('#');
        const coef = coeficientes[parcelas - 1] ? coeficientes[parcelas - 1].toString().replace(',', '.') : '';
        return coef > 0 ? coef : 1;
    },

    calcularParcelasCredito: function() {
        this.calcularParcelas('credito');
    },

    calcularParcelasCarne: function() {
        this.calcularParcelas('carne');
    },

    calcularParcelasChequePre: function() {
        this.calcularParcelas('chequepre');
    },

    calcularParcelas: function(tipo) {
        const vm = this.getViewModel();

        if(vm.get('readOnly')){ return; }
        if(
            configs.getMovimentos().partida && configs.getMovimentos().partida.coeficiente
        ) {
            const formaPagamento = vm.get('model');
            const valor = cents(formaPagamento.get('MOVIMENTOSFORMAS_' + (tipo == 'carne' ? 'DUPLICATA' : tipo.toUpperCase())));
            const campoVct = 'MOVIMENTOSFORMAS_VCT' + (tipo == 'carne' ? 'DUPLICATA' : tipo.toUpperCase());
            const txtParcelas = this.lookup('parcelas' + tipo);

            let parcelas = txtParcelas.getValue();

            if(!valor){
                if(tipo != 'credito') { formaPagamento.set(campoVct, '1899-12-30'); }
                txtParcelas.setValue('');
                parcelas = 0;
            } else {
                if(tipo != 'credito' && formaPagamento.get(campoVct) && momentTz(formaPagamento.get(campoVct)).year() == '1899'){
                    formaPagamento.set(campoVct, momentServer().add(30, 'days').format('YYYY-MM-DD'));
                }
                if(!parcelas){
                    parcelas = 10;
                    txtParcelas.setValue(parcelas);
                }
            }
            
            if(tipo != 'financeira' && tipo != 'carne') {
                const vlrParcela = valor / parcelas;
                formaPagamento.set('MOVIMENTOSFORMAS_VLR' + (tipo == 'carne' ? 'DUPLICATA' : tipo.toUpperCase()), vlrParcela / 100);
            }

        } else {
            Ext.Note('warning', 'Coeficiente não informado nas configurações');
        }
    },

    validarValorCredito: function() {
        this.validarValor('credito');
    },

    validarValorCreditoPessoa: function() {
        const vm = this.getViewModel();

        if(vm.get('readOnly')){ return; }
        const formaPagamento = vm.get('model');
        const formMovimento = this.getView().up('formmovimentos');
        const movimento = formMovimento.getViewModel().get('model');

        const creditoDisponivel = cents(movimento.get('PESSOAS_CREDITO'));
        const creditoUtilizado  = cents(formaPagamento.get('MOVIMENTOS_VALORIPI'));

        if(creditoUtilizado > creditoDisponivel) {
            formaPagamento.set('MOVIMENTOS_VALORIPI', 0);
            Ext.Note('warning', 'Crédito Disponível Excedido: ' + Ext.util.Format.maskRenderer('R$ #9.990,00', true)(creditoDisponivel / 100));
            setTimeout(() => {
                this.lookup('creditopessoa').focus(true);
            }, 100);    
        }

    },

    validarValorCarne: function() {
        const vm = this.getViewModel();

        if(vm.get('readOnly')){ return; }
        const formaPagamento = vm.get('model');
        const valor = cents(formaPagamento.get('MOVIMENTOSFORMAS_DUPLICATA'));
        const txtParcelas = this.lookup('parcelascarne');
        
        let parcelas = txtParcelas.getValue();

        if(!valor){
            formaPagamento.set('MOVIMENTOSFORMAS_VCTDUPLICATA', '1899-12-30');
            txtParcelas.setValue('');
            this.lookup('parcelacarne').setValue(0);
            formaPagamento.set('MOVIMENTOSFORMAS_VLRDUPLICATA', 0);
        } else {
            if(formaPagamento.get('MOVIMENTOSFORMAS_VCTDUPLICATA') && momentTz(formaPagamento.get('MOVIMENTOSFORMAS_VCTDUPLICATA')).year() == '1899'){
                formaPagamento.set('MOVIMENTOSFORMAS_VCTDUPLICATA', momentServer().add(30, 'days').format('YYYY-MM-DD'));
            }
            if(!parcelas){
                parcelas = 10;
                txtParcelas.setValue(parcelas);
            }

        } 
    },

    validarValorChequePre: function() {
        this.validarValor('chequepre');
    },

    validarValorFinanceira: function() {
        const vm = this.getViewModel();

        if(vm.get('readOnly')){ return; }
        const formaPagamento = vm.get('model');
        const valor = cents(formaPagamento.get('MOVIMENTOSFORMAS_FINANCEIRA'));
        const txtParcelas = this.lookup('parcelasfinanceira');
        
        let parcelas = txtParcelas.getValue();

        if(!valor){
            formaPagamento.set('MOVIMENTOSFORMAS_VCTFINANCEIRA', '1899-12-30');
            txtParcelas.setValue('');
            this.lookup('parcelafinanceira').setValue(0);
            formaPagamento.set('MOVIMENTOSFORMAS_VLRFINANCEIRA', 0);
        } else {
            if(formaPagamento.get('MOVIMENTOSFORMAS_VCTFINANCEIRA') && momentTz(formaPagamento.get('MOVIMENTOSFORMAS_VCTFINANCEIRA')).year() == '1899'){
                formaPagamento.set('MOVIMENTOSFORMAS_VCTFINANCEIRA', momentServer().add(30, 'days').format('YYYY-MM-DD'));
            }
            if(!parcelas){
                parcelas = 10;
                txtParcelas.setValue(parcelas);
            }
        }
    },

    validarValor: function(tipo){
        if(this.getViewModel().get('readOnly')){ return; }

        if(
            configs.getMovimentos().partida && configs.getMovimentos().partida.coeficiente
        ) {
            const formaPagamento = this.getViewModel().get('model');
            const valor = cents(formaPagamento.get('MOVIMENTOSFORMAS_' + (tipo == 'carne' ? 'DUPLICATA' : tipo.toUpperCase())));
            const parcela = cents(formaPagamento.get('MOVIMENTOSFORMAS_VLR' + (tipo == 'carne' ? 'DUPLICATA' : tipo.toUpperCase())));
            const txtParcelas = this.lookup('parcelas' + tipo);

            let parcelas = txtParcelas.getValue();

            if(parcela != 0 || valor > 0){
                if(valor == 0){
                    Ext.Note('warning', 'Digite o valor integral primeiro');
                    formaPagamento.set('MOVIMENTOSFORMAS_VLR' + (tipo == 'carne' ? 'DUPLICATA' : tipo.toUpperCase()), 0);
                    setTimeout(() => {
                        this.lookup(tipo).focus(true);
                    }, 100);

                } else if(!parcelas){
                    Ext.Note('warning', 'Digite o número de parcelas primeiro');
                    formaPagamento.set('MOVIMENTOSFORMAS_VLR' + (tipo == 'carne' ? 'DUPLICATA' : tipo.toUpperCase()), 0);
                    setTimeout(() => {
                        this.lookup('parcelas' + tipo).focus(true);
                    }, 100);
                } else {
                    const valorMinimo = Math.round(valor / parcelas);
                    if(parcela < valorMinimo){
                        formaPagamento.set('MOVIMENTOSFORMAS_VLR' + (tipo == 'carne' ? 'DUPLICATA' : tipo.toUpperCase()), valorMinimo / 100);
                        Ext.Note('warning', 'Valor Mínimo: ' + Ext.util.Format.maskRenderer('R$ #9.990,00', true)(valorMinimo / 100));
                        setTimeout(() => {
                            this.lookup('parcela' + tipo).focus(true);
                        }, 100);
                    }
                }
            }
        }
    },

    onGravarClick: function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = formMovimento.getViewModel().get('model');
        
        this.validarCabecalho()
            .then(() => Movimento.services.FormasPagamento.validar({
                obrigatorio: true,
                validarValor: 'liquido'
            }))
            .then(valido => {
                if(valido) {
                    Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                        if (btn == 'yes') {
                            this.getView().initGauge('Gravando...');
                            
                            movimento.set({
                                'MOVIMENTOS_LOG': SamosUtils.Info.getLog()
                            });
                            
                            ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento);
                            movimento.save()
                                .then(ctrlMovimento.onGravacaoSucesso.bind(ctrlMovimento))
                                .catch(ctrlMovimento.onGravacaoFalha.bind(ctrlMovimento))
                                .finally(() => {
                                    ctrlMovimento.aposGravar.call(ctrlMovimento);
                                    ctrlMovimento.setReadOnly.call(this, true);
                                    Ext.defer(this.onSairClick, 100, this);
                                });
                        }
                    });
                }
            });
    },

    onCancelarClick: function(btn, event) {
        this.getViewModel().set('model', undefined);
        this.cancelar();
    }
});