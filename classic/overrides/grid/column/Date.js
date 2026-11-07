Ext.define('Overrides.grid.column.Date', {
    override: 'Ext.grid.column.Date',

    defaultRenderer: function(value){
        if(momentTz(value).isSameOrBefore('1900-01-01')){
            return '';
        } else {
            return momentTz(value).format('DD/MM/YYYY');
        }
    }
});
