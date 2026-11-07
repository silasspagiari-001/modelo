Ext.define('SamosAdmin.movimentos.promocoes.services.Model', {
    alternateClassName: 'Promocao.services.Model',
    singleton: true,

    get: function(id) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.movimentos.promocoes.Model',
            proxy: {
                pageParam: '',
                startParam: '',
                limitParam: '',
                url: `server/promocoes/${id}`
            }
        });

        return store.load()
            .then(records => records)
            .catch(() => Ext.Note('error', 'Erro no servidor'));
    }
});
