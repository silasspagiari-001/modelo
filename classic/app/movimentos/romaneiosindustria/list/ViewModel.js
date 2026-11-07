Ext.define('SamosAdmin.movimentos.romaneiosindustria.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.romaneiosindustria',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueStatus: 3,
            valueIdPessoa: 0,
            valuePessoa: '',
            valueIdUsuario: 0,            
            valueUsuario: '',
            hideImprimir: false
        });

        this.setFormulas({
            totalSelecionado: function (get) {
                get('forceTotais');
                
                const selection = this.getView().down('grid').getSelectionModel().getSelection() || [];
                const totalSelecionado = selection.reduce((result, movimento) => {
                    return result + cents(movimento.get('MOVIMENTOS_TOTAL'));
                }, 0) / 100;

                return Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(totalSelecionado);
                
            },

            movimentosSelecionados: function (get) {
                get('forceTotais');               
                return this.getView().down('grid').getSelectionModel().getSelection().length.toString() || '0';
            },

            totalGeral: function (get) {
                get('forceTotais');
                
                const movimentos = this.getView().down('grid').getStore().getData().items || [];
                const total = movimentos.reduce((result, movimento) => {
                    return result + cents(movimento.get('MOVIMENTOS_TOTAL'));
                }, 0) / 100;

                return Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(total);
            }
        });

        this.setStores({
            documentos: {
                type: 'nodejsstore',
                model: 'SamosAdmin.atualizacao.documentos.Model',
                proxy: {
                    url: 'server/documentos',
                    extraParams: {
                        ordem: 2,
                        status: 2,
                        start: 0,
                        limit: 9999
                    }
                }
            }
        });
    }
});
