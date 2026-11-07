Ext.define('SamosAdmin.movimentos.movimento.services.EntregaConstrucao', {
    alternateClassName: 'Movimento.services.EntregaConstrucao',
    singleton: true,

    exibirNoMovimento: function() {
        const form = Ext.$('formmovimentos')[0];
        const vm = form.getViewModel();
        const movimento = vm.get('model');

        if(vm.get('isPedido') && !vm.get('entregaValida')){
            if(movimento.get('DOCUMENTOS_COLETAENTREGA') == 'T') {
                Movimento.services.EntregaConstrucao.criarJanela();
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    },
    
    criarJanela: function (btn, e) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');

        const viewEntrega = Ext.create({
            xtype: 'formmovimentosentregaconstrucao'
        });
        
        viewEntrega.getViewModel().set({
            model: movimento,
            movimentoReadOnly: form.getViewModel().get('readOnly'),
            readOnly: form.getViewModel().get('readOnly')
        });

        viewEntrega.focus(true);
        form.add(viewEntrega);
    },

    validar: function(movimento) {
        const statusEntrega = movimento.get('MOVIMENTOS_SITUACAO'); // 0 - Entregue, 1 - Entregar
        const entregueTotal = (movimento.get('MOVIMENTOS_ITENS') || []).every(item => {
            const qtde             = grams(item['MOVIMENTOSITENS_QUANTIDADE']);
            const entregueLoja     = grams(item['MOVIMENTOSITENS_ENTREGUE']);
            const entregueDeposito = grams(item['MOVIMENTOSITENS_DEPOSITO']);
            return entregueLoja + entregueDeposito == qtde;
        });

        const entregarAlgo = (movimento.get('MOVIMENTOS_ITENS') || []).some(item => {
            const entregaImediata  = grams(item['MOVIMENTOSITENS_IMEDIATA']);
            const entregaFutura    = grams(item['ITENS_ENTREGAR']);
            return entregaImediata + entregaFutura > 0;
        });

        if((statusEntrega == 0 && !entregueTotal) || (statusEntrega == 1 && !entregarAlgo)) {
            Ext.Note('warning', 'Lançamentos de entrega inconsistentes');
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
        const janelaEntrega = Ext.$('formmovimentosentregaconstrucao')[0];
        const listEntregas = form.getViewModel().get('model.MOVIMENTOS_ITENS');

        if(janelaEntrega && janelaEntrega.isVisible(true)){
            return janelaEntrega.down('samoswidgets-griditems').getStore().getData().items;
        } else if(listEntregas){
            return listEntregas;
        } else {
            return null;
        }
    },

    finalizar: function() {
        const form = Ext.$('formmovimentos')[0];
        const janelaEntrega = Ext.$('formmovimentosentregaconstrucao')[0];
        const movimento = form.getViewModel().get('model');

        janelaEntrega.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());

        const entregasLancadas = this.get()
            .map(entrega => entrega.data)
            .map(entrega => this.removerCamposLocais(entrega))
            .map(entrega => this.formatarCamposDeData(entrega))
            .map(entrega => SamosUtils.Json.trocarAspasDuplasPorDuasSimples(entrega));

        const itensAtualizados = movimento.get('MOVIMENTOS_ITENS').map((item, index) => {
            Object.assign(item, entregasLancadas[index]);
            return item;
        });
        
        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);
    },

    removerCamposLocais: function(entrega) {
        Object.keys(entrega).filter(campo => {
            return campo.split('_')[0] != 'MOVIMENTOSITENS';
        }).forEach(campo => {
            delete entrega[campo];
        });

        return entrega;
    },

    formatarCamposDeData: function(entrega) {
        const camposDeData = ['MOVIMENTOSITENS_DATAENTREGA', 'MOVIMENTOSITENS_DATAMONTAGEM'];

        camposDeData.forEach(campo => {
            entrega[campo] = momentTz(entrega[campo]).format('YYYY-MM-DD');
        });

        return entrega;
    },
    
    exibir: function() {
        const janelaEntrega = Ext.$('formmovimentosentregaconstrucao')[0];

        try {
            janelaEntrega.focus();
        } catch (e) {
            this.criarJanela();
        }
    },
    
    limpar: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        
        movimento.set('MOVIMENTOS_ITENS', []);
    },

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
    }
});
