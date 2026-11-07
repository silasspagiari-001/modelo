Ext.define('SamosAdmin.atualizacao.pessoas.multisearch.ViewModel', {
    extend: 'SamosWidgets.multisearch.ViewModel',
    alias: 'viewmodel.pessoasmultisearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            hideSelecionar: false,
            pageSizeStore: 99999
        });

        this.setFormulas({
            totalSelecionados: function (get) {
                get('forceTotais');
                const pessoas = this.getView().down('grid').getSelectionModel().getSelection() || [];
                return pessoas.length;
            }, 
            
            totalCredito: function (get) {
                get('forceTotais');
                
                const pessoas = this.getView().down('grid').getSelectionModel().getSelection() || [];
                const total = pessoas.reduce((result, pessoa) => {
                    return result + cents(pessoa.get('PESSOAS_CREDITO'));
                }, 0) / 100;

                return Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(total);
            }
        });
    }
});
