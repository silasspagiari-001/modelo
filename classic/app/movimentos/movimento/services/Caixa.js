Ext.define('SamosAdmin.movimentos.movimento.services.Caixa', {
    alternateClassName: 'Movimento.services.Caixa',
    singleton: true,

    validarReceber: function() {
        const obrigatorio = this.receberObrigatorio() || this.pagarObrigatorio();
        const caixaValido = this.caixaValido();
        const empresaRegimeCaixa = configs.getEmpresa().regimeCaixa;
        
        
        if(obrigatorio && caixaValido) {
            this.finalizarReceber();
            return true;
        } else if(obrigatorio && !caixaValido && !empresaRegimeCaixa) {
            this.exibirReceber();
            return false;
        } else {
            this.limparReceber();
            return true;          
        }
    },

    validarPagar: function() {
        const obrigatorio = this.pagarObrigatorio();
        let valido = this.pagarValido();
        
        if(obrigatorio && valido) {
            this.finalizarPagar();
            return true;
        } else if(obrigatorio && !valido) {
            this.exibirPagar();
            return false;
        } else {
            this.limparPagar();
            return true;          
        }
    },

    receberObrigatorio: function() {
        const form = Ext.$('formmovimentos')[0];
        
        return form.getViewModel().get('receberObrigatorio');
    },

    pagarObrigatorio: function() {
        const form = Ext.$('formmovimentos')[0];
        
        return form.getViewModel().get('pagarObrigatorio');
    },

    empresaRegimeCaixa: function() {
        const form = Ext.$('formmovimentos')[0];
        
        return form.getViewModel().get('empresaRegimeCaixa');
    },

    caixaValido: function() {
        return this.existeReceber() && this.caixaVerificado();
    },

    pagarValido: function() {
        return this.existePagar() && this.pagarVerificado();
    },

    existeReceber: function() {
        return !!this.getReceber();
    },

    existePagar: function() {
      return !!this.getPagar().length;
    },

    getReceber: function() {
        const janelaCaixa = Ext.$('formmovimentoscaixa')[0];
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const listCaixa = movimento.get('MOVIMENTOS_CAIXA');

        if(janelaCaixa && janelaCaixa.isVisible(true)){
            return janelaCaixa.getViewModel().get('model').data;
        } else if(listCaixa && listCaixa[0]){
            return listCaixa[0];
        } else {
            return {};
        }
    },

    getPagar: function() {
        const janelaFinanceiro = Ext.$('formmovimentoscaixafinanceiro')[0];
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const listaFinanceiros = movimento.get('MOVIMENTOS_FINANCEIROS');

        if(janelaFinanceiro && janelaFinanceiro.isVisible(true)){
            return janelaFinanceiro.getViewModel().getStore('main').getData().items;
        } else if(listaFinanceiros && listaFinanceiros[0]){
            return listaFinanceiros;
        } else {
            return [];
        }
    },

    caixaVerificado: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const totalMovimento = cents(movimento.get('MOVIMENTOS_TOTAL')) - cents(movimento.get('MOVIMENTOS_VALORRETENCAO'));
        const totalCaixa = this.obterTotalReceber();

        return totalMovimento == totalCaixa;
    },

    financeiroValido: function() {
        const form = Ext.$('formmovimentos')[0];
        const model = form.getViewModel().get('model');
        const movimento = model.get && model.data ? model.data : model;
        const caixa = this.getReceber();

        const vlrCartoes     = cents(caixa['MOVIMENTOSCAIXA_DEBITO']) + cents(caixa['MOVIMENTOSCAIXA_CREDITO']);
        const vlrCheques     = cents(caixa['MOVIMENTOSCAIXA_CHEQUE']);
        const vlrFinanceiros = cents(caixa['MOVIMENTOSCAIXA_DUPLICATA']);

        const listaCartoes    = movimento['MOVIMENTOS_CARTOES']     || [];
        const listaCheques    = movimento['MOVIMENTOS_CHEQUES']     || [];

        const listaFinanceiro = (movimento['MOVIMENTOS_FINANCEIROS'] || [])
        .filter(titulo => {
            return (
                titulo['PESSOAS_TIPO'] != configs.getFinanceiros().tipoFinanceira &&
                titulo['FINANCEIROS_ID_PESSOAS']!= '999999'
            );
        })
        
        const totalCartoes = listaCartoes.reduce((total, item) => {
            return total + cents(item['CARTOES_VALOR']);
        }, 0);

        const totalCheques = listaCheques.reduce((total, item) => {
            return total + cents(item['CHEQUES_VALOR']);
        }, 0);

        const totalFinanceiros = listaFinanceiro.reduce((total, item) => {
            return total + cents(item['FINANCEIROS_ABERTO']);
        }, 0);

        return this.formaPagamentoVerificada() &&
               this.caixaVerificado()          &&
               vlrCartoes     == totalCartoes  &&
               vlrCheques     == totalCheques
    },

    formaPagamentoVerificada: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const formaPagamento = movimento.get('MOVIMENTOS_FORMASPAGAMENTO');

        if(formaPagamento && formaPagamento[0]){
            const financeira = (movimento.get('MOVIMENTOS_FINANCEIROS') || []).find(titulo => {
                return (
                    titulo['PESSOAS_TIPO'] == configs.getFinanceiros().tipoFinanceira ||
                    titulo['FINANCEIROS_ID_PESSOAS'] == '999999'
                );
            });

            if(financeira && financeira['FINANCEIROS_ID_PESSOAS'] == '999999'){
                return false;
            } else if((movimento.get('MOVIMENTOS_CARTOES') || []).some(cartao => {
                return cartao['CARTOES_ID_OPERADORAS'] == 0 ||
                      !cartao['CARTOES_CONVENIO']          ||
                      !cartao['CARTOES_AUTORIZACAO'];
            })) {
                return false;
            } else if((movimento.get('MOVIMENTOS_CHEQUES') || []).some(cheque => {
                return cheque['CHEQUES_ID_BANCOS'] == 0 ||
                      !cheque['CHEQUES_AGENCIA']       ||
                      !cheque['CHEQUES_CONTA']         ||
                      !cheque['CHEQUES_NUMERO']      
            })) {
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    },

    pagarVerificado: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const totalMovimento = (cents(movimento.get('MOVIMENTOS_IMPOSTO')) && !configs.getClientName().match(/cirurcenter|racaforte/)) ? cents(movimento.get('MOVIMENTOS_IMPOSTO')) : (cents(movimento.get('MOVIMENTOS_TOTAL') - cents(movimento.get('MOVIMENTOS_VALORRETENCAO'))));
        const totalFinanceiro = this.obterTotalPagar();

        if(configs.getClientName() == 'pinguim') {
            return true
        }

        return totalMovimento == totalFinanceiro;
    },

    obterTotalReceber: function() {
        const caixa = this.getReceber();

        return (
            cents(caixa['MOVIMENTOSCAIXA_DINHEIRO']) +
            cents(caixa['MOVIMENTOSCAIXA_CHEQUE']) +
            cents(caixa['MOVIMENTOSCAIXA_DEBITO']) +
            cents(caixa['MOVIMENTOSCAIXA_CREDITO']) +
            cents(caixa['MOVIMENTOSCAIXA_CREDITOLOJA']) +
            cents(caixa['MOVIMENTOSCAIXA_CREDITOPESSOA']) +
            cents(caixa['MOVIMENTOSCAIXA_ALIMENTACAO']) +
            cents(caixa['MOVIMENTOSCAIXA_REFEICAO']) +
            cents(caixa['MOVIMENTOSCAIXA_PRESENTE']) +
            cents(caixa['MOVIMENTOSCAIXA_COMBUSTIVEL']) +
            cents(caixa['MOVIMENTOSCAIXA_DUPLICATA']) +
            cents(caixa['MOVIMENTOSCAIXA_BOLETO']) +
            cents(caixa['MOVIMENTOSCAIXA_TRANSFERENCIAS']) +
            cents(caixa['MOVIMENTOSCAIXA_OUTRO']) -
            cents(caixa['MOVIMENTOSCAIXA_TROCO'])
        );
    },

    obterTotalPagar: function() {
        const caixa = this.getPagar();

        return caixa.reduce((result, titulo) => {
            return result + cents(titulo['FINANCEIROS_ORIGINAL']);
        }, 0);
    },

    finalizarReceber: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const caixa = this.getReceber();

        this.formatarDatas(caixa);
        this.removerCamposLocais(caixa);
        movimento.set('MOVIMENTOS_CAIXA', [caixa]);
    },

    finalizarPagar: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const financeiro = this.getPagar();

        movimento.set('MOVIMENTOS_FINANCEIROS', financeiro);
    },

    formatarDatas: function(caixa) {
        const camposDeData = ['MOVIMENTOSCAIXA_EMISSAO', 'MOVIMENTOSCAIXA_VENCIMENTO'];

        camposDeData.forEach(campo => {
            caixa[campo] = momentTz(caixa[campo]).format('YYYY-MM-DD');
        });
    },

    removerCamposLocais: function(caixa) {
        Object.keys(caixa).filter(campo => {
            return campo.split('_')[0] != 'MOVIMENTOSCAIXA';
        }).forEach(campo => {
            delete caixa[campo];
        });
    },

    exibirReceber: function() {
        const janelaCaixa = Ext.$('formmovimentoscaixa')[0];
        const totalCaixa = this.obterTotalReceber();

        try {
            janelaCaixa.focus();
        } catch (e) {
            this.criarJanelaReceber();
        }

        if(totalCaixa != 0){
            Ext.Note('warning', 'O valor do caixa difere do valor total');
        }
    },

    exibirPagar: function() {
        const totalCaixa = this.obterTotalPagar();

        this.criarJanelaPagar();

        if(totalCaixa != 0 ){
            Ext.Note('warning', 'O valor do caixa difere do valor total');
        }
    },
    
    criarJanelaReceber: function (btn, e) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const caixaExistente = movimento.get('MOVIMENTOS_CAIXA')[0] || {
            'MOVIMENTOSCAIXA_EMISSAO': movimento.get('MOVIMENTOS_EMISSAO')
        };

        if(!caixaExistente['MOVIMENTOSCAIXA_ID']) {
            caixaExistente['MOVIMENTOSCAIXA_ID'] = -1;
        }

        const caixa = Ext.create(
            'SamosFinanceiros.titulos.ModelCaixa', 
            Ext.Object.merge({}, caixaExistente)
        );
        
        const viewPgto = Ext.create({
            xtype: 'formmovimentoscaixa'
        });

        this.controlarCoresBotoes(viewPgto, caixa),

        viewPgto.getViewModel().set({
            movimento: movimento,
            isVendaConsumidor: form.getViewModel().get('isVendaConsumidor'),
            model: caixa,
            readOnly: (
                (
                    movimento.get('MOVIMENTOS_STATUS') != 'N' && 
                    configs.getEmpresa().regimeCaixa
                ) ||
                (
                    movimento.get('MOVIMENTOS_STATUS') != 'N' && 
                    form.getViewModel().get('readOnly')
                ) ||
                (
                    movimento.get('MOVIMENTOS_STATUS')      == 'N'   && 
                    movimento.get('MOVIMENTOS_SERIEORIGEM') == 'ORC' &&
                    !!movimento.get('MOVIMENTOS_FORMASPAGAMENTO')    &&
                    !!movimento.get('MOVIMENTOS_FORMASPAGAMENTO')[0]
                )
            )
        });

        viewPgto.focus(true);
        form.add(viewPgto);
    },

    controlarCoresBotoes: function(viewPgto, caixa) {
        const form            = Ext.$('formmovimentos')[0];
        const movimento       = form.getViewModel().get('model');
        const btnFinanceiro   = viewPgto.down('button[text="Financeiro"]');
        const btnFinanceira   = viewPgto.down('button[text="Financeira"]');
        const btnCartoes      = viewPgto.down('button[text="Cartões"]');
        const btnCheques      = viewPgto.down('button[text="Cheques"]');
        const vlrFinanceiros  = cents(caixa.get('MOVIMENTOSCAIXA_DUPLICATA'));
        const vlrFinanceira   = cents(caixa.get('MOVIMENTOSCAIXA_OUTRO'));
        const vlrCartoes      = cents(caixa.get('MOVIMENTOSCAIXA_DEBITO')) + cents(caixa.get('MOVIMENTOSCAIXA_CREDITO'));
        const vlrCheques      = cents(caixa.get('MOVIMENTOSCAIXA_CHEQUE'));
        const listaFinanceiro = (movimento.get('MOVIMENTOS_FINANCEIROS') || []).filter(titulo => {
            return (
                titulo['PESSOAS_TIPO'] != configs.getFinanceiros().tipoFinanceira && 
                titulo['FINANCEIROS_ID_PESSOAS'] != '999999'
            );
        });
        const listaFinanceira = (movimento.get('MOVIMENTOS_FINANCEIROS') || []).filter(titulo => {
            return (
                titulo['PESSOAS_TIPO'] == configs.getFinanceiros().tipoFinanceira ||
                titulo['FINANCEIROS_ID_PESSOAS'] == '999999'
            );
        });
        const listaCartoes    = movimento.get('MOVIMENTOS_CARTOES') || [];
        const listaCheques    = movimento.get('MOVIMENTOS_CHEQUES') || [];
        const totalFinanceiros = listaFinanceiro.reduce((total, titulo) => {
            return total + cents(titulo['FINANCEIROS_ORIGINAL']);
        }, 0);
        const totalFinanceira = listaFinanceira.reduce((total, titulo) => {
            return total + cents(titulo['FINANCEIROS_ORIGINAL']);
        }, 0);
        const totalCartoes = listaCartoes.reduce((total, item) => {
            return total + cents(item['CARTOES_VALOR']);
        }, 0);
        const totalCheques = listaCheques.reduce((total, item) => {
            return total + cents(item['CHEQUES_VALOR']);
        }, 0);
        const financeiraPreenchida = listaFinanceira[0] && listaFinanceira[0]['FINANCEIROS_ID_PESSOAS'] != '999999';
        const cartoesPreenchidos = listaCartoes.every(cartao => {
            return cartao['CARTOES_ID_OPERADORAS'] != 0 &&
                   cartao['CARTOES_CONVENIO']           &&
                   cartao['CARTOES_AUTORIZACAO'];
        });
        const chequesPreenchidos = listaCheques.every(cheque => {
            return cheque['CHEQUES_ID_BANCOS'] != 0 &&
                   cheque['CHEQUES_AGENCIA']        &&
                   cheque['CHEQUES_CONTA']          &&
                   cheque['CHEQUES_NUMERO'];
        });

        const valido = {
            financeiro: vlrFinanceiros == totalFinanceiros,
            financeira: financeiraPreenchida && vlrFinanceira > 0 && totalFinanceira > 0,
            cartoes:    cartoesPreenchidos   && (vlrCartoes == totalCartoes),
            cheques:    chequesPreenchidos   && (vlrCheques == totalCheques)
        }

        if(btnFinanceiro && !valido.financeiro) {
            btnFinanceiro.getEl().dom.style.backgroundColor = 'yellow';
            btnFinanceiro.getEl().dom.querySelector('.x-btn-inner').style.color = 'black';
        }

        if(btnFinanceira && !valido.financeira) {
            btnFinanceira.getEl().dom.style.backgroundColor = 'yellow';
            btnFinanceira.getEl().dom.querySelector('.x-btn-inner').style.color = 'black';
        }

        if(btnCartoes && !valido.cartoes) {
            btnCartoes.getEl().dom.style.backgroundColor = 'yellow';
            btnCartoes.getEl().dom.querySelector('.x-btn-inner').style.color = 'black';
        }

        if(btnCheques && !valido.cheques) {
            btnCheques.getEl().dom.style.backgroundColor = 'yellow';
            btnCheques.getEl().dom.querySelector('.x-btn-inner').style.color = 'black';
        }
    },
    
    criarJanelaPagar: function (btn, e) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const dataFinanceiro = movimento.get('MOVIMENTOS_FINANCEIROS') || [];
        const dataModel = dataFinanceiro ? movimento.data : {};
        const valorFinanceiro = (cents(movimento.get('MOVIMENTOS_IMPOSTO')) > 0 && !configs.getClientName().match(/cirurcenter|racaforte/)) ? movimento.get('MOVIMENTOS_IMPOSTO') : (movimento.get('MOVIMENTOS_TOTAL') - cents(movimento.get('MOVIMENTOS_VALORRETENCAO'))) ;

        const viewPgto = Ext.create({
            xtype: 'formmovimentoscaixafinanceiro'
        });
        
        viewPgto.getViewModel().set({
            valorFinanceiro: valorFinanceiro,
            movimento: movimento,
            model: Ext.create('SamosAdmin.movimentos.movimento.Model', dataModel),
            dataFinanceiro: dataFinanceiro,
            localData: form.getViewModel().get('financeiroLocalData'),
            readOnly: form.getViewModel().get('readOnly')
        });

        viewPgto.lookup('prazo').setSearchedId(dataModel['MOVIMENTOS_ID_PRAZOS']);
        viewPgto.focus(true);
        form.add(viewPgto);
    },
    
    limparReceber: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const operacao = movimento.get('OPERACOES_FINANCEIRO');

        movimento.set('MOVIMENTOS_CAIXA',   []);
        movimento.set('MOVIMENTOS_CHEQUES', []);
        movimento.set('MOVIMENTOS_CARTOES', []);
        
        if(operacao == 'R' || operacao == 'N'){
            movimento.set('MOVIMENTOS_STATUS',     'N');
            movimento.set('MOVIMENTOS_FINANCEIROS', []);
        }
    },
    
    limparPagar: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const operacao = movimento.get('OPERACOES_FINANCEIRO');

        if(operacao == 'P' || operacao == 'N'){
            movimento.set('MOVIMENTOS_FINANCEIROS', []);
        }
    },

    calcularPartida: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        
        if(
            configs.getMovimentos().partida && configs.getMovimentos().partida.coeficiente
        ) {
            const coeficientes = configs.getMovimentos().partida.coeficiente.split('#');
            const caixa    = this.getReceber();
            const getCoeficiente = function(parcelas) {
                const coef = coeficientes[parcelas - 1] ? coeficientes[parcelas - 1].toString().replace(',', '.') : '';
                return coef > 0 ? coef : 1;
            }

            const produtos        = movimento.get('MOVIMENTOS_ITENS') || [];
            const totalMovimento  = cents(movimento.get('MOVIMENTOS_TOTAL')) - cents(movimento.get('MOVIMENTOS_VALORRETENCAO'));
            const valorFinanceira = cents(movimento.get('MOVIMENTOS_BASEST')); // Financeira informado            
            const valorCheque     = cents(caixa['MOVIMENTOSCAIXA_CHEQUE']);
            const valorCredito    = cents(caixa['MOVIMENTOSCAIXA_CREDITO']);
            const valorDebito     = cents(caixa['MOVIMENTOSCAIXA_DEBITO']);
            const valorFinanceiro = cents(caixa['MOVIMENTOSCAIXA_DUPLICATA']);
            const valorRestante   = cents(caixa['MOVIMENTOSCAIXA_DINHEIRO'])      +
                                    cents(caixa['MOVIMENTOSCAIXA_TRANSFERENCIAS'])+
                                    cents(caixa['MOVIMENTOSCAIXA_CREDITOLOJA'])   +
                                    cents(caixa['MOVIMENTOSCAIXA_ALIMENTACAO'])   +
                                    cents(caixa['MOVIMENTOSCAIXA_REFEICAO'])      +
                                    cents(caixa['MOVIMENTOSCAIXA_PRESENTE'])      +
                                    cents(caixa['MOVIMENTOSCAIXA_CREDITOPESSOA']) +
                                    cents(caixa['MOVIMENTOSCAIXA_COMBUSTIVEL'])   +
                                    cents(caixa['MOVIMENTOSCAIXA_BOLETO']);
            
            const parcelasCheques = (movimento.get('MOVIMENTOS_CHEQUES') || []).length;

            const parcelasDebito  = (movimento.get('MOVIMENTOS_CARTOES') || [])
                .filter(cartao => cartao['CARTOES_TIPO'] == 'D')
                .reduce((total, cartao) => total += parseInt(cartao['CARTOES_PARCELAS']), 0);

            const parcelasCredito = (movimento.get('MOVIMENTOS_CARTOES') || [])
                .filter(cartao => cartao['CARTOES_TIPO'] == 'C')
                .reduce((total, cartao) => Math.max(total, parseInt(cartao['CARTOES_PARCELAS'])), 0);

            const parcelasFinanceiro = (movimento.get('MOVIMENTOS_FINANCEIROS') || [])
                .filter(titulo => {
                    return (
                        titulo['PESSOAS_TIPO'] != configs.getFinanceiros().tipoFinanceira &&
                        titulo['FINANCEIROS_ID_PESSOAS']!= '999999'
                    );
                }).length;
                       
            let valorPartida = 0;

            if (valorFinanceira > 0){
                valorPartida += valorFinanceira;
            }

            if (valorCheque > 0){
                const parcelas = parcelasCheques || 1;
                valorPartida += Math.round(valorCheque / parcelas / getCoeficiente(parcelas));
            }

            if (valorCredito > 0){
                const parcelas = parcelasCredito || 1;
                valorPartida += Math.round(valorCredito / parcelas / getCoeficiente(parcelas));
            }

            if (valorDebito > 0) {
                const parcelas = parcelasDebito || 1;
                valorPartida += valorDebito;
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

    }
});
