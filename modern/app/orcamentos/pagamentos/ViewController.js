Ext.define('SamosAdminModern.orcamentos.pagamentos.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.orcamentospagamentos',

    showButtons: function() {
        const main = this.getView().up('main');
        main.down('image[reference="logo"]').hide();
    },

    onCancelarClick: function () {
        const vm = this.getViewModel();

        vm.get('model').set(vm.get('initialValues'));
        
        this.onVoltarClick();
    },

    onConfirmarClick: async function () {
        const vm = this.getViewModel();
        const formaPagamento = vm.get('model.MOVIMENTOS_FORMASPAGAMENTO')[0];
        const valorRestante = cents(vm.get('valorRestante')) / 100;

        if(valorRestante != 0) {
            return await SamosUtils.Msg.alert('Valor Restante', `O valor restante é de ${Ext.util.Format.currency(valorRestante)}`);
        }

        vm.set('initialValues', vm.get('model').data);

        formaPagamento['MOVIMENTOSFORMAS_DINHEIRO']       = cents(this.lookup('dinheiro').getValue()) / 100;
        formaPagamento['MOVIMENTOSFORMAS_DEBITO']         = cents(this.lookup('debito').getValue()) / 100;
        formaPagamento['MOVIMENTOSFORMAS_CHEQUE']         = cents(this.lookup('cheque').getValue()) / 100;
        formaPagamento['MOVIMENTOSFORMAS_CREDITO']        = cents(this.lookup('credito').getValue()) / 100;
        formaPagamento['MOVIMENTOSFORMAS_VLRCREDITO']     = cents(this.lookup('valorparcelacredito').getValue()) / 100;
        formaPagamento['MOVIMENTOSFORMAS_FINANCEIRA']     = cents(this.lookup('financeira').getValue()) / 100;
        formaPagamento['MOVIMENTOSFORMAS_VLRFINANCEIRA']  = cents(this.lookup('valorparcelafinanceira').getValue()) / 100;
        formaPagamento['MOVIMENTOSFORMAS_CHEQUEPRE']      = cents(this.lookup('chequepre').getValue()) / 100;
        formaPagamento['MOVIMENTOSFORMAS_VLRCHEQUEPRE']   = cents(this.lookup('valorparcelachequepre').getValue()) / 100;
        formaPagamento['MOVIMENTOSFORMAS_DUPLICATA']      = cents(this.lookup('duplicata').getValue()) / 100;
        formaPagamento['MOVIMENTOSFORMAS_VLRDUPLICATA']   = cents(this.lookup('valorparceladuplicata').getValue()) / 100;
        formaPagamento['MOVIMENTOSFORMAS_TRANSFERENCIAS'] = cents(this.lookup('transferencias').getValue()) / 100;

        vm.set('model.MOVIMENTOS_FORMASPAGAMENTO', [formaPagamento]);

        this.onVoltarClick();
    },

    onVoltarClick: function() {
        const main = this.getView().up('main');
        
        main.down('panel').setActiveItem('orcamentosform');
        main.down('container[reference="title"]').setHtml('Orçamento');
        
        const readOnly = main.down('panel').getActiveItem().getViewModel().get('readOnly');
        const status = main.down('panel').getActiveItem().getViewModel().get('model.MOVIMENTOS_STATUS')

        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: !readOnly || status != 'N',
            hideAlterar: !readOnly || status != 'N',
            hideGravar : readOnly,
            hideNovo   : true
        });

        Ext.defer(() => {
            this.getView().query('field')
                .map(field => {
                    try { field.el.dom.querySelector('input').style.backgroundColor = 'transparent' } catch (e) {}
                })
        }, 100)
    },

    calcularValorRestante: function () {
        const vm = this.getViewModel();

        const total = cents(vm.get('model.MOVIMENTOS_TOTAL'));

        const valorDinheiro       = cents((this.lookup('dinheiro').el.dom.querySelector('input').value       || '0,00').replace(/\./ig, '').replace(/,/ig, '.'));
        const valorDebito         = cents((this.lookup('debito').el.dom.querySelector('input').value         || '0,00').replace(/\./ig, '').replace(/,/ig, '.'));
        const valorCheque         = cents((this.lookup('cheque').el.dom.querySelector('input').value         || '0,00').replace(/\./ig, '').replace(/,/ig, '.'));
        const valorCredito        = cents((this.lookup('credito').el.dom.querySelector('input').value        || '0,00').replace(/\./ig, '').replace(/,/ig, '.'));
        const valorFinanceira     = cents((this.lookup('financeira').el.dom.querySelector('input').value     || '0,00').replace(/\./ig, '').replace(/,/ig, '.'));
        const valorChequePre      = cents((this.lookup('chequepre').el.dom.querySelector('input').value      || '0,00').replace(/\./ig, '').replace(/,/ig, '.'));
        const valorDuplicata      = cents((this.lookup('duplicata').el.dom.querySelector('input').value      || '0,00').replace(/\./ig, '').replace(/,/ig, '.'));
        const valorTransferencias = cents((this.lookup('transferencias').el.dom.querySelector('input').value || '0,00').replace(/\./ig, '').replace(/,/ig, '.'));

        const valorRestante = total - valorDinheiro - valorDebito - valorCheque - valorCredito - valorFinanceira - valorChequePre - valorDuplicata - valorTransferencias;
        
        vm.set('valorRestante', Ext.util.Format.currency(valorRestante / 100));
    },
    
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
            const formaPagamento = vm.get('pagamento');
            const valor = cents((this.lookup(tipo == 'carne' ? 'duplicata' : tipo).getValue() || '').replace(/\./ig, '').replace(',', '.'));
            const campoVct = 'MOVIMENTOSFORMAS_VCT' + (tipo == 'carne' ? 'DUPLICATA' : tipo.toUpperCase());
            const txtParcelas = this.lookup('parcelas' + (tipo == 'carne' ? 'duplicata' : tipo));

            let parcelas = txtParcelas.getValue();

            if(!valor){
                if(tipo != 'credito') { formaPagamento[campoVct] = '1899-12-30'; }
                txtParcelas.suspendEvents();
                txtParcelas.setValue('');
                txtParcelas.resumeEvents();
                parcelas = 0;
            } else {
                if(tipo != 'credito' && formaPagamento[campoVct] && momentTz(formaPagamento[campoVct]).year() == '1899'){
                    formaPagamento[campoVct] = momentServer().add(30, 'days').format('YYYY-MM-DD');
                }
                if(!parcelas){
                    parcelas = 10;
                    txtParcelas.suspendEvents();
                    txtParcelas.setValue(parcelas);
                    txtParcelas.resumeEvents();
                }
            }
            
            if(tipo != 'financeira' && tipo != 'carne') {
                const vlrParcela = valor / parcelas;
                formaPagamento['MOVIMENTOSFORMAS_VLR' + (tipo == 'carne' ? 'DUPLICATA' : tipo.toUpperCase())] = vlrParcela / 100;
                vm.set(`valorParcela${SamosUtils.String.toPascalCase(tipo)}`, Ext.util.Format.currency(vlrParcela / 100));
            }

        } else {
            SamosUtils.Msg.alert('Atenção', 'Coeficiente não informado nas configurações');
        }
    },

    validarValorCredito: function() {
        this.validarValor('credito');
    },

    validarValorCarne: function() {
        const vm = this.getViewModel();

        if(vm.get('readOnly')){ return; }

        const formaPagamento = vm.get('pagamento');
        const valor = cents((this.lookup('duplicata').getValue() || '').replace(/\./ig, '').replace(',', '.'));
        const txtParcelas = this.lookup('parcelasduplicata');
        
        let parcelas = txtParcelas.getValue();

        if(!valor){
            formaPagamento['MOVIMENTOSFORMAS_VCTDUPLICATA'] = '1899-12-30';
            txtParcelas.suspendEvents();
            txtParcelas.setValue('');
            txtParcelas.resumeEvents();
            this.lookup('parcelasduplicata').suspendEvents();
            this.lookup('parcelasduplicata').setValue(0);
            this.lookup('parcelasduplicata').resumeEvents();
            formaPagamento['MOVIMENTOSFORMAS_VLRDUPLICATA'] = 0;
            vm.set(`valorParcelaDuplicata`, Ext.util.Format.currency(0));
        } else {
            if(formaPagamento['MOVIMENTOSFORMAS_VCTDUPLICATA'] && momentTz(formaPagamento['MOVIMENTOSFORMAS_VCTDUPLICATA']).year() == '1899'){
                formaPagamento['MOVIMENTOSFORMAS_VCTDUPLICATA'] = momentServer().add(30, 'days').format('YYYY-MM-DD');
            }
            if(!parcelas){
                parcelas = 10;
                txtParcelas.suspendEvents();
                txtParcelas.setValue(parcelas);
                txtParcelas.resumeEvents();
            }
        }
    },

    validarValorChequePre: function() {
        this.validarValor('chequepre');
    },

    validarValorFinanceira: function() {
        const vm = this.getViewModel();

        if(vm.get('readOnly')){ return; }

        const formaPagamento = vm.get('pagamento');
        const valor = cents((this.lookup('financeira').getValue() || '').replace(/\./ig, '').replace(',', '.'));
        const txtParcelas = this.lookup('parcelasfinanceira');
        
        let parcelas = txtParcelas.getValue();

        if(!valor){
            formaPagamento['MOVIMENTOSFORMAS_VCTFINANCEIRA'] = '1899-12-30';
            txtParcelas.suspendEvents();
            txtParcelas.setValue('');
            txtParcelas.resumeEvents();
            this.lookup('parcelasfinanceira').suspendEvents();
            this.lookup('parcelasfinanceira').setValue(0);
            this.lookup('parcelasfinanceira').resumeEvents();
            formaPagamento['MOVIMENTOSFORMAS_VLRFINANCEIRA'] = 0;
            vm.set(`valorParcelaFinanceira`, Ext.util.Format.currency(0));
        } else {
            if(formaPagamento['MOVIMENTOSFORMAS_VCTFINANCEIRA'] && momentTz(formaPagamento['MOVIMENTOSFORMAS_VCTFINANCEIRA']).year() == '1899'){
                formaPagamento['MOVIMENTOSFORMAS_VCTFINANCEIRA'] = momentServer().add(30, 'days').format('YYYY-MM-DD');
            }
            if(!parcelas){
                parcelas = 10;
                txtParcelas.suspendEvents();
                txtParcelas.setValue(parcelas);
                txtParcelas.resumeEvents();
            }
        }
    },

    validarValor: async function(tipo){
        const vm = this.getViewModel();

        if(vm.get('readOnly')){ return; }

        if(
            configs.getMovimentos().partida && configs.getMovimentos().partida.coeficiente
        ) {
            const formaPagamento = vm.get('pagamento');
            const valor = cents(this.lookup(tipo == 'carne' ? 'duplicata' : tipo).getValue().replace(/\./ig, '').replace(',', '.'));
            const parcela = cents(this.lookup(`valorparcela${tipo == 'carne' ? 'duplicata' : tipo}`).getValue().replace(/\./ig, '').replace(',', '.'));
            const txtParcelas = this.lookup('parcelas' + tipo);

            let parcelas = txtParcelas.getValue();

            if(parcela != 0 || valor > 0){
                if(valor == 0){
                    await SamosUtils.Msg.alert('Atenção', 'Digite o valor integral primeiro');
                    formaPagamento['MOVIMENTOSFORMAS_VLR' + (tipo == 'carne' ? 'DUPLICATA' : tipo.toUpperCase())] = 0;
                    this.lookup(`valorparcela${tipo == 'carne' ? 'duplicata' : tipo}`).setValue('0,00')
                    setTimeout(() => {
                        this.lookup(tipo).focus(true);
                    }, 100);
                } else if(!parcelas){
                    await SamosUtils.Msg.alert('Atenção', 'Digite o número de parcelas primeiro');
                    formaPagamento['MOVIMENTOSFORMAS_VLR' + (tipo == 'carne' ? 'DUPLICATA' : tipo.toUpperCase())] = 0;
                    this.lookup(`valorparcela${tipo == 'carne' ? 'duplicata' : tipo}`).setValue('0,00')
                    setTimeout(() => {
                        this.lookup('parcelas' + tipo).focus(true);
                    }, 100);
                } else {
                    const valorMinimo = Math.round(valor / parcelas);

                    if(parcela < valorMinimo){
                        formaPagamento['MOVIMENTOSFORMAS_VLR' + (tipo == 'carne' ? 'DUPLICATA' : tipo.toUpperCase())] = valorMinimo / 100;
                        vm.set(`valorParcela${SamosUtils.String.toPascalCase(tipo)}`, Ext.util.Format.currency(valorMinimo / 100));
                        await SamosUtils.Msg.alert('Atenção', 'Valor Mínimo: ' + Ext.util.Format.maskRenderer('R$ #9.990,00', true)(valorMinimo / 100));
                        setTimeout(() => {
                            this.lookup('valorparcela' + tipo).focus(true);
                        }, 100);}
                }
            }
        }
    }
});
