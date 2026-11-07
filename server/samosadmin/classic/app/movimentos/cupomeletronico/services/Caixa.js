Ext.define('SamosAdmin.movimentos.cupomeletronico.services.Caixa', {
    alternateClassName: 'CupomEletronico.services.Caixa',
    singleton: true,

    validarReceber: function() {
        const obrigatorio = this.receberObrigatorio();
        const caixaValido = this.caixaValido();

        if(obrigatorio && caixaValido) {
            this.finalizarReceber();
            return true;
        } else if(obrigatorio && !caixaValido) {
            this.exibirReceber();
            return false;
        } else {
            this.limparReceber();
            return true;          
        }
    },

    receberObrigatorio: function() {
        // const form = Ext.$('formcupomeletronico')[0];
        // return form.getViewModel().get('receberObrigatorio');
        return true;
    },

    empresaRegimeCaixa: function() {
        const form = Ext.$('formcupomeletronico')[0];
        return form.getViewModel().get('empresaRegimeCaixa');
    },

    caixaValido: function() {
        return this.existeReceber() && this.caixaVerificado();
    },

    existeReceber: function() {
        return !!this.getReceber();
    },

    getReceber: function() {
        const janelaCaixa = Ext.$('formcupomeletronicocaixa')[0];
        const form = Ext.$('formcupomeletronico')[0];
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

    caixaVerificado: function() {
        const form = Ext.$('formcupomeletronico')[0];
        const movimento = form.getViewModel().get('model');
        const totalMovimento = cents(movimento.get('MOVIMENTOS_TOTAL'));
        const totalCaixa = this.obterTotalReceber();

        return totalMovimento == totalCaixa;
    },

    financeiroValido: function() {
        const form = Ext.$('formcupomeletronico')[0];
        const model = form.getViewModel().get('model');
        const movimento = model.get && model.data ? model.data : model;
        const caixa = this.getReceber();

        const vlrCartoes     = cents(caixa['MOVIMENTOSCAIXA_DEBITO']) + cents(caixa['MOVIMENTOSCAIXA_CREDITO']);
        const vlrCheques     = cents(caixa['MOVIMENTOSCAIXA_CHEQUE']);

        const listaCartoes    = movimento['MOVIMENTOS_CARTOES']     || [];
        const listaCheques    = movimento['MOVIMENTOS_CHEQUES']     || [];

        const totalCartoes = listaCartoes.reduce((total, item) => {
            return total + cents(item['CARTOES_VALOR']);
        }, 0);

        const totalCheques = listaCheques.reduce((total, item) => {
            return total + cents(item['CHEQUES_VALOR']);
        }, 0);

        return this.caixaVerificado()          &&
               vlrCartoes == totalCartoes  &&
               vlrCheques == totalCheques    
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

    finalizarReceber: function() {
        const form = Ext.$('formcupomeletronico')[0];
        const movimento = form.getViewModel().get('model');
        const caixa = this.getReceber();

        this.formatarDatas(caixa);
        this.removerCamposLocais(caixa);
        movimento.set('MOVIMENTOS_CAIXA', [caixa]);
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
        const janelaCaixa = Ext.$('formcupomeletronicocaixa')[0];
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
    
    criarJanelaReceber: function (btn, e) {
        const form = Ext.$('formcupomeletronico')[0];
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
            xtype: 'formcupomeletronicocaixa'
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
                )
            )
        });

        viewPgto.focus(true);
        form.add(viewPgto);
    },

    controlarCoresBotoes: function(viewPgto, caixa) {
        const form            = Ext.$('formcupomeletronico')[0];
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
    
    limparReceber: function() {
        const form = Ext.$('formcupomeletronico')[0];
        const movimento = form.getViewModel().get('model');

        movimento.set('MOVIMENTOS_CAIXA',       []);
        movimento.set('MOVIMENTOS_CHEQUES',     []);
        movimento.set('MOVIMENTOS_CARTOES',     []);
        movimento.set('MOVIMENTOS_STATUS',      'N');
        movimento.set('MOVIMENTOS_FINANCEIROS', []);
    }
});
