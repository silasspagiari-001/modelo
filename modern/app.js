Ext.application({
    extend: 'SamosAdminModern.Application',
    name: 'SamosAdminModern',

    requires: [
        'SamosAdminModern.*'
    ]
});

Ext.util.Format.decimalSeparator  = ',';
Ext.util.Format.thousandSeparator = '.';