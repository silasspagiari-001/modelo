Ext.define('SamosAdmin.atualizacao.aplicacoes.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.aplicacoes',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueTipo: 0,
            valueOrdem: 3
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            },

            hideSinteticas: function(get){
                return false;
            },

            isSelecionadoSintetica: function(get){
                return true;
            }
        });

    }

});
