Ext.define('SamosAdmin.relatorios.vendasvendedorsintetica.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendasvendedorsintetica',

    requires: [
        'SamosAdmin.relatorios.vendasvendedorsintetica.list.View'
    ],

    title: 'Vendas por Vendedor Sintética',
    width: 700,
    height: 280,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendasvendedorsinteticalist'
    }
});
