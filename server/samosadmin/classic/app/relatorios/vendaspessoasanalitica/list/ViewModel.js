Ext.define('SamosAdmin.relatorios.vendaspessoasanalitica.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendaspessoasanaliticalist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideImprimir    : false,
            valueInicio     : momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal      : momentServer().endOf('month').format('YYYY-MM-DD'),
            valueIdUsuarioi : 1,
            valueIdUsuariof : 999999,
            valueIdGrupoi   : 1,
            valueIdGrupof   : 999999,
            valueIdProdutoi : 1,
            valueIdProdutof : 999999,
            valueIdPessoai  : 1,
            valueIdPessoaf  : 999999,
            valueDocumento  : '3',
            valueStatus     : '1',
            valueVacina     : '2',
            valueQuebra     : '1',
            valueSoVendas   : '1',
            valueCidade     : '',
            valueTipo       : 1
        }),

        this.setFormulas({
            hideVacina: function (get) {
                return !configs.getProdutos().vacinas
            },

            storeStatus: function(get) {
                if(configs.getClientName() == 'prudenaco') {
                    return [
                        ['0', 'Todos'],
                        ['1', 'Com NF-e'],
                        ['2', 'Sem NF-e'],
                        ['3', 'Baixados'],
                        ['4', 'Abertos'],
                        ['5', 'Sem NF-e Abertos']
                    ];
                } else {
                    return [
                        ['1', 'Todos'],
                        ['2', 'Faturados'],
                        ['3', 'Não Faturados']
                    ]
                }
            }
        });

    }
});
