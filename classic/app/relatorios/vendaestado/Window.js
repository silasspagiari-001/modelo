Ext.define('SamosAdmin.relatorios.vendaestado.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendaestado',

    requires: [
        'SamosAdmin.relatorios.vendaestado.list.View'
    ],

    title: 'Venda Estado',
    width: 480, // 862
    height: 405,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendaestadolist'
    }
});
