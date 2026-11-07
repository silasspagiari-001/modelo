Ext.define('SamosAdmin.movimentos.caixa.services.CreditoPessoa', {
    alternateClassName: 'Caixa.services.CreditoPessoa',
    singleton: true,

    gravar: function(creditopessoa) {
        return new Ext.Promise((resolve, reject) => {
            SamosUtils.Request.nodeApi({
                url: '/creditopessoa',
                method: 'POST',
                data: creditopessoa
            })
            .done(res => resolve(res))
            .fail(err => reject(err));
        });
    }
});
