Ext.define('SamosAdmin.movimentos.romaneiosmoveis.services.Produto', {
    alternateClassName: 'RomaneioMoveis.services.Produto',
    singleton: true,

    alterar: function(produtos) {
        return new Ext.Promise((resolve, reject) => {
            SamosUtils.Request.nodeApi({
                url: '/produtosromaneiomontagem/lote',
                method: 'PUT',
                data: produtos.map(produto => produto.data)
            })
            .done(res => resolve(res))
            .fail(err => reject(err));
        });
    }
});
