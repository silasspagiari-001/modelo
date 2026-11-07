Ext.define('SamosAdmin.movimentos.movimento.services.Reserva', {
    alternateClassName: 'Movimento.services.Reserva',
    singleton: true,

    exibirNoMovimento: function() {
        const form = Ext.$('formmovimentos')[0];
        const vm = form.getViewModel();
        const movimento = vm.get('model');
        const items = vm.get('produtos').getData().items || [];

        if(movimento.isNew() && vm.get('isPedido') && !vm.get('reservaValida')){
            const itensAtualizados = items.map(item => {
                item.set('MOVIMENTOSITENS_ENTREGUE', item.get('MOVIMENTOSITENS_QUANTIDADE'));
                item.set('MOVIMENTOSITENS_DEPOSITO', 0);
                return item.data;
            });
            movimento.set('MOVIMENTOS_ITENS', itensAtualizados);
            Movimento.services.Reserva.criarJanela();
            return false;
        } else {
            return true;
        }
    },
    
    criarJanela: function (btn, e) {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');

        const viewReserva = Ext.create({
            xtype: 'formmovimentosreserva'
        });
        
        viewReserva.getViewModel().set({
            model: movimento,
            movimentoReadOnly: form.getViewModel().get('readOnly'),
            readOnly: form.getViewModel().get('readOnly')
        });

        form.add(viewReserva);

        setTimeout(() => {
            viewReserva.focus(true);
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
        const janelaReserva = Ext.$('formmovimentosreserva')[0];
        const listReservas = form.getViewModel().get('model.MOVIMENTOS_ITENS');

        if(janelaReserva && janelaReserva.isVisible(true)){
            return janelaReserva.down('samoswidgets-griditems').getStore().getData().items;
        } else if(listReservas){
            return listReservas;
        } else {
            return null;
        }
    },

    finalizar: function() {
        const form = Ext.$('formmovimentos')[0];
        const janelaReserva = Ext.$('formmovimentosreserva')[0];
        const movimento = form.getViewModel().get('model');

        janelaReserva.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());

        const reservasLancadas = this.get()
            .map(reserva => reserva.data)
            //.map(reserva => this.removerCamposLocais(reserva))
            .map(reserva => this.formatarCamposDeData(reserva))
            .map(reserva => SamosUtils.Json.trocarAspasDuplasPorDuasSimples(reserva));

        const itensAtualizados = movimento.get('MOVIMENTOS_ITENS').map((item, index) => {
            Object.assign(item, reservasLancadas[index]);
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

    formatarCamposDeData: function(reserva) {
        const camposDeData = ['MOVIMENTOSITENS_DATAENTREGA', 'MOVIMENTOSITENS_DATAMONTAGEM'];

        camposDeData.forEach(campo => {
            reserva[campo] = momentTz(reserva[campo]).format('YYYY-MM-DD');
        });

        return reserva;
    },
    
    exibir: function() {
        const janelaReserva = Ext.$('formmovimentosreserva')[0];

        try {
            janelaReserva.focus();
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
