Ext.define('Overrides.data.validator.Format', {
    override: 'Ext.data.validator.Format',
    
    config: {
        message: 'Formato: ',
        format: undefined,
        matcher: undefined
    },
    
    /*
     * Override:
     * Constructing a custom message
     */
    constructor: function() {
        this.callParent(arguments);
        this.setMessage(this.getMessage() + this.getFormat());
    },

    validate: function(value) {
        if (!value) { return true; }
        
        var matcher = this.getMatcher(),
            result = matcher && matcher.test(value);

        return result ? result : this.getMessage();
    }
});