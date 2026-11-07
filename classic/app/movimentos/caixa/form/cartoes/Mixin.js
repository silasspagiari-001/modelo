Ext.define('SamosAdmin.movimentos.caixa.form.cartoes.Mixin', {
    extend: 'Ext.app.ViewController',

    validarCartoes: function() {
        const obrigatorio = this.cartoesObrigatorio();  //ok
        const pagoComCartao = this.pagoComCartao();     //ok
        const valido = this.cartoesValidos();           //

        if(obrigatorio && pagoComCartao && valido) {
            this.finalizarCartoes();
            return true;
        } else if(obrigatorio && pagoComCartao && !valido) {
            this.exibirJanelaCartoes();
            this.exibirAlertas();
            return false;
        } else {
            this.limparCartoes();
            return true;          
        }
    },

    cartoesObrigatorio: function() {
        return true;
    },

    pagoComCartao: function() {
        return !!this.obterTotalPagoComCartao();
    },

    obterTotalPagoComCartao: function() {
        const caixa = Caixa.services.Model.get();

        return cents(caixa);
    },

    cartoesValidos: function() {
        const totalPagoComCartao         = this.obterTotalPagoComCartao();
        const totalCartoesLancados       = this.obterTotalCartoesLancados();
        const totalPagoComCartaoDebito   = this.obterTotalPagoComCartaoDebito();
        const totalCartoesDebitoLancados = this.obterTotalCartoesDebitoLancados();

        return (totalPagoComCartao       == totalCartoesLancados) && 
               (totalPagoComCartaoDebito == totalCartoesDebitoLancados);
    },
    
    obterTotalCartoesLancados: function() {
        return this.obterCartoesLancados().reduce((result, cartao) => {
            return result + cents(cartao['CARTOES_VALOR']);
        }, 0);
    },

    obterCartoesLancados: function() {
        const janelaCartoes = this.getJanelaCartoes();  // 
        const cartoesLancados = this.getFormCaixa().getViewModel().get('model.MOVIMENTOSCAIXA_CARTOES');
        try {
            return janelaCartoes.getViewModel().getStore('main').getData().items.map(cartao => cartao.data);
        } catch(e) {
            return cartoesLancados || [];
        }
    },

    finalizarCartoes: function() {
        const caixa = this.getFormCaixa().getViewModel().get('model');
        const cartoesLancados = this.obterCartoesLancados()
            .map(cartao => this.removerCamposLocais(cartao))
            .map(cartao => this.formatarCamposDeData(cartao))
            .map(cartao => SamosUtils.Json.trocarAspasDuplasPorDuasSimples(cartao));

        this.finalizarEdicaoNaGrid();
        caixa.set('MOVIMENTOSCAIXA_CARTOES', cartoesLancados);
    },

    finalizarEdicaoNaGrid: function() {
        const janelaCartoes = this.getJanelaCartoes();

        return janelaCartoes && janelaCartoes.down('grideditable').validarItens(true);
    },

    removerCamposLocais: function(cartao) {
        Object.keys(cartao).filter(campo => {
            return campo.split('_')[0] != 'CARTOES';
        }).forEach(campo => {
            delete cartao[campo];
        });

        return cartao;
    },

    formatarCamposDeData: function(cartao) {
        const camposDeData = ['CARTOES_EMISSAO'];

        camposDeData.forEach(campo => {
            cartao[campo] = momentTz(cartao[campo]).format('YYYY-MM-DD');
        });

        return cartao;
    },

    exibirJanelaCartoes: function() {
        const janelaCartoes = Ext.$('formcaixacartoes')[0];

        try {
            janelaCartoes.focus();
        } catch (e) {
            this.criarJanelaCartoes();
        }
    },

    exibirAlertas: function() {
        const totalCartoesLancados = this.obterTotalCartoesLancados();
        const totalPagoComCartaoDebito   = this.obterTotalPagoComCartaoDebito();
        const totalCartoesDebitoLancados = this.obterTotalCartoesDebitoLancados();

        if(totalPagoComCartaoDebito != totalCartoesDebitoLancados) {
            Ext.Note('warning', 'Os totais de débito e/ou crédito diferem');
        } else if(totalCartoesLancados != 0){
            Ext.Note('warning', 'O valor dos cartoes difere do informado no caixa');
        }
    },

    obterTotalPagoComCartaoDebito: function() {

        const form = Ext.$('formcaixa')[0];
        const caixa = form.getViewModel().get('model');
        
        const debito = caixa.get('MOVIMENTOSCAIXA_DEBITO');

        return cents(debito);

    },
    
    obterTotalCartoesDebitoLancados: function() {
        const cartoesLancados = this.obterCartoesLancados();

        return cartoesLancados.filter(cartao => {
            return cartao['CARTOES_TIPO'] == 'D';
        })
        .reduce((result, cartao) => {
            return result + cents(cartao['CARTOES_VALOR']);
        }, 0);
    },
    
    criarJanelaCartoes: function (btn, e) {
        const formCaixa = Ext.$('formcaixa')[0];
        const caixa = formCaixa.getViewModel().get('model');
        const cartoesLancados = this.obterCartoesLancados();
        const janelaCartoes = Ext.create({
            xtype: 'formcaixacartoes'
        });
        
        janelaCartoes.getViewModel().set({
            caixa: caixa,
            dataCartoes: cartoesLancados.length ? cartoesLancados : this.gerarCartoes(),
            readOnly: formCaixa.getViewModel().get('readOnly')
        });

        janelaCartoes.focus(true);
        formCaixa.add(janelaCartoes);
    },
    
    gerarCartoes: function() {
        const formCaixa = Ext.$('formcaixa')[0];
        const caixa = formCaixa.getViewModel().get('model');
        const cartoes = {
            credito:     cents(caixa.get('MOVIMENTOSCAIXA_CREDITO')),
            debito:      cents(caixa.get('MOVIMENTOSCAIXA_DEBITO')),
            loja:        cents(caixa.get('MOVIMENTOSCAIXA_CREDITOLOJA')),
            alimentacao: 0,
            refeicao:    cents(caixa.get('MOVIMENTOSCAIXA_REFEICAO')),
            presente:    cents(caixa.get('MOVIMENTOSCAIXA_PRESENTE')),
            combustivel: cents(caixa.get('MOVIMENTOSCAIXA_COMBUSTIVEL'))
        };

        let index = 0;
        
        return Object.keys(cartoes)
            .filter(type => cartoes[type] > 0)
            .map(type => {
                return Ext.create('SamosFinanceiros.cartoes.Model', {
                    'CARTOES_ID':            --index,
                    'CARTOES_ID_MOVIMENTOS': caixa.get('MOVIMENTOSCAIXA_ID'),
                    'CARTOES_ID_DOCUMENTOS': 999, // Caixa Diário
                    'CARTOES_ORIGEM':        caixa.get('MOVIMENTOSCAIXA_ID'),
                    'CARTOES_SERIE':         'CX',
                    'CARTOES_TIPO':          type == 'debito' ? 'D' : 'C',
                    'CARTOES_VALOR':         cartoes[type] / 100
                });
            });
    },
    
    limparCartoes: function() {
        const formCaixa = Ext.$('formcaixa')[0];
        const caixa = formCaixa.getViewModel().get('model');

        caixa.set('MOVIMENTOSCAIXA_CARTOES', []);
    },

    getFormCaixa: function() {
        return Ext.$('formcaixa')[0];
    },

    getJanelaCartoes: function() { //
        return Ext.$('formcaixacartoes')[0];
    },

    getControllerCaixa: function() {
        return this.getFormCaixa().getController();
    }

});
