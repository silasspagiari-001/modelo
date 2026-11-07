Ext.define('Overrides.picker.Date', {
    override: 'Ext.picker.Date',

    config: {
        slotOrder: ['day', 'month', 'year']
    },

    initialize: function() {
        const tema = configs.getTema();

        this.callParent(arguments);

        this.setYearFrom(1900);
        this.setMonthText('Mês');
        this.setDayText('Dia');
        this.setYearText('Ano');
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
