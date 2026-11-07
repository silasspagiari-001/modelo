Ext.define('Overrides.field.Select', {
    override:'Ext.field.Select',

    picker: /iPhone/.test(navigator.userAgent) ? 'floated': 'auto'
});
