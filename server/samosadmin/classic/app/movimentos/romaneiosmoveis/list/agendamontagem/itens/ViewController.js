Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.itens.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.romaneiosmoveisagendamontagemitens',

    onGravarClick: function() {
        
        const grid = this.getView().down('grid');
        const todosProdutos = grid.getStore().data.items || [];                
        const selecionados = grid.getSelectionModel().getSelection();

        const produtos = todosProdutos.map(produto => {
            if(selecionados.some(selecionado => {
                return selecionado.get('MOVIMENTOSITENS_ID') == produto.get('MOVIMENTOSITENS_ID')
            })) {
                produto.set('MOVIMENTOSITENS_CSTPIS', 'ML');
            } else {
                produto.set('MOVIMENTOSITENS_CSTPIS', '0');
            }
            return produto;
        });        

        Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
            if (btn == 'yes') {
                RomaneioMoveis.services.Produto.alterar(produtos)
                    .then(res => {
                        Ext.Note('success', 'Produtos atualizados com sucesso!');
                        this.onSairClick();
                    })
                    .catch(err => {
                        console.error(err);
                        Ext.Note('error', 'Erro no servidor');
                    })
                    .finally(() => this.onSairClick());
            }
        });

    }
    
});
