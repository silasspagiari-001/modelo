Ext.define('SamosAdmin.movimentos.notaservicos.form.caixa.cartoes.Mixin', {
    extend: 'Ext.app.ViewController',

    validarCartoes: function() {
        const obrigatorio = this.cartoesObrigatorio();
        const pagoComCartao = this.pagoComCartao();
        const valido = this.cartoesValidos();

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
        return this.getFormMovimento().getViewModel().get('cartoesObrigatorio');
    },

    pagoComCartao: function() {
        return !!this.obterTotalPagoComCartao();
    },

    obterTotalPagoComCartao: function() {
        const caixa = NotaServicos.services.Caixa.getReceber();
        const camposCartao = [
            'MOVIMENTOSCAIXA_CREDITO',
            'MOVIMENTOSCAIXA_DEBITO',
            'MOVIMENTOSCAIXA_CREDITOLOJA',
            'MOVIMENTOSCAIXA_REFEICAO',
            'MOVIMENTOSCAIXA_PRESENTE',
            'MOVIMENTOSCAIXA_COMBUSTIVEL'
        ];

        return camposCartao.reduce((result, campo) => {
            return result + cents(caixa[campo]);
        }, 0);
    },

    cartoesValidos: function() {
        const totalPagoComCartao         = this.obterTotalPagoComCartao();
        const totalCartoesLancados       = this.obterTotalCartoesLancados();
        const totalPagoComCartaoDebito   = this.obterTotalPagoComCartaoDebito();
        const totalCartoesDebitoLancados = this.obterTotalCartoesDebitoLancados();
        const preenchido                 = this.verificarPreenchimento();

        return preenchido && 
               (totalPagoComCartao       == totalCartoesLancados) && 
               (totalPagoComCartaoDebito == totalCartoesDebitoLancados);
    },
    
    obterTotalCartoesLancados: function() {
        return this.obterCartoesLancados().reduce((result, cartao) => {
            return result + cents(cartao['CARTOES_VALOR']);
        }, 0);
    },
    
    verificarPreenchimento: function() {
        return this.obterCartoesLancados().every(cartao => {
            return cartao['CARTOES_ID_OPERADORAS'] != 0 &&
                   cartao['CARTOES_CONVENIO']           &&
                   cartao['CARTOES_AUTORIZACAO'];
        }, 0);
    },
    
    obterCartoesLancados: function() {
        const janelaCartoes = this.getJanelaCartoes();
        const cartoesLancados = this.getFormMovimento().getViewModel().get('model.ORDENS_CARTOES');

        try {
            return janelaCartoes.getViewModel().getStore('main').getData().items.map(cartao => cartao.data);
        } catch(e) {
            return cartoesLancados || [];
        }
    },

    finalizarCartoes: function() {
        const movimento = this.getFormMovimento().getViewModel().get('model');
        const cartoesLancados = this.obterCartoesLancados()
            .map(cartao => this.removerCamposLocais(cartao))
            .map(cartao => this.formatarCamposDeData(cartao))
            .map(cartao => SamosUtils.Json.trocarAspasDuplasPorDuasSimples(cartao));

        this.finalizarEdicaoNaGrid();
        movimento.set('ORDENS_CARTOES', cartoesLancados);
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
        const janelaCartoes = Ext.$('formnotaservicoscaixacartoes')[0];

        try {
            janelaCartoes.focus();
        } catch (e) {
            this.criarJanelaCartoes();
        }
    },

    exibirAlertas: function() {
        const totalCartoesLancados       = this.obterTotalCartoesLancados();
        const totalPagoComCartao         = this.obterTotalPagoComCartao();
        const totalPagoComCartaoDebito   = this.obterTotalPagoComCartaoDebito();
        const totalCartoesDebitoLancados = this.obterTotalCartoesDebitoLancados();
        const preenchido                 = this.verificarPreenchimento();
        
        if(!preenchido) {
            Ext.Note('warning', 'Preencha as informações dos cartões');
        } else if(totalPagoComCartaoDebito != totalCartoesDebitoLancados) {
            Ext.Note('warning', 'Os totais de débito e/ou crédito diferem');
        } else if(totalPagoComCartao != totalCartoesLancados){
            Ext.Note('warning', 'O valor dos cartoes difere do informado no caixa');
        }
    },

    obterTotalPagoComCartaoDebito: function() {
        const caixa = NotaServicos.services.Caixa.getReceber();
        const camposCartao = [
            'MOVIMENTOSCAIXA_DEBITO'
        ];

        return camposCartao.reduce((result, campo) => {
            return result + cents(caixa[campo]);
        }, 0);
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
        const formMovimento = Ext.$('formnotaservicos')[0];
        const janelaCaixa = Ext.$('formnotaservicoscaixa')[0];
        const movimento = formMovimento.getViewModel().get('model');
        const cartoesLancados = this.obterCartoesLancados();
        const janelaCartoes = Ext.create({
            xtype: 'formnotaservicoscaixacartoes'
        });
        
        janelaCartoes.getViewModel().set({
            movimento: movimento,
            dataCartoes: cartoesLancados.length ? cartoesLancados : this.gerarCartoes(),
            readOnly: janelaCaixa.getViewModel().get('readOnly')
        });

        janelaCartoes.focus(true);
        formMovimento.add(janelaCartoes);
    },
    
    gerarCartoes: function() {
        const formMovimento = Ext.$('formnotaservicos')[0];
        const caixa = NotaServicos.services.Caixa.getReceber();
        const movimento = formMovimento.getViewModel().get('model');
        const cartoes = {
            credito:     cents(caixa['MOVIMENTOSCAIXA_CREDITO']),
            debito:      cents(caixa['MOVIMENTOSCAIXA_DEBITO']),
            loja:        cents(caixa['MOVIMENTOSCAIXA_CREDITOLOJA']),
            alimentacao: 0,
            refeicao:    cents(caixa['MOVIMENTOSCAIXA_REFEICAO']),
            presente:    cents(caixa['MOVIMENTOSCAIXA_PRESENTE']),
            combustivel: cents(caixa['MOVIMENTOSCAIXA_COMBUSTIVEL'])
        };

        let index = 0;
        
        return Object.keys(cartoes)
            .filter(type => cartoes[type] > 0)
            .map(type => {
                return Ext.create('SamosFinanceiros.cartoes.Model', {
                    'CARTOES_ID':            --index,
                    'CARTOES_ID_MOVIMENTOS': movimento.get('ORDENS_ID'),
                    'CARTOES_ID_DOCUMENTOS': movimento.get('ORDENS_ID_DOCUMENTOS'),
                    'CARTOES_ORIGEM':        movimento.get('ORDENS_NUMERO'),
                    'CARTOES_SERIE':         movimento.get('ORDENS_SERIE'),
                    'CARTOES_TIPO':          type == 'debito' ? 'D' : 'C',
                    'CARTOES_VALOR':         cartoes[type] / 100
                });
            });
    },
    
    limparCartoes: function() {
        const formMovimento = Ext.$('formnotaservicos')[0];
        const movimento = formMovimento.getViewModel().get('model');

        movimento.set('ORDENS_CARTOES', []);
    },

    getFormMovimento: function() {
        return Ext.$('formnotaservicos')[0];
    },

    getJanelaCartoes: function() {
        return Ext.$('formnotaservicoscaixacartoes')[0];
    },

    getControllerMovimento: function() {
        return this.getFormMovimento().getController();
    }
});
