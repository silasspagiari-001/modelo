Ext.define('SamosAdmin.movimentos.movimento.services.Romaneio', {
    alternateClassName: 'Movimento.services.Romaneio',
    singleton: true,

    exibirNoMovimento: function() {
        return true;
    },
    
    criarJanela: function (btn, e) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');

        const viewRomaneio = Ext.create({
            xtype: 'formmovimentosromaneio'
        });
        
        viewRomaneio.getViewModel().set({
            model: movimento,
            movimentoReadOnly: form.getViewModel().get('readOnly'),
            readOnly: form.getViewModel().get('readOnly')
        });

        form.add(viewRomaneio);

        setTimeout(() => {
            viewRomaneio.focus(true);
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
        const janelaRomaneio = Ext.$('formmovimentosromaneio')[0];
        const listRomaneios = form.getViewModel().get('model.MOVIMENTOS_ITENS');

        if(janelaRomaneio && janelaRomaneio.isVisible(true)){
            return janelaRomaneio.down('samoswidgets-griditems').getStore().getData().items;
        } else if(listRomaneios){
            return listRomaneios;
        } else {
            return null;
        }
    },

    finalizar: function() {
        const form = Ext.$('formmovimentos')[0];
        const janelaRomaneio = Ext.$('formmovimentosromaneio')[0];
        const movimento = form.getViewModel().get('model');

        janelaRomaneio.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());

        const romaneiosLancados = this.get()
            .map(romaneio => romaneio.data)
            .map(romaneio => this.formatarCamposDeData(romaneio))
            .map(romaneio => SamosUtils.Json.trocarAspasDuplasPorDuasSimples(romaneio));

        const itensAtualizados = movimento.get('MOVIMENTOS_ITENS').map((item, index) => {
            Object.assign(item, romaneiosLancados[index]);
            return item;
        });
        
        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);
    },

    removerCamposLocais: function(reserva) {
        Object.keys(reserva).filter(campo => {
            return campo.split('_')[0] != 'MOVIMENTOSITENS';
        }).forEach(campo => {
            delete reserva[campo];
        });

        return reserva;
    },

    formatarCamposDeData: function(romaneio) {
        const camposDeData = ['MOVIMENTOSITENS_DATAENTREGA', 'MOVIMENTOSITENS_DATAMONTAGEM'];

        camposDeData.forEach(campo => {
            romaneio[campo] = momentTz(romaneio[campo]).format('YYYY-MM-DD');
        });

        return romaneio;
    },
    
    exibir: function() {
        const janelaRomaneio = Ext.$('formmovimentosromaneio')[0];

        try {
            janelaRomaneio.focus();
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
