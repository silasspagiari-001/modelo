Ext.define('SamosAdmin.movimentos.liberacao.search.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.liberacaosearch',

    getBuscarParams: async function () {
        const vm = this.getViewModel();

        return {
            conteudo: '',
            inicio  : momentTz(vm.get('valueInicio')).format('YYYY-MM-DD'),
            final   : momentTz(vm.get('valueFinal')).format('YYYY-MM-DD'),
            ordem   : 0,
            status  : 0
        };
    },

    onLiberarClick: async function (btn, event) {
        const view = this.getView();

        try {
            const grid = view.down('grid');
            const store = grid.getStore();
            const liberacoes = grid.getSelectionModel().getSelection();

            if(liberacoes.length == 0) {
                throw 'Selecione um pedido de liberação';
            }

            view.initGauge('Gravando...');
            
            const liberadas = liberacoes.map(liberacao => {
                liberacao.set({
                    'NOTIFICACAO_STATUS': 'T', 
                    'NOTIFICACAO_DATALEITURA': momentServer().format('YYYY-MM-DD'),
                    'NOTIFICACAO_HORALEITURA': momentServer().format('HH:mm'),
                    'NOTIFICACAO_ID_DESTINO': configs.getUsuario().id
                });
    
                return liberacao.data;
            });

            await SamosUtils.Request.nodeApi({
                url: '/liberacao/lote',
                method: 'PUT',
                data: liberadas
            });

            store.remove(liberacoes);
            Liberacao.services.Monitor.notificarLiberacao(store.getData());
            
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao Liberar');
        }

        view.stopGauge();
    },

    onRecusarClick: async function (btn, event) {
        const view = this.getView();

        try {
            const grid = view.down('grid');
            const store = grid.getStore();
            const liberacoes = grid.getSelectionModel().getSelection();

            if(liberacoes.length == 0) {
                throw 'Selecione um pedido de liberação';
            }

            view.initGauge('Gravando...');
            
            const recusadas = liberacoes.map(liberacao => {
                liberacao.set({
                    'NOTIFICACAO_STATUS': 'F',
                    'NOTIFICACAO_DATALEITURA': momentServer().format('YYYY-MM-DD'),
                    'NOTIFICACAO_HORALEITURA': momentServer().format('HH:mm'),
                    'NOTIFICACAO_ID_DESTINO': configs.getUsuario().id
                });
    
                return liberacao.data;
            });

            await SamosUtils.Request.nodeApi({
                url: '/liberacao/lote',
                method: 'PUT',
                data: recusadas
            });

            store.remove(liberacoes);
            Liberacao.services.Monitor.notificarLiberacao(store.getData());
            
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao Recusar');
        }

        view.stopGauge();
    },

    onItemDblClick: function(grid, record, item, index, e){
        this.getViewModel().set('mensagem', record.get('NOTIFICACAO_MENSAGEM'));
    },

    onSairClick: function(btn, event) {
        this.getView().destroy();
    }
});
