Ext.define('SamosAdmin.movimentos.romaneiosindustria.services.Produto', {
    alternateClassName: 'RomaneioIndustria.services.Produto',
    singleton: true,

    alterar: function(produtos) {
        return new Ext.Promise((resolve, reject) => {
            SamosUtils.Request.nodeApi({
                url: '/produtosromaneioindustria/lote',
                method: 'PUT',
                data: produtos.map(produto => produto.data)
            })
            .done(res => resolve(res))
            .fail(err => reject(err));
        });
    }
});
