Ext.define('Overrides.field.Toggle', {
    override:'Ext.field.Toggle',

    width: 60,
    margin: '0 0 0 10',
    
    constructor: function() {
        this.callParent(arguments);
        this.setUi('toggleslider-' + configs.getTema());
    }
});
