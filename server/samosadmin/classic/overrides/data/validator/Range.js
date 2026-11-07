Ext.define('Overrides.data.validator.Range', {
    override: 'Ext.data.validator.Range',
    
    /*
     * Override:
     * pt-BR transate
     */
    config: {
        minOnlyMessage: 'Deve ser maior ou igual a {0}',
        maxOnlyMessage: 'Deve ser menor ou igual a {0}',
        bothMessage: 'Deve estar entre {0} e {1}',
        nanMessage: 'Valor numérico'
    },
 
    validate: function(value) {
        if ((value === '' || value === undefined || value === null || value === 0) && this.getAllowBlank()) { 
            return true; 
        } else {
            return this.callParent(arguments);
        }
    },
 
    validateValue: function(value) {
        value = typeof value == 'string' ? value.replace(',', '.') : value;
        
        let msg = this.callParent([value]);

        if (msg === true && isNaN(value)) {
            msg = this.getNanMessage();
        }
        return msg;
    }
});
