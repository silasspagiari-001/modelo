Ext.define('SamosAdmin.relatorios.margembrutafaturada.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosmargembrutafaturada',

    requires: [
        'SamosAdmin.relatorios.margembrutafaturada.list.View'
    ],

    title: 'Margem de Vendas por Produto',
    width: 700, //550
    height: 450, //380
    autoShow: true,

    items: {
        xtype: 'relatoriosmargembrutafaturadalist'
    }
});
