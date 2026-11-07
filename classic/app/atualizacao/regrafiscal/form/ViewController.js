Ext.define('SamosAdmin.atualizacao.regrafiscal.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formregrafiscal',

    checarSeExiste: function(txt, e) {
        txt = txt || this.lookup('codigo');

        const vm = this.getViewModel();
        const idOperacao = parseInt(txt.getValue());
        
        if((!e || SamosUtils.Events.isEnter(e)) && vm.get('updating') && this.getRecord().isNew()) {
            if(!idOperacao) {
                Ext.Note('warning', 'Campo obrigatório'); 
                Ext.defer(txt.focus, 250, txt, [true]);
                return;
            }
            
            this.getView().initGauge('Verificando disponibilidade...');

            return Operacao.services.Model.get(idOperacao)
                .then(operacao => {
                    this.getView().stopGauge(true);
                    if(operacao) { 
                        Ext.Note('warning', 'Regra fiscal já cadastrada'); 
                        Ext.defer(txt.focus, 50, txt, [true]);
                    }
                    return operacao;
                })
                .catch(error => {
                    this.getView().stopGauge();
                    Ext.Note('error', 'Erro no servidor');
                });
        }
    },

    onCstIbsCbsChange: function(combo, value) {
        var view = this.getView();
        var comboClassTrib = view.lookupReference('cclasstrib');

        if (!comboClassTrib) {
            return;
        }

        var store = comboClassTrib.getStore();

        store.clearFilter();

        if (value) {
            value = String(value).trim();

            store.filterBy(function(record) {
                var codigo = String(record.get('field1') || '').trim();

                return codigo.substring(0, 3) === value;
            });
        }
    },

    onGravarClick: async function (btn, event) {
        const jaExiste = await this.checarSeExiste();

        if(!jaExiste) { return this.callParent(arguments); }
    }
});
