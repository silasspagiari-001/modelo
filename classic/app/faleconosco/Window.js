Ext.define('SamosAdmin.faleconosco.Window', {
    extend: 'Ext.window.Window',
    xtype: 'faleconosco',

    requires: [
        'SamosAdmin.faleconosco.form.View'
    ],

    title: 'Contato',
    width: 700,
    height: 425,
    autoShow: true,

    items: {
        xtype: 'faleconoscoform'
    }
});
