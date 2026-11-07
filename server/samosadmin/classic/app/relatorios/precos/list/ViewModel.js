Ext.define('SamosAdmin.relatorios.precos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosprecoslist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueProduto: 1,
            valueAte: 999999,
            valueGrupo: 1,
            valueFinal: 9999,
            valueIdPessoa: 0,
            valueTipo: 0,    // Padrão normal
            valueSituacao: 0 // Saldo positivo
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
