Ext.define('Overrides.form.FieldSet', {
    override: 'Ext.form.FieldSet',
    defaultType: 'fieldcontainer',
    ui: 'fieldset-clean',
    style: {
        background: 'white'
    },
    layout: 'anchor',
    padding: '0 0 5 5',
    margin: 2.5
});
