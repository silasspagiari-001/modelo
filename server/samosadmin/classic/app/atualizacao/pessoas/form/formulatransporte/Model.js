Ext.define('SamosAdmin.atualizacao.pessoas.form.formulatransporte.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PESSOAS_ID',

    fields: [
        'FORMULA_TIPO',
        'FORMULA_URBANOA',
        'FORMULA_URBANOB',
        'FORMULA_SUBURBANOA',
        'FORMULA_SUBURBANOB'
    ]
});

