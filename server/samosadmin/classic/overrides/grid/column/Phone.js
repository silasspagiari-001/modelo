Ext.define('Ext.grid.column.Phone', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.phonecolumn',

    renderer: function(value, meta, record, rowIndex, colIndex, store, view) {
        return Ext.util.Format.maskPhone(value);
    }
});
