Ext.define('Ext.data.field.NodeJSDate', {
    extend: 'Ext.data.field.Field',

    alias: 'data.field.nodejsdate',

    validators: [
        { type: 'datevalidator', format: 'Y-m-d' }
    ],

    //defaultValue: new Date('1899-12-30T03:00:00.000Z'),

    convert: function (v, record) {
        if (v === null || v === ''){
            v = undefined;
        } else if (typeof v == 'string' && v != '') {
            if(v.match(/\//)) {
                //if date is like '00/00/0000' converts it to '0000-00-00'
                v = v.split('/');
                v = v.reverse().join('-');
            } else {
                //if date is like '0000-00-00T00:00:00.000Z' converts it to '0000-00-00'
                v = momentTz(v).format('YYYY-MM-DD')
            }
        }
        
        return v;
    }
});
