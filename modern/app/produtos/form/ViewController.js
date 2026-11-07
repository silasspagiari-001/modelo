Ext.define('SamosAdminModern.produtos.form.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.produtosform',

    showButtons: function() {
        const main = this.getView().up('main');

        main.down('image[reference="logo"]').hide();

        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        })
    },

    onFotosClick: async function(){
        const view = this.getView();
        const viewFotos = Ext.create('SamosAdminModern.produtos.form.fotos.View');

        viewFotos.getViewModel().set({
            idProduto: view.getViewModel().get('model').get('PRODUTOS_ID')
        });
        
        Ext.defer( ()=>{
            viewFotos.show();
            
            Ext.defer( ()=>{
                viewFotos.getViewModel().getStore('main').load();
            }, 130, this);

        }, 120, this );
    },

    onAlterarClick: async function () {
        if(await SamosUtils.Msg.confirm('Deseja realmente alterar?')) {
            const main = this.getView().up('main');
    
            main.getViewModel().set({
                hideVoltar : false,
                hideExcluir: true,
                hideAlterar: true,
                hideGravar : false,
                hideNovo   : true
            });
    
            this.getViewModel().set('readOnly', false);

            Ext.defer(() => {
                this.getView().query('field')
                    .filter(field => !field.getReadOnly())  
                    .map(field => {
                        try { field.el.dom.querySelector('input').style.backgroundColor = '#e5e5e5'; } catch (e) { }
                    })
            }, 100)
        }
    },

    onGravarClick: async function() {
        const view = this.getView();
        const main = view.up('main');
        const vm = this.getViewModel();

        if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
            try {
                view.initGauge();
                
                await SamosUtils.Request.nodeApi({
                    url: `/promocoesitens/${vm.get('promocao.PROMOCOESITENS_ID')}`,
                    method: 'PUT',
                    data: {
                        'PROMOCOESITENS_VALOR': this.lookup('partida').el.dom.querySelector('input').value.replace(/\./, '').replace(/,/, '.'),
                        'PROMOCOESITENS_VALORB': this.lookup('cartao').el.dom.querySelector('input').value.replace(/\./, '').replace(/,/, '.')                      
                    }
                });

                main.getViewModel().set({
                    hideVoltar : false,
                    hideExcluir: true,
                    hideAlterar: false,
                    hideGravar : true,
                    hideNovo   : true
                });
                
                vm.set({
                    'readOnly': true,
                    'initialValues': Object.assign({}, vm.get('model').data)
                });

                Ext.defer(() => {
                    this.getView().query('field')
                        .map(field => {
                            try { field.el.dom.querySelector('input').style.backgroundColor = 'transparent' } catch (e) {}
                        })
                }, 100);

                SamosUtils.Msg.alert('Sucesso', 'Gravado com sucesso', 2000);
            } catch (error) {
                SamosUtils.Msg.error(error, 'Falha ao gravar');
            }
        }

        view.stopGauge();
    },

    onVoltarClick: function() {
        const main = this.getView().up('main');

        main.down('panel').setActiveItem('produtos');
        main.down('container[reference="title"]').setHtml('Produtos');
        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        });
    }
});
