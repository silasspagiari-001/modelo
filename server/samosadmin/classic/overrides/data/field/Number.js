Ext.define('Overrides.data.field.Number', {
    override: 'Ext.data.field.Number',

    /*
     * Override:
     * If value is NaN, prevent parseFloat convert
     */
    convert: function (value, record) {
        if (parseFloat(value).toString() == 'NaN') {
            return value;
        } else {
            return parseFloat(value);
        }
    }
});