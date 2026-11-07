Ext.define('Overrides.util.Format', {
    override: 'Ext.util.Format',

    defaultDateFormat: 'd/m/Y',

    thousandSeparator: '.',
    decimalSeparator: ',',
    currencyPrecision: 2,
    currencySign: '',
    percentSign: '%',
    currencyAtEnd: false,

    brlMoney: function(v) {
        return this.currency(v, 'R$ ', 2);
    },

    money: function(v) {
        return this.currency(v, '', 2);
    }
});