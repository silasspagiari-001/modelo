Ext.define('SamosAdmin.movimentos.movimento.services.RecepcaoMoveis', {
    alternateClassName: 'Movimento.services.RecepcaoMoveis',
    singleton: true,

    exibirNoMovimento: function() {
        const form = Ext.$('formmovimentos')[0];
        const vm = form.getViewModel();
        const movimento = vm.get('model');

        if(vm.get('isPedidoCompra') && !vm.get('RecepcaoValida')){
            Movimento.services.RecepcaoMoveis.criarJanela();
            return false;
        } else {
            return true;
        }
    },
    
    criarJanela: function (btn, e) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');

        const viewRecepcao = Ext.create({
            xtype: 'formmovimentosrecepcaomoveis'
        });
        
        viewRecepcao.getViewModel().set({
            model: movimento,
            movimentoReadOnly: form.getViewModel().get('readOnly'),
            readOnly: form.getViewModel().get('readOnly')
        });

        viewRecepcao.focus(true);
        form.add(viewRecepcao);
    },

    validar: function(movimento) {
        const entregueAlgo = (movimento.get('MOVIMENTOS_ITENS') || []).some(item => {
            const recebidoAgora    = grams(item['MOVIMENTOSITENS_ENTREGUE']);
            return recebidoAgora > 0;
        });

        if(!entregueAlgo) {
            Ext.Note('warning', 'Lançamentos de recepção inconsistentes');
            this.exibir();
            return false;
        } else {
            if(this.existe()) {
                this.finalizar();
                return true;
            } else {
                this.exibir();
                return false;
            }    
        }
    },

    existe: function() {
        return !!this.get();
    },

    get: function() {
        const form = Ext.$('formmovimentos')[0];
        const janelaRecepcao = Ext.$('formmovimentosrecepcaomoveis')[0];
        const listRecepcoes = form.getViewModel().get('model.MOVIMENTOS_ITENS');

        if(janelaRecepcao && janelaRecepcao.isVisible(true)){
            return janelaRecepcao.down('samoswidgets-griditems').getStore().getData().items;
        } else if(listRecepcoes){
            return listRecepcoes;
        } else {
            return null;
        }
    },

    finalizar: function() {
        const form = Ext.$('formmovimentos')[0];
        const janelaRecepcao = Ext.$('formmovimentosrecepcaomoveis')[0];
        const movimento = form.getViewModel().get('model');

        janelaRecepcao.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());

        const recepcoesLancadas = this.get()
            .map(recepcao => recepcao.data)
            .map(recepcao => this.removerCamposLocais(recepcao))
            .map(recepcao => this.formatarCamposDeData(recepcao))
            .map(recepcao => SamosUtils.Json.trocarAspasDuplasPorDuasSimples(recepcao));

        const itensAtualizados = movimento.get('MOVIMENTOS_ITENS').map((item, index) => {
            Object.assign(item, recepcoesLancadas[index]);
            return item;
        });
        
        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);
    },

    removerCamposLocais: function(recepcao) {
        Object.keys(recepcao).filter(campo => {
            return campo.split('_')[0] != 'MOVIMENTOSITENS';
        }).forEach(campo => {
            delete recepcao[campo];
        });

        return recepcao;
    },

    formatarCamposDeData: function(recepcao) {
        const camposDeData = ['MOVIMENTOSITENS_DATAENTREGA', 'MOVIMENTOSITENS_DATAMONTAGEM'];

        camposDeData.forEach(campo => {
            recepcao[campo] = momentTz(recepcao[campo]).format('YYYY-MM-DD');
        });

        return recepcao;
    },
    
    exibir: function() {
        const janelaRecepcao = Ext.$('formmovimentosrecepcaomoveis')[0];

        try {
            janelaRecepcao.focus();
        } catch (e) {
            this.criarJanela();
        }
    },
    
    limpar: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        
        movimento.set('MOVIMENTOS_ITENS', []);
    },

    alterar: function(produtos) {
        return new Ext.Promise((resolve, reject) => {
            SamosUtils.Request.nodeApi({
                url: '/produtosrecepcaomoveis/lote',
                method: 'PUT',
                data: produtos.map(produto => produto.data)
            })
            .done(res => resolve(res))
            .fail(err => reject(err));
        });
    }    
/* depois vamos gerar o novo pedido de compra aqui
    gerarRomaneio: function(entrega) {
        return new Ext.Promise((resolve, reject) => {
            SamosUtils.Request.nodeApi({
                url: '/romaneioimediata',
                method: 'POST',
                data: entrega
            })
            .done(res => resolve(res))
            .fail(err => reject(err));
        });
    }*/
});
