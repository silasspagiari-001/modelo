Ext.define('Overrides.form.field.TextArea', {
    override:'Ext.form.field.TextArea',
    
    constructor: function() {
        this.callParent(arguments);

        if(this.ui == 'default'){
            this.setUI('textarea-clean-' + configs.getTema());
        }
    }
});
