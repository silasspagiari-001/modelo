Ext.define('SamosAdmin.movimentos.movimento.services.Partidas', {
    alternateClassName: 'Movimento.services.Partidas',
    singleton: true,

    exibirNoMovimento: function() {
        const form = Ext.$('formmovimentos')[0];
        const vm = form.getViewModel();
        const movimento = vm.get('model');

        if(movimento.isNew() && (vm.get('isPedido') || vm.get('isNotaEletronica'))){
            Movimento.services.Partidas.criarJanela();
            return false;
        } else {
            return true;
        }
    },
    
    criarJanela: function (btn, e) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');

        const viewPartidas = Ext.create({
            xtype: 'formmovimentospartidas'
        });
        
        viewPartidas.getViewModel().set({
            model: movimento,
            movimentoReadOnly: form.getViewModel().get('readOnly'),
            readOnly: form.getViewModel().get('readOnly')
        });

        form.add(viewPartidas);

        setTimeout(() => {
            viewPartidas.focus(true);
        }, 500);
    },

    validar: function() {
        if(this.existe()) {
            this.finalizar();
            return true;
        } else {
            this.exibir();
            return false;
        }
    },

    existe: function() {
        return !!this.get();
    },

    get: function() {
        const form = Ext.$('formmovimentos')[0];
        const janelaPartidas = Ext.$('formmovimentospartidas')[0];
        const listPartidas = form.getViewModel().get('model.MOVIMENTOS_ITENS');

        if(janelaPartidas && janelaPartidas.isVisible(true)){
            return janelaPartidas.down('samoswidgets-griditems').getStore().getData().items;
        } else if(listPartidas){
            return listPartidas;
        } else {
            return null;
        }
    },

    finalizar: function() {
        const form = Ext.$('formmovimentos')[0];
        const janelaPartidas = Ext.$('formmovimentospartidas')[0];
        const movimento = form.getViewModel().get('model');

        janelaPartidas.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());

        const partidasLancadas = this.get()
            .map(partida => partida.data)
            .map(partida => this.formatarCamposDeData(partida))
            .map(partida => SamosUtils.Json.trocarAspasDuplasPorDuasSimples(partida));

        const itensAtualizados = movimento.get('MOVIMENTOS_ITENS').map((item, index) => {
            Object.assign(item, partidasLancadas[index]);
            return item;
        });

        if(movimento.get('MOVIMENTOSENVIO_ID_USUARIOS') && movimento.get('MOVIMENTOS_ENVIO')) {
            const envioAtualizado = movimento.get('MOVIMENTOS_ENVIO').map((item, index) => {
                item['MOVIMENTOSENVIO_ID_USUARIOS'] = movimento.get('MOVIMENTOSENVIO_ID_USUARIOS') || 0;
                item['VETERINARIOS_NOME'] = movimento.get('VETERINARIOS_NOME') || '';
                item['VETERINARIOS_CPF']  = movimento.get('VETERINARIOS_CPF') || '';
                return item;
            });
            movimento.set('MOVIMENTOS_ENVIO', envioAtualizado);

        }
        
        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);
    },

    removerCamposLocais: function(partida) {
        Object.keys(partida).filter(campo => {
            return campo.split('_')[0] != 'MOVIMENTOSITENS';
        }).forEach(campo => {
            delete partida[campo];
        });

        return partida;
    },

    formatarCamposDeData: function(partida) {
        const camposDeData = ['MOVIMENTOSITENS_DATAENTREGA', 'MOVIMENTOSITENS_DATAMONTAGEM'];

        camposDeData.forEach(campo => {
            partida[campo] = momentTz(partida[campo]).format('YYYY-MM-DD');
        });

        return partida;
    },
    
    exibir: function() {
        const janelaPartidas = Ext.$('formmovimentospartidas')[0];

        try {
            janelaPartidas.focus();
        } catch (e) {
            this.criarJanela();
        }
    },
    
    limpar: function() {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        
        movimento.set('MOVIMENTOS_ITENS', []);
    }
});
