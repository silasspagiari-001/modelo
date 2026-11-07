Ext.define('SamosAdmin.movimentos.movimento.form.baixaparcialpedido.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmovimentosbaixaparcialpedido',

    constructor: function() {
        this.callParent(arguments);
        
        this.setData({
            readOnly: false,
            bloquearGravacaoBaixa: false
        });

        this.setFormulas({
               hideAlterar: function(get){
                  return !get('readOnly');
               },
               
               hideGravar: function(get){
                  return get('readOnly') || get('bloquearGravacaoBaixa');
               }    
        });
    }
});
