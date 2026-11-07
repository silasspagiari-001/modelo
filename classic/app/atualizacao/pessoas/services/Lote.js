Ext.define('SamosAdmin.atualizacao.pessoas.services.Lote', {
    alternateClassName: 'Pessoa.services.Lote',
    singleton: true,

    alterar: function(registros) {
        return new Ext.Promise((resolve, reject) => {
            SamosUtils.Request.nodeApi({
                url: '/pessoas/lote',
                method: 'PUT',
                data: registros.map(registro => registro.data)
            })
            .done(res => resolve(res))
            .fail(err => reject(err));
        });
    }
});
