Ext.define('SamosAdmin.movimentos.movimento.services.Devolucao', {
    alternateClassName: 'Movimento.services.Devolucao',
    singleton: true,

    gravar: function(devolucao) {
        return new Ext.Promise((resolve, reject) => {
            SamosUtils.Request.nodeApi({
                url: '/devolucao', 
                method: 'POST',
                data: devolucao
            })
            .done(res => resolve(res))
            .fail(err => reject(err));
        });
    },

    removerItensNaoDevolvidos: function(form, store){
        const naoDevolver = store.data.items.filter(produto => produto.get('ITENS_DEVOLUCAO') != 'T');
        
        store.remove(naoDevolver);

        return new Ext.Promise((resolve, reject) => {
            if(naoDevolver.length == 0){
                resolve();
            } else {
                setTimeout(() => {
                    form.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());
                    setTimeout(() => {
                        resolve();
                    }, 500);
                }, 500);                        
            }
        });
    }
});
