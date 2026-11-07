Ext.define('SamosAdmin.movimentos.liberacao.services.Monitor', {
    alternateClassName: 'Liberacao.services.Monitor',
    singleton: true,
    
    init: function() {
        var self = this;
    
        if (configs.getMovimentos().liberacaoViaRedis == true) {
    
            let permUser = SamosUtils.Json.tryJsonToObj(configs.getPermissao()['PERMISSOES_ITENS']);
    
            let liberUser = null;
    
            if (permUser && permUser.children) {
    
                for (var i = 0; i < permUser.children.length; i++) {
    
                    var item = permUser.children[i];
    
                    if (item.children) {
    
                        var encontrou = false;
    
                        for (var j = 0; j < item.children.length; j++) {
    
                            var child = item.children[j];
    
                            if (child.text === 'Liberações') {
                                encontrou = true;
                                break;
                            }
                        }
    
                        if (encontrou) {
    
                            for (var k = 0; k < item.children.length; k++) {
    
                                var childItem = item.children[k];
    
                                if (childItem.text === 'Liberações') {
                                    liberUser = childItem;
                                    break;
                                }
                            }
                        }
                    }
    
                    if (liberUser) {
                        break;
                    }
                }
            }
    
            let admLiberacao = liberUser ? liberUser.read : 'F';
    
            if (admLiberacao == 'T') {
    
                try {
    
                    var result = self.verificarPendentes();
    
                    // Compatibilidade com Promise sem async/await
                    if (result && typeof result.then === 'function') {
    
                        result.catch(function(error) {
                            console.error(error);
                        });
                    }
    
                } catch (error) {
                    console.error(error);
                }
    
                // checar a cada 15 segundos
                setTimeout(function() {
                    self.init();
                }, 1 * 15 * 1000);
            }
        }
    },

    verificarPendentes: async function() {

        const queryLiberacoes = await SamosUtils.Request.nodeApi({
            url: `/liberacao`,
            method: 'GET',
            query: {
                checagem: 'P',
                device: 'desktop'
            }
        });

//        console.log('verificandoPendentes: ', queryLiberacoes);

        this.notificarLiberacao(queryLiberacoes);
    },
    
    notificarLiberacao: function(liberacoes) {
        const tema = configs.getTema();
        const el = document.querySelector('.contador-liberacao-' + tema);
        const qtde = liberacoes ? liberacoes.length : 0;
        const qtdeAtual = Number(el.getAttribute('data-count'));

        el.dataSet = liberacoes;

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
                    this.atualizarDados(liberacoes);
                }
            }
        } else if(qtde != 0){
            if(!this.janelaAberta()) {
                this.mostrarLembrete();
            } else {
                this.atualizarDados(liberacoes);
            }
        }        
    },

    mostrarLembrete: function() {
        Ext.Note(
            'warning', 
            `Você tem Liberações Pendentes.<br><br>
            <a href="#" onclick="Liberacao.services.Monitor.exibirJanelaLiberacoes()">
                <font color="blue">Liberar agora</font>
            </a>`, 5000);
    },

    atualizarDados: function(liberacoes) {
        Ext.$('liberacaosearch')[0].getViewModel().set('memoryStore', liberacoes);
    },

    exibirJanelaLiberacoes: function() {
        const tema = configs.getTema();
        const el = document.querySelector('.contador-liberacao-' + tema);
        const data = el.dataSet;
        const view = Ext.create({
            xtype: 'liberacaosearch'
        });

        view.getViewModel().set({
            module: 'liberacao',
            sufix: '',
            valueConteudo: '',
            valueStatus: 0,
            memoryStore: data
        });

        try { Ext.$('note')[0].destroy(); } catch(e) {}
    },

    janelaAberta: function() {
        return !!Ext.$('liberacaosearch')[0];
    }
});
