Ext.define('SamosAdmin.movimentos.caixa.services.Filhos', {
    alternateClassName: 'Caixa.services.Filhos',
    singleton: true,

    resetarIds: function(model, campoLista, campoId) {
        const lista = model.get(campoLista) || [];
        
        return lista.map((model, index) => {
            model[campoId] = (parseInt(index) + 1) * -1;
            return model;
        });
    }
});
