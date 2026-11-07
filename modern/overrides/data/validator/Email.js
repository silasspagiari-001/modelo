Ext.define('Overrides.data.validator.Email', {
    override: 'Ext.data.validator.Email',
    
    config: {
        message: 'Formato: ',
        format: 'E-mail'
    },

    /*
     * Override:
     * Allowing blank values
     */
    validate: function(value) {
        if (!value) return true;

        var matcher = this.getMatcher(),
            result = matcher && matcher.test(value);

        return result ? result : this.getMessage();
    }
});
