Ext.define('SamosAdmin.relatorios.comissoes.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatorioscomissoes',

    requires: [
        'SamosAdmin.relatorios.comissoes.list.View'
    ],

    title: 'Comissões Vendedores',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatorioscomissoeslist'
    }
});
