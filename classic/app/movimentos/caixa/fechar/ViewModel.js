Ext.define('SamosAdmin.movimentos.caixa.fechar.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.formcaixafechar',

    requires: [
        'Ext.data.proxy.Rest'
    ],

    constructor: function() {
        this.callParent(arguments);

        const form = Ext.$('caixa')[0];
        const dinheiro    = form.getViewModel().get('saldoDinheiro');
        const cheque      = form.getViewModel().get('saldoCheque');
        const credito     = form.getViewModel().get('saldoCredito');
        const debito      = form.getViewModel().get('saldoDebito');
        const creditoloja = form.getViewModel().get('saldoCreditoloja');
        const alimentacao = form.getViewModel().get('saldoAlimentacao');
        const refeicao    = form.getViewModel().get('saldoRefeicao');
        const presente    = form.getViewModel().get('saldoPresente');
        const combustivel = form.getViewModel().get('saldoCombustivel');        
        const duplicata   = form.getViewModel().get('saldoDuplicata');
        const transf      = form.getViewModel().get('saldoTransf');
        const outro       = form.getViewModel().get('saldoOutro');

        this.setData({
            hideSair: false,
            hideFechar: false,
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
            valorOutro: outro,
            selectedPortador: 0,            
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
