Ext.define('SamosAdmin.movimentos.notificacao.services.Monitor', {
    alternateClassName: 'Notificacao.services.Monitor',
    singleton: true,
    
    init: async function() {
        //Se usa notificação, dispara o evento de checagem
        if( configs._notificacoes == true )
        {
            try {
                await this.verificarNaoLidas();
            } catch(error) {
                console.error(error);
            }

            setTimeout(() => this.init(), 1 * 60 * 1000);
        }
    },

    verificarNaoLidas: async function() {
        const queryNotificacoes = await SamosUtils.Request.nodeApi({
            url: `/notificacao`,
            method: 'GET',
            query: {
                checagem: 'T',
                device: 'desktop'
            }
        });

        this.notificarUsuario(queryNotificacoes.results);
    },
    
    notificarUsuario: function(notificacoes) {
        const tema = configs.getTema();
        const el = document.querySelector('.contador-notificacao-' + tema);
        const qtde = notificacoes ? notificacoes.length : 0;
        const qtdeAtual = Number(el.getAttribute('data-count'));

        el.dataSet = notificacoes;

        if(qtde != qtdeAtual) {
            el.setAttribute('data-count', qtde);
            if(qtde > qtdeAtual) {
                el.classList.remove('notify');
                el.offsetWidth = el.offsetWidth;
                el.classList.add('notify');
            }
            if(qtde === 0){
                el.classList.remove('show-count');
            } else {
                el.classList.add('show-count');
                if(!this.janelaAberta()) {
                    this.mostrarLembrete();
                } else {
                    this.atualizarDados(notificacoes);
                }
            }
        } else if(qtde != 0){
            if(!this.janelaAberta()) {
                this.mostrarLembrete();
            } else {
                this.atualizarDados(notificacoes);
            }
        }
    },

    mostrarLembrete: function() {
        Ext.Note(
            'warning', 
            `Você tem notificações não lidas.<br><br>
            <a href="#" onclick="Notificacao.services.Monitor.exibirJanelaNotificacoes()">
                <font color="blue">Ler agora</font>
            </a>`, 5000);
    },

    atualizarDados: function(notificacoes) {
        Ext.$('notificacaosearch')[0].getViewModel().set('memoryStore', notificacoes);
    },

    exibirJanelaNotificacoes: function() {
        const tema = configs.getTema();
        const el = document.querySelector('.contador-notificacao-' + tema);
        const data = el.dataSet;
        const view = Ext.create({
            xtype: 'notificacaosearch' 
        });

        view.getViewModel().set({
            module: 'notificacao',
            sufix: '',
            valueConteudo: '',
            valueStatus: 0,
            memoryStore: data
        });

        try { Ext.$('note')[0].destroy(); } catch(e) {}
    },

    janelaAberta: function() {
        return !!Ext.$('notificacaosearch')[0];
    }
});
