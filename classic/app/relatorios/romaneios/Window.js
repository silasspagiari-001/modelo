Ext.define('SamosAdmin.relatorios.romaneios.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatoriosromaneios',

    requires: [
        'SamosAdmin.relatorios.romaneios.list.View'
    ],

    title: 'Romaneios',
    width: 562,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatoriosromaneioslist'
    }
});
