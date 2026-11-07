Ext.define('Overrides.data.validator.Inclusion', {
    override: 'Ext.data.validator.Inclusion',
    
    /*
     * Override:
     * pt-BR translate
     */
    config: {
        minOnlyMessage: 'Deve ser maior que {0}',
        maxOnlyMessage: 'Deve ser menor que {0}',
        bothMessage: 'Deve estar entre {0} e {1}',
        nanMessage: 'Valor numérico'
    }
});