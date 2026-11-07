Ext.define('SamosAdmin.relatorios.precos.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosprecos',

    requires: [
        'SamosAdmin.relatorios.precos.list.View'
    ],

    title: 'Lista de Preços',
    width: 480,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosprecoslist'
    }
});
