/*
 * Added:
 * It was created to identify mask fields in order to clean their mask before send to server
 */
Ext.define('Ext.data.field.Mask', {
    extend: 'Ext.data.field.String',

    alias: 'data.field.mask',
    type: 'mask'
});