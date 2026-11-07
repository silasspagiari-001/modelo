Ext.define('Ext.grid.column.Money', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.moneycolumn',

    constructor: function(cfg) {
        const ocultaZero = cfg.ocultaZero === false ? false : true;

        Ext.apply(this, {
            width: 90,
            align: 'right',
            renderer: function(value, meta, record, rowIndex, colIndex, store, view) {
                return Ext.util.Format.maskRenderer('#9.990,00', true, ocultaZero)(value);
            }
        });

        this.callParent(arguments);
    }
});
