Ext.define('Ext.data.field.Check', {
    extend: 'Ext.data.field.String',

    alias: 'data.field.check',
    type: 'check',

    /*
     * Added:
     * Value send to server when field is checked
     */
    trueValue: 'T',

    /*
     * Added:
     * Value send to server when field is unchecked
     */
    falseValue: 'F',

    convert: function (v) {
        if (v === true || v === this.trueValue) {
            return this.trueValue;
        }
        if (v === false || v === this.falseValue || (typeof v) === "undefined") {
            return this.falseValue;
        }
        return v;
    }
});