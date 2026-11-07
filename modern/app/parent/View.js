Ext.define('SamosAdminModern.parent.View', {
    extend: 'Ext.Panel',
    
    defaultFocus: 'textfield:not([hidden]):not([disabled]):not([readOnly])',
    mainView: true,
    
    listeners: {
        initialize: 'doDefaultFocus'
    }
});
