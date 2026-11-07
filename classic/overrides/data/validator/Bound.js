Ext.define('Overrides.data.validator.Bound', {
    override: 'Ext.data.validator.Bound',
    
    config: {
        min: undefined,
        max: undefined,
        emptyMessage: 'Campo obrigatório',
        minOnlyMessage: 'Valor Inválido',
        maxOnlyMessage: 'Valor Inválido',
        bothOnlyMessage: 'Valor Inválido',
        bothMessage: 'Valor Inválido',
        allowBlank: true
    },

    validateValue: function(value) {
        if ((value === '' || value === undefined || value === null || value === 0) && this.getAllowBlank()) { 
            return true; 
        }
        if (value === undefined || value === null) {
            return this.getEmptyMessage();
        }
        return true;
    }
});
