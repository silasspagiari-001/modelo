Ext.define('SamosAdmin.movimentos.notaservicos.services.Filhos', {
    alternateClassName: 'NotaServicos.services.Filhos',
    singleton: true,

    resetarIds: function(model, campoLista, campoId) {
        const lista = model.get(campoLista) || [];
        
        return lista.map((model, index) => {
            model[campoId] = (parseInt(index) + 1) * -1;
            return model;
        });
    }
});
