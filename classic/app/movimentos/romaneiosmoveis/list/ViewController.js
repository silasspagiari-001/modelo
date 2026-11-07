Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.romaneiosmoveis',

    onNovoClick: async function () {

        const view = this.getView();      
          
        try {

            const nomeDocumento = this.getView().title;

            if(configs.getClientName() == 'prudenmoveis' && !configs.getUsuario().privilegiado) { // Na pruden checa sempre se o caixa está aberto, em qualquer movimento
                view.initGauge('Verificando caixa diário...');   

                const data = momentServer().format('YYYY-MM-DD');
                const statusCaixa = await Caixa.services.Model.getStatus(data);
              
                view.stopGauge(true);

                if(statusCaixa == 'F') {
                    Ext.Note('warning', 'O caixa diário está fechado!');
                    return;
                } else if(!statusCaixa) {
                    Ext.Note('warning', 'O caixa diário não foi aberto!');                    
                    return;
                }
            }
            const form = await this.callParent(arguments);
            await RomaneioMoveis.services.Model.definirValoresPadrao(form, nomeDocumento);
            return form;
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falhar ao criar novo documento');
        }
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();
        const title = this.getView().title;
        const idEmpresa = configs.getEmpresa().id;

        return {
            empresa      : idEmpresa,
            documento    : '',
            nomedocumento: title,
            numero       : vm.get('valueNumero'),
            pessoa       : vm.get('valueIdPessoa'),
            inicio       : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final        : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            ordem        : vm.get('valueOrdem'),
            status       : vm.get('valueStatus')
        };
    },

    afterLoadMainStore: function(store, records, success, operation){
        records.forEach(record => {
            record.set('CONTAGEM_ITENS', record.get('ROMANEIOS_ITENS').length);
        });
    },

    onAgendamentoClick: function() {
        const tipo = this.getView().title.match(/Entrega/) ? 'entrega' : 'montagem';

        const view = Ext.create({
            xtype: 'romaneiosmoveisagenda' + tipo,
            permissoes: this.getView().getPermissoes()
        });

        view.getViewModel().set({
            valueTurno: 0,
            valueSituacao: 0
        });

        this.getView().add(view);
    },

    onBaixaPorLoteClick: function() {
        const view = Ext.create({
            xtype: 'romaneiosmoveisbaixa',
            tipo: this.getView().title,
            permissoes: this.getView().getPermissoes()
        });

        view.getViewModel().set({
            valueStatus: 1,
            valuePessoa: '',
            valueIdPessoa: ''
        });

        this.getView().add(view);
    }
});
