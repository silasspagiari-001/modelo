Ext.define('Ext.grid.column.Cpfcnpj', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.cpfcnpjcolumn',

    renderer: function(value, meta, record, rowIndex, colIndex, store, view) {
        var value = SamosUtils.String.onlyNumbers(value),
            maskedValue;

        if (value.length == 11) {
            var maskedValue = Ext.util.Format.TextMask.setMask('999.999.999-99', false).mask(value);
            return maskedValue;

        } else if (value.length == 14) {
            var maskedValue = Ext.util.Format.TextMask.setMask('99.999.999/9999-99', false).mask(value);
            return maskedValue;

        } else {
            return value;
        }
    }
});
