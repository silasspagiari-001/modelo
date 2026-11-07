Ext.define('SamosAdmin.relatorios.comprasfornecedor.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatorioscomprasfornecedor',

    requires: [
        'SamosAdmin.relatorios.comprasfornecedor.list.View'
    ],

    title: 'Compras Fornecedor Sintética',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatorioscomprasfornecedorlist'
    }
});
