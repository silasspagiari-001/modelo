Ext.define('SamosAdmin.relatorios.controlevacinas.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatorioscontrolevacinas',

    requires: [
        'SamosAdmin.relatorios.controlevacinas.list.View'
    ],

    title: 'Controle de Vacinas',
    width: 420,
    height: 180,
    autoShow: true,

    items: {
        xtype: 'relatorioscontrolevacinaslist'
    }
});
