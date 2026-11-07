Ext.define('SamosAdminModern.notificacao.Monitor', {
    alternateClassName: 'Notificacao.services.Monitor',
    singleton: true,
    
    init: async function() {
        try {
            await this.verificarNaoLidas();
        } catch(error) {
            console.error(error);
        }

        setTimeout(() => this.init(), 1 * 60 * 1000);
    },

    verificarNaoLidas: async function() {
        const queryNotificacoes = await SamosUtils.Request.nodeApi({
            url: `/notificacao`,
            method: 'GET',
            query: {
                checagem: 'T',
                device: 'phone'
            }
        });

        this.notificarUsuario(queryNotificacoes.results);
    },
    
    notificarUsuario: function(notificacoes) {
        const el = document.querySelector('.notificacao-cls');
        const qtde = notificacoes ? notificacoes.length : 0;
        const qtdeAtual = Number(el.innerHTML || 0);

        if(qtde != qtdeAtual) {
            el.innerHTML = qtde || '';
            if(qtde != 0){
                SamosUtils.Msg.alert('Notificação', 'Nova Notificação', 1500)
            }
        }
    }
});
