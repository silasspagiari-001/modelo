Ext.define('SamosAdmin.movimentos.movimento.services.EntregaMoveis', {
    alternateClassName: 'Movimento.services.EntregaMoveis',
    singleton: true,

    exibirNoMovimento: function() {
        const form = Ext.$('formmovimentos')[0];
        const vm = form.getViewModel();
        const movimento = vm.get('model');

        if(
            movimento.isNew() && 
            vm.get('isPedido') &&
            !vm.get('entregaValida')
        ){
            if(movimento.get('DOCUMENTOS_COLETAENTREGA') == 'T') {
                Movimento.services.EntregaMoveis.criarJanela();
                return false;
            } else {
                this.finalizar();
                return true;
            }
        } else {
            this.finalizar();
            return true;
        }
    },
    
    criarJanela: function (btn, e) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const item = form.lookup('produtos').getStore().data.items[0];
        const temMontagem = cents(movimento.get('MONTAGENS_VALOR')) > 0 && (movimento.get('MOVIMENTOS_NFE') || '').trim() != 'ABA';

        if(movimento.isNew() && form.getViewModel().get('updating')){
            item.set({
                'MOVIMENTOSITENS_DATAENTREGA'  : '',
                'MOVIMENTOSITENS_HORAENTREGA'  : 'M',
                'MOVIMENTOSITENS_DATAMONTAGEM' : '',
                'MOVIMENTOSITENS_HORAMONTAGEM' : temMontagem ? 'M' : ''
            });
        }

        const viewEntrega = Ext.create({
            xtype: 'formmovimentosentregamoveis'
        });
        
        viewEntrega.getViewModel().set({
            model: item.data,
            movimento: movimento,
            movimentoReadOnly: form.getViewModel().get('readOnly'),
            readOnly: form.getViewModel().get('readOnly'),
            temMontagem: temMontagem
        });

        viewEntrega.focus(true);
        form.add(viewEntrega);
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
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const temMontagem = cents(movimento.get('MONTAGENS_VALOR')) > 0;
        const itens = this.get();

        return  itens &&
                itens['MOVIMENTOSITENS_DATAENTREGA'] &&
                (temMontagem ? itens['MOVIMENTOSITENS_DATAMONTAGEM'] : true);
    },

    get: function() {
        const form = Ext.$('formmovimentos')[0];
        const janelaEntrega = Ext.$('formmovimentosentregamoveis')[0];
        const itens = form.getViewModel().get('model.MOVIMENTOS_ITENS');

        if(janelaEntrega && janelaEntrega.isVisible(true)){
            return janelaEntrega.getViewModel().get('model');
        } else if(itens && itens[0]){
            return itens[0];
        } else {
            return null;
        }
    },

    finalizar: function() {
        if(!this.get()) { return; }
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const itens = form.lookup('produtos').getStore().data.items;
        const entrega = this.formatarCamposDeData(this.get());
        const temMontagem = cents(movimento.get('MONTAGENS_VALOR')) > 0;

        const itensAtualizados = itens.map(item => {
            item.set('MOVIMENTOSITENS_DATAENTREGA',  entrega['MOVIMENTOSITENS_DATAENTREGA']); 
            item.set('MOVIMENTOSITENS_DATAMONTAGEM', temMontagem ? entrega['MOVIMENTOSITENS_DATAMONTAGEM'] : '1899-12-30');
            item.set('MOVIMENTOSITENS_HORAENTREGA',  entrega['MOVIMENTOSITENS_HORAENTREGA']); 
            item.set('MOVIMENTOSITENS_HORAMONTAGEM', temMontagem ? entrega['MOVIMENTOSITENS_HORAMONTAGEM'] : '');
            return item.data;
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
        const janelaEntrega = Ext.$('formmovimentosentregamoveis')[0];

        try {
            janelaEntrega.focus();
        } catch (e) {
            this.criarJanela();
        }
    }
});
