Ext.define('SamosAdmin.atualizacao.operacoes.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formoperacoes',

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
                        Ext.Note('warning', 'Operação já cadastrada'); 
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

    onGravarClick: async function (btn, event) {
        const jaExiste = await this.checarSeExiste();

        if(!jaExiste) { return this.callParent(arguments); }
    }
});
