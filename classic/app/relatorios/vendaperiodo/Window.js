Ext.define('SamosAdmin.relatorios.vendaperiodo.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosvendaperiodo',

    requires: [
        'SamosAdmin.relatorios.vendaperiodo.list.View'
    ],

    title: 'Documentos Emitidos no Período',
    width: 790,
    height: 490,
    autoShow: true,

    items: {
        xtype: 'relatoriosvendaperiodolist'
    }
});
