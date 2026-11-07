Ext.define('SamosAdminModern.produtos.form.fotos.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.produtosfotos',

    visualizar: function (caminho) {
        //const url = `${configs.getApiNode()}/streaming?caminho=${caminho}&contentType=*/*`;
        //window.open(url, '_blank');

        const viewFoto = Ext.create('SamosAdminModern.produtos.form.fotos.exibirfoto.View');

        viewFoto.getViewModel().set({
            idProduto: this.getViewModel().get('idProduto')
        });
        
        Ext.defer( ()=>{
            viewFoto.show();
            
            Ext.defer( ()=>{
                viewFoto.lookupReference('foto')
                .setHtml(`
                <img title="Foto" width="100%" height="100%" src="${configs.getApiNode()}/streaming?caminho=${caminho}&contentType=*/*">
                </img>
                `);

            }, 130, this);

        }, 120, this );
    },

    onSairClick: function(){
        this.getView().destroy();
    },

    showButtons: function(){
        
    },

    onItemClick: function(dataview, index, target, record, e){
        this.visualizar( record.get('PRODUTOSFOTOS_CAMINHO') );
    }
});
