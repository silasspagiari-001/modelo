Ext.define('SamosAdmin.movimentos.cupomeletronico.form.caixa.cartoes.form.ViewController', {
    extend: 'SamosAdmin.movimentos.cupomeletronico.form.caixa.ViewController',
    alias: 'controller.formcupomeletronicocaixaformcartoes',

    onAlterarClick: function() {
        var formMovimento = this.getView().up('formcupomeletronico'),
            ctrlMovimento = formMovimento.getController(),
            ctrlCartao = formMovimento.down('formcupomeletronicocaixacartoes').getController();

        ctrlCartao.onAlterarClick.call(ctrlCartao);
        ctrlMovimento.setReadOnly.call(this, false);
        ctrlMovimento.doDefaultFocus.call(this);
    },

    onConfirmarClick: function (btn, e) {
        Ext.defer(this.getView().destroy, 200, this.getView());
    }
});
