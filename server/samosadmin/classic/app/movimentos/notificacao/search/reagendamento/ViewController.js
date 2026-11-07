Ext.define('SamosAdmin.movimentos.notificacao.search.reagendamento.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.notificacaoreagendamento',

    onGravarClick: async function(btn, event) {
        const view = this.getView();

        try {
            const vm = this.getViewModel();
            const notificacoes = vm.get('model');
            const janelaNotificacoes = Ext.$('notificacaosearch')[0];
            const dataAvisar = vm.get('dataAvisar');
            const horaAvisar = vm.get('horaAvisar');
    
            view.initGauge('Reagendando...');

            const reagendadas = notificacoes.map(notificacao => {
                notificacao.set({
                    'NOTIFICACAO_DATAAVISAR' : dataAvisar, 
                    'NOTIFICACAO_HORAAVISAR' : horaAvisar, 
                    'NOTIFICACAO_STATUS'     : 'R', 
                    'NOTIFICACAO_DATALEITURA': '1899-12-30',
                    'NOTIFICACAO_HORALEITURA': ''
                });
    
                return notificacao.data;
            });

            await SamosUtils.Request.nodeApi({
                url: '/notificacao/lote',
                method: 'PUT',
                data: reagendadas
            });

            if(janelaNotificacoes) {
                const store = janelaNotificacoes.down('grid').getStore();
                store.remove(notificacoes);
                Notificacao.services.Monitor.notificarUsuario(store.getData());
                if(!store.getData().length){
                    janelaNotificacoes.getController().onSairClick();
                }
            }

            Ext.Note('success', 'Reagendado com sucesso');
            this.onSairClick();

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao reagendar');
        }

        view.stopGauge();
    },

    onSairClick: function(btn, event) {
        this.getView().destroy();
    }
});
