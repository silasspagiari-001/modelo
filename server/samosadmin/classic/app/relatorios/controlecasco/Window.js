Ext.define('SamosAdmin.relatorios.controlecasco.Window', {
    extend: 'Ext.window.Window',
    xtype: 'relatorioscasco',

    requires: [
        'SamosAdmin.relatorios.controlecasco.list.View'
    ],

    title: 'Controle Casco',
    width: 480,
    height: 295,
    autoShow: true,

    items: {
        xtype: 'relatorioscascolist'
    }
});
