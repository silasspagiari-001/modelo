Ext.define('SamosAdminModern.menu.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.menulist',

    onCarregarMenu: function( dataview, value, oldValue, eOpts){
        const menuList = Ext.$('menulist')[0],
              vmList = menuList.getViewModel(),
              permissoes = vmList.get('listMenu'),
              storeList = this.lookupReference('menulist'),
              //Removi o produto para adicionar para todos terem acesso
              permissoesSemProduto = permissoes.filter( ( perm ) => { if( perm.module != 'produtos' ){ return perm } } );

        //Adiciona na lista de permissoes
        permissoesSemProduto.unshift( {
            'text'    : 'Produtos',
            'module'  : 'produtos',
            'read'    : true,
            'create'  : false,
            'update'  : false,
            'destroy' : false
        } );

        permissoesSemProduto.unshift( {
            'type'    : 'window',
            'text'    : 'Dashboard',
            'module'  : 'dashboard',
            'read'    : true,
            'create'  : false,
            'update'  : false,
            'destroy' : false
        } );

        //Atualiza o store
        Ext.defer( ()=>{
            storeList.setData( permissoesSemProduto );

        }, 100, this );
    },

    onMenuClick: function(dataview, index, target, record, e) {
        const main = this.getView().up('main');

        //Se for uma pagina
        if( record.get('type') != 'window' )
        {
            main.down('panel').setActiveItem(record.get('module'));
            main.down('container[reference="title"]').setHtml(record.get('text'));
            if( main.down('panel').getActiveItem() )
            {
                main.down('panel').getActiveItem().getViewModel().getStore('main').setData([]);
            }
        //Se for um window
        }else{
            const windowInstance = Ext.create(record.get('module'));
            windowInstance.repassedParams = {};
            windowInstance.show();
        }
    }
});
