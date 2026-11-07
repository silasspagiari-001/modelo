Ext.define('SamosAdmin.movimentos.movimento.services.Casco', {
    alternateClassName: 'Movimento.services.Casco',
    singleton: true,
    
    criarJanela: function (btn, e) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');

        const viewCasco = Ext.create({
            xtype: 'formmovimentoscasco'
        });
        
        viewCasco.getViewModel().set({
            model: movimento,
            movimentoReadOnly: form.getViewModel().get('readOnly'),
            readOnly: form.getViewModel().get('readOnly')
        });

        form.add(viewCasco);

        setTimeout(() => {
            viewCasco.focus(true);
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
        const janelaCasco = Ext.$('formmovimentoscasco')[0];
        const listCascos = form.getViewModel().get('model.MOVIMENTOS_ITENS');

        if(janelaCasco && janelaCasco.isVisible(true)){
            return janelaCasco.down('samoswidgets-griditems').getStore().getData().items;
        } else if(listCascos){
            return listCascos;
        } else {
            return null;
        }
    },

    finalizar: function() {
        const form = Ext.$('formmovimentos')[0];
        const janelaCasco = Ext.$('formmovimentoscasco')[0];
        const movimento = form.getViewModel().get('model');

        janelaCasco.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());

        const cascosLancados = this.get()
            .map(casco => casco.data)
            .map(casco => this.formatarCamposDeData(casco))
            .map(casco => SamosUtils.Json.trocarAspasDuplasPorDuasSimples(casco));

        const itensAtualizados = movimento.get('MOVIMENTOS_ITENS').map((item, index) => {
            Object.assign(item, cascosLancados[index]);
            return item;
        });
        
        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);
    },

    removerCamposLocais: function(casco) {
        Object.keys(casco).filter(campo => {
            return campo.split('_')[0] != 'MOVIMENTOSITENS';
        }).forEach(campo => {
            delete casco[campo];
        });

        return casco;
    },

    formatarCamposDeData: function(casco) {
        const camposDeData = ['MOVIMENTOSITENS_DATAENTREGA', 'MOVIMENTOSITENS_DATAMONTAGEM'];

        camposDeData.forEach(campo => {
            casco[campo] = momentTz(casco[campo]).format('YYYY-MM-DD');
        });

        return casco;
    },
    
    exibir: function() {
        const janelaCasco = Ext.$('formmovimentoscasco')[0];

        try {
            janelaCasco.focus();
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