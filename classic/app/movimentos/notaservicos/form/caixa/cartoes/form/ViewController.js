Ext.define('SamosAdmin.movimentos.notaservicos.form.caixa.cartoes.form.ViewController', {
    extend: 'SamosAdmin.movimentos.notaservicos.form.caixa.ViewController',
    alias: 'controller.formnotaservicoscaixaformcartoes',

    onAlterarClick: function() {
        var formMovimento = this.getView().up('formnotaservicos'),
            ctrlMovimento = formMovimento.getController(),
            ctrlCartao = formMovimento.down('formnotaservicoscaixacartoes').getController();

        ctrlCartao.onAlterarClick.call(ctrlCartao);
        ctrlMovimento.setReadOnly.call(this, false);
        ctrlMovimento.doDefaultFocus.call(this);
    },

    onConfirmarClick: function (btn, e) {
        Ext.defer(this.getView().destroy, 200, this.getView());
    }
});
