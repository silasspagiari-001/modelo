Ext.define('SamosAdmin.atualizacao.relacoes.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formrelacoes',

    publicarModel: function(txt, record) { 
        setTimeout(() => {
            txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
        }, 200);
    },

    checarSeExiste: function(txt, e) {
        txt = txt || this.lookup('produtoweb');

        const vm = this.getViewModel();
        const idProduto = parseInt(txt.getValue());
        
        if((!e || SamosUtils.Events.isEnter(e)) && vm.get('updating') && this.getRecord().isNew()) {
            if(!idProduto) {
                Ext.Note('warning', 'Campo obrigatório'); 
                Ext.defer(txt.focus, 250, txt, [true]);
                return;
            }
            
            this.getView().initGauge('Verificando disponibilidade...');

            return Relacao.services.Model.get(idProduto)
                .then(produto => {
                    this.getView().stopGauge(true);
                    if(produto) { 
                        Ext.Note('warning', 'Produto Web já cadastrado'); 
                        txt.setV
                        Ext.defer(txt.focus, 50, txt, [true]);
                    }
                    return produto;
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
