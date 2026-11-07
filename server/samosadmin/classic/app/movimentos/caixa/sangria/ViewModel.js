Ext.define('SamosAdmin.movimentos.caixa.sangria.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.formcaixasangria',

    requires: [
        'Ext.data.proxy.Rest'
    ],

    constructor: function() {
        this.callParent(arguments);

        const form = Ext.$('caixa')[0];
        const dinheiro    = form.getViewModel().get('saldoDinheiro');
        const cheque      = form.getViewModel().get('saldoCheque');
        const credito     = 0;//form.getViewModel().get('saldoCredito');
        const debito      = 0;//form.getViewModel().get('saldoDebito');
        const creditoloja = 0;//form.getViewModel().get('saldoCreditoloja');
        const alimentacao = 0;//form.getViewModel().get('saldoAlimentacao');
        const refeicao    = 0;//form.getViewModel().get('saldoRefeicao');
        const presente    = 0;//form.getViewModel().get('saldoPresente');
        const combustivel = 0;//form.getViewModel().get('saldoCombustivel');        
        const duplicata   = 0;//form.getViewModel().get('saldoDuplicata');
        const transf      = 0;//form.getViewModel().get('saldoTransf');
        const outro       = 0;//form.getViewModel().get('saldoOutro');

        this.setData({
            hideSair: false,
            hideConfirmar: false,
            valorDinheiro: dinheiro,
            valorCheque: cheque,
            valorCredito: credito,
            valorDebito: debito,
            valorCreditoloja: creditoloja,
            valorAlimentacao: alimentacao,
            valorRefeicao: refeicao,
            valorPresente: presente,
            valorCombustivel: combustivel,
            valorDuplicata: duplicata,
            valorTransf: transf,
            valorOutro: outro
        });
        
        this.setStores({

            portadores: {
                type: 'nodejsstore',
                model: 'SamosAdmin.atualizacao.portadores.Model',
                autoLoad: true,
                proxy: {
                    url: 'server/portadores',
                    extraParams: {
                        conteudo: '',
                        ordem: '4',
                        status: '2',
                        empresa: configs.getEmpresa().id
                    }
                }
            }
        });

    }
});
