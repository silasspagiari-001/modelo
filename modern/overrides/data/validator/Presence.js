Ext.define('Overrides.data.validator.Presence', {
    override: 'Ext.data.validator.Presence',
    
    config: {
        /*
         * Override:
         * pt-BR transate
         */
        message: 'Campo obrigatório',

        /*
         * Added:
         * This config allow to declare an alternative field
         * If the alternative field is filled, this field will allow blank values
         */
        alternative: ''
    },

    /*
     * Override:
     * Checking allowBlank property
     * Checking alternative field
     */
    validate: function(value, model) {
        var valid = this.check(SamosUtils.String.onlyLettersAndNumbers(value));

        if (!valid && !!this.getAlternative()) {
            valid = this.check(SamosUtils.String.onlyLettersAndNumbers(model.get(this.getAlternative())));
        }

        return valid ? true : this.getMessage();
    },

    check: function (value) {
        var valid = !(value === undefined || value === null);

        if (valid && !this.getAllowEmpty()) {
            valid = !(value === '');
        }

        return valid;
    }
});
