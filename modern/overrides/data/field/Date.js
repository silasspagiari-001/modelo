Ext.define('Overrides.data.field.Date', {
    override: 'Ext.data.field.Date',

    validators: [
        {type: 'datevalidator', format: 'Y-m-d'}
    ],

    /*
     * Override:
     * Adding 'T03:00:00.000Z' string to prevent auto convert to yesterday when record was saved after 21h
     */
    convert: function (v, record) {
        if (typeof v == 'string' && v != '') {
            v = momentTz(v).hours(0).minutes(0).seconds(0).toDate();
        }
        return v;
    }
});