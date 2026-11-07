Ext.define('Ext.panel.Pdf', {
    extend: 'Ext.panel.Panel',
    xtype: 'pdfpanel',
    layout: 'fit',
    
    items: {
        xtype: 'component'
    },

    initComponent: function() {
        this.callParent(arguments);

        setTimeout(() => {
            this.down('component').setHtml(
                '<iframe src="' + this.streamingPath + '" width="100%" height="100%"></iframe>'
            );
        }, 500);
    }
});
