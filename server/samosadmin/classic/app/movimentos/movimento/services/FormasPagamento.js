Ext.define('SamosAdmin.movimentos.movimento.services.FormasPagamento', {
    alternateClassName: 'Movimento.services.FormasPagamento',
    singleton: true,

    validar: function(opcoes) {
        const form = Ext.$('formmovimentos')[0];
        const comFormasPagamento = form.getViewModel().get('formasDePagamento');
        const obrigatorio = opcoes.obrigatorio;
        
        if(comFormasPagamento) {
            const valido = this.valido(opcoes);

            if(valido) {
                this.finalizar();
                return true;
            } else if(!valido) {
                if(obrigatorio){
                    if(!opcoes.naoExibir){
                        this.exibir();
                    }
                    return false;
                } else {
                    this.limpar();
                    return true;
                }
            }
        } else {
            opcoes.obrigatorio = false;
            const valido = this.valido(opcoes);

            if(valido) {
                this.finalizar();
                return true;
            } else {
                this.limpar();
                return true;
            }
        }
    },

    valido: function(opcoes) {
        return this.existe() && this.verificado(opcoes);
    },

    existe: function() {
        return !!this.getFormasPagamento();
    },

    verificado: function(opcoes) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const totalMovimento = cents(movimento.get('MOVIMENTOS_TOTAL'));
        const validarValor = opcoes.validarValor;
        const obrigatorio = opcoes.obrigatorio;
        const totalFormasPagamento = validarValor == 'liquido' ? this.obterTotal() : this.obterTotalComJuros();
        const formaPagamento = this.getFormasPagamento();
        const win = Ext.$('formmovimentosformaspagamento')[0];        

        if(totalMovimento != totalFormasPagamento) {
            if(obrigatorio) { Ext.Note('warning', 'O valor do Pagamento (' + totalFormasPagamento + ') difere do valor Total (' + totalMovimento + ')'); }
            if(win) { win.focus(); }
            return false;
        } else if(
            cents(formaPagamento['MOVIMENTOSFORMAS_CREDITO']) > 0 && 
            !parseInt(formaPagamento['MOVIMENTOSFORMAS_PRCCREDITO'])
        ) {
            if(obrigatorio) { Ext.Note('warning', 'Informe o número de parcelas do cartão.');}
            if(win) { win.lookup('parcelascredito').focus(true); }
            return false;
        } else if(
            cents(formaPagamento['MOVIMENTOSFORMAS_VLRFINANCEIRA']) > 0 &&
            (
                !formaPagamento['MOVIMENTOSFORMAS_VCTFINANCEIRA'] ||
                momentTz(formaPagamento['MOVIMENTOSFORMAS_VCTFINANCEIRA']).year() == '1899'
            )
        ) {
            if(obrigatorio) { Ext.Note('warning', 'Informe o primeiro vencimento da financeira.'); }
            if(win) { win.lookup('vctofinanceira').focus(true); }
            return false;
        } else if(
            cents(formaPagamento['MOVIMENTOSFORMAS_VLRFINANCEIRA']) > 0 &&
            !parseInt(formaPagamento['MOVIMENTOSFORMAS_PRCFINANCEIRA'])
        ) {
            if(obrigatorio) { Ext.Note('warning', 'Informe o número de parcelas da financeira.'); }
            if(win) { win.lookup('parcelasfinanceira').focus(true); }
            return false;
        } else if(
            cents(formaPagamento['MOVIMENTOSFORMAS_FINANCEIRA']) > 0 &&
            (cents(formaPagamento['MOVIMENTOSFORMAS_VLRFINANCEIRA']) * parseInt(formaPagamento['MOVIMENTOSFORMAS_PRCFINANCEIRA'])) < cents(formaPagamento['MOVIMENTOSFORMAS_FINANCEIRA'])
        ) {
            Ext.Note('warning', 'Valor da parcela financeira abaixo do permitido.');
            if(win) { win.lookup('parcelafinanceira').focus(true); }
            return false;
        } else if(
            cents(formaPagamento['MOVIMENTOSFORMAS_FINANCEIRA'])    == 0 &&
            (cents(formaPagamento['MOVIMENTOSFORMAS_VLRFINANCEIRA']) > 0 || cents(formaPagamento['MOVIMENTOS_BASEST']) > 0)
        ) {
            if(obrigatorio) { Ext.Note('warning', 'Informe o valor da financeira.'); }
            if(win) { win.lookup('financeira').focus(true); }
            return false;
        } else if(
            cents(formaPagamento['MOVIMENTOSFORMAS_FINANCEIRA']) > 0 &&
            cents(formaPagamento['MOVIMENTOS_BASEST']) ==  0 && win
        ) {
            if(obrigatorio) { Ext.Note('warning', 'Informe o valor da partida financeira.'); }
            if(win) { win.lookup('partida').focus(true); }
            return false;
        } else if(
            cents(formaPagamento['MOVIMENTOSFORMAS_FINANCEIRA']) > 0 &&
            cents(formaPagamento['MOVIMENTOS_BASEST']) > 0 &&
            cents(formaPagamento['MOVIMENTOS_BASEST']) > cents(formaPagamento['MOVIMENTOSFORMAS_FINANCEIRA']) && win
        ) {
            if(obrigatorio) { Ext.Note('warning', 'Valor da partida maior que valor financeira - não permitido.'); }
            if(win) { win.lookup('partida').focus(true); }
            return false;
        } else if(
            cents(formaPagamento['MOVIMENTOSFORMAS_DUPLICATA']) > 0 &&
            (
                !formaPagamento['MOVIMENTOSFORMAS_VCTDUPLICATA'] ||
                momentTz(formaPagamento['MOVIMENTOSFORMAS_VCTDUPLICATA']).year() == '1899'
            )
        ) {
            if(win) { win.lookup('vctocarne').focus(true); }
            if(obrigatorio) { Ext.Note('warning', 'Informe o primeiro vencimento do carnê.'); }
            return false;
        } else if(
            cents(formaPagamento['MOVIMENTOSFORMAS_DUPLICATA']) > 0 &&
            !parseInt(formaPagamento['MOVIMENTOSFORMAS_PRCDUPLICATA'])
        ) {
            if(obrigatorio) { Ext.Note('warning', 'Informe o número de parcelas do carnê.'); }
            if(win) { win.lookup('parcelascarne').focus(true); }
            return false;
        } else if(
            cents(formaPagamento['MOVIMENTOSFORMAS_DUPLICATA']) > 0 &&
            ((cents(formaPagamento['MOVIMENTOSFORMAS_VLRDUPLICATA']) * parseInt(formaPagamento['MOVIMENTOSFORMAS_PRCDUPLICATA'])) < cents(formaPagamento['MOVIMENTOSFORMAS_DUPLICATA']) || 
             (cents(formaPagamento['MOVIMENTOSFORMAS_VLRDUPLICATA']) * parseInt(formaPagamento['MOVIMENTOSFORMAS_PRCDUPLICATA'])) > (cents(formaPagamento['MOVIMENTOSFORMAS_DUPLICATA']) + 1000))
        ) {
            Ext.Note('warning', 'Valor da parcela carnê acima ou abaixo do permitido.');
            if(win) { win.lookup('parcelacarne').focus(true); }
            return false;
        } else if(
            cents(formaPagamento['MOVIMENTOSFORMAS_CHEQUEPRE']) > 0  &&
            (
                !formaPagamento['MOVIMENTOSFORMAS_VCTCHEQUEPRE'] ||
                momentTz(formaPagamento['MOVIMENTOSFORMAS_VCTCHEQUEPRE']).year() == '1899'
            )
        ) {
            if(win) { win.lookup('vctochequepre').focus(true); }
            if(obrigatorio) { Ext.Note('warning', 'Informe o primeiro vencimento do cheque pré.'); }
            return false;
        } else if(
            cents(formaPagamento['MOVIMENTOSFORMAS_CHEQUEPRE']) > 0 &&
            !parseInt(formaPagamento['MOVIMENTOSFORMAS_PRCCHEQUEPRE'])
        ) {
            if(obrigatorio) { Ext.Note('warning', 'Informe o número de parcelas do cheque pré.'); }
            if(win) { win.lookup('parcelaschequepre').focus(true); }
            return false;
        } else {
            return true;
        }


    },

    getFormasPagamento: function() {
        const janelaFormasPagamento = Ext.$('formmovimentosformaspagamento')[0];
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const listFormasPagamentos = movimento.get('MOVIMENTOS_FORMASPAGAMENTO');

        if(janelaFormasPagamento && janelaFormasPagamento.isVisible(true) && janelaFormasPagamento.getViewModel().get('model')){
            return janelaFormasPagamento.getViewModel().get('model').data;
        } else if(listFormasPagamentos && listFormasPagamentos[0]){
            return listFormasPagamentos[0];
        } else {
            return {};
        }
    },

    obterTotal: function() {
        const formaPagamento = this.getFormasPagamento();

        return (
            (cents(formaPagamento['MOVIMENTOSFORMAS_DINHEIRO'])       || 0) +
            (cents(formaPagamento['MOVIMENTOSFORMAS_DEBITO'])         || 0) +
            (cents(formaPagamento['MOVIMENTOSFORMAS_CHEQUE'])         || 0) +
            (cents(formaPagamento['MOVIMENTOSFORMAS_CREDITO'])        || 0) +
            (cents(formaPagamento['MOVIMENTOSFORMAS_CHEQUEPRE'])      || 0) +
            (cents(formaPagamento['MOVIMENTOSFORMAS_DUPLICATA'])      || 0) +
            (cents(formaPagamento['MOVIMENTOSFORMAS_TRANSFERENCIAS']) || 0) +
            (cents(formaPagamento['MOVIMENTOS_VALORIPI'])             || 0) +
            (cents(formaPagamento['MOVIMENTOSFORMAS_FINANCEIRA'])     || 0)
        );
    },

    obterTotalComJuros: function() {
        const formaPagamento  = this.getFormasPagamento();

        const parceladoCredito    = ((cents(formaPagamento['MOVIMENTOSFORMAS_VLRCREDITO']) || 0)    * (parseInt(formaPagamento['MOVIMENTOSFORMAS_PRCCREDITO'])    || 1));
        const parceladoChequePre  = ((cents(formaPagamento['MOVIMENTOSFORMAS_VLRCHEQUEPRE'])  || 0) * (parseInt(formaPagamento['MOVIMENTOSFORMAS_PRCCHEQUEPRE'])  || 1));

        const totalCredito    = cents(formaPagamento['MOVIMENTOSFORMAS_CREDITO']);
        const totalChequePre  = cents(formaPagamento['MOVIMENTOSFORMAS_CHEQUEPRE']);
        const totalDuplicata  = cents(formaPagamento['MOVIMENTOSFORMAS_DUPLICATA']);
        const totalFinanceira = cents(formaPagamento['MOVIMENTOSFORMAS_FINANCEIRA']);

        return (    
            (cents(formaPagamento['MOVIMENTOSFORMAS_DINHEIRO'])       || 0) +
            (cents(formaPagamento['MOVIMENTOSFORMAS_TRANSFERENCIAS']) || 0) +
            (cents(formaPagamento['MOVIMENTOSFORMAS_DEBITO'])         || 0) +
            (cents(formaPagamento['MOVIMENTOSFORMAS_CHEQUE'])         || 0) +
            (Math.abs(parceladoCredito    - totalCredito)    > 10 ? parceladoCredito    : totalCredito)   +
            (Math.abs(parceladoChequePre  - totalChequePre)  > 10 ? parceladoChequePre  : totalChequePre) +
            totalDuplicata +
            totalFinanceira
        );
    },

    finalizar: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const formaPagamento = this.getFormasPagamento();

        if(!formaPagamento['MOVIMENTOSFORMAS_CREDITO']) {
            formaPagamento['MOVIMENTOSFORMAS_CREDITO']    = 0;
            formaPagamento['MOVIMENTOSFORMAS_PRCCREDITO'] = 0;
            formaPagamento['MOVIMENTOSFORMAS_VLRCREDITO'] = 0;
        }
        if(!formaPagamento['MOVIMENTOSFORMAS_VLRFINANCEIRA']) {
            formaPagamento['MOVIMENTOSFORMAS_FINANCEIRA']    = 0;
            formaPagamento['MOVIMENTOSFORMAS_PRCFINANCEIRA'] = 0;
            formaPagamento['MOVIMENTOSFORMAS_VLRFINANCEIRA'] = 0;
            formaPagamento['MOVIMENTOSFORMAS_VCTFINANCEIRA'] = '1899-12-30';
        }
        if(!formaPagamento['MOVIMENTOSFORMAS_DUPLICATA']) {
            formaPagamento['MOVIMENTOSFORMAS_DUPLICATA']    = 0;
            formaPagamento['MOVIMENTOSFORMAS_PRCDUPLICATA'] = 0;
            formaPagamento['MOVIMENTOSFORMAS_VLRDUPLICATA'] = 0;
            formaPagamento['MOVIMENTOSFORMAS_VCTDUPLICATA'] = '1899-12-30';
        }
        if(!formaPagamento['MOVIMENTOSFORMAS_CHEQUEPRE']) {
            formaPagamento['MOVIMENTOSFORMAS_CHEQUEPRE']    = 0;
            formaPagamento['MOVIMENTOSFORMAS_PRCCHEQUEPRE'] = 0;
            formaPagamento['MOVIMENTOSFORMAS_VLRCHEQUEPRE'] = 0;
            formaPagamento['MOVIMENTOSFORMAS_VCTCHEQUEPRE'] = '1899-12-30';
        }

        if(cents(formaPagamento['MOVIMENTOS_BASEST']) > 0) {
            movimento.set('MOVIMENTOS_BASEST', formaPagamento['MOVIMENTOS_BASEST']);
        } else {
            movimento.set('MOVIMENTOS_BASEST', 0);
        }

        if(cents(formaPagamento['MOVIMENTOS_VALORIPI']) > 0) {
            movimento.set('MOVIMENTOS_VALORIPI', formaPagamento['MOVIMENTOS_VALORIPI']);
        } else {
            movimento.set('MOVIMENTOS_VALORIPI', 0);
        }

        this.formatarDatas(formaPagamento);
        this.removerCamposLocais(formaPagamento);
        movimento.set('MOVIMENTOS_FORMASPAGAMENTO', [formaPagamento]);

        this.calcularPartida(); 
    },

    formatarDatas: function(formaPagamento) {
        const camposDeData = [
            'MOVIMENTOSFORMAS_VCTCHEQUEPRE', 
            'MOVIMENTOSFORMAS_VCTDUPLICATA', 
            'MOVIMENTOSFORMAS_VCTFINANCEIRA'
        ];

        camposDeData.forEach(campo => {
            formaPagamento[campo] = momentTz(formaPagamento[campo]).format('YYYY-MM-DD');
        });
    },

    removerCamposLocais: function(formaPagamento) {
        Object.keys(formaPagamento).filter(campo => {
            return campo.split('_')[0] != 'MOVIMENTOSFORMAS';
        }).forEach(campo => {
            delete formaPagamento[campo];
        });
    },

    exibir: function() {
        const janelaFormasPagamento = Ext.$('formmovimentosformaspagamento')[0];

        if(!janelaFormasPagamento) {
            this.criarJanela();
        }
    },
    
    criarJanela: function (btn, e) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const formaPagamentoExistente = movimento.get('MOVIMENTOS_FORMASPAGAMENTO')[0] || {};

        if(!formaPagamentoExistente['MOVIMENTOSFORMAS_ID']) {
            formaPagamentoExistente['MOVIMENTOSFORMAS_ID'] = -1;
        }

        const formaPagamento = Ext.create(
            'SamosAdmin.movimentos.movimento.ModelFormaPagamento', 
            Ext.Object.merge({}, formaPagamentoExistente)
        );
        
        const viewFormasPagamento = Ext.create({
            xtype: 'formmovimentosformaspagamento'
        });

        const readOnly = form.getViewModel().get('readOnly') && Movimento.services.FormasPagamento.verificado({
            obrigatorio: false,
            validarValor: 'bruto'
        });
        
        if(!readOnly){
            const produtos = movimento.get('MOVIMENTOS_ITENS') || [];
            
            produtos.forEach(produto => {
                produto['MOVIMENTOSITENS_IMPOSTO'] = produto['MOVIMENTOSITENS_TOTAL'];
            });
        }

        formaPagamento.set('MOVIMENTOS_BASEST', movimento.get('MOVIMENTOS_BASEST'));
        formaPagamento.set('MOVIMENTOS_VALORIPI', movimento.get('MOVIMENTOS_VALORIPI'));

        viewFormasPagamento.getViewModel().set({
            totalOriginal: Movimento.services.FormasPagamento.obterTotal() || cents(movimento.get('MOVIMENTOS_TOTAL')),
            movimento: movimento,
            model: formaPagamento,
            readOnly: readOnly
        });

        viewFormasPagamento.focus(true);
        form.add(viewFormasPagamento);
    },
    
    limpar: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const operacao = movimento.get('OPERACOES_FINANCEIRO');

        movimento.set('MOVIMENTOS_FORMASPAGAMENTO', []);
        
        if(operacao == 'O'){
            movimento.set('MOVIMENTOS_STATUS', 'N');
        }
    },

    calcularPartida: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        
        if(
            configs.getMovimentos().partida && configs.getMovimentos().partida.coeficiente
        ) {
            const coeficientes = configs.getMovimentos().partida.coeficiente.split('#');
            const formaPagamento    = this.getFormasPagamento();
            const getCoeficiente = function(parcelas) {
                const coef = coeficientes[parcelas - 1] ? coeficientes[parcelas - 1].toString().replace(',', '.') : '';
                return coef > 0 ? coef : 1;
            }

            const produtos           = movimento.get('MOVIMENTOS_ITENS') || [];
            const totalMovimento     = cents(movimento.get('MOVIMENTOS_TOTAL'));
            const valorFinanceira    = cents(movimento.get('MOVIMENTOS_BASEST')); // Financeira informado
            const valorCheque        = cents(formaPagamento['MOVIMENTOSFORMAS_CHEQUE']);
            const valorChequePre     = cents(formaPagamento['MOVIMENTOSFORMAS_CHEQUEPRE']);
            const valorCredito       = cents(formaPagamento['MOVIMENTOSFORMAS_CREDITO']);
            const valorDebito        = cents(formaPagamento['MOVIMENTOSFORMAS_DEBITO']);
            const valorFinanceiro    = cents(formaPagamento['MOVIMENTOSFORMAS_DUPLICATA']);
            const valorRestante      = cents(formaPagamento['MOVIMENTOSFORMAS_DINHEIRO'])   + 
                                       cents(movimento.get('MOVIMENTOS_BASEICMS'))          +  // Crédito pessoa por devolução ou pagamento antecipado
                                       cents(formaPagamento['MOVIMENTOSFORMAS_TRANSFERENCIAS']) + 
                                       cents(formaPagamento['MOVIMENTOSFORMAS_CREDITOLOJA']) + 
                                       cents(formaPagamento['MOVIMENTOSFORMAS_ALIMENTACAO']) + 
                                       cents(formaPagamento['MOVIMENTOSFORMAS_REFEICAO'])    + 
                                       cents(formaPagamento['MOVIMENTOSFORMAS_PRESENTE'])    + 
                                       cents(formaPagamento['MOVIMENTOSFORMAS_COMBUSTIVEL']) 
            
            const parcelasChequePre = formaPagamento['MOVIMENTOSFORMAS_PRCCHEQUEPRE'];
            const parcelasDebito  = 1;
            const parcelasCredito = formaPagamento['MOVIMENTOSFORMAS_PRCCREDITO'];
            const parcelasFinanceiro = formaPagamento['MOVIMENTOSFORMAS_PRCDUPLICATA'];
                       
            let valorPartida = 0;

            if (valorFinanceira > 0){
                valorPartida += valorFinanceira;
            }

            if (valorCheque > 0) {
                const parcelas = 1;
                valorPartida += Math.round(valorCheque / parcelas / getCoeficiente(parcelas));
            }

            if (valorChequePre > 0){
                const parcelas = parcelasChequePre || 1;
                valorPartida += Math.round(valorChequePre / parcelas / getCoeficiente(parcelas));
            }

            if (valorCredito > 0){
                const parcelas = parcelasCredito || 1;
                valorPartida += Math.round(valorCredito / parcelas / getCoeficiente(parcelas));
            }

            if (valorDebito > 0) {
                const parcelas = parcelasDebito || 1;
                valorPartida += Math.round(valorDebito / parcelas / getCoeficiente(parcelas));
            }

            if (valorFinanceiro > 0) {
                const parcelas = parcelasFinanceiro || 1;
                valorPartida += Math.round(valorFinanceiro / parcelas / getCoeficiente(parcelas));
            }
            
            produtos.forEach(produto => {
                let vlrPercentual;
                let vlrPartida;
                const totalLiquido = cents(produto['TOTAL_LIQUIDO']);

                if (totalLiquido != (valorPartida + valorRestante)){
                    vlrPercentual = (valorPartida + valorRestante) / totalMovimento;
                    vlrPartida = Math.round(totalLiquido * vlrPercentual)
                } else {
                    vlrPartida = (valorPartida + valorRestante);
                }

                produto['MOVIMENTOSITENS_IMPOSTO'] = Math.round(vlrPartida) / 100;

            });

            movimento.set('MOVIMENTOS_IMPOSTO', (valorPartida + valorRestante) / 100);

            return (valorPartida + valorRestante) / 100;
        }

    },

    validarPagarCompra: function() {
        const form = Ext.$('formmovimentos')[0];

        if(form.getViewModel().get('isPedidoCompra')) {
            const valorCompra = cents(form.getViewModel().get('model.MOVIMENTOS_TOTAL'));
            const parcelasCompra = form.getViewModel().get('financeiroscompra').data.items;
            let somaParcelas = 0;
            parcelasCompra.forEach(parcela => {
                somaParcelas += cents(parcela.get('MOVIMENTOSFINANCEIROSCOMPRA_VALOR'))
            });
            if(somaParcelas != valorCompra) {
                Ext.Note('warning', `A soma das parcelas: ${(somaParcelas/100)} difere do valor total`);
                return false;
            } else {
                return true;
            }    
        } else {
            return true;
        }
    }

});
