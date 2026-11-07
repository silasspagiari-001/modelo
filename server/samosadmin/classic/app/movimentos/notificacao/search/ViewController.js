Ext.define('SamosAdmin.movimentos.notificacao.search.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.notificacaosearch',

    getBuscarParams: async function () {
        const vm = this.getViewModel();

        return {
            conteudo: '',
            inicio  : momentTz(vm.get('valueInicio')).format('YYYY-MM-DD'),
            final   : momentTz(vm.get('valueFinal')).format('YYYY-MM-DD'),
            ordem   : 0,
            status  : 6
        };
    },

    onMarcarLidaClick: async function (btn, event) {
        const view = this.getView();

        try {
            const grid = view.down('grid');
            const store = grid.getStore();
            const notificacoes = grid.getSelectionModel().getSelection();

            if(notificacoes.length == 0) {
                throw 'Selecione uma notificação';
            }

            view.initGauge('Gravando...');
            
            const lidas = notificacoes.map(notificacao => {
                notificacao.set({
                    'NOTIFICACAO_STATUS': 'L', 
                    'NOTIFICACAO_DATALEITURA': momentServer().format('YYYY-MM-DD'),
                    'NOTIFICACAO_HORALEITURA': momentServer().format('HH:mm')
                });
    
                return notificacao.data;
            });

            await SamosUtils.Request.nodeApi({
                url: '/notificacao/lote',
                method: 'PUT',
                data: lidas
            });

            store.remove(notificacoes);
            Notificacao.services.Monitor.notificarUsuario(store.getData());
            
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao marcar como lida');
        }

        view.stopGauge();
    },

    onReagendarClick: function(btn, event) {
        const notificacoes = this.getView().down('grid').getSelectionModel().getSelection();

        if(notificacoes.length) {
            const view = Ext.create({
                xtype: 'notificacaoreagendamento'
            });
    
            view.getViewModel().set({
                'model': notificacoes
            });
        } else { 
            Ext.Note('warning', 'Selecione uma notificação');
        }
    },

    onItemDblClick: function(grid, record, item, index, e){
        this.getViewModel().set('mensagem', record.get('NOTIFICACAO_MENSAGEM'));
    },

    onSairClick: function(btn, event) {
        this.getView().destroy();
    }
});
