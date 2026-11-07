Ext.define('Overrides.picker.Picker', {
    override: 'Ext.picker.Picker',

    initialize: function() {
        const tema = configs.getTema();

        this.callParent(arguments);

        this.setDoneButton({
            text: 'OK',
            ui: 'primary-' + tema
        });
        this.setCancelButton({
            text: 'Cancelar',
            ui: 'secondary-' + tema
        })
    }
});
