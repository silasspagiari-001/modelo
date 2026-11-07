Ext.define('SamosAdmin.relatorios.margembrutafaturada.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosmargembrutafaturadalist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideImprimir       : false,
            valueInicio        : momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal         : momentServer().endOf('month').format('YYYY-MM-DD'),
            valueIdPessoai     : 0,
            valueIdPessoaf     : 999999,
            valueIdFornecedori : 0,
            valueIdFornecedorf : 9999999,
            valueIdProdutoi    : 0,
            valueIdProdutof    : 999999,
            valueIdGrupoi      : 0,
            valueIdGrupof      : 999999,
            valueIdUsuarioi    : 0,
            valueIdUsuariof    : 999999,
            valuePRP           : '2',
            valueDocumento     : '3',
            valueOrdem         : '0',       
            valueQuebra        : '0'
        });

        this.setFormulas({
            hidePRP: function(get){
                return configs.getClientName() != 'herbiquimica';
            }
        });

        this.setFormulas({
            hideQuebra: function(get){
                return configs.getClientName() != 'racaforte';
            }
        });


    }
});
